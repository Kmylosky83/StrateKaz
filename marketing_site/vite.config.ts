import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
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
      // PWA Disabled for stability
      // ...(env.VITE_ENABLE_PWA === 'true'
      //   ? [
      //     VitePWA({
      //       registerType: 'autoUpdate',
      //       includeAssets: ['favicon.ico', 'logo.svg'],
      //       injectRegister: 'auto',
      //       manifest: {
      //         name: 'StrateKaz | Consultoría 4.0',
      //         short_name: 'StrateKaz',
      //         id: `stratekaz-pwa-${Date.now()}`,
      //         description:
      //           'Consultoría estratégica + Plataforma de Gestión Integral que busca modernizar la gestión empresarial con herramientas de vanguardia.',
      //         theme_color: '#000000',
      //         background_color: '#000000',
      //         display: 'standalone',
      //         orientation: 'portrait',
      //         scope: '/',
      //         start_url: `/?v=${Date.now()}`,
      //         version: `1.0.${Date.now()}`,
      //         icons: [
      //           {
      //             src: 'icons/pwa-64x64.png',
      //             sizes: '64x64',
      //             type: 'image/png',
      //           },
      //           {
      //             src: 'icons/apple-touch-icon-180x180.png',
      //             sizes: '180x180',
      //             type: 'image/png',
      //           },
      //           {
      //             src: 'icons/pwa-192x192.png',
      //             sizes: '192x192',
      //             type: 'image/png',
      //           },
      //           {
      //             src: 'icons/pwa-512x512.png',
      //             sizes: '512x512',
      //             type: 'image/png',
      //           },
      //           {
      //             src: 'icons/maskable-icon-512x512.png',
      //             sizes: '512x512',
      //             type: 'image/png',
      //             purpose: 'maskable',
      //           },
      //           {
      //             src: 'icons/apple-touch-icon-152x152.png',
      //             sizes: '152x152',
      //             type: 'image/png',
      //           },
      //           {
      //             src: 'icons/apple-touch-icon-144x144.png',
      //             sizes: '144x144',
      //             type: 'image/png',
      //           },
      //           {
      //             src: 'icons/apple-touch-icon-120x120.png',
      //             sizes: '120x120',
      //             type: 'image/png',
      //           },
      //           {
      //             src: 'icons/apple-touch-icon-76x76.png',
      //             sizes: '76x76',
      //             type: 'image/png',
      //           },
      //         ],
      //       },
      //       workbox: {
      //         globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      //         cleanupOutdatedCaches: true,
      //         clientsClaim: true,
      //         skipWaiting: true,
      //         maximumFileSizeToCacheInBytes: 5000000,
      //         navigateFallbackDenylist: [/^\/api\//],
      //         // Enable cache busting with build hash
      //         dontCacheBustURLsMatching: /\-[a-f0-9]{8}\./,
      //         // Force update on new version
      //         runtimeCaching: [
      //           {
      //             urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      //             handler: 'CacheFirst',
      //             options: {
      //               cacheName: 'google-fonts-cache',
      //               expiration: {
      //                 maxEntries: 10,
      //                 maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      //               },
      //               cacheableResponse: {
      //                 statuses: [0, 200],
      //               },
      //             },
      //           },
      //           {
      //             urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
      //             handler: 'CacheFirst',
      //             options: {
      //               cacheName: 'images-cache',
      //               expiration: {
      //                 maxEntries: 60,
      //                 maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      //               },
      //             },
      //           },
      //         ],
      //       },
      //       devOptions: {
      //         enabled: false,
      //       },
      //     }),
      //   ]
      //   : []),
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
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    // esbuild options for production
    // keepNames & minifyIdentifiers: false = FIX for @react-three/fiber v9 minification bug
    // See: https://github.com/pmndrs/react-three-fiber/issues/3494
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      keepNames: true,              // Preserve function/class names (required for Three.js)
      minifyIdentifiers: false,     // Don't mangle variable names (fixes 'S' undefined error)
    },
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV || mode),
    },
  };
});
