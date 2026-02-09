/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    env: {
      VITE_ENV: 'test',
      VITE_API_URL: 'https://api.stratekaz.com',
      VITE_PUBLIC_URL: 'https://stratekaz.com',
      VITE_ENABLE_PWA: 'true',
      VITE_ENABLE_ANALYTICS: 'false',
      VITE_ENABLE_CHAT: 'false',
    },
    // Include coverage reporting
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'dev-dist/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/vite-env.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
});
