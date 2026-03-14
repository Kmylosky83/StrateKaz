import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Detecta errores de carga de chunks (post-deploy con hashes nuevos).
 * Patrones comunes en Vite/Webpack cuando un chunk ya no existe en el servidor.
 */
function isChunkLoadError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes('loading chunk') ||
    msg.includes('dynamically imported module') ||
    msg.includes('importing a module script') ||
    msg.includes('failed to fetch') ||
    error.name === 'ChunkLoadError'
  );
}

/**
 * Error Boundary global para capturar errores de React.
 * Evita pantallas blancas y muestra una UI de fallback.
 *
 * CHUNK DETECTION: Detecta errores de chunks obsoletos (post-deploy) y
 * muestra un mensaje específico invitando al usuario a recargar, sin
 * auto-reloads que puedan causar loops.
 *
 * PERF-1: Sentry is dynamically imported to avoid pulling ~150 KB into the
 * initial bundle. captureException is called asynchronously when an error occurs.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    console.error('Error capturado por ErrorBoundary:', error, errorInfo);

    // Lazy-load Sentry only when an error actually occurs
    import('@sentry/react')
      .then((Sentry) => {
        Sentry.captureException(error, {
          extra: {
            componentStack: errorInfo?.componentStack,
            isChunkError: isChunkLoadError(error),
          },
        });
      })
      .catch(() => {
        // Sentry not available (e.g., dev environment) — silently ignore
      });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = (): void => {
    // Limpiar caches del SW antes de recargar para forzar chunks nuevos
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          isChunkError={!!this.state.error && isChunkLoadError(this.state.error)}
          onReset={this.handleReset}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  isChunkError: boolean;
  onReset: () => void;
  onReload: () => void;
}

/**
 * UI de fallback cuando ocurre un error.
 * Muestra mensaje diferenciado para errores de chunk (post-deploy).
 */
function ErrorFallback({
  error,
  isChunkError,
  onReset,
  onReload,
}: ErrorFallbackProps): JSX.Element {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {/* Icono */}
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
            isChunkError ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-red-100 dark:bg-red-900/20'
          }`}
        >
          {isChunkError ? (
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>

        {/* Mensaje diferenciado */}
        {isChunkError ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nueva versión disponible
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Se ha actualizado el sistema. Recarga la página para usar la versión más reciente.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Algo salió mal
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al
              inicio.
            </p>
          </>
        )}

        {/* Detalles del error (solo en desarrollo) */}
        {isDev && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Ver detalles técnicos
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isChunkError && (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Intentar de nuevo
            </button>
          )}
          <button
            onClick={onReload}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Recargar página
          </button>
        </div>

        {/* Link al inicio */}
        {!isChunkError && (
          <a
            href="/"
            className="inline-block mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Volver al inicio
          </a>
        )}
      </div>
    </div>
  );
}

export default ErrorBoundary;
