import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Check } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatWall } from '../domain/dates';
import { rank, STATUS_LABEL, type ActItem, type ChangeGroup, type ContextRow, type Due } from '../domain/rank';
import type { RunOutput } from '../domain/runner';
import type { Evidence, Item, Message, Participant, UserAction } from '../domain/types';
import { Btn, TopBar } from './common';
import { InspectorBody, type InspectorTarget, type SourceEntry } from './Inspector';

interface Props {
  result: RunOutput;
  messages: Message[];
  participants: Participant[];
  selfId: string;
  onSelf: (id: string) => void;
  referenceTime: string;
  timezone: string;
  /** Acknowledgments for each participant. Switching identity never inherits another person's. */
  actions: Record<string, Record<string, UserAction>>;
  onAction: (participantId: string, itemId: string, a: UserAction | null) => void;
  onRunAgain: () => void;
  onRetryFailed: () => void;
  onStartOver: () => void;
}

function useMedia(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const h = () => setM(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [q]);
  return m;
}

function uniqueIds(ev: Evidence[]) {
  return [...new Set(ev.map((e) => e.messageId))];
}

function DueCell({ due }: { due: Due }) {
  return (
    <div className="due">
      {due.overdue && <span className="od">Overdue</span>}
      {due.kind === 'unresolved' ? (
        <>
          {due.text}
          <br />
          <span className="muted">Date not resolved</span>
        </>
      ) : (
        due.text
      )}
    </div>
  );
}

