import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';

// PERF-1: Lazy-load Sentry so it doesn't block initial render (~150 KB)
// Only loads in production when DSN is configured
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.5,
      enabled: import.meta.env.PROD,
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
        <Toaster position="top-right" richColors closeButton duration={4000} theme="system" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// PWA: Forzar recarga cuando el Service Worker se actualiza con nuevo build
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
