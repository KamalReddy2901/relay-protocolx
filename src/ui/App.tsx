import { useCallback, useMemo, useState } from 'react';
import { applyReadBoundary, InputTooLargeError, parseChat } from '../domain/parser';
import { mergeRuns, type RunOutput } from '../domain/runner';
import { nowIso } from '../domain/time';
import type { Participant, UserAction } from '../domain/types';
import { dropEngine } from '../inference/session';
import { Brief } from './Brief';
import { FORMAT_EXAMPLES, Import } from './Import';
import { ModelStep } from './ModelStep';
import { Review, type Settings } from './Review';

type Screen = 'import' | 'review' | 'model' | 'brief';

const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const freshSettings = (): Settings => ({
  dateOrder: null,
  timezone: browserZone,
  selfId: '',
  lastReadId: '',
  selfExtra: '',
  othersExtra: '',
});

interface Session {
  rawText: string;
  source: 'paste' | 'file';
  fileName?: string;
}

/** Single reset for chat, derived output and acknowledgments (SPEC F10). */
function initialState() {
  return {
    screen: 'import' as Screen,
    session: { rawText: '', source: 'paste' } as Session,
    settings: freshSettings(),
    result: null as RunOutput | null,
    actions: {} as Record<string, Record<string, UserAction>>,
    retry: null as { only: Set<string>; seqStart: number } | null,
    viewingAs: '',
  };
}

export function App() {
  const [state, setState] = useState(initialState);
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { screen, session, settings, result, actions, retry } = state;

  const parse = useMemo(() => {
    try {
      return parseChat(session.rawText, { timezone: settings.timezone, dateOrder: settings.dateOrder ?? undefined });
    } catch {
      return parseChat('', { timezone: settings.timezone });
    }
  }, [session.rawText, settings.timezone, settings.dateOrder]);

  const participants: Participant[] = useMemo(() => {
    const list = [...parse.participants];
    const add = (name: string) => {
      const n = name.trim();
      if (!n) return null;
      const hit = list.find((p) => p.displayName === n);
      if (hit) return hit.id;
      const p = { id: `p${list.length + 1}`, displayName: n, messageCount: 0 };
      list.push(p);
      return p.id;
    };
    const selfExtraId = add(settings.selfExtra);
    void selfExtraId;
    settings.othersExtra.split(',').forEach(add);
    return list;
  }, [parse.participants, settings.selfExtra, settings.othersExtra]);

  const selfId = settings.selfId || participants.find((p) => p.displayName === settings.selfExtra.trim() && p.messageCount === 0)?.id || '';
  const viewingAs = state.viewingAs || selfId;

  const messages = useMemo(() => applyReadBoundary(parse.messages, settings.lastReadId || null), [parse.messages, settings.lastReadId]);
  const unreadCount = messages.filter((m) => m.isUnread).length;
  const referenceTime = useMemo(() => {
    const last = [...parse.messages].reverse().find((m) => m.timestamp);
    return last?.timestamp ?? nowIso(settings.timezone);
  }, [parse.messages, settings.timezone]);

  const go = (s: Screen) => {
    setTouched(true);
    setState((st) => ({ ...st, screen: s }));
  };

  const onReview = useCallback((text: string, source: 'paste' | 'file', fileName?: string): string | null => {
    let r;
    try {
      r = parseChat(text, { timezone: browserZone });
    } catch (e) {
      if (e instanceof InputTooLargeError) return `${e.message} Choose a smaller export or trim the text.`;
      return 'That text could not be read.';
    }
    if (!r.format || r.messages.length === 0) {
      return `We couldn't recognise this format. Relay reads: ${FORMAT_EXAMPLES.map(([l, ex]) => `${l}, like "${ex.split('\n')[0]}"`).join('; ')}. Your text is still here; edit it or choose another file.`;
    }
    setNotice(null);
    setTouched(true);
    setState((st) => ({
      ...st,
      screen: 'review',
      session: { rawText: text, source, fileName },
      settings: { ...freshSettings(), timezone: st.settings.timezone },
      result: null,
      actions: {},
      viewingAs: '',
    }));
    return null;
  }, []);

  const startOver = useCallback(() => {
    void dropEngine();
    setTouched(true);
    setNotice('Chat, results and acknowledgments were deleted from this browser.');
    setState(initialState());
  }, []);

  const onResult = useCallback(
    (out: RunOutput) => {
      setState((st) => {
        const merged = st.retry && st.result ? mergeRuns(st.result, out, applyReadBoundary(parseChat(st.session.rawText, { timezone: st.settings.timezone, dateOrder: st.settings.dateOrder ?? undefined }).messages, st.settings.lastReadId || null)) : out;
        return { ...st, result: merged, retry: null, screen: 'brief', actions: st.retry ? st.actions : {} };
      });
    },
    [],
  );

  if (screen === 'import' || !parse.format) {
    return (
      <Import
        key={session.rawText.length + (notice ?? '')}
        initialText={session.rawText}
        fileName={session.fileName}
        onReview={onReview}
        skipFocus={!touched}
        notice={notice}
      />
    );
  }

  if (screen === 'review') {
    return (
      <Review
        parse={parse}
        participants={participants}
        unreadCount={unreadCount}
        settings={settings}
        referenceTime={referenceTime}
        onChange={(s) => setState((st) => ({ ...st, settings: { ...st.settings, ...s } }))}
        onBack={() => go('import')}
        onContinue={() => {
          setState((st) => ({ ...st, retry: null, viewingAs: '' }));
          go('model');
        }}
      />
    );
  }

  if (screen === 'model') {
    return (
      <ModelStep
        key={retry ? 'retry' : 'run'}
        messages={messages}
        participants={participants}
        only={retry?.only}
        seqStart={retry?.seqStart}
        onResult={onResult}
        onBack={() => go(result ? 'brief' : 'review')}
      />
    );
  }

  return (
    <Brief
      result={result!}
      messages={messages}
      participants={participants}
      selfId={viewingAs}
      onSelf={(id) => setState((st) => ({ ...st, viewingAs: id }))}
      referenceTime={referenceTime}
      timezone={settings.timezone}
      actions={actions}
      onAction={(pid, itemId, a) =>
        setState((st) => {
          const mine = { ...(st.actions[pid] ?? {}) };
          if (a) mine[itemId] = a;
          else delete mine[itemId];
          return { ...st, actions: { ...st.actions, [pid]: mine } };
        })
      }
      onRunAgain={() => {
        setState((st) => ({ ...st, retry: null }));
        go('model');
      }}
      onRetryFailed={() => {
        setState((st) => ({ ...st, retry: { only: new Set(st.result!.failedIds), seqStart: st.result!.seq } }));
        go('model');
      }}
      onStartOver={startOver}
    />
  );
}
