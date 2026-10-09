import type { ChangePair, Evidence, Item, Message } from './types';

function words(s: string) {
  return new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));
}

export function sameSubject(a: string, b: string): boolean {
  if (a === b) return true;
  if (a && b && (a.includes(b) || b.includes(a))) return true;
  const wa = words(a);
  const wb = words(b);
  if (!wa.size || !wb.size) return false;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / (wa.size + wb.size - inter) >= 0.5;
}

function mergeEvidence(a: Evidence[], b: Evidence[]): Evidence[] {
  const out = [...a];
  for (const e of b) {
    if (!out.some((x) => x.messageId === e.messageId && x.start === e.start && x.end === e.end && x.role === e.role)) out.push(e);
  }
  return out;
}

const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export interface Reconciled {
  items: Item[];
  changes: ChangePair[];
}

/**
 * Conservative cross-chunk reconciliation: merge only items with the same kind, status, owner and subject
 * that cite a common message; drop duplicate change pairs; never infer a replacement from titles alone.
 */
export function reconcile(items: Item[], changes: ChangePair[], messages: Message[]): Reconciled {
  const order = new Map(messages.map((m, i) => [m.id, i]));
  const author = new Map(messages.map((m) => [m.id, m.participantId]));

  const merged: Item[] = [];
  const idMap = new Map<string, string>();
  for (const it of items) {
    const twin = merged.find(
      (m) =>
        m.kind === it.kind &&
        m.status === it.status &&
        m.ownerParticipantId === it.ownerParticipantId &&
        m.ownerRaw === it.ownerRaw &&
        sameSubject(m.subjectKey, it.subjectKey) &&
        m.evidence.some((e) => it.evidence.some((x) => x.messageId === e.messageId)),
    );
    if (twin) {
      twin.evidence = mergeEvidence(twin.evidence, it.evidence);
      twin.deadlineText = twin.deadlineText ?? it.deadlineText;
      idMap.set(it.id, twin.id);
    } else {
      merged.push({ ...it, evidence: [...it.evidence] });
    }
  }

  const seen = new Set<string>();
  const pairs: ChangePair[] = [];
  for (const c of changes) {
    const key = [c.before.evidence.messageId, c.after.evidence.messageId, c.field, c.before.value.toLowerCase(), c.after.value.toLowerCase()].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ ...c, itemId: idMap.get(c.itemId) ?? c.itemId });
  }

  // Supersession: a validated owner change retires the earlier assignment for the same subject.
  for (const c of pairs.filter((p) => p.field === 'owner')) {
    const afterIdx = order.get(c.after.evidence.messageId) ?? -1;
    for (const it of merged) {
      if (it.kind !== 'action' || it.supersededBy || !sameSubject(it.subjectKey, c.subjectKey)) continue;
      const last = Math.max(...it.evidence.map((e) => order.get(e.messageId) ?? -1));
      const named = it.ownerRaw?.toLowerCase() === c.before.value.toLowerCase();
      if (last < afterIdx && named) it.supersededBy = c.itemId;
    }
  }

  // Two confirmed decisions about one subject from different speakers that neither revises stay visible as unresolved.
  const inPair = (it: Item) =>
    pairs.some((p) => it.evidence.some((e) => e.messageId === p.before.evidence.messageId || e.messageId === p.after.evidence.messageId));
  const decisions = merged.filter((i) => i.kind === 'decision' && i.status === 'confirmed' && !inPair(i));
  for (let a = 0; a < decisions.length; a++) {
    for (let b = a + 1; b < decisions.length; b++) {
      const x = decisions[a];
      const y = decisions[b];
      if (!sameSubject(x.subjectKey, y.subjectKey) || normTitle(x.title) === normTitle(y.title)) continue;
      const ax = new Set(x.evidence.map((e) => author.get(e.messageId)));
      const ay = new Set(y.evidence.map((e) => author.get(e.messageId)));
      const differentSpeakers = [...ax].every((p) => !ay.has(p));
      if (differentSpeakers) {
        x.status = 'needs-clarification';
        y.status = 'needs-clarification';
      }
    }
  }
  return { items: merged, changes: pairs };
}
