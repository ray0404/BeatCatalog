import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeEssentia, analyzeAudioFile } from './audioAnalyzer';

describe('Audio Analyzer Service', () => {
  let mockEssentiaInstance: any;

  beforeEach(() => {
    // 1. Mock window.EssentiaWASM (The Factory)
    (window as any).EssentiaWASM = vi.fn().mockImplementation(async () => {
      return {
        EssentiaJS: class MockEssentiaJS {
          version = '0.0.1';
          algorithmNames = [];
        }
      };
    });

    // 2. Mock window.Essentia (The Class Wrapper)
    mockEssentiaInstance = {
      arrayToVector: vi.fn().mockReturnValue({}), // Returns dummy vector
      RhythmExtractor2013: vi.fn().mockReturnValue({ bpm: 125.0 }),
      KeyExtractor: vi.fn().mockReturnValue({ key: 'C', scale: 'Major' }),
      Loudness: vi.fn().mockReturnValue({ loudness: 0.85 }),
    };

    (window as any).Essentia = vi.fn(function() { return mockEssentiaInstance; });

    // 3. Mock window.AudioContext
    (window as any).AudioContext = class {
      decodeAudioData = vi.fn().mockResolvedValue({
        getChannelData: vi.fn().mockReturnValue(new Float32Array(100))
      });
      close = vi.fn();
    };
    (window as any).webkitAudioContext = (window as any).AudioContext;

    // Reset global state in module if possible (hard with ESM, but we rely on idempotency check)
  });

  afterEach(() => {
    delete (window as any).EssentiaWASM;
    delete (window as any).Essentia;
    delete (window as any).AudioContext;
  });

  it('should initialize and call specific algorithms', async () => {
    // Mock fetch for WASM file check
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);

    // Create dummy file
    const file = new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' });
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

    // Run analysis
    const result = await analyzeAudioFile(file);

    // Verify results
    expect(result.bpm).toBe(125.0);
    expect(result.key).toBe('C Major');
    expect(result.energy).toBe(0.85);

    // Verify calls
    expect((window as any).EssentiaWASM).toHaveBeenCalled();
    expect((window as any).Essentia).toHaveBeenCalled();
    expect(mockEssentiaInstance.RhythmExtractor2013).toHaveBeenCalled();
    expect(mockEssentiaInstance.KeyExtractor).toHaveBeenCalled();
    expect(mockEssentiaInstance.Loudness).toHaveBeenCalled();
  });
});