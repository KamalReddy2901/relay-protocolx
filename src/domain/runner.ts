import { LEDGER_BUDGET, planChunks, rangeLabel, splitPlan, type ChunkPlan } from './chunker';
import { buildUserPrompt, estimateTokens, serializeMessage, systemPromptFor } from './extraction';
import { reconcile } from './reconcile';
import { omissionChecks, OMISSION_SYSTEM_PROMPT } from './omissions';
import type { ChangePair, Coverage, Item, Message, Participant } from './types';
import { parseModelOutput, validateExtraction } from './validate';

export interface GenerateOutput {
  text: string;
  finishReason: string | null;
}
export type GenerateFn = (userPrompt: string, systemPrompt: string) => Promise<GenerateOutput>;

export type RunEvent =
  | { type: 'chunk-start'; n: number; total: number; range: string; firstId: string; lastId: string }
  | { type: 'chunk-end'; n: number; range: string; status: 'done' | 'failed' | 'invalid-output' };

export interface RunInput {
  messages: Message[];
  participants: Participant[];
  generate: GenerateFn;
  signal?: AbortSignal;
  /** Process only these unread message ids (used to retry failed sections). */
  only?: Set<string>;
  /** Offset for item ids so merged runs never collide. */
  seqStart?: number;
  onEvent?: (e: RunEvent) => void;
}

export interface RunOutput {
  items: Item[];
  changes: ChangePair[];
  discarded: { reason: string; title: string }[];
  downgraded: number;
  instructionSources: number;
  coverage: Coverage;
  processedIds: string[];
  failedIds: string[];
  seq: number;
  chunkLog: { range: string; status: 'done' | 'failed' | 'invalid-output' | 'skipped'; note?: string }[];
}

/** Errors that mean the GPU or runtime is gone; the run stops instead of marking one chunk failed. */
export class FatalInferenceError extends Error {
  constructor(
    message: string,
    readonly kind: 'gpu-memory' | 'device-lost',
  ) {
    super(message);
  }
}

const OVERFLOW = /context window|exceed|too long|prompt tokens|max.*tokens/i;
const GPU_MEMORY = /out of memory|\boom\b|createBuffer|allocat/i;
const DEVICE_LOST = /device.*lost|lost.*device|gpu.*(crash|reset)/i;

export function classifyError(e: unknown): 'overflow' | 'gpu-memory' | 'device-lost' | 'other' {
  const msg = e instanceof Error ? e.message : String(e);
  if (DEVICE_LOST.test(msg)) return 'device-lost';
  if (OVERFLOW.test(msg)) return 'overflow';
  if (GPU_MEMORY.test(msg)) return 'gpu-memory';
  return 'other';
}

