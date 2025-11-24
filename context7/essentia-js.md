# Essentia.js Documentation

## Installation

### NPM
```bash
npm install essentia.js
```

### Yarn
```bash
yarn add essentia.js
```

## Usage Examples

### Basic Instantiation (HTML/CDN)
```html
<script src="https://cdn.jsdelivr.net/npm/essentia.js@<version>/dist/essentia-wasm.web.js"></script>
<script src="https://cdn.jsdelivr.net/npm/essentia.js@<version>/dist/essentia.js-core.js"></script>
<script>
  let essentia;
  EssentiaWASM().then( function(EssentiaWasm) {
    essentia = new Essentia(EssentiaWasm);
  });
</script>
```

### ES6 Imports
```javascript
import Essentia from 'essentia.js/dist/essentia.js-core.es.js';
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js';

// Usage depends on how EssentiaWASM is exported (factory vs instance)
// Typically requires awaiting the WASM factory
```

### Audio Analysis Example
```javascript
const audioCtx = new AudioContext();
const audioURL = "path/to/audio.mp3";
const audioBuffer = await essentia.getAudioBufferFromURL(audioURL, audioCtx);
const inputSignalVector = essentia.arrayToVector(audioBuffer.getChannelData(0));

// ReplayGain
let outputRG = essentia.ReplayGain(inputSignalVector, 44100);
console.log(outputRG.replayGain);

// Cleanup
inputSignalVector.delete();
// ... delete other vectors
```

## Common Issues
- **Constructor Error**: Ensure `Essentia` is imported correctly (default vs named export).
- **WASM Loading**: Ensure the WASM file is served correctly and the path is provided to the factory if not auto-detected.

## Related Context7 Library IDs
- `/mtg/essentia.js`
- `/mtg/essentia`