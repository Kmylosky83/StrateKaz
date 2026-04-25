import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';

// H-PROD-04: Forzar reload cuando Vite falla al cargar un chunk dinámico.
// Ocurre cuando el usuario tiene sesión activa durante un deploy: el HTML
// referencia chunks del build anterior que ya no existen en el servidor.
// vite:preloadError es el evento estándar de Vite 5.x para este escenario.
// El SW de PWA maneja el caso "app abierta + update disponible" (ver abajo),
// pero este handler cubre el caso donde el chunk falla ANTES de que el SW
// detecte la actualización.
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

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
// Estrategia "Prompt to reload" (Gmail/Slack/VS Code Web):
// - skipWaiting: false → SW viejo sigue activo, no interfiere con requests
// - Detectamos SW nuevo en estado "waiting" y mostramos toast persistente
// - El usuario recarga cuando quiera → nuevo SW toma control → bundle nuevo
// - NUNCA se pierde sesión ni se corrompen headers durante deploys
if ('serviceWorker' in navigator) {
  let hasNotified = false;

  const showUpdateToast = () => {
    if (hasNotified) return;
    hasNotified = true;

    import('sonner').then(({ toast }) => {
      const primaryRgb =
        getComputedStyle(document.documentElement).getPropertyValue('--color-primary-600').trim() ||
        '59, 130, 246';

      toast('Actualización disponible', {
        description:
          'Hay una nueva versión de la aplicación. Recarga cuando estés listo para aplicar los cambios.',
        duration: Infinity,
        action: {
          label: 'Recargar ahora',
          onClick: () => window.location.reload(),
        },
        dismissible: true,
        style: {
          borderLeft: `4px solid rgb(${primaryRgb})`,
        },
        actionButtonStyle: {
          backgroundColor: `rgb(${primaryRgb})`,
          color: '#ffffff',
          borderRadius: '6px',
          fontWeight: '500',
        },
      });
    });
  };

  // Detectar nuevo SW en estado "waiting" (skipWaiting: false)
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg) return;

    // Ya hay un SW esperando activación
    if (reg.waiting) {
      showUpdateToast();
      return;
    }

    // Escuchar cuando un nuevo SW termine de instalarse
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      if (!newSW) return;

      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          // Nuevo SW instalado pero el viejo sigue activo → mostrar toast
          showUpdateToast();
        }
      });
    });
  });

  // Fallback: si por alguna razón el controllerchange se dispara (edge case)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showUpdateToast();
  });
}
