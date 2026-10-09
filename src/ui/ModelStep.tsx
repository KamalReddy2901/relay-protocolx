import { Check } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FatalInferenceError, runCatchUp, type RunOutput } from '../domain/runner';
import type { Message, Participant } from '../domain/types';
import { checkCapability, type Capability } from '../inference/capability';
import { dropEngine, engineReady, ensureEngine, interrupt, makeGenerate, modelCached, removeModelFiles } from '../inference/session';
import { Btn, ErrorNotice, Steps, TopBar, useHeadingFocus } from './common';

const MODEL_NAME = 'Qwen3-4B-q4f16_1-MLC';
const MODEL_CARD = 'https://huggingface.co/mlc-ai/Qwen3-4B-q4f16_1-MLC';

type Phase = 'checking' | 'unsupported' | 'download' | 'loading' | 'running' | 'error';

interface Props {
  messages: Message[];
  participants: Participant[];
  /** When retrying, only these unread message ids are processed. */
  only?: Set<string>;
  seqStart?: number;
  onResult: (out: RunOutput) => void;
  onBack: () => void;
  onQuickRules: () => void;
}

export function ModelStep({ messages, participants, only, seqStart, onResult, onBack, onQuickRules }: Props) {
  const heading = useHeadingFocus(false);
  const [phase, setPhase] = useState<Phase>('checking');
  const [cap, setCap] = useState<Capability | null>(null);
  const [cached, setCached] = useState<boolean | null>(null);
  const [progressText, setProgressText] = useState('');
  const [fraction, setFraction] = useState<number | null>(null);
  const [announce, setAnnounce] = useState('');
  const [error, setError] = useState<{ text: string; detail?: string } | null>(null);
  const [chunk, setChunk] = useState<{ n: number; total: number; range: string; first: string; last: string } | null>(null);
  const [doneLines, setDoneLines] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [stopping, setStopping] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const started = useRef(false);
  const leftRef = useRef(false);
  const engineRef = useRef<Awaited<ReturnType<typeof ensureEngine>> | null>(null);
  const lastStep = useRef(-1);
  const t0 = useRef(0);

  useEffect(() => {
    if (phase !== 'loading' && phase !== 'running') return;
    const id = setInterval(() => setElapsed(Math.round((performance.now() - t0.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const infer = useCallback(async () => {
    if (leftRef.current) return;
    setPhase('running');
    setAnnounce('Model ready. Reading messages.');
    abort.current = new AbortController();
    try {
      const generate = await makeGenerate(engineRef.current!);
      const out = await runCatchUp({
        messages,
        participants,
        generate,
        only,
        seqStart,
        signal: abort.current.signal,
        onEvent: (e) => {
          if (e.type === 'chunk-start') {
            setChunk({ n: e.n, total: e.total, range: e.range, first: e.firstId, last: e.lastId });
            setAnnounce(`Reading messages ${e.firstId} to ${e.lastId}, section ${e.n} of ${e.total}.`);
          } else if (e.status === 'done') {
            setDoneLines((l) => [...l, `Read ${e.range}`]);
          } else {
            setDoneLines((l) => [...l, `Could not read ${e.range} (${e.status === 'invalid-output' ? 'the model output was not valid' : 'failed'})`]);
          }
        },
      });
      if (!leftRef.current) onResult(out);
    } catch (e) {
      if (leftRef.current) return;
      if (e instanceof FatalInferenceError) {
        setError({ text: e.message + (e.kind === 'gpu-memory' ? ' Close other tabs or apps that use the GPU, then retry.' : ' Retry to reload the model.') });
        await dropEngine();
      } else {
        setError({ text: 'The run stopped unexpectedly.', detail: e instanceof Error ? e.message : String(e) });
      }
      setPhase('error');
    }
  }, [messages, participants, only, seqStart, onResult]);

  const load = useCallback(async () => {
    setError(null);
    setPhase('loading');
    t0.current = performance.now();
    setElapsed(0);
    try {
      engineRef.current = await ensureEngine((r) => {
        setProgressText(r.text);
        setFraction(typeof r.progress === 'number' ? r.progress : null);
        const step = Math.floor((r.progress ?? 0) * 10);
        if (step !== lastStep.current) {
          lastStep.current = step;
          setAnnounce(`Getting the model ready: ${step * 10} percent.`);
        }
      });
      if (leftRef.current) return;
      setCached(true);
      t0.current = performance.now();
      await infer();
    } catch (e) {
      if (leftRef.current) return;
      await dropEngine();
      const msg = e instanceof Error ? e.message : String(e);
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      setError({
        text: offline
          ? 'You appear to be offline. The model could not be downloaded. Files already downloaded are reused when you retry.'
          : 'The model could not be loaded. Files already downloaded are reused when you retry.',
        detail: msg,
      });
      setPhase('error');
    }
  }, [infer]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const c = await checkCapability();
      setCap(c);
      if (!c.webgpu) {
        setPhase('unsupported');
        return;
      }
      const isCached = await modelCached();
      setCached(isCached);
      if (isCached || engineReady()) void load();
      else setPhase('download');
    })();
  }, [load]);

  function cancel() {
    if (phase === 'running') {
      setStopping(true);
      abort.current?.abort();
      interrupt(engineRef.current);
      return;
    }
    leftRef.current = true;
    onBack();
  }

  async function remove() {
    await removeModelFiles();
    setCached(false);
    setPhase('download');
  }

  return (
    <>
      <TopBar />
      <main className="sheet" id="main">
        <Steps current={3} />
        <div aria-live="polite" className="sr-only">
          {announce}
        </div>
        <h1 ref={heading} tabIndex={-1}>
          {phase === 'running' ? 'Reading your messages' : phase === 'unsupported' ? 'This device cannot run the model' : 'Getting the model ready'}
        </h1>

        {phase === 'unsupported' && (
          <div className="stack" style={{ marginTop: 'var(--s-4)' }}>
            <ErrorNotice>
              <p>Relay needs WebGPU to run the model in your browser. Try recent Chrome or Edge on a laptop with a GPU.</p>
              {cap?.reason && <p className="small muted">Detected: {cap.reason}</p>}
            </ErrorNotice>
            <p className="small muted">The private AI run is unavailable here. You can still get a clearly labeled, rule-based catch-up on this device.</p>
            <div className="row"><Btn onClick={onBack}>Back</Btn><Btn primary onClick={onQuickRules}>Use instant rules instead</Btn></div>
          </div>
        )}

        {phase !== 'unsupported' && (
          <div className="stack" style={{ marginTop: 'var(--s-4)' }}>
            <p className="small">
              Model: {MODEL_NAME} (WebLLM, runs in this browser). Licence: see the{' '}
              <a href={MODEL_CARD} rel="noreferrer noopener" target="_blank">
                model card
              </a>
              .
            </p>
            {cap && (
              <p className="mono muted">
                WebGPU: {cap.webgpu ? 'yes' : 'no'} · shader-f16: {cap.shaderF16 ? 'yes' : 'no'}
                {cap.adapterInfo ? ` · ${cap.adapterInfo}` : ''}
              </p>
            )}
          </div>
        )}

        {phase === 'checking' && <p style={{ marginTop: 'var(--s-4)' }}>Checking this device…</p>}

        {phase === 'download' && (
          <div className="stack" style={{ marginTop: 'var(--s-4)' }}>
            <p>
              The model is not on this device yet. The first download is large (about 2.2 GB when measured once on one laptop); later visits reuse the cached files. Your chat is not uploaded.
            </p>
            <div className="row">
              <Btn onClick={onBack}>Back</Btn>
              <Btn primary onClick={() => void load()}>
                Download model
              </Btn>
            </div>
          </div>
        )}

        {phase === 'loading' && (
          <div className="stack" style={{ marginTop: 'var(--s-4)' }}>
            {cached && !progressText && <p>Model ready (cached on this device). Starting it…</p>}
            <p className="progress-text">{progressText || 'Starting…'}</p>
            {fraction !== null && <progress value={fraction} max={1} aria-label="Model loading progress" />}
            <p className="mono muted">Elapsed {elapsed}s · first download is large; later visits reuse cached files</p>
            <Btn onClick={cancel}>Cancel</Btn>
          </div>
        )}

        {phase === 'running' && (
          <div className="stack" style={{ marginTop: 'var(--s-4)' }}>
            <p>
              {chunk
                ? `Reading messages ${chunk.first === chunk.last ? chunk.first : `${chunk.first}–${chunk.last}`} (section ${chunk.n} of ${chunk.total})`
                : 'Preparing the first section…'}
            </p>
            {doneLines.length > 0 && (
              <ul className="done-list">
                {doneLines.map((l, i) => (
                  <li key={i}>
                    <Check size={16} strokeWidth={1.5} aria-hidden="true" /> {l}
                  </li>
                ))}
              </ul>
            )}
            <p className="mono muted">Elapsed {elapsed}s</p>
            <Btn onClick={cancel} reason={stopping ? 'Stopping after the current section…' : null}>
              Cancel
            </Btn>
            <p className="small muted">Cancelling keeps the sections already read and marks the result Partial.</p>
          </div>
        )}

        {phase === 'error' && error && (
          <div className="stack" style={{ marginTop: 'var(--s-4)' }}>
            <ErrorNotice>
              <p>{error.text}</p>
              {error.detail && <p className="mono muted">{error.detail}</p>}
            </ErrorNotice>
            <div className="row">
              <Btn onClick={onBack}>Back</Btn>
              <Btn
                primary
                onClick={() => {
                  setDoneLines([]);
                  setChunk(null);
                  void load();
                }}
              >
                Retry
              </Btn>
              <Btn onClick={onQuickRules}>Use instant rules instead</Btn>
            </div>
          </div>
        )}

        {cached && (phase === 'download' || phase === 'error') && (
          <details style={{ marginTop: 'var(--s-5)' }}>
            <summary>Model files cached on this device</summary>
            <p className="small muted">Removing them means the next run downloads the model again.</p>
            <Btn small onClick={() => void remove()}>
              Remove model files
            </Btn>
          </details>
        )}
      </main>
    </>
  );
}
