import { isInstructionLike } from './injection';
import { OMISSION_SYSTEM_PROMPT } from './omissions';
import type { GenerateFn } from './runner';
import type { ChangeField, EvidenceRole, RawExtraction, RawItem } from './types';

/**
 * Deterministic, rule-based extractor that runs entirely in the browser.
 *
 * It implements the same contract the pipeline expects of any extractor: it reads the serialized chat lines
 * and returns the extraction JSON. Everything it returns is then checked by `validateExtraction`
 * (message ids and exact quotes), reconciled and ranked like any other extraction. It uses no network and no model.
 */

interface Line {
  id: string;
  author: string;
  text: string;
  /** Older message shown for reference only; never produces items. */
  reference: boolean;
}

interface Sentence {
  text: string;
  start: number;
}

const VERBS =
  'bring|grab|send|prepare|submit|review|finish|book|upload|share|collect|confirm|check|call|email|complete|fix|write|update|print|order|buy|arrange|handle|take over|take|pick up|make|create|draft|post|reply|follow up|remind|schedule|test|set up|clean|carry|fill|sign|pay|register|reserve|bring along|look into|work on|get';
const TIME = '(?:\\b(?:[01]?\\d|2[0-3])(?::[0-5]\\d)?\\s?(?:am|pm)\\b|\\b(?:[01]?\\d|2[0-3]):[0-5]\\d\\b|\\bnoon\\b)';
const TIME_RE = new RegExp(TIME, 'gi');
const PLACE_RE =
  /\b(?:(?:Room|Hall|Lab|Block|Building|Auditorium|Library|Cafeteria|Floor)\s+[A-Za-z0-9-]+|[A-Z]{1,4}-\d+[A-Z]?|\b[A-Z]\d{2,4}|Google Meet|Zoom|Teams|Discord)\b/g;
