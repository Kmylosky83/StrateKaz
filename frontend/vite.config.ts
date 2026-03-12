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
        // NO forzar activación inmediata — deja que el usuario elija cuándo recargar.
        // Con skipWaiting:true + clientsClaim:true, un deploy forzaba reload en TODAS
        // las pestañas abiertas via controllerchange, causando logouts inesperados.
        // Ahora el nuevo SW espera hasta que el usuario recargue manualmente.
        skipWaiting: false,
        clientsClaim: false,
        cleanupOutdatedCaches: true,
        // Cache de archivos estáticos
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Límite de cache por archivo (5MB — suficiente para vendor chunks post-splitting)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        // Estrategias de cache para API
        runtimeCaching: [
          {
            // MB-TENANT: API NUNCA se cachea en SW para evitar fuga cross-tenant.
            // React Query maneja cache client-side con tenant_id en la key.
            urlPattern: /^https?:\/\/.*\/api\/.*$/i,
            handler: 'NetworkOnly',
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
          },
          {
            // Cache de assets del juego SST (CacheFirst)
            urlPattern: /\/game\/.*\.(?:png|json|mp3|ogg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false // Deshabilitado en dev — el SW causa reloads confusos durante desarrollo
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
      // Proxy para archivos media (fotos de perfil, documentos subidos)
      '/media': {
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
          // ===================================================================
          // PERF-1: Manual chunk splitting strategy
          //
          // React-dependent libs are safe to split into own chunks because
          // Rollup deduplicates React — they import from the shared React chunk.
          // The React singleton concern only applies if react/react-dom itself
          // ends up duplicated, which Rollup prevents automatically.
          //
          // Strategy: isolate heavy libraries so they load ONLY when needed
          // by lazy-loaded routes (analytics, workflows, organigrama, etc.)
          // ===================================================================

          // === CHARTS: ECharts (~800 KB, loaded only by analytics/dashboard pages) ===
          if (id.includes('node_modules/echarts') ||
              id.includes('node_modules/zrender')) {
            return 'vendor-echarts'
          }

          // === CHARTS: Recharts (~350 KB, loaded by contexto/stakeholder charts) ===
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/victory-vendor') ||
              id.includes('node_modules/d3-')) {
            return 'vendor-recharts'
          }

          // === 3D GRAPHICS (~680 KB, only login NetworkBackground + rare 3D views) ===
          if (id.includes('node_modules/three/') ||
              id.includes('node_modules/@react-three/')) {
            return 'vendor-3d'
          }

          // === FLOW DIAGRAMS (~250 KB, only organigrama + workflow designer) ===
          if (id.includes('node_modules/@xyflow/') ||
              id.includes('node_modules/@dagrejs/')) {
            return 'vendor-flow'
          }

          // === RICH TEXT EDITOR (~250 KB, loaded when editing rich text) ===
          if (id.includes('node_modules/prosemirror-') ||
              id.includes('node_modules/@prosemirror/') ||
              id.includes('node_modules/@tiptap/')) {
            return 'vendor-editor'
          }

          // === PDF & EXPORT (~370 KB, loaded when exporting/printing) ===
          if (id.includes('node_modules/jspdf') ||
              id.includes('node_modules/html-to-image')) {
            return 'vendor-export'
          }

          // === ANIMATIONS: Framer Motion (~180 KB, used widely but deferrable) ===
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }

          // === DRAG & DROP (~50 KB, only kanban/form builder) ===
          if (id.includes('node_modules/@dnd-kit/')) {
            return 'vendor-dnd'
          }

          // === SENTRY (~150 KB, only loaded in production with DSN) ===
          if (id.includes('node_modules/@sentry/')) {
            return 'vendor-sentry'
          }

          // === DATA TABLE (~50 KB, used by many pages but cacheable separately) ===
          if (id.includes('node_modules/@tanstack/react-table')) {
            return 'vendor-table'
          }

          // === REACT QUERY (~40 KB, core infra — cached long-term) ===
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query'
          }

          // === GAME ENGINE: Phaser (~1MB, loaded only by SST game in Mi Portal) ===
          if (id.includes('node_modules/phaser')) {
            return 'vendor-phaser'
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
    minify: 'esbuild',
    // PERF-1: Upgrade target from es2015 to es2020 — reduces polyfills/downlevel transforms.
    // All modern browsers (Chrome 80+, Firefox 80+, Safari 14+, Edge 80+) support ES2020.
    // This is consistent with tsconfig target and the Vite docs recommendation.
    target: 'es2020',
  },
})
