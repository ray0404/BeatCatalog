/// <reference types="vite/client" />

declare module 'essentia.js/dist/essentia-wasm.umd.js' {
  export default function EssentiaWASM(config?: any): Promise<any>;
}

declare module 'essentia.js/dist/essentia.js-core.es.js' {
  export default class Essentia {
      constructor(module: any);
      arrayToVector(array: Float32Array): any;
      vectorToArray(vector: any): Float32Array;
  }
}

declare module 'essentia.js/dist/essentia.js-extractor.es.js' {
  import Essentia from 'essentia.js/dist/essentia.js-core.es.js';
  export default class EssentiaExtractor {
    constructor(essentia: Essentia);
    compute(audioVector: any): {
      rhythm: { bpm: number };
      tonal: { key_key: string; key_scale: string };
      sfx: { loudness: number };
      [key: string]: any;
    };
  }
}

declare module 'essentia.js' {
  export class Essentia {
    constructor(module: any);
    arrayToVector(array: Float32Array): any;
    vectorToArray(vector: any): Float32Array;
    algorithms: any;
  }

  export class EssentiaExtractor {
    constructor(essentia: Essentia);
    compute(audioVector: any): {
      rhythm: { bpm: number };
      tonal: { key_key: string; key_scale: string };
      sfx: { loudness: number };
      [key: string]: any;
    };
  }
}

declare module 'uuid' {
  export function v4(): string;
}

// Extend FileSystemDirectoryHandle to include values() iterator
interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
}
