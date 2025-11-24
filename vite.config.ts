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
    /* VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB to support Essentia
        globPatterns: ['**\/*.{js,css,html,ico,png,svg,wasm}'], // Cache WASM!
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
    }) */
  ],
  optimizeDeps: {
    exclude: [] // Removed essentia.js to allow pre-bundling for CommonJS interop
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
  build: {
    minify: false
  },
  worker: {
    format: 'es',
    plugins: () => [
      wasm(),
      topLevelAwait()
    ]
  },
  server: {
    host: '0.0.0.0', // Expose to network
    port: 5173,
    hmr: {
      clientPort: 5173,
    }
  }
});