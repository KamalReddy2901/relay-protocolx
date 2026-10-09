import { formatDue, isTaskDeadline, resolveDeadline, sameWallDay } from './dates';
import { sameSubject } from './reconcile';
import { resolveOwner } from './validate';
import type { ChangePair, Item, Message, Participant, UserAction } from './types';

export interface Due {
  kind: 'resolved' | 'unresolved' | 'none';
  text: string;
  resolved: string | null;
  overdue: boolean;
  today: boolean;
  within24h: boolean;
}

export interface ActItem {
  item: Item;
  ownerId: string | null;
  ownerLabel: string;
  due: Due;
  /** Time words that describe the event, not a task deadline (shown as context). */
  eventTime: string | null;
  reasons: string[];
  beforeLastRead: boolean;
  edited: boolean;
  state: 'open' | 'done' | 'not-mine';
}

export interface ChangeGroup {
  id: string;
  pairs: ChangePair[];
  proposals: Item[];
  consequences: string[];
  affectsSelf: boolean;
  changedAfterLastRead: boolean;
}

export interface ContextRow {
  item: Item;
  label: string;
  statusLabel: string;
  reasons: string[];
  ownerLabel: string | null;
  due: Due | null;
  beforeLastRead: boolean;
  /** Present for actions so the user can still correct them (F9). */
  action?: ActItem;
}

export interface Ranking {
  actNow: ActItem[];
  acknowledged: ActItem[];
  changed: ChangeGroup[];
  context: ContextRow[];
}

export interface RankInput {
  items: Item[];
  changes: ChangePair[];
  messages: Message[];
  participants: Participant[];
  selfId: string;
  referenceTime: string;
  timezone: string;
  /** Acknowledgments for the selected identity only. */
  actions: Record<string, UserAction>;
}

export const STATUS_LABEL: Record<Item['status'], string> = {
  confirmed: 'Confirmed',
  proposed: 'Proposed',
  cancelled: 'Cancelled',
  'needs-clarification': 'Needs clarification',
};

function dueFor(
  text: string | null,
  anchor: string | null,
  referenceTime: string,
  timezone: string,
): Due {
  if (!text) return { kind: 'none', text: 'No date given', resolved: null, overdue: false, today: false, within24h: false };
  const resolved = resolveDeadline(text, anchor ?? referenceTime, timezone);
  if (!resolved) return { kind: 'unresolved', text, resolved: null, overdue: false, today: false, within24h: false };
  const diff = Date.parse(resolved) - Date.parse(referenceTime);
  return {
    kind: 'resolved',
    text: formatDue(resolved),
    resolved,
    overdue: diff < 0,
    today: sameWallDay(resolved, referenceTime),
    within24h: diff >= 0 && diff <= 24 * 3600 * 1000,
  };
}

function firstName(p: Participant | undefined) {
  return p?.displayName.trim().split(/\s+/)[0] ?? '';
}

