import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@styles/globals.css';

// Hide loading spinner once app is ready
const hideLoader = () => {
  const loader = document.querySelector('.app-loader');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 300);
  }
};

// Create root and render app FIRST (critical path)
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Hide loader after React is fully rendered
if (document.readyState === 'complete') {
  setTimeout(hideLoader, 100);
} else {
  window.addEventListener('load', () => setTimeout(hideLoader, 100));
}

// Fallback: force hide after 3 seconds
setTimeout(() => {
  const loader = document.querySelector('.app-loader');
  if (loader && !loader.classList.contains('fade-out')) {
    hideLoader();
  }
}, 3000);

// === DEFERRED: Initialize Sentry after first paint ===
const initSentry = () => {
  const DSN = import.meta.env.VITE_SENTRY_DSN_MARKETING || import.meta.env.VITE_SENTRY_DSN;
  if (!DSN) return;

  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: DSN,
      integrations: [Sentry.browserTracingIntegration()],
      // No replayIntegration — minimal value for 3-page marketing site
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/stratekaz\.com/,
        /^https:\/\/www\.stratekaz\.com/,
      ],
      tracesSampleRate: import.meta.env.PROD ? 0.05 : 1.0,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
      release: import.meta.env.VITE_SENTRY_RELEASE || `stratekaz-marketing@${import.meta.env.VITE_APP_VERSION || '5.3.0'}`,
      ignoreErrors: [
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'fb_xd_fragment',
        'Non-Error promise rejection captured',
        'Failed to fetch',
        'NetworkError',
        'workbox',
        'precache',
      ],
      beforeSend(event, hint) {
        const error = hint.originalException;
        if (error instanceof Error) {
          if (error.message.includes('workbox') || error.message.includes('service worker')) {
            return null;
          }
        }
        return event;
      },
      maxBreadcrumbs: 30,
      attachStacktrace: true,
    });

    Sentry.setTag('application', 'marketing');
    Sentry.setTag('version', import.meta.env.VITE_APP_VERSION || '5.3.0');
  });
};

// === DEFERRED: Clean up old service workers (legacy PWA) ===
const cleanupServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const hasOldCache = await caches.has('workbox-precache-v2-https://stratekaz.com/');
      if (hasOldCache) {
        await registration.unregister();
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('workbox') || cacheName.includes('precache')) {
            await caches.delete(cacheName);
          }
        }
      }
    }
  } catch {
    // Silent fail — cleanup is best-effort
  }
};

// Run deferred tasks after idle
if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(() => {
    initSentry();
    cleanupServiceWorkers();
  }, { timeout: 3000 });
} else {
  setTimeout(() => {
    initSentry();
    cleanupServiceWorkers();
  }, 2000);
}