export async function runCatchUp(input: RunInput): Promise<RunOutput> {
  const { messages, participants, generate, signal, onEvent, only } = input;
  const byId = new Map(messages.map((m) => [m.id, m]));
  const order = new Map(messages.map((m, i) => [m.id, i]));
  const unreadTotal = messages.filter((m) => m.isUnread).length;

  const queue: ChunkPlan[] = planChunks(messages, only);
  let total = queue.length;
  let n = 0;
  let seq = input.seqStart ?? 0;
  const items: Item[] = [];
  const changes: ChangePair[] = [];
  const discarded: { reason: string; title: string }[] = [];
  let downgraded = 0;
  let instructionSources = 0;
  const chunkLog: RunOutput['chunkLog'] = [];
  const doneParts = new Map<string, Set<string>>();
  const partTotals = new Map<string, number>();
  const failedRanges: string[] = [];
  let thinkingStripped = false;
  let cancelled = false;

  const buildLedger = (plan: ChunkPlan): Message[] => {
    const firstIdx = order.get(plan.units[0].parentId) ?? 0;
    const have = new Set([...plan.contextIds, ...plan.units.map((u) => u.parentId)]);
    const out: Message[] = [];
    let used = 0;
    const evs = [...items].reverse().flatMap((it) => it.evidence.map((e) => ({ it, e })));
    for (const { e } of evs) {
      if (have.has(e.messageId)) continue;
      const idx = order.get(e.messageId);
      const base = byId.get(e.messageId);
      if (idx === undefined || !base || idx >= firstIdx) continue;
      const ledgerMsg: Message = { ...base, text: e.quote };
      const c = estimateTokens(serializeMessage(ledgerMsg, 'ledger'));
      if (used + c > LEDGER_BUDGET) break;
      used += c;
      have.add(e.messageId);
      out.unshift(ledgerMsg);
    }
    return out;
  };

  const attempt = async (plan: ChunkPlan): Promise<'done' | 'failed' | 'invalid-output' | 'split'> => {
    const context = plan.contextIds.map((id) => byId.get(id)!).filter(Boolean);
    const ledger = buildLedger(plan);
    const unitMsgs = plan.units.map((u) => u.message);
    const prompt = buildUserPrompt(unitMsgs, context, ledger);
    const system = systemPromptFor(ledger.length > 0);

    const known = new Map<string, Message>();
    for (const m of context) known.set(m.id, m);
    for (const l of ledger) known.set(l.id, byId.get(l.id)!);
    const parts = new Map<string, { parentId: string; offset: number }>();
    for (const u of plan.units) {
      known.set(u.key, u.message);
      if (u.partCount > 1) parts.set(u.key, { parentId: u.parentId, offset: u.offset });
      else known.set(u.parentId, u.message);
    }

    let lastError = '';
    for (let tryNo = 0; tryNo < 2; tryNo++) {
      if (signal?.aborted) return 'failed';
      const userPrompt = tryNo === 0 ? prompt : `${prompt}\n\nYour previous reply was rejected: ${lastError}. Reply with ONLY one valid JSON object that matches the schema.`;
      let out: GenerateOutput;
      try {
        out = await generate(userPrompt, system);
      } catch (e) {
        if (signal?.aborted) return 'failed';
        const kind = classifyError(e);
        if (kind === 'overflow') return splitPlan(plan, messages) ? 'split' : 'failed';
        if (kind === 'gpu-memory') throw new FatalInferenceError('The model ran out of GPU memory.', 'gpu-memory');
        if (kind === 'device-lost') throw new FatalInferenceError('The GPU device was lost.', 'device-lost');
        chunkLog.push({ range: rangeLabel(plan.units), status: 'failed', note: e instanceof Error ? e.message : String(e) });
        return 'failed';
      }
      if (signal?.aborted) return 'failed';
      if (out.finishReason === 'length') {
        // Truncated JSON cannot be trusted; shrink the chunk if possible.
        if (splitPlan(plan, messages)) return 'split';
        lastError = 'output was cut off';
        continue;
      }
      const parsed = parseModelOutput(out.text);
      if (parsed.ok) {
        thinkingStripped ||= parsed.thinkingStripped;
        const v = validateExtraction(parsed.value, {
          known,
          order,
          participants,
          chunkIndex: ++seq,
          parts,
        });
        const checks = omissionChecks([...known.values()], participants, v);
        if (checks.length) {
          let repair: GenerateOutput;
          try {
            repair = await generate(`${prompt}\n\nExtraction audit:\n${checks.join('\n')}`, OMISSION_SYSTEM_PROMPT);
          } catch (e) {
            const kind = classifyError(e);
            if (kind === 'gpu-memory') throw new FatalInferenceError('The model ran out of GPU memory.', 'gpu-memory');
            if (kind === 'device-lost') throw new FatalInferenceError('The GPU device was lost.', 'device-lost');
            chunkLog.push({ range: rangeLabel(plan.units), status: 'failed', note: 'Focused extraction audit failed; retry this section.' });
            return 'failed';
          }
          if (signal?.aborted) return 'failed';
          const audited = parseModelOutput(repair.text);
          if (!audited.ok || repair.finishReason === 'length') {
            chunkLog.push({ range: rangeLabel(plan.units), status: 'invalid-output', note: 'Focused extraction audit returned invalid or truncated output.' });
            return 'invalid-output';
          }
          const extra = validateExtraction(audited.value, { known, order, participants, chunkIndex: ++seq, parts });
          v.items.push(...extra.items);
          v.changes.push(...extra.changes);
          v.discarded.push(...extra.discarded);
          v.downgraded.push(...extra.downgraded);
          v.instructionSources += extra.instructionSources;
          thinkingStripped ||= audited.thinkingStripped;
          chunkLog.push({ range: rangeLabel(plan.units), status: 'done', note: 'Ran one focused extraction audit for possible omissions.' });
        }
        items.push(...v.items);
        changes.push(...v.changes);
        discarded.push(...v.discarded);
        downgraded += v.downgraded.length;
        instructionSources += v.instructionSources;
        return 'done';
      }
      lastError = parsed.error;
    }
    chunkLog.push({ range: rangeLabel(plan.units), status: 'invalid-output', note: lastError });
    return 'invalid-output';
  };

  while (queue.length) {
    if (signal?.aborted) {
      cancelled = true;
      for (const p of queue) chunkLog.push({ range: rangeLabel(p.units), status: 'skipped' });
      break;
    }
    const plan = queue.shift()!;
    n++;
    const range = rangeLabel(plan.units);
    onEvent?.({ type: 'chunk-start', n, total, range, firstId: plan.units[0].parentId, lastId: plan.units[plan.units.length - 1].parentId });
    const res = await attempt(plan);
    if (res === 'split') {
      const halves = splitPlan(plan, messages)!;
      queue.unshift(...halves);
      total++;
      chunkLog.push({ range, status: 'skipped', note: 'split after overflow or truncated output' });
      continue;
    }
    onEvent?.({ type: 'chunk-end', n, range, status: res });
    if (res === 'done') {
      for (const u of plan.units) {
        const set = doneParts.get(u.parentId) ?? new Set<string>();
        set.add(u.key);
        doneParts.set(u.parentId, set);
        partTotals.set(u.parentId, u.partCount);
      }
      chunkLog.push({ range, status: 'done' });
    } else {
      failedRanges.push(range);
      if (!chunkLog.some((c) => c.range === range && c.status === res)) chunkLog.push({ range, status: res });
    }
  }

  const processedIds: string[] = [];
  for (const m of messages) {
    const set = doneParts.get(m.id);
    if (set && set.size === partTotals.get(m.id)) processedIds.push(m.id);
  }
  const processed = processedIds.length;
  const targetIds = messages.filter((m) => m.isUnread && (!only || only.has(m.id))).map((m) => m.id);
  const failedIds = targetIds.filter((id) => !processedIds.includes(id));
  const rec = reconcile(items, changes, messages);
  const coverage: Coverage = {
    totalUnread: unreadTotal,
    processedUnread: processed,
    failedRanges,
    discardedCount: discarded.length,
    complete: !cancelled && failedRanges.length === 0 && failedIds.length === 0 && (only ? true : processed === unreadTotal),
    cancelled,
    thinkingStripped,
  };
  return { items: rec.items, changes: rec.changes, discarded, downgraded, instructionSources, coverage, processedIds, failedIds, seq, chunkLog };
}