const NEGATED_PLACE = /^\s+(?:is|was|are)\s+(?:gone|out|unavailable|booked|taken|closed|cancel(?:l)?ed|not available)/i;
const REVISION = /\b(?:moved|move|shifted|shift|rescheduled|reschedule|postponed|pushed|preponed|changed|change|switched|updated?|instead|new (?:time|venue|place|location)|relocated|now at|now in)\b/i;
const PROPOSAL = /\b(?:could|can|should|shall|would)\s+we\b|\bhow about\b|\bwhat about\b|\bwhat if\b|\bmaybe\b|\bperhaps\b|\bmight\b|\blet'?s\s+(?:try|do|make|move)\b|\?\s*$/i;
const CANCEL = /\b(?:cancel(?:l?ed)?|called off|scrapped|not happening|won't happen|no longer (?:happening|needed|on))\b/i;
const DECISION = /\b(?:confirmed|scheduled|booked|fixed|set for|decided|finali[sz]ed|agreed|will be|is at|is on|starts at)\b/i;
const OWNER_CHANGE = /\b(?:instead|take over|taking over|reassign(?:ed)?|swap(?:ped)?|in place of|is out|can'?t|cannot|unavailable|won'?t be able)\b/i;
const EVENT_WORDS = [
  'meeting', 'review', 'standup', 'stand-up', 'sync', 'call', 'class', 'lecture', 'demo', 'showcase', 'presentation', 'setup', 'session', 'workshop',
  'exam', 'test', 'lunch', 'dinner', 'trip', 'practice', 'rehearsal', 'interview', 'event', 'party', 'hackathon', 'deadline', 'submission', 'viva',
];
const NOT_NAMES = new Set(
  'please pls update note reminder also can could will would should everyone everybody team all guys today tomorrow tonight the this that we they and but so ok okay hey hi thanks thank yes no maybe then now if when after before once also just'.split(' '),
);
const GROUP_WORDS = new Set(['everyone', 'everybody', 'team', 'all', 'guys']);
const STOP = new Set(
  'the a an my our your their his her its to for by at on in of and instead please this that these those it them from with up out over'.split(' '),
);
const PREPOSITIONS = /\b(?:to|for|by|at|on|in|before|until|from|with|after)\b/i;

const ACTION_RE = new RegExp(
  `(?:^|[,;:]\\s*|\\b(?:and|then)\\s+)(@?[A-Z][a-z]+)\\s*,?\\s+((?:(?:can|could|will|would)\\s+you\\s+|please\\s+|pls\\s+|you\\s+(?:need to|should|must)\\s+|(?:needs?\\s+to|has\\s+to|will|to|should|can)\\s+)*)(${VERBS})\\b`,
  'g',
);
const OPEN_REQUEST_RE = new RegExp(`\\b(?:(?:can|could|would|will)\\s+(?:you|someone|anyone|anybody|everyone)\\s+(?:please\\s+)?|please\\s+|pls\\s+)(${VERBS})\\b`, 'i');
const FIRST_PERSON_RE = new RegExp(`\\b(?:I'll|I will|I can|I'm going to|let me)\\s+(${VERBS})\\b`, 'i');
const DEADLINE_RE = new RegExp(
  `\\b(?:(?:by|before|until|due)\\s+(?:end of (?:the )?day|eod|tonight|tomorrow|today|noon|midnight|(?:next\\s+)?(?:mon|tues|wednes|thurs|fri|satur|sun)day|\\d{1,2}(?:st|nd|rd|th)?\\s+[A-Z][a-z]+|[A-Z][a-z]+\\s+\\d{1,2}(?:st|nd|rd|th)?|${TIME})(?:\\s+(?:on\\s+)?(?:(?:next\\s+)?(?:mon|tues|wednes|thurs|fri|satur|sun)day|tomorrow))?|tonight|tomorrow|today|eod)\\b`,
  'i',
);

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');

function parseLines(prompt: string): Line[] {
  const out: Line[] = [];
  for (const raw of prompt.split('\n')) {
    if (!raw.startsWith('{')) continue;
    try {
      const o = JSON.parse(raw) as { id?: unknown; author?: unknown; text?: unknown; context?: unknown; ledger?: unknown };
      if (typeof o.id === 'string' && typeof o.text === 'string') {
        out.push({ id: o.id, author: typeof o.author === 'string' ? o.author : '', text: o.text, reference: Boolean(o.context || o.ledger) });
      }
    } catch {
      /* not a chat line */
    }
  }
  return out;
}

function sentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  for (const m of text.matchAll(/[^.!?\n]+[.!?]*/g)) {
    const lead = m[0].length - m[0].trimStart().length;
    const t = m[0].trim();
    if (t) out.push({ text: t, start: (m.index ?? 0) + lead });
  }
  return out;
}

