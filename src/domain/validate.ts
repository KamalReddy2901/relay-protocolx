import { isInstructionLike } from './injection';
import type {
  ChangePair,
  Evidence,
  EvidenceRole,
  Item,
  ItemKind,
  ItemStatus,
  Message,
  Participant,
  RawExtraction,
  RawItem,
  ValidationReport,
} from './types';

const KINDS: ItemKind[] = ['action', 'decision', 'change', 'proposal', 'cancellation', 'conflict'];
const STATUSES: ItemStatus[] = ['confirmed', 'proposed', 'cancelled', 'needs-clarification'];
const ROLES: EvidenceRole[] = ['states', 'assigns', 'proposes', 'confirms', 'revises', 'cancels', 'before', 'after'];

const STATUS_ROLES: EvidenceRole[] = ['confirms', 'assigns', 'cancels', 'revises', 'before', 'after'];

export interface ValidationContext {
  /** Every message the model was shown (chunk messages, context and ledger entries), keyed by id. */
  known: Map<string, Message>;
  /** Position of each message in the whole chat, used to check "after is later than before". */
  order: Map<string, number>;
  participants: Participant[];
  chunkIndex: number;
  /** Parts of oversize messages: part key (m88#1) -> parent id and character offset. */
  parts?: Map<string, { parentId: string; offset: number }>;
}

export type ParseOutcome =
  | { ok: true; value: RawExtraction; thinkingStripped: boolean; emptyThinkWrapper: boolean }
  | { ok: false; error: string };

