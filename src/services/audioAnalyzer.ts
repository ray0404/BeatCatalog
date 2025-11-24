// src/services/audioAnalyzer.ts
// Imports removed in favor of global scripts
// import * as EssentiaCore from 'essentia.js/dist/essentia.js-core.es.js';
// import * as EssentiaExtractorCore from 'essentia.js/dist/essentia.js-extractor.es.js';

import EssentiaWorker from '../workers/essentia.worker.ts?worker';

// Singleton worker instance
let worker: Worker | null = null;

// Promise map to handle responses
let pendingResolve: ((value: any) => void) | null = null;
let pendingReject: ((reason?: any) => void) | null = null;

/**
 * Initializes the Essentia.js WASM module.
 * No-op in main thread as worker handles it lazily.
 * Kept for API compatibility.
 */
export async function initializeEssentia(): Promise<void> {
    return Promise.resolve();
}

function getWorker(): Worker {
  if (!worker) {
    worker = new EssentiaWorker();
    
    worker.onmessage = (e) => {
        const { status, result, error } = e.data;
        
        if (status === 'success') {
            if (pendingResolve) {
                pendingResolve(result);
                pendingResolve = null;
                pendingReject = null;
            }
        } else {
            console.error('Worker returned error:', error);
            if (pendingReject) {
                pendingReject(new Error(error));
                pendingResolve = null;
                pendingReject = null;
            }
        }
    };

    worker.onerror = (e) => {
        console.error('Worker error:', e);
        if (pendingReject) {
            pendingReject(e);
            pendingResolve = null;
            pendingReject = null;
        }
    };
  }
  return worker;
}

/**
 * Analyzes an audio file to extract BPM, Key, and Energy using Essentia.js in a Web Worker.
 * @param audioFile The audio File object to analyze.
 * @returns An object containing BPM, Key, and Energy.
 */
export async function analyzeAudioFile(audioFile: File): Promise<{ bpm: number; key: string; energy: number }> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get the raw PCM data from the first channel
      const channelData = audioBuffer.getChannelData(0);
      
      // We cannot transfer the channelData directly as it's a view on the AudioBuffer's internal buffer often.
      // We should create a copy or check if we can transfer.
      // Float32Array can be transferred if backed by a unique ArrayBuffer.
      // safe approach: slice it (creates copy) or send as is (structured clone).
      // Transferable is better for performance.
      // const transferBuffer = channelData.buffer; // This might be shared, be careful.
      // Actually, decodeAudioData returns a new AudioBuffer. 
      // audioBuffer.getChannelData(0) returns a Float32Array.
      
      return new Promise((resolve, reject) => {
          // If a request is already pending, we might have a race condition if we use a single global handler.
          // For simplicity in this "one file at a time" loop, we assume sequential access.
          // For robust parallel processing, we'd need IDs.
          // But LibraryImporter processes files sequentially in its loop.
          
          if (pendingResolve) {
              reject(new Error('Analysis already in progress'));
              return;
          }

          pendingResolve = resolve;
          pendingReject = reject;
          
          const w = getWorker();
          // Send data to worker. We use the buffer from the Float32Array.
          // We transfer it to avoid copy overhead.
          w.postMessage({
              cmd: 'analyze',
              audioBuffer: channelData, // Structured clone handles TypedArrays efficiently
              sampleRate: audioBuffer.sampleRate
          }); // Optional: [channelData.buffer] if we want to transfer ownership
      });

  } finally {
      await audioContext.close();
  }
}


