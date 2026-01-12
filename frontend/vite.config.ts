import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo-dark.png', 'logo-light.png', 'pwa-icon.svg'],
      manifest: {
        name: 'StrateKaz - Sistema de Gestión Integral',
        short_name: 'StrateKaz',
        description: 'ERP de Consultoría 4.0 - SST, PESV, ISO, Calidad',
        theme_color: '#ec268f',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            url: '/dashboard',
            icons: [{ src: 'pwa-icon.svg', sizes: 'any' }]
          },
          {
            name: 'HSEQ',
            short_name: 'HSEQ',
            url: '/hseq',
            icons: [{ src: 'pwa-icon.svg', sizes: 'any' }]
          }
        ]
      },
      workbox: {
        // Cache de archivos estáticos
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

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
          // ============================================================
          // CRÍTICO: React Core + State Management
          // TODAS las librerías que usan createContext deben estar aquí
          // para evitar "Cannot read properties of undefined (reading 'createContext')"
          // ============================================================
          if (id.includes('node_modules/react/') && !id.includes('node_modules/react-')) {
            return 'vendor-react-core';
          }
          if (id.includes('node_modules/react-dom/')) {
            return 'vendor-react-core';
          }
          if (id.includes('node_modules/scheduler/')) {
            return 'vendor-react-core';
          }
          // State management - DEBE estar con React core porque usa createContext
          if (id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/zustand')) {
            return 'vendor-react-core';
          }
          // Charts - DEBE estar con React core porque usa createContext
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3') ||
              id.includes('node_modules/@xyflow') ||
              id.includes('node_modules/@dagrejs')) {
            return 'vendor-react-core';
          }

          // ============================================================
          // React Router (usa React pero carga después de core)
          // ============================================================
          if (id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run')) {
            return 'vendor-react-router';
          }

          // Forms & Validation
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }

          // UI Libraries (pueden usar context)
          if (id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/@headlessui')) {
            return 'vendor-ui';
          }

          // Tables
          if (id.includes('node_modules/@tanstack/react-table')) {
            return 'vendor-tables';
          }

          // Icons - librería grande, separar
          if (id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/react-icons')) {
            return 'vendor-icons';
          }

          // ============================================================
          // Utilities (no dependen de React context)
          // ============================================================

          // HTTP client
          if (id.includes('node_modules/axios')) {
            return 'vendor-http';
          }

          // Utilities
          if (id.includes('node_modules/date-fns') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'vendor-utils';
          }

          // Toast/Notifications (Sonner)
          if (id.includes('node_modules/sonner')) {
            return 'vendor-notifications';
          }

          // PDF/Print utilities
          if (id.includes('node_modules/html-to-image') ||
              id.includes('node_modules/jspdf') ||
              id.includes('node_modules/react-to-print')) {
            return 'vendor-pdf';
          }

          // ============================================================
          // Feature modules (código de aplicación)
          // Subdivididos para optimizar carga inicial
          // ============================================================

          // Gestión Estratégica - subdividido por páginas (módulo más grande)
          if (id.includes('src/features/gestion-estrategica/pages/ConfiguracionPage') ||
              id.includes('src/features/gestion-estrategica/components/configuracion')) {
            return 'feature-ge-configuracion';
          }
          if (id.includes('src/features/gestion-estrategica/pages/IdentidadPage') ||
              id.includes('src/features/gestion-estrategica/components/identidad')) {
            return 'feature-ge-identidad';
          }
          if (id.includes('src/features/gestion-estrategica/pages/OrganizacionPage') ||
              id.includes('src/features/gestion-estrategica/components/organizacion')) {
            return 'feature-ge-organizacion';
          }
          if (id.includes('src/features/gestion-estrategica/pages/PlaneacionPage') ||
              id.includes('src/features/gestion-estrategica/components/planeacion')) {
            return 'feature-ge-planeacion';
          }
          if (id.includes('src/features/gestion-estrategica/pages/ProyectosPage') ||
              id.includes('src/features/gestion-estrategica/components/proyectos')) {
            return 'feature-ge-proyectos';
          }
          if (id.includes('src/features/gestion-estrategica/pages/RevisionDireccionPage') ||
              id.includes('src/features/gestion-estrategica/components/revision')) {
            return 'feature-ge-revision';
          }
          // Shared components y utilities de gestion-estrategica
          if (id.includes('src/features/gestion-estrategica')) {
            return 'feature-ge-shared';
          }

          // HSEQ - subdividido
          if (id.includes('src/features/hseq/pages') ||
              id.includes('src/features/hseq/components')) {
            return 'feature-hseq-pages';
          }
          if (id.includes('src/features/hseq')) {
            return 'feature-hseq-shared';
          }

          // Otros features (más pequeños, no necesitan subdivisión)
          if (id.includes('src/features/riesgos')) {
            return 'feature-riesgos';
          }
          if (id.includes('src/features/workflows')) {
            return 'feature-workflows';
          }
          if (id.includes('src/features/sales-crm')) {
            return 'feature-sales-crm';
          }
          if (id.includes('src/features/analytics')) {
            return 'feature-analytics';
          }
          if (id.includes('src/features/audit-system')) {
            return 'feature-audit-system';
          }
          if (id.includes('src/features/accounting')) {
            return 'feature-accounting';
          }
          if (id.includes('src/features/admin-finance')) {
            return 'feature-admin-finance';
          }
          if (id.includes('src/features/talent-hub')) {
            return 'feature-talent-hub';
          }

          // Supply chain (si existe)
          if (id.includes('src/features/supply-chain')) {
            return 'feature-supply-chain';
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
