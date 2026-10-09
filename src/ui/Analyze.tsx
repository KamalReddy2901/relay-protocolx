import { useEffect, useRef, useState } from 'react';
import { localExtract } from '../domain/localExtractor';
import { runCatchUp, type RunOutput } from '../domain/runner';
import type { Message, Participant } from '../domain/types';
import { Btn, ErrorNotice, Steps, TopBar, useHeadingFocus } from './common';

interface Props {
  messages: Message[];
  participants: Participant[];
  /** When retrying, only these unread message ids are processed. */
  only?: Set<string>;
  seqStart?: number;
  onResult: (out: RunOutput) => void;
  onBack: () => void;
}

/** Reads the unread messages with Relay's on-device rules. Nothing is downloaded or sent anywhere. */
export function Analyze({ messages, participants, only, seqStart, onResult, onBack }: Props) {
  const heading = useHeadingFocus(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const left = useRef(false);

  useEffect(() => {
    left.current = false;
    runCatchUp({ messages, participants, generate: localExtract, only, seqStart })
      .then((out) => {
        if (!left.current) onResult(out);
      })
      .catch((e: unknown) => {
        if (!left.current) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      left.current = true;
    };
  }, [messages, participants, only, seqStart, onResult, attempt]);

  return (
    <>
      <TopBar />
      <main className="sheet" id="main">
        <Steps current={3} />
        <h1 ref={heading} tabIndex={-1}>
          Reading your messages
        </h1>
        <div aria-live="polite" className="stack" style={{ marginTop: 'var(--s-4)' }}>
          {error ? (
            <>
              <ErrorNotice>
                <p>The messages could not be read.</p>
                <p className="mono muted">{error}</p>
              </ErrorNotice>
              <div className="row">
                <Btn onClick={onBack}>Back</Btn>
                <Btn
                  primary
                  onClick={() => {
                    setError(null);
                    setAttempt((n) => n + 1);
                  }}
                >
                  Retry
                </Btn>
              </div>
            </>
          ) : (
            <p>Finding tasks, changes and decisions on this device. Your chat is not uploaded and no model is downloaded.</p>
          )}
        </div>
      </main>
    </>
  );
}