export function rank(input: RankInput): Ranking {
  const { items, changes, messages, participants, selfId, referenceTime, timezone, actions } = input;
  const byId = new Map(messages.map((m) => [m.id, m]));
  const order = new Map(messages.map((m, i) => [m.id, i]));
  const self = participants.find((p) => p.id === selfId);
  const pname = (id: string | null) => participants.find((p) => p.id === id)?.displayName ?? null;

  const anchorOf = (it: Item) => it.evidence.map((e) => byId.get(e.messageId)?.timestamp ?? null).find(Boolean) ?? null;
  const allRead = (it: Item) => it.evidence.every((e) => byId.get(e.messageId)?.isUnread === false);

  // Group change pairs that come from the same two messages (e.g. venue and time in one revision).
  const groupsMap = new Map<string, ChangePair[]>();
  for (const c of changes) {
    const k = `${c.before.evidence.messageId}|${c.after.evidence.messageId}`;
    groupsMap.set(k, [...(groupsMap.get(k) ?? []), c]);
  }

  const actionFor = (it: Item): ActItem => {
    const ua = actions[it.id];
    const editedOwner = ua?.edits && 'ownerParticipantId' in ua.edits ? ua.edits.ownerParticipantId ?? null : undefined;
    const ownerId = editedOwner !== undefined ? editedOwner : it.ownerParticipantId;
    const userDeadline = !!ua?.edits && 'deadlineText' in ua.edits;
    const rawDeadline = userDeadline ? ua?.edits?.deadlineText ?? null : it.deadlineText;
    const isDeadline =
      !rawDeadline ||
      userDeadline ||
      isTaskDeadline(rawDeadline, it.evidence.map((e) => byId.get(e.messageId)?.text ?? ''));
    const due = dueFor(isDeadline ? rawDeadline : null, anchorOf(it), referenceTime, timezone);
    const eventTime = !isDeadline ? rawDeadline : null;
    const reasons: string[] = [];
    const ownerChange = changes.find((c) => c.field === 'owner' && sameSubject(c.subjectKey, it.subjectKey));
    if (ownerId === selfId) {
      reasons.push('Assigned to you');
      if (ownerChange && resolveOwner(ownerChange.after.value, participants).id === selfId) {
        reasons.push(`Reassigned to you (from ${ownerChange.before.value})`);
      }
    }
    if (due.overdue) reasons.push('Overdue');
    else if (due.today) reasons.push('Due today');
    const touched = changes.some(
      (c) => sameSubject(c.subjectKey, it.subjectKey) && byId.get(c.after.evidence.messageId)?.isUnread,
    );
    if (touched) reasons.push('Changed after you last read');
    const ownerLabel = ownerId
      ? pname(ownerId) ?? 'Owner unknown'
      : it.ownerRaw
        ? `Owner unknown ("${it.ownerRaw}")`
        : 'Owner unknown';
    return {
      item: it,
      ownerId,
      ownerLabel,
      due,
      eventTime,
      reasons,
      beforeLastRead: allRead(it),
      edited: ua?.state === 'edited' || !!ua?.edits,
      state: ua?.state === 'done' ? 'done' : ua?.state === 'not-mine' ? 'not-mine' : 'open',
    };
  };

  const act: ActItem[] = [];
  const acknowledged: ActItem[] = [];
  const context: ContextRow[] = [];
  for (const it of items) {
    if (it.kind === 'change') continue;
    if (it.kind === 'action') {
      const a = actionFor(it);
      const qualifies = a.ownerId === selfId && it.status === 'confirmed' && !it.supersededBy;
      if (qualifies) {
        (a.state === 'open' ? act : acknowledged).push(a);
        continue;
      }
      const reasons: string[] = [];
      if (it.supersededBy && it.ownerParticipantId === selfId) reasons.push('Reassigned away from you');
      context.push({
        item: it,
        label: it.supersededBy ? 'Changed' : STATUS_LABEL[it.status],
        statusLabel: it.supersededBy ? 'Changed' : STATUS_LABEL[it.status],
        reasons,
        ownerLabel: a.ownerLabel,
        due: a.due,
        beforeLastRead: a.beforeLastRead,
        action: a,
      });
      continue;
    }
    const reasons: string[] = [];
    const text = it.evidence.map((e) => byId.get(e.messageId)?.text ?? '').join(' ');
    const fn = firstName(self);
    if (fn && new RegExp(`\\b${fn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) reasons.push('You were mentioned');
    context.push({
      item: it,
      label: STATUS_LABEL[it.status],
      statusLabel: it.kind === 'cancellation' ? 'Cancelled' : STATUS_LABEL[it.status],
      reasons,
      ownerLabel: null,
      due: null,
      beforeLastRead: allRead(it),
    });
  }

  const bucket = (a: ActItem) => (a.due.overdue ? 0 : a.due.within24h ? 1 : a.due.kind === 'resolved' ? 2 : 3);
  act.sort(
    (x, y) =>
      bucket(x) - bucket(y) ||
      (x.due.resolved && y.due.resolved ? Date.parse(x.due.resolved) - Date.parse(y.due.resolved) : 0),
  );

  const changed: ChangeGroup[] = [...groupsMap.entries()].map(([id, pairs]) => {
    const afterId = pairs[0].after.evidence.messageId;
    const beforeId = pairs[0].before.evidence.messageId;
    const consequences: string[] = [];
    for (const p of pairs) {
      const subjectItem = items.find((i) => i.kind === 'action' && sameSubject(i.subjectKey, p.subjectKey));
      const title = subjectItem?.title ?? p.subjectKey;
      if (p.field === 'owner') {
        const after = resolveOwner(p.after.value, participants).id;
        const before = resolveOwner(p.before.value, participants).id;
        if (after === selfId) consequences.push(`For you: you now ${lowerFirst(title)} (was ${p.before.value}).`);
        else if (before === selfId) consequences.push(`For you: you no longer ${lowerFirst(title)}; ${p.after.value} does.`);
      }
    }
    if (consequences.length === 0) {
      const mine = act.find((a) => a.item.evidence.some((e) => e.messageId === afterId));
      if (mine) consequences.push(`For you: ${mine.item.title}.`);
    }
    const proposals = items.filter(
      (i) =>
        (i.kind === 'proposal' || i.status === 'proposed') &&
        pairs.some((p) => sameSubject(p.subjectKey, i.subjectKey)) &&
        i.evidence.some((e) => {
          const idx = order.get(e.messageId) ?? -1;
          return idx > (order.get(beforeId) ?? 0) && idx < (order.get(afterId) ?? 0);
        }),
    );
    return {
      id,
      pairs,
      proposals,
      consequences,
      affectsSelf: consequences.length > 0,
      changedAfterLastRead: byId.get(afterId)?.isUnread === true,
    };
  });
  changed.sort((a, b) => Number(b.affectsSelf) - Number(a.affectsSelf));

  // Items that are the "after" side of a change and owned by someone else give the owner-change reason to context rows.
  return { actNow: act, acknowledged, changed, context };
}

function lowerFirst(s: string) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
