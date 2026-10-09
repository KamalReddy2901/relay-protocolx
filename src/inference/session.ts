import type { InitProgressReport, MLCEngineInterface } from '@mlc-ai/web-llm';
import type { GenerateFn } from '../domain/runner';

type EngineModule = typeof import('./engine');
let mod: Promise<EngineModule> | null = null;
let engine: Promise<MLCEngineInterface> | null = null;

/** WebLLM is loaded lazily so S1/S2 stay small and work without WebGPU. */
export function engineModule(): Promise<EngineModule> {
  mod ??= import('./engine');
  return mod;
}

export async function modelCached(): Promise<boolean> {
  try {
    return await (await engineModule()).isModelCached();
  } catch {
    return false;
  }
}

export function ensureEngine(onProgress: (r: InitProgressReport) => void): Promise<MLCEngineInterface> {
  engine ??= engineModule()
    .then((m) => m.loadEngine(onProgress))
    .catch((e) => {
      engine = null;
      throw e;
    });
  return engine;
}

export function engineReady(): boolean {
  return engine !== null;
}

export async function dropEngine(): Promise<void> {
  const e = engine;
  engine = null;
  if (e) {
    try {
      await (await e).unload();
    } catch {
      /* already gone */
    }
  }
}

export async function removeModelFiles(): Promise<void> {
  await dropEngine();
  await (await engineModule()).removeModelFiles();
}

export async function makeGenerate(e: MLCEngineInterface): Promise<GenerateFn> {
  const m = await engineModule();
  return async (user, system) => {
    const r = await m.generate(e, user, m.DEFAULT_SETTINGS, system);
    return { text: r.text, finishReason: r.finishReason };
  };
}

export function interrupt(e: MLCEngineInterface | null) {
  void e?.interruptGenerate();
}
