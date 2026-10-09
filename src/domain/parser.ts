import { wallTimeToIso } from './time';
import type { DateOrder, FormatId, Message, Participant, ParseIssue, ParseResult } from './types';

export const MAX_BYTES = 2 * 1024 * 1024;
export const MAX_MESSAGES = 2000;

export interface ParseOptions {
  dateOrder?: DateOrder;
  timezone: string;
}

interface Header {
  a?: number;
  b?: number;
  year?: number;
  hour?: number;
  minute?: number;
  second?: number;
  iso?: { y: number; mo: number; d: number };
  timestampRaw: string;
  rest: string;
}

const RE_WA_A = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?:\s?([ap]m))?\s+-\s+(.*)$/i;
const RE_WA_I = /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s?([ap]m))?\]\s+(.*)$/i;
const RE_BRACKET_TIME = /^\[(\d{1,2}):(\d{2})\]\s+(.*)$/;
const RE_BRACKET_ISO = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s+(.*)$/;
const RE_PLAIN = /^([^:\[\]\n]{1,40}?):\s+(.*)$/;

function to24(h: number, ampm?: string): number {
  if (!ampm) return h;
  const pm = ampm.toLowerCase() === 'pm';
  return (h % 12) + (pm ? 12 : 0);
}

function fullYear(y: number): number {
  return y < 100 ? 2000 + y : y;
}

function matchHeader(format: FormatId, line: string): Header | null {
  let m: RegExpMatchArray | null;
  switch (format) {
    case 'WA-A':
      m = line.match(RE_WA_A);
      if (!m) return null;
      return {
        a: +m[1],
        b: +m[2],
        year: fullYear(+m[3]),
        hour: to24(+m[4], m[6]),
        minute: +m[5],
        second: 0,
        timestampRaw: line.slice(0, line.length - m[7].length).replace(/\s+-\s+$/, ''),
        rest: m[7],
      };
    case 'WA-I':
      m = line.match(RE_WA_I);
      if (!m) return null;
      return {
        a: +m[1],
        b: +m[2],
        year: fullYear(+m[3]),
        hour: to24(+m[4], m[7]),
        minute: +m[5],
        second: m[6] ? +m[6] : 0,
        timestampRaw: line.slice(0, line.length - m[8].length).trim(),
        rest: m[8],
      };
    case 'BRACKET-TIME':
      m = line.match(RE_BRACKET_TIME);
      if (!m) return null;
      return { hour: +m[1], minute: +m[2], timestampRaw: `[${m[1]}:${m[2]}]`, rest: m[3] };
    case 'BRACKET-ISO':
      m = line.match(RE_BRACKET_ISO);
      if (!m) return null;
      return {
        iso: { y: +m[1], mo: +m[2], d: +m[3] },
        hour: +m[4],
        minute: +m[5],
        second: m[6] ? +m[6] : 0,
        timestampRaw: line.slice(0, line.length - m[7].length).trim(),
        rest: m[7],
      };
    case 'PLAIN':
      m = line.match(RE_PLAIN);
      if (!m) return null;
      return { timestampRaw: '', rest: line };
  }
}

const FORMAT_ORDER: FormatId[] = ['WA-A', 'WA-I', 'BRACKET-ISO', 'BRACKET-TIME', 'PLAIN'];

/** Score plausible header lines among the first 50 non-empty lines; continuation lines do not lower the score. */
export function detectFormat(lines: string[]): FormatId | null {
  const sample = lines.filter((l) => l.trim() !== '').slice(0, 50);
  let best: FormatId | null = null;
  let bestScore = 0;
  for (const f of FORMAT_ORDER) {
    let score = 0;
    for (const l of sample) {
      const h = matchHeader(f, l);
      if (!h) continue;
      if (f === 'PLAIN') {
        // Author must be a name, not a sentence fragment; require author-like text.
        const name = h.rest.split(/:\s/)[0];
        if (name.split(/\s+/).length > 4) continue;
      }
      score++;
    }
    if (score > bestScore) {
      best = f;
      bestScore = score;
    }
  }
  if (best === 'PLAIN' && bestScore < 2) return null;
  return bestScore > 0 ? best : null;
}

function splitAuthor(rest: string): { author: string; text: string } | null {
  const i = rest.indexOf(': ');
  if (i <= 0) {
    // Message ending with colon and nothing after, e.g. "Sam:"
    if (rest.endsWith(':') && rest.length > 1) return { author: rest.slice(0, -1).trim(), text: '' };
    return null;
  }
  return { author: rest.slice(0, i).trim(), text: rest.slice(i + 2) };
}

export function emptyResult(): ParseResult {
  return {
    format: null,
    messages: [],
    participants: [],
    issues: [],
    dateOrderAmbiguous: false,
    dateOrderUsed: null,
    hasTimestamps: false,
  };
}

export class InputTooLargeError extends Error {}

