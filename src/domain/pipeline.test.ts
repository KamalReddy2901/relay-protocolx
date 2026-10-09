import { describe, expect, it } from 'vitest';
import { planChunks } from './chunker';
import { resolveDeadline } from './dates';
import { applyReadBoundary, parseChat } from './parser';
import { rank } from './rank';
import { classifyError, FatalInferenceError, runCatchUp, type GenerateFn } from './runner';

const TZ = 'Asia/Kolkata';
// Synthetic test fixtures (internal only; not real chats and never shown as output).
const FIXTURE = [
  '10/10/26, 09:00 - Priya: Setup is confirmed for 3pm in Room B214, Arjun bring the projector.',
  '10/10/26, 09:10 - Sam: could we do 4?',
  "10/10/26, 09:20 - Priya: Update: we've moved to LT-2 at 4pm, Room B214 is gone. Kamal, please grab the projector instead, Arjun is out.",
].join('\n');

function setup(text = FIXTURE, lastRead: string | null = null) {
  const p = parseChat(text, { timezone: TZ, dateOrder: 'DMY' });
  return { p, msgs: applyReadBoundary(p.messages, lastRead) };
}

/** Test double standing in for the model worker. Production never uses this. */
const fakeModel: GenerateFn = async (user) => {
  if (!user.includes('"id":"m3"')) return { text: JSON.stringify({ items: [] }), finishReason: 'stop' };
  return {
    finishReason: 'stop',
    text: JSON.stringify({
      items: [
        {
          kind: 'change', title: 'Setup venue and time changed', owner_name: null, deadline_text: null, status: 'confirmed',
          subject: 'setup venue',
          change_fields: [{ field: 'place', before_value: 'Room B214', after_value: 'LT-2', before_id: 'm1', after_id: 'm3' }],
          evidence: [
            { id: 'm1', quote: 'confirmed for 3pm in Room B214', role: 'before' },
            { id: 'm3', quote: "moved to LT-2 at 4pm", role: 'after' },
          ],
        },
        {
          kind: 'change', title: 'Projector owner changed', owner_name: 'Kamal', deadline_text: null, status: 'confirmed',
          subject: 'projector',
          change_fields: [{ field: 'owner', before_value: 'Arjun', after_value: 'Kamal', before_id: 'm1', after_id: 'm3' }],
          evidence: [
            { id: 'm1', quote: 'Arjun bring the projector', role: 'before' },
            { id: 'm3', quote: 'Kamal, please grab the projector', role: 'after' },
          ],
        },
        {
          kind: 'action', title: 'Bring the projector to LT-2', owner_name: 'Kamal', deadline_text: '4pm', status: 'confirmed',
          subject: 'projector', evidence: [{ id: 'm3', quote: 'Kamal, please grab the projector', role: 'assigns' }],
        },
        {
          kind: 'action', title: 'Bring the projector', owner_name: 'Arjun', deadline_text: '3pm', status: 'confirmed',
          subject: 'projector', evidence: [{ id: 'm1', quote: 'Arjun bring the projector', role: 'assigns' }],
        },
        {
          kind: 'proposal', title: 'Move to 4pm', owner_name: null, deadline_text: '4', status: 'proposed',
          subject: 'setup venue', evidence: [{ id: 'm2', quote: 'could we do 4?', role: 'proposes' }],
        },
        { kind: 'action', title: 'Invented', owner_name: 'Kamal', deadline_text: null, status: 'confirmed', subject: 'x', evidence: [{ id: 'm999', quote: 'nope', role: 'assigns' }] },
      ],
    }),
  };
};

