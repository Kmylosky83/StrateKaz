import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import App from './App';
import '@styles/globals.css';

// Initialize Sentry for error tracking (Marketing Site)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN_MARKETING || import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;
const SENTRY_RELEASE = import.meta.env.VITE_SENTRY_RELEASE || `stratekaz-marketing@${import.meta.env.VITE_APP_VERSION || '5.3.0'}`;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    integrations: [
      // Browser Tracing for performance monitoring
      Sentry.browserTracingIntegration(),

      // Session Replay (lighter sampling for marketing)
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Trace Propagation Targets (moved to root level)
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/stratekaz\.com/,
      /^https:\/\/www\.stratekaz\.com/,
    ],

    // Performance Monitoring (lighter sampling for marketing site)
    tracesSampleRate: import.meta.env.PROD ? 0.05 : 1.0, // 5% in production

    // Session Replay Sampling (lower for marketing)
    replaysSessionSampleRate: 0.05, // 5% of normal sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Environment and Release
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,

    // Error filtering for marketing site
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'fb_xd_fragment',
      // Network errors
      'Non-Error promise rejection captured',
      'Failed to fetch',
      'NetworkError',
      // Service worker errors (already handled)
      'workbox',
      'precache',
    ],

    beforeSend(event, hint) {
      // Filter out service worker cleanup messages
      const error = hint.originalException;
      if (error instanceof Error) {
        if (error.message.includes('workbox') ||
            error.message.includes('service worker')) {
          return null;
        }
      }
      return event;
    },

    // Performance
    maxBreadcrumbs: 30, // Lower for marketing
    attachStacktrace: true,
  });

  // Set initial context
  Sentry.setTag('application', 'marketing');
  Sentry.setTag('version', import.meta.env.VITE_APP_VERSION || '5.3.0');
}

// Aggressive Service Worker cleanup on every page load
const aggressiveCleanup = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      // Check if we have OLD service workers (workbox-precache)
      for (const registration of registrations) {
        const hasOldCache = await caches.has(
          'workbox-precache-v2-https://stratekaz.com/'
        );

        if (hasOldCache) {
          console.warn(
            '[React Cleanup] Detected OLD service worker - removing...'
          );
          await registration.unregister();

          // Delete all old caches
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            if (
              cacheName.includes('workbox') ||
              cacheName.includes('precache')
            ) {
              await caches.delete(cacheName);
              console.log('[React Cleanup] Deleted old cache:', cacheName);
            }
          }

          // Force reload ONCE
          if (!sessionStorage.getItem('cleanup_reload_done')) {
            sessionStorage.setItem('cleanup_reload_done', 'true');
            console.log('[React Cleanup] Reloading to apply cleanup...');
            window.location.reload();
            return;
          }
        } else {
          // Normal update check for clean service workers
          await registration.update();
        }
      }
    } catch (error) {
      console.error('[React Cleanup] Failed:', error);
    }
  }
};

// Run cleanup IMMEDIATELY
aggressiveCleanup();

// Hide loading spinner once app is ready
const hideLoader = () => {
  const loader = document.querySelector('.app-loader');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.remove();
    }, 300);
  }
};

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Hide loader after React is fully rendered
// Use multiple strategies to ensure it always hides
if (document.readyState === 'complete') {
  setTimeout(hideLoader, 100);
} else {
  window.addEventListener('load', () => {
    setTimeout(hideLoader, 100);
  });
}

// Fallback: force hide after 5 seconds if still showing
setTimeout(() => {
  const loader = document.querySelector('.app-loader');
  if (loader && !loader.classList.contains('fade-out')) {
    console.warn('Loader forcefully hidden after timeout');
    hideLoader();
  }
}, 5000);
