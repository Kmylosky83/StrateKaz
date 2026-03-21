import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      // PWA disabled — marketing site no necesita offline/instalación.
      // PWA se implementará en app.stratekaz.com (el software real).
      // Sentry plugin for source maps upload (only in production)
      ...(isProduction && env.SENTRY_AUTH_TOKEN
        ? [
          sentryVitePlugin({
            org: env.SENTRY_ORG || 'stratekaz',
            project: env.SENTRY_PROJECT_MARKETING || 'marketing',
            authToken: env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
              assets: './dist/assets/**',
              filesToDeleteAfterUpload: ['./dist/assets/**/*.map'],
            },
            release: {
              name: env.VITE_SENTRY_RELEASE || `stratekaz-marketing@5.3.0`,
              cleanArtifacts: true,
              setCommits: {
                auto: true,
              },
            },
          }),
        ]
        : []),
    ],
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
    server: {
      port: 3006,
      host: true,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: isProduction ? 'hidden' : true, // Hidden source maps for Sentry in production
      minify: isProduction ? 'esbuild' : false, // Use esbuild (safer with React than terser)
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks: {
            'three-vendor': ['three', '@react-three/fiber'],
            'framer': ['framer-motion'],
            'sentry': ['@sentry/react'],
          },
        },
      },
    },
    // esbuild options for production
    // Three.js is now in a separate lazy chunk, so we can enable full minification
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      keepNames: true,              // Still needed for Three.js chunk
      target: 'es2020',            // Modern browsers, avoid unnecessary polyfills
    },
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV || mode),
    },
  };
});