/** Combine a first run with a retry of its failed sections; coverage is recomputed from what actually succeeded. */
export function mergeRuns(prev: RunOutput, next: RunOutput, messages: Message[]): RunOutput {
  const rec = reconcile([...prev.items, ...next.items], [...prev.changes, ...next.changes], messages);
  const processed = new Set([...prev.processedIds, ...next.processedIds]);
  const processedIds = messages.filter((m) => processed.has(m.id)).map((m) => m.id);
  const failedIds = messages.filter((m) => m.isUnread && !processed.has(m.id)).map((m) => m.id);
  const discarded = [...prev.discarded, ...next.discarded];
  return {
    items: rec.items,
    changes: rec.changes,
    discarded,
    downgraded: prev.downgraded + next.downgraded,
    instructionSources: prev.instructionSources + next.instructionSources,
    processedIds,
    failedIds,
    seq: next.seq,
    chunkLog: [...prev.chunkLog, ...next.chunkLog],
    coverage: {
      totalUnread: prev.coverage.totalUnread,
      processedUnread: processedIds.length,
      failedRanges: next.coverage.failedRanges,
      discardedCount: discarded.length,
      complete: failedIds.length === 0 && !next.coverage.cancelled,
      cancelled: next.coverage.cancelled,
      thinkingStripped: prev.coverage.thinkingStripped || next.coverage.thinkingStripped,
    },
  };
}