/** Longest allowed quote: 160 characters and 20 words, always a prefix of the original so it stays exact. */
function clip(s: string): string {
  const t = s.trim().replace(/[\s,;:]+$/, '');
  const words = t.split(/\s+/);
  const byWords = words.length > 20 ? words.slice(0, 20).join(' ') : t;
  const idx = t.indexOf(byWords);
  const base = idx === 0 ? byWords : t;
  return base.length > 160 ? base.slice(0, 160).replace(/\s+\S*$/, '') : base;
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function times(s: string): string[] {
  return [...s.matchAll(TIME_RE)].map((m) => m[0]);
}

function places(s: string): string[] {
  const out: string[] = [];
  for (const m of s.matchAll(PLACE_RE)) {
    const after = s.slice((m.index ?? 0) + m[0].length);
    const before = s.slice(0, m.index ?? 0);
    if (NEGATED_PLACE.test(after) || /\bnot\s+$/i.test(before)) continue;
    out.push(m[0]);
  }
  return out;
}

function eventWord(s: string): string | null {
  const low = s.toLowerCase();
  return EVENT_WORDS.find((w) => new RegExp(`\\b${w}\\b`).test(low)) ?? null;
}

function subjectOf(rest: string): string {
  const head = rest.split(PREPOSITIONS)[0] ?? rest;
  const words = head
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((w) => w && !STOP.has(w));
  return words.slice(0, 2).join(' ') || 'task';
}

interface Found {
  line: Line;
  sentence: Sentence;
  owner: string | null;
  title: string;
  subject: string;
  quote: string;
  role: EvidenceRole;
  deadline: string | null;
}

function findActions(line: Line): Found[] {
  const out: Found[] = [];
  for (const s of sentences(line.text)) {
    const used: [number, number][] = [];
    const push = (owner: string | null, verbStart: number, nameStart: number, role: EvidenceRole) => {
      const rest = s.text.slice(verbStart);
      const clauseEnd = rest.search(/[,;]/);
      const clause = clauseEnd < 0 ? rest : rest.slice(0, clauseEnd);
      const title = cap(clause.replace(/[.!?]+$/, '').replace(/\s+instead$/i, '').trim());
      const afterVerb = clause.replace(new RegExp(`^(?:${VERBS})\\s*`, 'i'), '');
      const deadline = clause.match(DEADLINE_RE)?.[0] ?? null;
      if (used.some(([a, b]) => nameStart >= a && nameStart < b)) return;
      used.push([nameStart, verbStart + clause.length]);
      out.push({
        line,
        sentence: s,
        owner,
        title: title.slice(0, 140),
        subject: subjectOf(afterVerb),
        quote: clip(s.text.slice(nameStart, verbStart + clause.length)),
        role,
        deadline,
      });
    };
    for (const m of s.text.matchAll(ACTION_RE)) {
      const rawName = m[1].replace(/^@/, '');
      const key = rawName.toLowerCase();
      if (NOT_NAMES.has(key) && !GROUP_WORDS.has(key)) continue;
      const nameStart = (m.index ?? 0) + m[0].indexOf(m[1]);
      const verbStart = (m.index ?? 0) + m[0].length - m[3].length;
      push(GROUP_WORDS.has(key) ? null : rawName, verbStart, nameStart, 'assigns');
    }
    const first = s.text.match(FIRST_PERSON_RE);
    if (first && line.author) {
      const verbStart = (first.index ?? 0) + first[0].length - first[1].length;
      push(line.author, verbStart, first.index ?? 0, 'states');
    }
    const open = s.text.match(OPEN_REQUEST_RE);
    if (open && !used.length) {
      const verbStart = (open.index ?? 0) + open[0].length - open[1].length;
      push(null, verbStart, open.index ?? 0, 'assigns');
    }
  }
  return out;
}

const item = (p: Partial<RawItem> & Pick<RawItem, 'kind' | 'title' | 'subject' | 'status' | 'evidence'>): RawItem => ({
  owner_name: null,
  deadline_text: null,
  ...p,
});

export function extractFromLines(lines: Line[]): RawExtraction {
  const items: RawItem[] = [];
  const earlierActions: Found[] = [];
  const changeAfter = new Set<string>();

  lines.forEach((line, idx) => {
    const instruction = isInstructionLike(line.text);
    const actions = instruction ? [] : findActions(line);
    const sents = sentences(line.text);

    if (!line.reference && !instruction) {
      // Task assignments.
      for (const a of actions) {
        items.push(
          item({
            kind: 'action',
            title: a.title,
            owner_name: a.owner,
            deadline_text: a.deadline,
            status: 'confirmed',
            subject: a.subject,
            evidence: [{ id: line.id, quote: a.quote, role: a.role }],
          }),
        );
        // A new owner for something earlier given to someone else is a change in who owns it.
        const old = [...earlierActions]
          .reverse()
          .find((e) => e.owner && a.owner && e.owner.toLowerCase() !== a.owner.toLowerCase() && e.subject === a.subject);
        if (old && old.owner && a.owner && OWNER_CHANGE.test(a.sentence.text)) {
          items.push(
            item({
              kind: 'change',
              title: `${cap(a.subject)} task moved from ${old.owner} to ${a.owner}`,
              status: 'confirmed',
              subject: a.subject,
              change_fields: [{ field: 'owner', before_value: old.owner, after_value: a.owner, before_id: old.line.id, after_id: line.id }],
              evidence: [
                { id: old.line.id, quote: old.quote, role: 'before' },
                { id: line.id, quote: a.quote, role: 'after' },
              ],
            }),
          );
        }
      }

      // Time and place revisions.
      for (const s of sents) {
        if (PROPOSAL.test(s.text) || !REVISION.test(s.text)) continue;
        const afterTimes = times(s.text);
        const afterPlaces = places(s.text);
        if (!afterTimes.length && !afterPlaces.length) continue;
        const word = eventWord(s.text);
        const groups = new Map<string, { before: { line: Line; sentence: Sentence }; fields: { field: ChangeField; bv: string; av: string }[] }>();
        const tryField = (field: ChangeField, afterVal: string | undefined, valuesIn: (t: string) => string[]) => {
          if (!afterVal) return;
          for (let j = idx - 1; j >= 0; j--) {
            const prev = lines[j];
            if (isInstructionLike(prev.text)) continue;
            for (const ps of sentences(prev.text).reverse()) {
              if (PROPOSAL.test(ps.text)) continue;
              const pw = eventWord(ps.text) ?? eventWord(prev.text);
              // A revision that names a subject must not borrow a time/place from an unrelated
              // message that contains no matching subject (for example a task deadline).
              if (word && pw !== word) continue;
              const bv = valuesIn(ps.text).find((v) => norm(v) !== norm(afterVal));
              if (!bv) continue;
              const g = groups.get(prev.id) ?? { before: { line: prev, sentence: ps }, fields: [] };
              g.fields.push({ field, bv, av: afterVal });
              groups.set(prev.id, g);
              return;
            }
          }
        };
        tryField('time', afterTimes[afterTimes.length - 1], times);
        tryField('place', afterPlaces[0], places);
        for (const g of groups.values()) {
          const subject = word ?? eventWord(g.before.sentence.text) ?? eventWord(g.before.line.text) ?? 'plan';
          const fieldNames = g.fields.map((f) => f.field).join(' and ');
          items.push(
            item({
              kind: 'change',
              title: `${cap(subject)} ${fieldNames} changed`,
              status: 'confirmed',
              subject,
              change_fields: g.fields.map((f) => ({ field: f.field, before_value: f.bv, after_value: f.av, before_id: g.before.line.id, after_id: line.id })),
              evidence: [
                { id: g.before.line.id, quote: clip(g.before.sentence.text), role: 'before' },
                { id: line.id, quote: clip(s.text), role: 'after' },
              ],
            }),
          );
          changeAfter.add(`${line.id}:${s.start}`);
        }
      }

      for (const s of sents) {
        const key = `${line.id}:${s.start}`;
        const hasValue = times(s.text).length > 0 || places(s.text).length > 0;
        const word = eventWord(s.text);
        // Part of the sentence before an assignment clause, so a plan and a task in one sentence stay separate.
        const task = actions.find((a) => a.sentence.start === s.start);
        const planText = task ? s.text.slice(0, s.text.indexOf(task.quote)).replace(/[\s,;:]+$/, '') : s.text;

        if (CANCEL.test(s.text) && !s.text.includes('?')) {
          items.push(
            item({ kind: 'cancellation', title: clip(cap(s.text.replace(/[.!?]+$/, ''))), status: 'cancelled', subject: word ?? subjectOf(s.text), evidence: [{ id: line.id, quote: clip(s.text), role: 'cancels' }] }),
          );
        } else if (PROPOSAL.test(s.text) && (hasValue || s.text.split(/\s+/).length <= 14) && /\b(?:could|can|should|shall)\s+we\b|how about|what about|what if|maybe|let'?s|perhaps/i.test(s.text)) {
          items.push(
            item({ kind: 'proposal', title: clip(cap(s.text.replace(/[.!?]+$/, ''))), status: 'proposed', subject: word ?? 'plan', evidence: [{ id: line.id, quote: clip(s.text), role: 'proposes' }] }),
          );
        } else if (!changeAfter.has(key) && hasValue && DECISION.test(planText) && planText.trim()) {
          items.push(
            item({ kind: 'decision', title: clip(cap(planText.replace(/[.!?]+$/, ''))), status: 'confirmed', subject: word ?? 'plan', evidence: [{ id: line.id, quote: clip(planText), role: 'states' }] }),
          );
        }
      }
    }
    earlierActions.push(...actions);
  });
  return { items };
}

/** Same signature the pipeline uses for any extractor: prompt in, extraction JSON text out. */
export const localExtract: GenerateFn = async (userPrompt, systemPrompt) => {
  if (systemPrompt === OMISSION_SYSTEM_PROMPT) return { text: '{"items":[]}', finishReason: 'stop' };
  return { text: JSON.stringify(extractFromLines(parseLines(userPrompt))), finishReason: 'stop' };
};