describe('pipeline with a model double', () => {
  it('produces change pairs, ranks for Kamal and re-ranks for Arjun without new inference', async () => {
    const { p, msgs } = setup();
    let calls = 0;
    const out = await runCatchUp({ messages: msgs, participants: [...p.participants, { id: 'p9', displayName: 'Kamal', messageCount: 0 }, { id: 'p8', displayName: 'Arjun', messageCount: 0 }], generate: async (u, s) => { calls++; return fakeModel(u, s); } });
    expect(out.coverage.complete).toBe(true);
    expect(out.coverage.discardedCount).toBe(1);
    expect(out.changes).toHaveLength(2);
    const people = [...p.participants, { id: 'p9', displayName: 'Kamal', messageCount: 0 }, { id: 'p8', displayName: 'Arjun', messageCount: 0 }];
    const base = { items: out.items, changes: out.changes, messages: msgs, participants: people, referenceTime: '2026-10-10T09:30:00+05:30', timezone: TZ, actions: {} };
    expect(out.items.find((i) => i.ownerRaw === 'Arjun')?.supersededBy).toBeTruthy();
    // Owner ids are resolved from chat participants; Kamal/Arjun are not senders here, so exercise by names.
    const kamal = rank({ ...base, selfId: 'p9' });
    expect(kamal.actNow.map((a) => a.item.title)).toEqual(['Bring the projector to LT-2']);
    expect(kamal.actNow[0].reasons.some((r) => r.startsWith('Reassigned to you'))).toBe(true);
    expect(kamal.changed[0].affectsSelf).toBe(true);
    expect(kamal.changed[0].pairs.length).toBe(2);
    const callsAfterKamal = calls;
    const arjun = rank({ ...base, selfId: 'p8' });
    expect(arjun.actNow).toHaveLength(0);
    expect(arjun.context.some((c) => c.reasons.includes('Reassigned away from you'))).toBe(true);
    expect(calls).toBe(callsAfterKamal);
  });

  it('keeps an unconfirmed proposal out of Act now when the revision message is removed', async () => {
    const { p, msgs } = setup(FIXTURE.split('\n').slice(0, 2).join('\n'));
    const out = await runCatchUp({
      messages: msgs, participants: p.participants,
      generate: async () => ({ finishReason: 'stop', text: JSON.stringify({ items: [{ kind: 'proposal', title: 'Move to 4pm', owner_name: null, deadline_text: null, status: 'proposed', subject: 'time', evidence: [{ id: 'm2', quote: 'could we do 4?', role: 'proposes' }] }] }) }),
    });
    expect(out.changes).toHaveLength(0);
    const r = rank({ items: out.items, changes: out.changes, messages: msgs, participants: p.participants, selfId: 'p1', referenceTime: '2026-10-10T09:30:00+05:30', timezone: TZ, actions: {} });
    expect(r.actNow).toHaveLength(0);
    expect(r.context[0].statusLabel).toBe('Proposed');
  });

  it('retries invalid JSON once, then marks the chunk invalid and coverage partial', async () => {
    const { p, msgs } = setup();
    let calls = 0;
    const out = await runCatchUp({ messages: msgs, participants: p.participants, generate: async () => { calls++; return { text: 'Sure!', finishReason: 'stop' }; } });
    expect(calls).toBe(2);
    expect(out.coverage.complete).toBe(false);
    expect(out.coverage.failedRanges).toEqual(['m1–m3']);
  });

  it('splits on a context overflow error and then completes', async () => {
    const { p, msgs } = setup();
    let first = true;
    const out = await runCatchUp({
      messages: msgs, participants: p.participants,
      generate: async () => { if (first) { first = false; throw new Error('Prompt tokens exceed context window size'); } return { text: '{"items":[]}', finishReason: 'stop' }; },
    });
    expect(out.coverage.complete).toBe(true);
    expect(out.chunkLog.some((c) => c.note?.includes('split'))).toBe(true);
  });

  it('stops with a fatal error on GPU memory loss', async () => {
    const { p, msgs } = setup();
    await expect(runCatchUp({ messages: msgs, participants: p.participants, generate: async () => { throw new Error('Out of memory in createBuffer'); } })).rejects.toBeInstanceOf(FatalInferenceError);
    expect(classifyError(new Error('Device was lost'))).toBe('device-lost');
  });

  it('reports a cancelled run as partial', async () => {
    const { p, msgs } = setup();
    const ac = new AbortController();
    ac.abort();
    const out = await runCatchUp({ messages: msgs, participants: p.participants, signal: ac.signal, generate: fakeModel });
    expect(out.coverage.cancelled).toBe(true);
    expect(out.coverage.complete).toBe(false);
  });
});

