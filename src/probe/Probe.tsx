import { useEffect, useRef, useState } from 'react';
import type { MLCEngineInterface } from '@mlc-ai/web-llm';
import { buildUserPrompt, estimateTokens } from '../domain/extraction';
import { parseChat, applyReadBoundary } from '../domain/parser';
import { parseModelOutput, validateExtraction } from '../domain/validate';
import type { ParseResult } from '../domain/types';
import { checkCapability, DEFAULT_SETTINGS, generate, loadEngine, MODEL_ID, type Capability } from '../inference/engine';

/** CP1 debug view. Reached only via #probe; removed or hidden before CP3. */
export function Probe() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [text, setText] = useState('');
  const [dateOrder, setDateOrder] = useState<'DMY' | 'MDY'>('DMY');
  const [lastRead, setLastRead] = useState('');
  const [cap, setCap] = useState<Capability | null>(null);
  const [progress, setProgress] = useState('');
  const [fraction, setFraction] = useState<number | null>(null);
  const [loadMs, setLoadMs] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [out, setOut] = useState<string>('');
  const [report, setReport] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const engine = useRef<MLCEngineInterface | null>(null);
  const parsed = useRef<ParseResult | null>(null);
  const [parseSummary, setParseSummary] = useState('');
  const [csp, setCsp] = useState<string[]>([]);

  useEffect(() => {
    void checkCapability().then(setCap);
    const h = (e: SecurityPolicyViolationEvent) => setCsp((c) => [...c, `${e.violatedDirective}: ${e.blockedURI}`]);
    document.addEventListener('securitypolicyviolation', h);
    return () => document.removeEventListener('securitypolicyviolation', h);
  }, []);

  const addLog = (s: string) => setLog((l) => [...l, `${new Date().toISOString().slice(11, 19)} ${s}`]);

  function doParse() {
    const r = parseChat(text, { timezone: tz, dateOrder });
    parsed.current = r;
    setParseSummary(
      `format=${r.format} messages=${r.messages.length} participants=${r.participants.map((p) => p.displayName).join(', ')} issues=${r.issues.length} ambiguous=${r.dateOrderAmbiguous}`,
    );
  }

  async function load() {
    setBusy(true);
    const t0 = performance.now();
    try {
      engine.current = await loadEngine((r) => {
        setProgress(r.text);
        setFraction(r.progress);
      });
      const ms = Math.round(performance.now() - t0);
      setLoadMs(ms);
      addLog(`model initialized in ${ms} ms`);
    } catch (e) {
      addLog(`LOAD FAILED: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  async function run() {
    if (!engine.current) return;
    doParse();
    const r = parsed.current!;
    if (!r.format) {
      addLog('unrecognized format');
      return;
    }
    const msgs = applyReadBoundary(r.messages, lastRead || null);
    const context = msgs.filter((m) => !m.isUnread).slice(-10);
    const unread = msgs.filter((m) => m.isUnread);
    // fill one chunk to the budget
    const chunk = [];
    let used = 0;
    for (const m of unread) {
      const c = estimateTokens(JSON.stringify(m.text)) + 30;
      if (used + c > 2000 && chunk.length > 0) break;
      chunk.push(m);
      used += c;
    }
    setBusy(true);
    setOut('');
    setReport('');
    try {
      const prompt = buildUserPrompt(chunk, context);
      addLog(`chunk: ${chunk.length}/${unread.length} unread messages, ${context.length} context, est ${used} tokens`);
      const res = await generate(engine.current, prompt, DEFAULT_SETTINGS);
      setOut(res.text);
      addLog(
        `generated ${res.completionTokens} tokens (prompt ${res.promptTokens}) in ${res.ms} ms, finish=${res.finishReason}`,
      );
      const parsedOut = parseModelOutput(res.text);
      if (!parsedOut.ok) {
        setReport(`INVALID: ${parsedOut.error}`);
      } else {
        const known = new Map([...context, ...chunk].map((m) => [m.id, m]));
        const order = new Map(msgs.map((m, i) => [m.id, i]));
        const v = validateExtraction(parsedOut.value, { known, order, participants: r.participants, chunkIndex: 0 });
        setReport(
          JSON.stringify(
            { thinkingStripped: parsedOut.thinkingStripped, ...v, items: v.items.map((i) => ({ ...i, evidence: i.evidence.map((e) => `${e.messageId}[${e.role}] "${e.quote}"`) })) },
            null,
            1,
          ),
        );
      }
    } catch (e) {
      addLog(`RUN FAILED: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  async function env() {
    const hosts = new Set(performance.getEntriesByType('resource').map((e) => new URL(e.name).host));
    const est = await navigator.storage.estimate();
    const keys = await caches.keys();
    const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    addLog(
      `hosts=${[...hosts].join(',')} storage usage=${Math.round((est.usage ?? 0) / 1e6)}MB caches=${keys.join(',')} heap=${mem ? Math.round(mem.usedJSHeapSize / 1e6) + 'MB' : 'n/a'} ua=${navigator.userAgent}`,
    );
  }

  return (
    <main style={{ maxWidth: 1000 }}>
      <h1>CP1 probe</h1>
      <p>Debug view for model checks. Model: {MODEL_ID}. Timezone: {tz}.</p>
      <p data-testid="cap">
        WebGPU: {cap ? `${cap.webgpu} · shader-f16: ${cap.shaderF16} · ${cap.adapterInfo} ${cap.reason ?? ''}` : 'checking'}
      </p>
      <label>
        Chat text
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} style={{ width: '100%', fontFamily: 'monospace' }} />
      </label>
      <p>
        <label>
          Date order{' '}
          <select value={dateOrder} onChange={(e) => setDateOrder(e.target.value as 'DMY' | 'MDY')}>
            <option>DMY</option>
            <option>MDY</option>
          </select>
        </label>{' '}
        <label>
          Last read message id (blank = none){' '}
          <input value={lastRead} onChange={(e) => setLastRead(e.target.value)} />
        </label>
      </p>
      <p>
        <button onClick={doParse}>Parse</button> <button onClick={load} disabled={busy}>Load model</button>{' '}
        <button onClick={run} disabled={busy || !engine.current}>Run one chunk</button> <button onClick={env}>Environment</button>
      </p>
      <p data-testid="parse">{parseSummary}</p>
      <p data-testid="progress">
        {progress} {fraction !== null && <progress value={fraction} max={1} />} {loadMs !== null && `loaded ${loadMs} ms`}
      </p>
      <h2>Raw model output</h2>
      <pre data-testid="out" style={{ whiteSpace: 'pre-wrap' }}>{out}</pre>
      <h2>Validation</h2>
      <pre data-testid="report" style={{ whiteSpace: 'pre-wrap' }}>{report}</pre>
      <h2>Log</h2>
      <pre data-testid="log" style={{ whiteSpace: 'pre-wrap' }}>{log.join('\n')}</pre>
      <pre data-testid="csp">{csp.join('\n')}</pre>
    </main>
  );
}
