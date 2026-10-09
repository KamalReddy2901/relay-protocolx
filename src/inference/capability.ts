export interface Capability {
  webgpu: boolean;
  shaderF16: boolean;
  adapterInfo: string;
  reason?: string;
}

export async function checkCapability(): Promise<Capability> {
  interface MinimalGpu {
    requestAdapter(): Promise<{
      features: { has(f: string): boolean };
      info?: { vendor?: string; architecture?: string; description?: string };
    } | null>;
  }
  const gpu = (navigator as Navigator & { gpu?: MinimalGpu }).gpu;
  if (!gpu) return { webgpu: false, shaderF16: false, adapterInfo: '', reason: 'navigator.gpu is not available' };
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return { webgpu: false, shaderF16: false, adapterInfo: '', reason: 'No WebGPU adapter was returned' };
    const info = adapter.info;
    return {
      webgpu: true,
      shaderF16: adapter.features.has('shader-f16'),
      adapterInfo: [info?.vendor, info?.architecture, info?.description].filter(Boolean).join(' / '),
    };
  } catch (e) {
    return { webgpu: false, shaderF16: false, adapterInfo: '', reason: (e as Error).message };
  }
}

