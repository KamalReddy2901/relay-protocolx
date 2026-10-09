import { estimateTokens, serializeMessage } from './extraction';
import type { Message } from './types';

/** Budgets are in estimateTokens() units, which deliberately over-count (bytes/2). */
export const MSG_BUDGET = 1500;
export const CONTEXT_BUDGET = 500;
export const LEDGER_BUDGET = 450;
export const CONTEXT_MESSAGES = 10;
const UNIT_MAX = 1000;

/** One thing sent to the model as an unread line: a whole message or a part (`m88#1`) of a long one. */
export interface Unit {
  key: string;
  parentId: string;
  /** Character offset of this part's text within the parent message. */
  offset: number;
  message: Message;
  partCount: number;
}

export interface ChunkPlan {
  index: number;
  units: Unit[];
  contextIds: string[];
}

function cost(m: Message) {
  return estimateTokens(serializeMessage(m, false));
}

function splitLong(m: Message): Unit[] {
  if (cost(m) <= UNIT_MAX) return [{ key: m.id, parentId: m.id, offset: 0, message: m, partCount: 1 }];
  const pieces: { text: string; offset: number }[] = [];
  const re = /[^.!?\n]*[.!?\n]+\s*|[^.!?\n]+$/g;
  let cur = { text: '', offset: 0 };
  let pos = 0;
  const push = () => {
    if (cur.text) pieces.push(cur);
    cur = { text: '', offset: pos };
  };
  const probe = (t: string) => estimateTokens(JSON.stringify(t)) + 40;
  for (const match of m.text.matchAll(re)) {
    let s = match[0];
    if (!s) continue;
    // A single sentence that is itself too long is cut by characters.
    while (probe(s) > UNIT_MAX) {
      const cut = Math.max(50, Math.floor(s.length / 2));
      const head = s.slice(0, cut);
      s = s.slice(cut);
      if (probe(cur.text + head) > UNIT_MAX) push();
      if (!cur.text) cur.offset = pos;
      cur.text += head;
      pos += head.length;
      push();
    }
    if (probe(cur.text + s) > UNIT_MAX) push();
    if (!cur.text) cur.offset = pos;
    cur.text += s;
    pos += s.length;
  }
  push();
  return pieces.map((p, i) => ({
    key: `${m.id}#${i + 1}`,
    parentId: m.id,
    offset: p.offset,
    message: { ...m, id: `${m.id}#${i + 1}`, text: p.text },
    partCount: pieces.length,
  }));
}

export function contextIdsFor(all: Message[], firstMessageId: string): string[] {
  const idx = all.findIndex((m) => m.id === firstMessageId);
  const ids: string[] = [];
  let used = 0;
  for (let i = idx - 1; i >= 0 && ids.length < CONTEXT_MESSAGES; i--) {
    const c = cost(all[i]);
    if (used + c > CONTEXT_BUDGET) break;
    used += c;
    ids.unshift(all[i].id);
  }
  return ids;
}

/** Split on message boundaries (parts only for oversize messages). Never truncates silently. */
export function planChunks(all: Message[], only?: Set<string>): ChunkPlan[] {
  const unread = all.filter((m) => m.isUnread && (!only || only.has(m.id)));
  const plans: ChunkPlan[] = [];
  let units: Unit[] = [];
  let used = 0;
  const flush = () => {
    if (!units.length) return;
    plans.push({ index: plans.length, units, contextIds: contextIdsFor(all, units[0].parentId) });
    units = [];
    used = 0;
  };
  for (const m of unread) {
    for (const u of splitLong(m)) {
      const c = cost(u.message);
      if (used + c > MSG_BUDGET && units.length) flush();
      units.push(u);
      used += c;
    }
  }
  flush();
  return plans;
}

/** Halve a chunk after a context overflow or truncated output. Returns null when it cannot shrink. */
export function splitPlan(plan: ChunkPlan, all: Message[]): [ChunkPlan, ChunkPlan] | null {
  if (plan.units.length < 2) return null;
  const mid = Math.ceil(plan.units.length / 2);
  const a = plan.units.slice(0, mid);
  const b = plan.units.slice(mid);
  return [
    { index: plan.index, units: a, contextIds: plan.contextIds },
    { index: plan.index, units: b, contextIds: contextIdsFor(all, b[0].parentId) },
  ];
}

export function rangeLabel(units: Unit[]): string {
  const first = units[0].parentId;
  const last = units[units.length - 1].parentId;
  return first === last ? first : `${first}–${last}`;
}