/** Deterministic parser. Never calls a model. */
export function parseChat(raw: string, opts: ParseOptions): ParseResult {
  const bytes = new TextEncoder().encode(raw).length;
  if (bytes > MAX_BYTES) {
    throw new InputTooLargeError(`Input is ${(bytes / 1048576).toFixed(1)} MB; the limit is 2 MB.`);
  }
  const text = raw.replace(/^\uFEFF/, '').replace(/[\u200E\u200F\u202A-\u202E]/g, '');
  const lines = text.split(/\r\n|\r|\n/);
  const format = detectFormat(lines);
  const result = emptyResult();
  if (!format) {
    return result;
  }
  result.format = format;
  result.hasTimestamps = format !== 'PLAIN' && format !== 'BRACKET-TIME';

  // Pass 1: split into raw entries.
  interface Entry {
    lineStart: number;
    lineEnd: number;
    header: Header;
    author: string;
    text: string[];
  }
  const entries: Entry[] = [];
  const issues: ParseIssue[] = [];
  let current: Entry | null = null;
  let systemOpen = false;

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    const header = matchHeader(format, line);
    if (header) {
      const split = splitAuthor(header.rest);
      if (!split || (format === 'PLAIN' && split.author.split(/\s+/).length > 4)) {
        if (format === 'PLAIN') {
          // looks like prose, treat as continuation
          if (current) {
            current.text.push(line);
            current.lineEnd = lineNo;
            issues.push({ line: lineNo, kind: 'unrecognized', rawLine: line, handling: 'attached-to-previous' });
          } else {
            issues.push({ line: lineNo, kind: 'continuation-orphan', rawLine: line, handling: 'excluded-shown' });
          }
          return;
        }
        // Timestamped line without "Author: " => system line
        issues.push({ line: lineNo, kind: 'system-line', rawLine: line, handling: 'kept-as-system' });
        current = null;
        systemOpen = true;
        return;
      }
      systemOpen = false;
      current = { lineStart: lineNo, lineEnd: lineNo, header, author: split.author, text: [split.text] };
      entries.push(current);
      return;
    }
    if (line.trim() === '' && !current) return;
    if (current) {
      current.text.push(line);
      current.lineEnd = lineNo;
      return;
    }
    if (line.trim() === '') return;
    if (systemOpen) {
      issues.push({ line: lineNo, kind: 'system-line', rawLine: line, handling: 'kept-as-system' });
      return;
    }
    issues.push({ line: lineNo, kind: 'continuation-orphan', rawLine: line, handling: 'excluded-shown' });
  });

  // Date order resolution for numeric day/month formats.
  const numeric = entries.filter((e) => e.header.a !== undefined);
  let order: DateOrder | null = opts.dateOrder ?? null;
  if (numeric.length > 0) {
    const anyFirstOver12 = numeric.some((e) => e.header.a! > 12);
    const anySecondOver12 = numeric.some((e) => e.header.b! > 12);
    if (anyFirstOver12 && !anySecondOver12) order = 'DMY';
    else if (anySecondOver12 && !anyFirstOver12) order = 'MDY';
    else if (anyFirstOver12 && anySecondOver12) {
      issues.push({ line: numeric[0].lineStart, kind: 'ambiguous-date', rawLine: 'Dates use both orders', handling: 'excluded-shown' });
    } else {
      // Day and month cannot be told apart from the text; stays true after the user chooses so the choice remains visible.
      result.dateOrderAmbiguous = true;
    }
    result.dateOrderUsed = order;
  }

  // Pass 2: messages and participants.
  const names = new Map<string, Participant>();
  const messages: Message[] = [];
  for (const e of entries) {
    if (messages.length >= MAX_MESSAGES) {
      issues.push({
        line: e.lineStart,
        kind: 'unrecognized',
        rawLine: `More than ${MAX_MESSAGES} messages. Supply a smaller export.`,
        handling: 'excluded-shown',
      });
      break;
    }
    let p = names.get(e.author);
    if (!p) {
      p = { id: `p${names.size + 1}`, displayName: e.author, messageCount: 0 };
      names.set(e.author, p);
    }
    p.messageCount++;
    let timestamp: string | null = null;
    const h = e.header;
    if (h.iso) {
      timestamp = wallTimeToIso(h.iso.y, h.iso.mo, h.iso.d, h.hour ?? 0, h.minute ?? 0, h.second ?? 0, opts.timezone);
    } else if (h.a !== undefined && order) {
      const day = order === 'DMY' ? h.a : h.b!;
      const month = order === 'DMY' ? h.b! : h.a;
      timestamp = wallTimeToIso(h.year!, month, day, h.hour!, h.minute!, h.second ?? 0, opts.timezone);
    }
    if (!timestamp && format !== 'PLAIN' && format !== 'BRACKET-TIME' && !(result.dateOrderAmbiguous && !order)) {
      issues.push({ line: e.lineStart, kind: 'no-timestamp', rawLine: e.header.timestampRaw, handling: 'excluded-shown' });
    }
    messages.push({
      id: `m${messages.length + 1}`,
      lineStart: e.lineStart,
      lineEnd: e.lineEnd,
      authorRaw: e.author,
      participantId: p.id,
      timestamp,
      timestampRaw: h.timestampRaw,
      text: e.text.join('\n').replace(/\n+$/, ''),
      isUnread: true,
    });
  }
  if (format === 'PLAIN' || format === 'BRACKET-TIME') {
    issues.unshift({
      line: 1,
      kind: 'no-timestamp',
      rawLine: 'No dates in this format',
      handling: 'excluded-shown',
    });
  }
  result.messages = messages;
  result.participants = [...names.values()];
  result.issues = issues.sort((x, y) => x.line - y.line);
  return result;
}

/** Marks messages up to and including lastReadId as read. */
export function applyReadBoundary(messages: Message[], lastReadId: string | null): Message[] {
  if (!lastReadId) return messages.map((m) => ({ ...m, isUnread: true }));
  const idx = messages.findIndex((m) => m.id === lastReadId);
  return messages.map((m, i) => ({ ...m, isUnread: idx < 0 ? true : i > idx }));
}
