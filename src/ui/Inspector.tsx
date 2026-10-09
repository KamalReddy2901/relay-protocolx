import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { formatWall } from '../domain/dates';
import { isInstructionLike } from '../domain/injection';
import type { Message } from '../domain/types';
import { Btn } from './common';

export interface SourceEntry {
  key: string;
  label: 'Before' | 'After' | 'Proposed' | 'Source';
  detail?: string;
  messageId: string;
  start: number;
  end: number;
}

export interface InspectorTarget {
  key: string;
  title: string;
  sources: SourceEntry[];
  focusMessageId?: string;
}

const MAX_LINES = 12;

function Highlighted({ text, start, end, tone }: { text: string; start: number; end: number; tone: string }) {
  return (
    <>
      {text.slice(0, start)}
      <mark className={`q ${tone}`}>{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

function MessageLine({ m, entry }: { m: Message; entry?: SourceEntry }) {
  const [full, setFull] = useState(false);
  const lines = m.text.split('\n');
  const long = lines.length > MAX_LINES && !full;
  // Highlight offsets refer to the full text; only truncate when the quote is inside the shown part.
  const shown = long ? lines.slice(0, MAX_LINES).join('\n') : m.text;
  const canHighlight = entry && entry.end <= shown.length;
  return (
    <div className={`msg ${entry ? '' : 'near'}`}>
      <span className="who">
        {m.id} · {m.authorRaw} · {formatWall(m.timestamp) === 'no time' ? m.timestampRaw || 'no time' : formatWall(m.timestamp)}
      </span>
      {canHighlight ? (
        <Highlighted text={shown} start={entry.start} end={entry.end} tone={entry.label === 'Before' ? 'before-q' : ''} />
      ) : (
        shown
      )}
      {isInstructionLike(m.text) && (
        <span className="small muted" style={{ display: 'block', fontFamily: 'var(--font-body)' }}>
          This message looks like an instruction aimed at the AI. Relay treats it as chat text only and does not use it to confirm anything.
        </span>
      )}
      {long && (
        <>
          {' '}
          <button className="btn link small" onClick={() => setFull(true)}>
            Show full message ({lines.length} lines)
          </button>
        </>
      )}
    </div>
  );
}

interface Props {
  target: InspectorTarget | null;
  messages: Message[];
  onClose: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  closeLabel?: ReactNode;
}

/** Contents of the evidence margin (wide) or panel/sheet (narrow). Renders only the selected messages ±2. */
export const InspectorBody = forwardRef<HTMLDivElement, Props>(function InspectorBody({ target, messages, onClose, headingRef }, ref) {
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const index = useMemo(() => new Map(messages.map((m, i) => [m.id, i])), [messages]);

  const sources = useMemo(
    () => (target ? [...target.sources].sort((a, b) => (index.get(a.messageId) ?? 0) - (index.get(b.messageId) ?? 0)) : []),
    [target, index],
  );

  useEffect(() => {
    const i = target?.focusMessageId ? sources.findIndex((s) => s.messageId === target.focusMessageId) : 0;
    setCurrent(Math.max(0, i));
  }, [target?.key, target?.focusMessageId, sources]);

  function step(delta: number) {
    const next = Math.min(sources.length - 1, Math.max(0, current + delta));
    setCurrent(next);
    sectionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
  }

  const dur = (n: number) => (reduced ? 0 : n);

  return (
    <div
      ref={ref}
      onKeyDown={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest('input, textarea, select, [contenteditable]')) return;
        if (e.key === 'j' || e.key === 'J') step(1);
        else if (e.key === 'k' || e.key === 'K') step(-1);
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 ref={headingRef} tabIndex={-1} id="inspector-heading">
          {target ? `Sources for: ${target.title}` : 'Sources'}
        </h2>
        {target && (
          <Btn small onClick={onClose} aria-label="Close sources (Esc)">
            <X size={16} strokeWidth={1.5} aria-hidden="true" /> Close <span className="mono">Esc</span>
          </Btn>
        )}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {!target ? (
          <motion.p key="empty" className="empty" style={{ marginTop: 'var(--s-3)' }}>
            Select a line to see the messages behind it.
          </motion.p>
        ) : (
          <motion.div
            key={target.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: dur(0.08) } }}
            transition={{ duration: 0 }}
          >
            {sources.length > 1 && (
              <div className="row" style={{ marginTop: 'var(--s-3)' }}>
                <Btn small reason={current === 0 ? 'This is the first source.' : null} onClick={() => step(-1)}>
                  Previous source
                </Btn>
                <Btn small reason={current === sources.length - 1 ? 'This is the last source.' : null} onClick={() => step(1)}>
                  Next source
                </Btn>
                <span className="small muted">J / K also step through sources.</span>
              </div>
            )}
            {sources.map((s, i) => {
              const at = index.get(s.messageId) ?? 0;
              const m = messages[at];
              const near = (from: number, to: number) => messages.slice(Math.max(0, from), to);
              return (
                <motion.section
                  key={s.key}
                  ref={(el) => {
                    sectionRefs.current[i] = el;
                  }}
                  className="src"
                  aria-current={i === current ? 'true' : undefined}
                  aria-label={`${s.label} source ${s.messageId}`}
                  initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: dur(0.22), delay: dur(i * 0.06), ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <p className={`src-label ${s.label === 'Before' ? 'before-l' : s.label === 'After' ? 'after-l' : s.label === 'Proposed' ? 'prop-l' : ''}`}>
                    {s.label} · {s.messageId}
                    {s.detail ? ` · ${s.detail}` : ''}
                  </p>
                  {near(at - 2, at).map((n) => (
                    <MessageLine key={n.id} m={n} />
                  ))}
                  <MessageLine m={m} entry={s} />
                  {near(at + 1, at + 3).map((n) => (
                    <MessageLine key={n.id} m={n} />
                  ))}
                </motion.section>
              );
            })}
            <p className="honest">Quote matches source. Check the interpretation yourself.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
