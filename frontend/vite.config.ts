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
      // El manifest.json se genera dinámicamente desde /api/core/branding/manifest/
      // Solo definimos valores mínimos de fallback aquí
      manifest: false, // Deshabilitamos manifest estático - se carga dinámicamente
      injectManifest: {
        injectionPoint: undefined // No inyectar manifest
      },
      workbox: {
        // Cache de archivos estáticos
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Aumentar límite para vendor chunk grande (3MB)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

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
          // Estrategia Simplificada: Un solo bloque "vendor" para todas las librerías
          // Esto elimina los errores de "undefined" por orden de carga incorrecto
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Aumentar el límite de advertencia de chunk size
    chunkSizeWarningLimit: 800,

    // Optimizaciones adicionales
    minify: 'esbuild', // Usar esbuild (más rápido que terser)
    target: 'es2015', // Compatibilidad con navegadores modernos
  },
})