/** Parse and structurally check model text. Strips <think> blocks (and reports that it did). */
export function parseModelOutput(text: string): ParseOutcome {
  let t = text;
  let thinkingStripped = false;
  let emptyThinkWrapper = false;
  if (/<think>/i.test(t)) {
    // An empty wrapper is recorded separately; only real reasoning text counts as "stripped".
    t = t.replace(/<think>([\s\S]*?)(<\/think>|$)/gi, (_m, inner: string) => {
      if (inner.trim()) thinkingStripped = true;
      else emptyThinkWrapper = true;
      return '';
    });
  }
  t = t.trim();
  let data: unknown;
  try {
    data = JSON.parse(t);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
  if (!data || typeof data !== 'object' || !Array.isArray((data as { items?: unknown }).items)) {
    return { ok: false, error: 'Missing "items" array' };
  }
  const items: RawItem[] = [];
  for (const raw of (data as { items: unknown[] }).items) {
    const it = raw as Record<string, unknown>;
    if (!it || typeof it !== 'object') return { ok: false, error: 'Item is not an object' };
    if (!KINDS.includes(it.kind as ItemKind)) return { ok: false, error: `Bad kind ${String(it.kind)}` };
    if (!STATUSES.includes(it.status as ItemStatus)) return { ok: false, error: `Bad status ${String(it.status)}` };
    if (typeof it.title !== 'string' || typeof it.subject !== 'string') return { ok: false, error: 'Missing title/subject' };
    if (!Array.isArray(it.evidence)) return { ok: false, error: 'Missing evidence' };
    const evidence = [];
    for (const ev of it.evidence as Record<string, unknown>[]) {
      if (typeof ev?.id !== 'string' || typeof ev?.quote !== 'string' || !ROLES.includes(ev?.role as EvidenceRole)) {
        return { ok: false, error: 'Malformed evidence entry' };
      }
      evidence.push({ id: ev.id, quote: ev.quote, role: ev.role as EvidenceRole });
    }
    items.push({
      kind: it.kind as ItemKind,
      title: it.title,
      owner_name: typeof it.owner_name === 'string' && it.owner_name.trim() ? it.owner_name.trim() : null,
      deadline_text: typeof it.deadline_text === 'string' && it.deadline_text.trim() ? it.deadline_text.trim() : null,
      status: it.status as ItemStatus,
      subject: it.subject,
      change_fields: Array.isArray(it.change_fields)
        ? (it.change_fields as Record<string, unknown>[])
            .filter(
              (f) =>
                f &&
                typeof f.before_value === 'string' &&
                typeof f.after_value === 'string' &&
                typeof f.before_id === 'string' &&
                typeof f.after_id === 'string',
            )
            .map((f) => ({
              field: (['time', 'place', 'owner', 'date', 'task', 'other'].includes(f.field as string) ? f.field : 'other') as 'other',
              before_value: f.before_value as string,
              after_value: f.after_value as string,
              before_id: f.before_id as string,
              after_id: f.after_id as string,
            }))
        : undefined,
      evidence,
    });
  }
  return { ok: true, value: { items }, thinkingStripped, emptyThinkWrapper };
}

/** Locate an exact quote in the message; tolerate only surrounding whitespace and ellipsis markers. */
export function locateQuote(text: string, quote: string): { start: number; end: number } | null {
  const q = quote.replace(/^[\s.…]+|[\s.…]+$/g, '');
  if (!q) return null;
  const i = text.indexOf(q);
  return i < 0 ? null : { start: i, end: i + q.length };
}

export function resolveOwner(
  ownerRaw: string | null,
  participants: Participant[],
): { id: string | null; ambiguous: boolean } {
  if (!ownerRaw) return { id: null, ambiguous: false };
  const name = ownerRaw.trim().toLowerCase();
  const full = participants.filter((p) => p.displayName.trim().toLowerCase() === name);
  if (full.length === 1) return { id: full[0].id, ambiguous: false };
  const first = participants.filter((p) => p.displayName.trim().toLowerCase().split(/\s+/)[0] === name);
  if (first.length === 1 && !name.includes(' ')) return { id: first[0].id, ambiguous: false };
  return { id: null, ambiguous: first.length > 1 };
}

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function validateExtraction(raw: RawExtraction, ctx: ValidationContext): ValidationReport {
  const report: ValidationReport = { items: [], changes: [], discarded: [], downgraded: [], droppedQuotes: 0, instructionSources: 0 };
  let n = 0;
  for (const r of raw.items) {
    const evidence: Evidence[] = [];
    for (const e of r.evidence) {
      const msg = ctx.known.get(e.id);
      if (!msg) {
        report.droppedQuotes++;
        continue;
      }
      if (STATUS_ROLES.includes(e.role) && isInstructionLike(msg.text)) {
        report.instructionSources++;
        report.droppedQuotes++;
        continue;
      }
      const at = locateQuote(msg.text, e.quote);
      if (!at) {
        report.droppedQuotes++;
        continue;
      }
      const part = ctx.parts?.get(e.id);
      evidence.push({
        messageId: part ? part.parentId : e.id,
        quote: msg.text.slice(at.start, at.end),
        role: e.role,
        start: at.start + (part?.offset ?? 0),
        end: at.end + (part?.offset ?? 0),
      });
    }
    if (evidence.length === 0) {
      report.discarded.push({ reason: 'no valid source', title: r.title });
      continue;
    }
    // An item whose own claim lost all supporting evidence of the roles it relies on is not salvaged from other evidence.
    const owner = resolveOwner(r.owner_name, ctx.participants);
    const item: Item = {
      id: `i${ctx.chunkIndex}-${++n}`,
      kind: r.kind,
      title: r.title.trim(),
      ownerRaw: r.owner_name,
      ownerParticipantId: owner.id,
      ownerAmbiguous: owner.ambiguous,
      deadlineText: r.deadline_text,
      status: r.status,
      subjectKey: norm(r.subject),
      evidence,
      chunkIndex: ctx.chunkIndex,
    };

    if (r.kind === 'change') {
      const before = evidence.find((e) => e.role === 'before');
      const after = evidence.find((e) => e.role === 'after');
      const pairs: ChangePair[] = [];
      if (before && after && before.messageId !== after.messageId) {
        const bi = ctx.order.get(before.messageId);
        const ai = ctx.order.get(after.messageId);
        if (bi !== undefined && ai !== undefined && ai > bi) {
          for (const f of r.change_fields ?? []) {
            const bMsg = ctx.known.get(f.before_id);
            const aMsg = ctx.known.get(f.after_id);
            const parent = (id: string) => ctx.parts?.get(id)?.parentId ?? id;
            if (!bMsg || !aMsg || parent(f.before_id) !== before.messageId || parent(f.after_id) !== after.messageId) continue;
            if (!norm(bMsg.text).includes(norm(f.before_value)) || !norm(aMsg.text).includes(norm(f.after_value))) continue;
            if (norm(f.before_value) === norm(f.after_value)) continue;
            pairs.push({
              id: `${item.id}-c${pairs.length + 1}`,
              itemId: item.id,
              subjectKey: item.subjectKey,
              field: f.field,
              before: { value: f.before_value.trim(), evidence: before },
              after: { value: f.after_value.trim(), evidence: after },
            });
          }
        }
      }
      if (pairs.length === 0) {
        // Never assert a replacement without two valid sources, but keep what the valid evidence does support.
        const kept = evidence;
        report.downgraded.push({ title: r.title });
        item.kind = r.status === 'proposed' ? 'proposal' : 'decision';
        item.status = r.status === 'proposed' ? 'proposed' : 'needs-clarification';
        item.evidence = kept.map((e) => ({ ...e, role: 'states' as EvidenceRole }));
        report.items.push(item);
        continue;
      }
      report.changes.push(...pairs);
    }
    report.items.push(item);
  }
  return report;
}