export function Brief(props: Props) {
  const { result, messages, participants, selfId, onSelf, referenceTime, timezone, actions, onAction } = props;
  const reduced = useReducedMotion();
  const wide = useMedia('(min-width: 1280px)');
  const self = participants.find((p) => p.id === selfId);
  const myActions = actions[selfId] ?? {};

  const ranking = useMemo(
    () => rank({ items: result.items, changes: result.changes, messages, participants, selfId, referenceTime, timezone, actions: myActions }),
    [result, messages, participants, selfId, referenceTime, timezone, myActions],
  );

  // Selection / inspector
  const [sel, setSel] = useState<{ key: string; focus?: string } | null>(null);
  const viaKeyboard = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const targets = useMemo(() => {
    const t = new Map<string, InspectorTarget>();
    const toSource = (e: Evidence, label: SourceEntry['label'], detail?: string): SourceEntry => ({
      key: `${label}-${e.messageId}-${e.start}`,
      label,
      detail,
      messageId: e.messageId,
      start: e.start,
      end: e.end,
    });
    const itemTarget = (it: Item) => {
      t.set(`item:${it.id}`, {
        key: `item:${it.id}`,
        title: it.title,
        sources: it.evidence.map((e) =>
          toSource(e, e.role === 'before' ? 'Before' : e.role === 'after' ? 'After' : e.role === 'proposes' ? 'Proposed' : 'Source', e.role),
        ),
      });
    };
    result.items.forEach(itemTarget);
    for (const g of ranking.changed) {
      const first = g.pairs[0];
      const title = g.pairs.map((p) => `${p.field}`).join(' and ') + ' change';
      const seen = new Set<string>();
      const sources: SourceEntry[] = [];
      const add = (s: SourceEntry) => {
        if (!seen.has(s.key)) {
          seen.add(s.key);
          sources.push(s);
        }
      };
      for (const p of g.pairs) {
        add(toSource(p.before.evidence, 'Before'));
        add(toSource(p.after.evidence, 'After'));
      }
      for (const pr of g.proposals) for (const e of pr.evidence) add(toSource(e, 'Proposed'));
      t.set(`change:${g.id}`, { key: `change:${g.id}`, title: `${first.subjectKey || 'plan'} (${title})`, sources });
    }
    return t;
  }, [result.items, ranking.changed]);

  const base = sel ? targets.get(sel.key) : undefined;
  const activeTarget: InspectorTarget | null = base ? { ...base, focusMessageId: sel?.focus } : null;

  const select = useCallback((key: string, e: React.MouseEvent | null, focus?: string) => {
    viaKeyboard.current = !!e && e.detail === 0;
    setSel({ key, focus });
  }, []);

  const close = useCallback(() => {
    const key = sel?.key;
    setSel(null);
    if (key) {
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-sel="${CSS.escape(key)}"]`)?.focus();
      });
    }
  }, [sel]);

  // Narrow: modal dialog (inert background, trapped focus, Esc). Wide: persistent non-modal aside.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (!wide && activeTarget && !d.open) {
      d.showModal();
      requestAnimationFrame(() => headingRef.current?.focus());
    }
    if ((wide || !activeTarget) && d.open) d.close();
  }, [wide, activeTarget]);

  useEffect(() => {
    if (wide && activeTarget && viaKeyboard.current) headingRef.current?.focus();
  }, [wide, activeTarget?.key]);

  // Done / Undo
  const [status, setStatus] = useState<{ text: string; itemId: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const setAction = (a: ActItem, state: 'done' | 'not-mine') => {
    const id = a.item.id;
    onAction(selfId, id, { itemId: id, state, at: new Date().toISOString() });
    setStatus({ text: state === 'done' ? 'Marked done.' : 'Marked not mine.', itemId: id });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus((s) => (s?.itemId === id ? null : s)), 8000);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const [editing, setEditing] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const confirmRef = useRef<HTMLDialogElement>(null);

  const cov = result.coverage;
  const partial = !cov.complete;
  const unreadTotal = cov.totalUnread;
  const name = self?.displayName ?? 'you';
  const shownContext = showAll ? ranking.context : ranking.context.slice(0, 8);

  const inspector = (
    <InspectorBody target={activeTarget} messages={messages} onClose={close} headingRef={headingRef} ref={bodyRef} />
  );

  function Refs({ ids, keyOf }: { ids: string[]; keyOf: string }) {
    return (
      <span className="refs">
        {ids.map((id) => (
          <button key={id} className="ref" data-sel={`${keyOf}#${id}`} onClick={(e) => select(keyOf, e, id)} aria-label={`Open source message ${id}`}>
            {id} ›
          </button>
        ))}
      </span>
    );
  }

  function ActRow({ a, n }: { a: ActItem; n: number }) {
    const key = `item:${a.item.id}`;
    return (
      <div className="act" data-selected={sel?.key === key}>
        <span className="act-n mono" aria-hidden="true">
          {String(n).padStart(2, '0')}
        </span>
        <DueCell due={a.due} />
        <div>
          <p className="title">{a.item.title}</p>
          <p className="reasons">
            {a.reasons.join(' · ')}
            {a.beforeLastRead ? `${a.reasons.length ? ' · ' : ''}Before you last read` : ''}
            {a.edited ? ' · Edited by you' : ''}
          </p>
          <div className="meta">
            <button className="ref" data-sel={key} onClick={(e) => select(key, e)}>
              Sources
            </button>
            {Refs({ ids: uniqueIds(a.item.evidence), keyOf: key })}
            <span className="rowact">
              <Btn small onClick={() => setAction(a, 'done')}>
                <Check size={16} strokeWidth={1.5} aria-hidden="true" /> Done
              </Btn>
              <Btn small onClick={() => setAction(a, 'not-mine')}>
                Not mine
              </Btn>
              <Btn small onClick={() => setEditing(editing === a.item.id ? null : a.item.id)}>
                Edit
              </Btn>
            </span>
          </div>
        </div>
        {editing === a.item.id && <EditForm a={a} participants={participants} onCancel={() => setEditing(null)} onSave={(e) => {
          onAction(selfId, a.item.id, { itemId: a.item.id, state: 'edited', edits: e, at: new Date().toISOString() });
          setEditing(null);
        }} />}
      </div>
    );
  }

  function ChangeRow({ g }: { g: ChangeGroup }) {
    const key = `change:${g.id}`;
    const p0 = g.pairs[0];
    return (
      <div className="change" data-selected={sel?.key === key}>
        <button className="change-btn" data-sel={key} onClick={(e) => select(key, e)} aria-label={`Open sources for change: ${g.pairs.map((p) => `${p.field} was ${p.before.value}, now ${p.after.value}`).join('; ')}`}>
          {g.pairs.map((p) => (
            <div className="pair" key={p.id}>
              <span className="field">{p.field === 'place' ? 'Place' : p.field[0].toUpperCase() + p.field.slice(1)}</span>
              <span>
                <span className="sr-only">Before: </span>
                <span className="before">{p.before.value}</span>
                <span className="arrow" aria-hidden="true">→</span>
                <span className="sr-only"> After: </span>
                <span className="after">{p.after.value}</span>
              </span>
            </div>
          ))}
        </button>
        <div className="meta">
          {Refs({ ids: [p0.before.evidence.messageId, p0.after.evidence.messageId], keyOf: key })}
          {g.changedAfterLastRead && <span className="small muted">Changed after you last read</span>}
        </div>
        {g.consequences.map((c) => (
          <p className="foryou" key={c}>
            {c}
          </p>
        ))}
        {g.proposals.length > 0 && (
          <p className="small muted">
            Proposed in between: {g.proposals.map((i) => `${i.title}`).join('; ')} ({uniqueIds(g.proposals.flatMap((i) => i.evidence)).join(', ')})
          </p>
        )}
      </div>
    );
  }

  function ContextItem({ c }: { c: ContextRow }) {
    const key = `item:${c.item.id}`;
    const owner = c.item.kind === 'action' ? c.ownerLabel : null;
    return (
      <div className="ctx" data-selected={sel?.key === key}>
        <span className={`tag ${c.item.supersededBy ? 'changed' : c.item.status}`}>{c.statusLabel}</span>
        {' — '}
        <span className="ctx-title">{c.item.title}</span>
        {owner && <span> · {owner}</span>}
        {c.due && c.due.kind !== 'none' && <span> · {c.due.text}</span>}
        {c.reasons.length > 0 && <span> · {c.reasons.join(' · ')}</span>}
        {c.beforeLastRead && <span> · Before you last read</span>}
        {c.action?.edited && <span> · Edited by you</span>}
        <div className="meta">
          <button className="ref" data-sel={key} onClick={(e) => select(key, e)}>
            Sources
          </button>
          {Refs({ ids: uniqueIds(c.item.evidence), keyOf: key })}
          {c.action && (
            <Btn small link onClick={() => setEditing(editing === c.item.id ? null : c.item.id)}>
              Edit owner or date
            </Btn>
          )}
        </div>
        {c.action && editing === c.item.id && (
          <EditForm
            a={c.action}
            participants={participants}
            onCancel={() => setEditing(null)}
            onSave={(e) => {
              onAction(selfId, c.item.id, { itemId: c.item.id, state: 'edited', edits: e, at: new Date().toISOString() });
              setEditing(null);
            }}
          />
        )}
      </div>
    );
  }

  const failedText = cov.failedRanges.length ? cov.failedRanges.join(', ') : result.failedIds.length ? `${result.failedIds[0]}–${result.failedIds[result.failedIds.length - 1]}` : '';

  return (
    <>
      <TopBar wide />
      <div className="brief-layout">
        <div className="rail" aria-hidden="true" />
        <main className="brief" id="main">
          <header className="brief-head">
            <h1>
              {partial ? 'Partial catch-up for ' : 'Catch-up for '}
              {name}
            </h1>
            <p className="mono muted">
              {unreadTotal} unread of {messages.length} · resolved against {formatWall(referenceTime)} ({timezone})
            </p>
            {partial ? (
              <div className="notice tentative" role="status">
                <AlertTriangle size={20} strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <p>
                    {cov.cancelled ? 'Partial — you cancelled the run. ' : 'Partial — '}
                    {cov.processedUnread} of {unreadTotal} unread messages were read.
                    {failedText ? ` Not read: ${failedText}.` : ''} Items from those messages may be missing.
                  </p>
                  <Btn onClick={props.onRetryFailed}>Retry failed sections</Btn>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--current)' }}>Complete — all {unreadTotal} unread messages read.</p>
            )}
            <div className="controls">
              <label>
                <span className="small">Viewing as </span>
                <select value={selfId} onChange={(e) => onSelf(e.target.value)}>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <Btn onClick={props.onRunAgain}>Run again</Btn>
              <Btn onClick={() => confirmRef.current?.showModal()}>Start over</Btn>
            </div>
            <div aria-live="polite" className="small" style={{ minHeight: '1.5em' }}>
              {status && (
                <>
                  {status.text}{' '}
                  <Btn small link onClick={() => { onAction(selfId, status.itemId, null); setStatus(null); }}>
                    Undo
                  </Btn>
                </>
              )}
            </div>
          </header>

          <section className="section" aria-labelledby="h-act">
            <h2 id="h-act">Act now · {ranking.actNow.length}</h2>
            {ranking.actNow.length === 0 ? (
              <p style={{ fontSize: 'var(--text-md)' }}>Nothing assigned to you in the unread messages.</p>
            ) : (
              <ol className="list">
                <AnimatePresence initial={false}>
                  {ranking.actNow.map((a, i) => (
                    <motion.li
                      key={a.item.id}
                      exit={{ height: 0, opacity: 0, transition: { duration: reduced ? 0 : 0.2 } }}
                      style={{ overflow: 'hidden', paddingLeft: 0 }}
                    >
                      {ActRow({ a, n: i + 1 })}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
            )}
            {ranking.acknowledged.length > 0 && (
              <details style={{ marginTop: 'var(--s-4)' }}>
                <summary>Done or dismissed · {ranking.acknowledged.length}</summary>
                <ul className="list" style={{ marginTop: 'var(--s-3)' }}>
                  {ranking.acknowledged.map((a) => (
                    <li key={a.item.id}>
                      <span className="tag done">{a.state === 'done' ? 'Done' : 'Not mine'}</span> — {a.item.title}{' '}
                      <Btn small link onClick={() => onAction(selfId, a.item.id, null)}>
                        Restore
                      </Btn>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section className="section" aria-labelledby="h-changed">
            <h2 id="h-changed">What changed · {ranking.changed.length}</h2>
            {ranking.changed.length === 0 ? (
              <p className="muted">No explicit changes to an earlier plan were found in the messages Relay could read.</p>
            ) : (
              <ul className="list">
                {ranking.changed.map((g) => (
                  <li key={g.id}>
                    {ChangeRow({ g })}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section" aria-labelledby="h-context">
            <h2 id="h-context">For context · {ranking.context.length}</h2>
            {ranking.context.length === 0 ? (
              <p className="muted">Nothing else was found.</p>
            ) : (
              <ul className="list">
                {shownContext.map((c) => (
                  <li key={c.item.id}>
                    {ContextItem({ c })}
                  </li>
                ))}
              </ul>
            )}
            {ranking.context.length > 8 && !showAll && (
              <Btn small onClick={() => setShowAll(true)}>
                Show {ranking.context.length - 8} more
              </Btn>
            )}
            <details style={{ marginTop: 'var(--s-4)' }}>
              <summary>{result.discarded.length} model suggestions discarded (no valid source)</summary>
              <p className="small muted">
                These suggestions cited a message that does not exist, quoted text that is not in the message, or claimed a change without two valid sources.
                {result.downgraded > 0 && ` ${result.downgraded} unsupported change ${result.downgraded === 1 ? 'claim was' : 'claims were'} kept as the original statement instead of a replacement.`}
                {result.instructionSources > 0 && ` ${result.instructionSources} cited ${result.instructionSources === 1 ? 'message looked' : 'messages looked'} like instructions to the AI and ${result.instructionSources === 1 ? 'was' : 'were'} not used as evidence.`}
                {result.discarded.length > 0 && ` Reasons: ${[...new Set(result.discarded.map((d) => d.reason))].join(', ')}.`}
              </p>
            </details>
          </section>

          <footer className="footer-note">
            <p>Generated in this browser by Qwen3-4B (WebLLM) from the messages above.</p>
            {cov.thinkingStripped && <p>Hidden reasoning text was removed from at least one model reply.</p>}
            <details>
              <summary>About and limits</summary>
              <ul>
                <li>Extraction can be wrong. Quote checks show where a statement came from, not what it means.</li>
                <li>You chose the text and the last-read point. Relay cannot see your chat app&apos;s unread state.</li>
                <li>Only the formats listed on the first screen are supported. English chat is assumed.</li>
                <li>A &quot;Complete&quot; label means every selected message was read by the model, not that nothing was missed.</li>
                <li>Quality and speed have not been measured; no accuracy figure is claimed.</li>
              </ul>
            </details>
          </footer>
        </main>

        {wide && (
          <aside className="margin-col inspector" aria-labelledby="inspector-heading" onKeyDown={(e) => { if (e.key === 'Escape' && activeTarget) close(); }}>
            {inspector}
          </aside>
        )}
      </div>

      {!wide && (
        <dialog
          ref={dialogRef}
          className="panel"
          aria-labelledby="inspector-heading"
          onClose={() => {
            if (sel) close();
          }}
        >
          {activeTarget && inspector}
        </dialog>
      )}

      <dialog ref={confirmRef} className="confirm" aria-labelledby="confirm-h">
        <h2 id="confirm-h" style={{ fontSize: 'var(--text-md)' }}>
          Delete this chat and catch-up from this browser?
        </h2>
        <p className="small muted" style={{ margin: 'var(--s-3) 0' }}>
          The chat text, the results and your acknowledgments are removed together. Cached model files stay unless you remove them separately.
        </p>
        <div className="row">
          <Btn primary onClick={props.onStartOver}>
            Delete and start over
          </Btn>
          <Btn onClick={() => confirmRef.current?.close()}>Cancel</Btn>
        </div>
      </dialog>
    </>
  );
}

function EditForm({
  a,
  participants,
  onSave,
  onCancel,
}: {
  a: ActItem;
  participants: Participant[];
  onSave: (e: { ownerParticipantId: string | null; deadlineText: string | null }) => void;
  onCancel: () => void;
}) {
  const [owner, setOwner] = useState(a.ownerId ?? '');
  const [deadline, setDeadline] = useState(a.due.kind === 'none' ? '' : a.due.kind === 'unresolved' ? a.due.text : a.item.deadlineText ?? '');
  return (
    <form
      className="edit-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ownerParticipantId: owner || null, deadlineText: deadline.trim() || null });
      }}
    >
      <p className="small muted">Your edit is stored only as a local override labelled &quot;Edited by you&quot;. The source messages do not change.</p>
      <div className="grid2">
        <label className="field">
          <span>Owner</span>
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">Owner unknown</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Deadline (words, e.g. &quot;Friday 5pm&quot;)</span>
          <input type="text" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
      </div>
      <div className="row">
        <Btn primary small type="submit">
          Save edit
        </Btn>
        <Btn small onClick={onCancel}>
          Cancel
        </Btn>
      </div>
    </form>
  );
}

export { STATUS_LABEL };
