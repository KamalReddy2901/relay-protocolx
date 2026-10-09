import { useId, useMemo, useState } from 'react';
import { formatWall } from '../domain/dates';
import type { DateOrder, Message, ParseResult, Participant } from '../domain/types';
import { Btn, Steps, TopBar, useHeadingFocus } from './common';

export interface Settings {
  dateOrder: DateOrder | null;
  timezone: string;
  selfId: string;
  lastReadId: string;
  /** The user's own name when they never wrote in the chat. */
  selfExtra: string;
  /** Other names mentioned in the chat who never wrote (comma separated). */
  othersExtra: string;
}

interface Props {
  parse: ParseResult;
  participants: Participant[];
  unreadCount: number;
  settings: Settings;
  referenceTime: string;
  onChange: (s: Partial<Settings>) => void;
  onBack: () => void;
  onContinue: () => void;
  onQuickRules: () => void;
}

const ZONES: string[] = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['UTC'];
  }
})();

function preview(m: Message) {
  const t = m.text.replace(/\s+/g, ' ');
  return `${m.id} · ${m.authorRaw} · ${formatWall(m.timestamp) === 'no time' ? 'no date' : formatWall(m.timestamp)} · ${t.length > 70 ? t.slice(0, 70) + '…' : t}`;
}

export function blockingReason(parse: ParseResult, settings: Settings): string | null {
  if (!parse.format) return 'This text could not be read.';
  if (parse.messages.length === 0) return 'No messages were found.';
  if (parse.issues.some((i) => i.rawLine.startsWith('More than 2000'))) {
    return 'This chat has more than 2,000 messages. Supply a smaller export or trim it.';
  }
  if (parse.dateOrderAmbiguous && !settings.dateOrder) return 'Choose the date format (day/month or month/day) to continue.';
  if (parse.issues.some((i) => i.kind === 'ambiguous-date')) return 'Dates mix day-first and month-first; fix the export before continuing.';
  if (!settings.selfId && !settings.selfExtra.trim()) return 'Choose who you are to continue.';
  return null;
}

