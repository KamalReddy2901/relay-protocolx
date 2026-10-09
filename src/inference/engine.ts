import {
  CreateWebWorkerMLCEngine,
  deleteModelAllInfoInCache,
  hasModelInCache,
  type InitProgressReport,
  type MLCEngineInterface,
} from '@mlc-ai/web-llm';
import { EXTRACTION_SCHEMA, SYSTEM_PROMPT } from '../domain/extraction';

export const MODEL_ID = 'Qwen3-4B-q4f16_1-MLC';

export { checkCapability, type Capability } from './capability';

export interface GenerationSettings {
  temperature: number;
  top_p: number;
  seed: number;
  max_tokens: number;
}

export const DEFAULT_SETTINGS: GenerationSettings = { temperature: 0.2, top_p: 0.9, seed: 7, max_tokens: 1200 };

export async function loadEngine(onProgress: (r: InitProgressReport) => void): Promise<MLCEngineInterface> {
  const worker = new Worker(new URL('../worker/llm.worker.ts', import.meta.url), { type: 'module' });
  return CreateWebWorkerMLCEngine(worker, MODEL_ID, { initProgressCallback: onProgress });
}

export interface GenerationResult {
  text: string;
  finishReason: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  ms: number;
}

export async function generate(
  engine: MLCEngineInterface,
  userPrompt: string,
  settings: GenerationSettings = DEFAULT_SETTINGS,
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<GenerationResult> {
  const t0 = performance.now();
  await engine.resetChat();
  const res = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: settings.temperature,
    top_p: settings.top_p,
    seed: settings.seed,
    max_tokens: settings.max_tokens,
    response_format: { type: 'json_object', schema: JSON.stringify(EXTRACTION_SCHEMA) },
    extra_body: { enable_thinking: false },
  });
  const choice = res.choices[0];
  return {
    text: choice.message.content ?? '',
    finishReason: choice.finish_reason ?? null,
    promptTokens: res.usage?.prompt_tokens ?? null,
    completionTokens: res.usage?.completion_tokens ?? null,
    ms: Math.round(performance.now() - t0),
  };
}

export function isModelCached(): Promise<boolean> {
  return hasModelInCache(MODEL_ID);
}

export function removeModelFiles(): Promise<void> {
  return deleteModelAllInfoInCache(MODEL_ID);
}
