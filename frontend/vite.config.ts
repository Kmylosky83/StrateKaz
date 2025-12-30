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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks - React core
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }

          // Forms & Validation
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }

          // Icons - separar en su propio chunk
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }

          // UI Libraries
          if (id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/@headlessui') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'vendor-ui';
          }

          // Data fetching & state
          if (id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/zustand') ||
              id.includes('node_modules/axios')) {
            return 'vendor-data';
          }

          // Charts & Visualization
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/@xyflow') ||
              id.includes('node_modules/@dagrejs')) {
            return 'vendor-charts';
          }

          // Tables
          if (id.includes('node_modules/@tanstack/react-table')) {
            return 'vendor-tables';
          }

          // Utilities
          if (id.includes('node_modules/date-fns') ||
              id.includes('node_modules/react-hot-toast') ||
              id.includes('node_modules/sonner') ||
              id.includes('node_modules/html-to-image') ||
              id.includes('node_modules/jspdf') ||
              id.includes('node_modules/react-to-print')) {
            return 'vendor-utils';
          }

          // Feature modules
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
    chunkSizeWarningLimit: 600,
  },
})
