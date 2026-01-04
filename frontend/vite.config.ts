import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
          // CRÍTICO: React SOLO (sin dependencias externas)
          // Se carga primero para evitar "Cannot read properties of undefined (reading 'createContext')"
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

          // ============================================================
          // React ecosystem (usa React pero no crítico para el arranque)
          // ============================================================
          if (id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run')) {
            return 'vendor-react-router';
          }

          // State management
          if (id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/zustand')) {
            return 'vendor-state';
          }

          // Forms & Validation
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }

          // ============================================================
          // Librerías que usan React context (DEBEN cargarse después de React)
          // ============================================================

          // Charts & Visualization (usa createContext internamente)
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/@xyflow') ||
              id.includes('node_modules/@dagrejs')) {
            return 'vendor-charts';
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

          // Toast/Notifications
          if (id.includes('node_modules/react-hot-toast') ||
              id.includes('node_modules/sonner')) {
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
          // ============================================================
          if (id.includes('src/features/gestion-estrategica')) {
            return 'feature-gestion-estrategica';
          }
          if (id.includes('src/features/hseq')) {
            return 'feature-hseq';
          }
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