export function Review({ parse, participants, unreadCount, settings, referenceTime, onChange, onBack, onContinue, onQuickRules }: Props) {
  const heading = useHeadingFocus(false);
  const [filter, setFilter] = useState('');
  const issuesId = useId();
  const reason = blockingReason(parse, settings) ?? (unreadCount === 0 ? 'Every message is marked as read. Choose an earlier last-read message.' : null);
  const needsAttention = parse.issues.filter((i) => i.kind !== 'system-line').length;
  const systemLines = parse.issues.length - needsAttention;

  const options = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return parse.messages.filter((m) => !f || preview(m).toLowerCase().includes(f) || m.id === settings.lastReadId);
  }, [parse.messages, filter, settings.lastReadId]);

  return (
    <>
      <TopBar />
      <main className="sheet" id="main">
        <Steps current={2} />
        <h1 ref={heading} tabIndex={-1}>
          Check the messages
        </h1>
        <p className="small muted" style={{ marginTop: 'var(--s-2)' }}>
          Format: {parse.format}
          {parse.hasTimestamps ? '' : ' · this format has no dates'}
        </p>
        <p style={{ fontSize: 'var(--text-md)', marginTop: 'var(--s-3)' }}>
          {parse.messages.length} messages from {parse.participants.length} {parse.participants.length === 1 ? 'person' : 'people'}.{' '}
          {needsAttention ? `${needsAttention} ${needsAttention === 1 ? 'line needs' : 'lines need'} a look.` : 'No lines need attention.'}
          {systemLines ? ` ${systemLines} system ${systemLines === 1 ? 'line is' : 'lines are'} kept out of the AI input.` : ''}
        </p>

        {parse.issues.length > 0 && (
          <section aria-labelledby={issuesId} style={{ marginTop: 'var(--s-4)' }}>
            <h3 id={issuesId}>Lines Relay did not treat as messages</h3>
            <div className="scroll" tabIndex={0} role="region" aria-labelledby={issuesId}>
              <table className="issues">
                <thead>
                  <tr>
                    <th scope="col">Line</th>
                    <th scope="col">Text</th>
                    <th scope="col">What Relay did</th>
                  </tr>
                </thead>
                <tbody>
                  {parse.issues.map((i, k) => (
                    <tr key={k}>
                      <td>{i.line}</td>
                      <td>{i.rawLine}</td>
                      <td>
                        {i.kind}: {i.handling.replace(/-/g, ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="stack" style={{ marginTop: 'var(--s-5)' }}>
          {parse.dateOrderAmbiguous && (
            <fieldset>
              <legend>Date format in this chat</legend>
              <p className="small muted">Every day value is 12 or less, so Relay cannot tell day/month from month/day.</p>
              {(['DMY', 'MDY'] as const).map((o) => (
                <label key={o} className="radio">
                  <input type="radio" name="dateOrder" checked={settings.dateOrder === o} onChange={() => onChange({ dateOrder: o })} />
                  {o === 'DMY' ? 'Day/Month/Year (09/10 is 9 October)' : 'Month/Day/Year (09/10 is September 10)'}
                </label>
              ))}
            </fieldset>
          )}

          <label className="field">
            <span>Timezone</span>
            <select value={settings.timezone} onChange={(e) => onChange({ timezone: e.target.value })}>
              {(ZONES.includes(settings.timezone) ? ZONES : [settings.timezone, ...ZONES]).map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>I am</span>
            <select value={settings.selfId} onChange={(e) => onChange({ selfId: e.target.value })}>
              <option value="">Choose who you are…</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                  {p.messageCount === 0 ? ' (not in the chat)' : ` (${p.messageCount} messages)`}
                </option>
              ))}
            </select>
          </label>

          <details>
            <summary>My name or someone else&apos;s isn&apos;t in the list</summary>
            <div className="stack">
              <p className="small muted">
                People who never wrote in the chat can still be given tasks. Names are matched exactly; Relay never merges names for you.
              </p>
              <label className="field">
                <span>My name</span>
                <input type="text" value={settings.selfExtra} onChange={(e) => onChange({ selfExtra: e.target.value, selfId: '' })} />
              </label>
              <label className="field">
                <span>Other people mentioned in the chat (comma separated)</span>
                <input type="text" value={settings.othersExtra} onChange={(e) => onChange({ othersExtra: e.target.value })} />
              </label>
            </div>
          </details>

          <div>
            <label className="field">
              <span>Find a message to mark as last read</span>
              <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Type to narrow the list" />
            </label>
            <label className="field" style={{ marginTop: 'var(--s-3)' }}>
              <span>I last read up to…</span>
              <select value={settings.lastReadId} onChange={(e) => onChange({ lastReadId: e.target.value })}>
                <option value="">I haven&apos;t read any</option>
                {options.map((m) => (
                  <option key={m.id} value={m.id}>
                    {preview(m)}
                  </option>
                ))}
              </select>
            </label>
            <p className="small muted" style={{ marginTop: 'var(--s-2)' }}>
              Messages up to and including this one count as read and are used only as context.
            </p>
          </div>

          <p className="mono muted">
            {unreadCount} unread of {parse.messages.length} · relative dates resolved against {formatWall(referenceTime)} ({settings.timezone})
          </p>
          {parse.format === 'PLAIN' || parse.format === 'BRACKET-TIME' ? (
            <p className="small notice tentative" role="note">
              <span>This format has no dates, so relative deadlines resolve against the reference time only.</span>
            </p>
          ) : null}

          <div className="row">
            <Btn onClick={onBack}>Back</Btn>
            <Btn primary reason={reason} onClick={onContinue}>
              Catch me up with private AI
            </Btn>
          </div>
          <p className="small muted">Relay downloads Qwen3-4B to this device on first use (about 2.2 GB). Your chat stays in this browser; model files come from Hugging Face.</p>
          <Btn onClick={onQuickRules} reason={reason}>Use instant rules (no model)</Btn>
        </div>
      </main>
    </>
  );
}
