import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import pkg from './package.json'

// https://vitejs.dev/config/
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
  // Configuración de esbuild para minificación en producción
  esbuild: {
    drop: ['console', 'debugger'], // Eliminar console.log y debugger en producción
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // === CORE FRAMEWORK (siempre necesario) ===
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react'
          }

          // === STATE & DATA (crítico para toda la app) ===
          if (id.includes('node_modules/@tanstack/') ||
              id.includes('node_modules/zustand/') ||
              id.includes('node_modules/axios/')) {
            return 'vendor-state'
          }

          // === CHARTS & ANALYTICS (pesado, solo en dashboards) ===
          if (id.includes('node_modules/echarts') ||
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/react-gauge-chart') ||
              id.includes('node_modules/simple-statistics') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'vendor-analytics'
          }

          // === 3D GRAPHICS (muy pesado, solo NetworkBackground) ===
          if (id.includes('node_modules/three') ||
              id.includes('node_modules/@react-three/')) {
            return 'vendor-3d'
          }

          // === GRAPHS & DIAGRAMS (organigrama, mapa, workflow) ===
          if (id.includes('node_modules/@xyflow/') ||
              id.includes('node_modules/@dagrejs/')) {
            return 'vendor-graphs'
          }

          // === PDF & EXPORT ===
          if (id.includes('node_modules/jspdf') ||
              id.includes('node_modules/html-to-image') ||
              id.includes('node_modules/react-to-print')) {
            return 'vendor-export'
          }

          // === RICH TEXT EDITOR ===
          if (id.includes('node_modules/@tiptap/') ||
              id.includes('node_modules/prosemirror-') ||
              id.includes('node_modules/@prosemirror/')) {
            return 'vendor-editor'
          }

          // === FORMS & VALIDATION ===
          if (id.includes('node_modules/react-hook-form/') ||
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod/')) {
            return 'vendor-forms'
          }

          // === UI COMPONENTS & UTILITIES ===
          if (id.includes('node_modules/@headlessui/') ||
              id.includes('node_modules/@heroicons/') ||
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/sonner') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/tailwind-merge') ||
              id.includes('node_modules/date-fns') ||
              id.includes('node_modules/@dnd-kit/') ||
              id.includes('node_modules/@fontsource/') ||
              id.includes('node_modules/react-signature-canvas') ||
              id.includes('node_modules/qrcode')) {
            return 'vendor-ui'
          }

          // === RESTO de node_modules ===
          if (id.includes('node_modules')) {
            return 'vendor-misc'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    minify: 'esbuild',
    target: 'es2015',
  },
})
