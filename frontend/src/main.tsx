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

// PWA: Notificar al usuario cuando hay una actualización disponible.
// NUNCA forzar reload automático — interrumpe trabajo en curso y causa logouts inesperados.
// El usuario decide cuándo recargar via toast persistente.
if ('serviceWorker' in navigator) {
  let hasNotified = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Prevenir múltiples notificaciones si el evento se dispara más de una vez
    if (hasNotified) return;
    hasNotified = true;

    // Importar toast dinámicamente para no bloquear el bundle inicial
    import('sonner').then(({ toast }) => {
      toast.info('Actualización disponible', {
        description:
          'Hay una nueva versión de la aplicación. Recarga cuando estés listo para aplicar los cambios.',
        duration: Infinity, // Persistente hasta que el usuario actúe
        action: {
          label: 'Recargar ahora',
          onClick: () => window.location.reload(),
        },
        dismissible: true,
      });
    });
  });
}
