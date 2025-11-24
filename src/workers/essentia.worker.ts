// src/workers/essentia.worker.ts

// We use the CDN / local public path for the WASM backend if standard import fails, 
// but with Vite, we should try to use the installed package or the public scripts.
// Given the previous setup used window globals from public scripts, we can try 
// to mirror that or use proper imports if Vite allows.

// Let's try proper imports first, as that is cleaner with Vite.
// If that fails during build/runtime, we can fallback to importScripts with public URLs.

// NOTE: We need to tell TypeScript about the worker context if we want type safety,
// but for now we'll stick to basic JS/TS to get it working.

let essentia: any = null;
let essentiaWasmBackend: any = null;

// Define the interface for the message data
interface AnalysisMessage {
  cmd: 'analyze';
  audioBuffer: Float32Array; // The raw audio data for one channel
  sampleRate: number; // Essentia often defaults to 44100 but good to be explicit
}

self.onmessage = async (e: MessageEvent<AnalysisMessage>) => {
  const { cmd, audioBuffer } = e.data;

  if (cmd === 'analyze') {
    try {
      if (!essentia) {
        await initializeEssentia();
      }

      const vector = essentia.arrayToVector(audioBuffer);

      // 1. BPM and Rhythm
      // RhythmExtractor2013(signal, maxTempo, method, minTempo)
      const rhythmStats = essentia.RhythmExtractor2013(vector);
      const bpm = rhythmStats.bpm;

      // 2. Key and Scale
      // KeyExtractor(audio, ...)
      const keyStats = essentia.KeyExtractor(vector);
      const key = `${keyStats.key} ${keyStats.scale}`;

      // 3. Energy (using Loudness as proxy)
      const loudnessStats = essentia.Loudness(vector);
      const energy = loudnessStats.loudness;
      
      // Clean up vector to free memory (crucial in WASM)
      vector.delete();

      self.postMessage({
        status: 'success',
        result: { bpm, key, energy }
      });

    } catch (error: any) {
      console.error('Essentia Worker Error:', error);
      self.postMessage({
        status: 'error',
        error: error.message || String(error)
      });
    }
  }
};

async function initializeEssentia() {
  console.log('[Worker] Initializing Essentia...');
  
  // We need to load the WASM backend.
  // Since we are in a worker, we can't look at 'window'.
  // We will try to import via standard ES modules provided by the package.
  
  // Dynamic import to avoid top-level await issues if not fully supported in worker init
  // or to catch errors better.
  
  // Using the paths that worked in the main thread (checking node_modules structure via search results)
  // 'essentia.js/dist/essentia-wasm.web.js'
  
  try {
     // We import the modules. Vite will bundle these.
     // @ts-ignore
     const EssentiaWASMModule = await import('essentia.js/dist/essentia-wasm.web.js');
     const EssentiaWASM = EssentiaWASMModule.EssentiaWASM || EssentiaWASMModule.default || EssentiaWASMModule;

     // @ts-ignore
     const EssentiaCore = await import('essentia.js/dist/essentia.js-core.es.js');
     const Essentia = EssentiaCore.default || EssentiaCore;

     if (typeof EssentiaWASM !== 'function') {
         throw new Error(`EssentiaWASM is not a function, it is ${typeof EssentiaWASM}`);
     }

     essentiaWasmBackend = await EssentiaWASM({
        // We need to point to the .wasm file.
        // In the worker, the relative path might be tricky.
        // Usually, pointing to the public URL works.
        locateFile: (path: string) => {
            if (path.endsWith('.wasm')) {
                return '/essentia-wasm.web.wasm';
            }
            return path;
        }
     });

     essentia = new Essentia(essentiaWasmBackend);
     console.log('[Worker] Essentia initialized.');

  } catch (e) {
      console.error('[Worker] Failed to load Essentia modules via import. Trying importScripts fallback...');
      throw e;
  }
}