describe('chunker and ledger across chunks', () => {
  const many = Array.from({ length: 120 }, (_, i) => `10/10/26, 09:${String(i % 60).padStart(2, '0')} - ${i % 2 ? 'Ann' : 'Bo'}: message number ${i} about something ordinary that takes space`).join('\n');
  it('splits on message boundaries into several chunks with read-only context', () => {
    const { msgs } = setup(many, 'm10');
    const plans = planChunks(msgs);
    expect(plans.length).toBeGreaterThan(2);
    expect(plans.flatMap((c) => c.units.map((u) => u.parentId))).toEqual(msgs.slice(10).map((m) => m.id));
    expect(plans[1].contextIds.length).toBeGreaterThan(0);
    expect(plans[1].contextIds.length).toBeLessThanOrEqual(10);
  });

  it('splits one oversize message into parts that reassemble exactly', () => {
    const long = Array.from({ length: 400 }, (_, i) => `Sentence ${i} is here.`).join(' ');
    const { msgs } = setup(`10/10/26, 09:00 - Ann: ${long}`);
    const plans = planChunks(msgs);
    const units = plans.flatMap((c) => c.units);
    expect(units.length).toBeGreaterThan(1);
    expect(units.map((u) => u.message.text).join('')).toBe(long);
    for (const u of units) expect(long.slice(u.offset, u.offset + u.message.text.length)).toBe(u.message.text);
  });

  it('lets a later chunk cite an earlier message through the ledger so a cross-chunk change validates', async () => {
    const filler = Array.from({ length: 70 }, (_, i) => `10/10/26, 10:${String(i % 60).padStart(2, '0')} - Ann: filler chatter number ${i} with enough words to use budget`).join('\n');
    const text = `10/10/26, 09:00 - Priya: Venue is Room B214 for the rehearsal.\n${filler}\n10/10/26, 12:00 - Priya: Update: rehearsal moved to LT-2.`;
    const { p, msgs } = setup(text);
    const lastId = msgs[msgs.length - 1].id;
    const sawLedger: boolean[] = [];
    const out = await runCatchUp({
      messages: msgs, participants: p.participants,
      generate: async (user) => {
        if (user.includes(`"id":"${lastId}"`) && !user.includes('"id":"m1","time"')) return { text: '{"items":[]}', finishReason: 'stop' };
        if (user.includes('"id":"m1"') && !user.includes(`"id":"${lastId}"`)) {
          return { finishReason: 'stop', text: JSON.stringify({ items: [{ kind: 'decision', title: 'Rehearsal in Room B214', owner_name: null, deadline_text: null, status: 'confirmed', subject: 'rehearsal venue', evidence: [{ id: 'm1', quote: 'Venue is Room B214', role: 'states' }] }] }) };
        }
        if (user.includes(`"id":"${lastId}"`)) {
          sawLedger.push(user.includes('"ledger":true'));
          return { finishReason: 'stop', text: JSON.stringify({ items: [{ kind: 'change', title: 'Rehearsal venue changed', owner_name: null, deadline_text: null, status: 'confirmed', subject: 'rehearsal venue', change_fields: [{ field: 'place', before_value: 'Room B214', after_value: 'LT-2', before_id: 'm1', after_id: lastId }], evidence: [{ id: 'm1', quote: 'Venue is Room B214', role: 'before' }, { id: lastId, quote: 'moved to LT-2', role: 'after' }] }] }) };
        }
        return { text: '{"items":[]}', finishReason: 'stop' };
      },
    });
    expect(sawLedger).toContain(true);
    expect(out.changes).toHaveLength(1);
    expect(out.changes[0].before.evidence.messageId).toBe('m1');
    expect(out.coverage.complete).toBe(true);
  });
});

describe('deadline resolution', () => {
  const anchor = '2026-10-10T09:20:00+05:30';
  it('resolves times and weekdays against the anchor and leaves unknown text unresolved', () => {
    expect(resolveDeadline('4pm', anchor, TZ)).toBe('2026-10-10T16:00:00+05:30');
    expect(resolveDeadline('tomorrow noon', anchor, TZ)).toBe('2026-10-11T12:00:00+05:30');
    expect(resolveDeadline('by Monday', anchor, TZ)).toBe('2026-10-12T23:59:00+05:30');
    expect(resolveDeadline('soonish', anchor, TZ)).toBeNull();
  });
});

describe('retrying failed sections', () => {
  it('re-runs only unread messages that were not processed and merges coverage', async () => {
    const lines = Array.from({ length: 60 }, (_, i) => `10/10/26, 09:${String(i).padStart(2, '0')} - Ann: ordinary message number ${i} padded with some extra words to fill the budget`).join('\n');
    const p = parseChat(lines, { timezone: TZ, dateOrder: 'DMY' });
    const msgs = applyReadBoundary(p.messages, null);
    let fail = true;
    const gen: GenerateFn = async (user) => {
      if (fail && user.includes('"id":"m1"')) return { text: 'not json', finishReason: 'stop' };
      return { text: '{"items":[]}', finishReason: 'stop' };
    };
    const first = await runCatchUp({ messages: msgs, participants: p.participants, generate: gen });
    expect(first.coverage.complete).toBe(false);
    expect(first.failedIds.length).toBeGreaterThan(0);
    fail = false;
    const { mergeRuns } = await import('./runner');
    const retry = await runCatchUp({ messages: msgs, participants: p.participants, generate: gen, only: new Set(first.failedIds), seqStart: first.seq });
    const merged = mergeRuns(first, retry, msgs);
    expect(merged.coverage.complete).toBe(true);
    expect(merged.coverage.processedUnread).toBe(60);
  });
});
