# BeatCatalog PWA

You are an expert Senior Frontend Engineer specializing in Local-First Progressive Web Apps (PWAs) and Web Audio/WASM technologies.  

I need you to scaffold and prototype a project called "BeatCatalog". This is a tool for a music producer to organize local audio files (beats/instrumentals) for album preparation without uploading files to a cloud server.  

## 1. Technical Stack & Constraints
* Core: React (v18+), TypeScript, Vite.
* Styling: Tailwind CSS (use a dark, sleek 'DAW-like' aesthetic).
* State: Zustand.
* Database (Local): Dexie.js (IndexedDB wrapper) for storing metadata.
* Audio Visualization: Wavesurfer.js.
* Audio Analysis: Essentia.js (WASM version) for client-side BPM/Key detection.
* PWA Requirement: Strict Offline Persistence. Use vite-plugin-pwa. The strategy must be "Cache First, falling back to Network" for all static assets.  

## 2. Critical Configuration (Must Follow Exact Implementation)
To avoid common WASM errors with Vite + Essentia, you must configure vite.config.ts exactly like this. Do not hallucinate a different config:
```
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await'; 

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'], // Cache WASM!
        runtimeCaching: [{
          urlPattern: ({ request }) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style',
          handler: 'CacheFirst',
          options: {
            cacheName: 'app-shell',
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }
          }
        }]
      },
      manifest: {
        name: 'BeatCatalog',
        short_name: 'BeatCat',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        scope: '/',
        start_url: '/',
      }
    })
  ],
  optimizeDeps: {
    exclude: ['essentia.js'] // Prevent optimization issues with WASM libs
  }
}); 
```

## 3. Functional Requirements (The Prototype)
### A. Data Schema (Dexie.js)
Create a database store db.ts with a table beats:
* id (string, uuid)
* title (string)
* bpm (number, float)
* key (string)
* tags (array of strings)
* fileHandle (Do not store the blob, store the FileSystemFileHandle object if possible, or use the File System Access API to retrieve it on demand).
### B. Core Features
* Library Context: A React Context/Hook that uses window.showDirectoryPicker() to recursively scan a selected local folder for .wav and .mp3 files.
* The Analyzer: A utility function that accepts a File object, runs it through Essentia.js (audio analysis), extracts BPM/Key/Energy, and saves the result to Dexie.
* The Dashboard: A main view displaying a table of beats.
   * Columns: Title, BPM, Key, Actions.
   * Clicking a row opens a player footer.
* The Player: A persistent footer component using Wavesurfer.js to visualize the waveform and play the audio.  

## 4. Output Deliverables
Please provide the code in the following order:
* Terminal Commands: To install all specific dependencies (include vite-plugin-wasm, vite-plugin-top-level-await, essentia.js, wavesurfer.js, dexie, zustand).
* File Structure: A tree view of the recommended folder structure.
* Key Files:
   * vite.config.ts (Use the code provided above).
   * src/db/db.ts (Dexie setup).
   * src/services/audioAnalyzer.ts (The logic to load Essentia WASM and analyze a buffer).
   * src/App.tsx (Main layout).
   * src/components/LibraryImporter.tsx (The button to trigger folder scan).
Begin by confirming you understand the PWA caching strategy and the WASM constraints.

