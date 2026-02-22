import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import pkg from './package.json'

// https://vitejs.dev/config/
const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  base: '/',
  // Inyectar versión desde package.json en build time
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo-dark.png', 'logo-light.png', 'pwa-icon.svg'],
      // MB-001: Manifest dinámico desde BD
      // El manifest.json se genera dinámicamente desde /api/tenant/public/manifest/
      // Solo definimos valores mínimos de fallback aquí
      manifest: false, // Deshabilitamos manifest estático - se carga dinámicamente
      injectManifest: {
        injectionPoint: undefined // No inyectar manifest
      },
      workbox: {
        // Forzar activación inmediata del nuevo SW en cada deploy
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Cache de archivos estáticos
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Aumentar límite para vendor chunk grande (15MB)
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,

        // Estrategias de cache para API
        runtimeCaching: [
          {
            // Cache de API para consultas GET (NetworkFirst)
            urlPattern: /^https?:\/\/.*\/api\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cache de imágenes (CacheFirst)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              }
            }
          },
          {
            // Cache de fuentes (CacheFirst)
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true // Habilitar en desarrollo para testing
      }
    })
  ],
  server: {
    port: 3010,
    host: true,
    proxy: {
      // Proxy para API backend en desarrollo
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Eliminar console.log y debugger SOLO en produccion (preservar en dev para debugging)
  esbuild: {
    drop: isProduction ? ['console', 'debugger'] : [],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Solo aislamos paquetes grandes que NO dependen de React internamente.
          // Todo lo demás (react, echarts, recharts, framer-motion, headlessui,
          // tanstack, zustand, etc.) se deja a Rollup automático para evitar
          // circular chunks que rompen el singleton de React en producción.

          // === 3D GRAPHICS (~500 KB, solo three.js core sin React bindings) ===
          if (id.includes('node_modules/three/')) {
            return 'vendor-3d'
          }
          // NOTA: @react-three/* usa React hooks internamente, NO separar del auto-chunk

          // === RICH TEXT EDITOR (~250 KB, solo prosemirror core sin React) ===
          if (id.includes('node_modules/prosemirror-') ||
              id.includes('node_modules/@prosemirror/')) {
            return 'vendor-editor'
          }
          // NOTA: @tiptap/react usa React hooks, NO separar del auto-chunk

          // === PDF & EXPORT (~300 KB, solo librerías sin React) ===
          if (id.includes('node_modules/jspdf') ||
              id.includes('node_modules/html-to-image')) {
            return 'vendor-export'
          }
          // NOTA: react-to-print usa React hooks, NO separar del auto-chunk
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    minify: 'esbuild',
    target: 'es2015',
  },
})
