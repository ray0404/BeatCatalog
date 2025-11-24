import { describe, it, expect, vi } from 'vitest';
import EssentiaWASM from 'essentia.js/dist/essentia-wasm.umd.js';
import { initializeEssentia } from './audioAnalyzer';

describe('Audio Analyzer Service', () => {
  it('should import EssentiaWASM factory correctly', () => {
    expect(typeof EssentiaWASM).toBe('function');
  });

  it('should attempt to initialize Essentia without crashing on import', async () => {
    // Mock fetch to return a dummy WASM response so initialization proceeds
    // without network errors in JSDOM.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8), // Minimal dummy buffer
    } as Response);

    // We mainly want to ensure it doesn't throw "is not a function"
    // It might fail later due to invalid WASM, but that's expected in this mock.
    try {
      await initializeEssentia();
    } catch (e: any) {
      // If it fails with "WebAssembly.instantiate", that means it got past the import!
      // If it fails with "EssentiaWASM is not a function", we failed.
      if (e.message && e.message.includes('EssentiaWASM is not a function')) {
        throw e;
      }
      console.log('Initialization reached WASM loading stage (expected failure in test):', e.message);
    }
  });
});
