// src/services/audioAnalyzer.ts
import EssentiaWASM from 'essentia.js/dist/essentia-wasm.umd.js';
import Essentia from 'essentia.js/dist/essentia.js-core.es.js';
import EssentiaExtractor from 'essentia.js/dist/essentia.js-extractor.es.js';
import essentiaWasmUrl from 'essentia.js/dist/essentia-wasm.web.wasm?url';

let essentia: Essentia | null = null;

/**
 * Initializes the Essentia.js WASM module.
 * This should be called once when the application starts.
 * @returns A promise that resolves when Essentia.js is ready.
 */
export async function initializeEssentia(): Promise<void> {
  if (!essentia) {
    try {
      const wasmModule = await EssentiaWASM({
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return essentiaWasmUrl;
          }
          return path;
        }
      });
      
      // Temporary workaround for potential double-module wrapping or incorrect type
      // Check if EssentiaJS is directly on the module or on a 'default' property
      const coreModule = wasmModule.EssentiaJS ? wasmModule : (wasmModule.default || wasmModule);
      
      if (!coreModule.EssentiaJS) {
         console.error('EssentiaJS not found on WASM module. Available keys:', Object.keys(wasmModule));
         // Fallback: Check if it's strictly a raw emscripten module without the class
         // In some versions/builds, you might need to use a different property
         throw new Error('EssentiaJS constructor not found in WASM module');
      }

      console.log('WASM Module loaded successfully');
      essentia = new Essentia(coreModule);
      console.log('Essentia.js WASM initialized.');
    } catch (error) {
      console.error('Failed to initialize Essentia.js:', error);
      throw error;
    }
  }
}

/**
 * Analyzes an audio file to extract BPM, Key, and Energy using Essentia.js.
 * @param audioFile The audio File object to analyze.
 * @returns An object containing BPM, Key, and Energy.
 */
export async function analyzeAudioFile(audioFile: File): Promise<{ bpm: number; key: string; energy: number }> {
  if (!essentia) {
    await initializeEssentia(); // Ensure Essentia is initialized
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioFile.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const audioVector = essentia!.arrayToVector(audioBuffer.getChannelData(0)); // Use the first channel

  // Initialize the Essentia Extractor with default parameters
  const extractor = new EssentiaExtractor(essentia!);
  const features = extractor.compute(audioVector);

  // Extract relevant features
  const bpm = features.rhythm.bpm;
  const key = features.tonal.key_key + ' ' + features.tonal.key_scale;
  const energy = features.sfx.loudness; // Using loudness as a proxy for energy

  await audioContext.close();

  return { bpm, key, energy };
}

