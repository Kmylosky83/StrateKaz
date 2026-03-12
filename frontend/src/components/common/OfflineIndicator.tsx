/**
 * OfflineIndicator Component
 *
 * Muestra un indicador visual cuando la aplicación está offline.
 * Se integra con la PWA para mostrar el estado de conexión.
 */
import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface OfflineIndicatorProps {
  /** Posición del indicador */
  position?: 'top' | 'bottom';
  /** Mostrar botón de reintentar */
  showRetry?: boolean;
  /** Callback cuando se recupera la conexión */
  onOnline?: () => void;
  /** Callback cuando se pierde la conexión */
  onOffline?: () => void;
  /** Clases CSS adicionales */
  className?: string;
}

export function OfflineIndicator({
  position = 'bottom',
  showRetry = true,
  onOnline,
  onOffline,
  className,
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      onOnline?.();

      // Ocultar mensaje de reconectado después de 3 segundos
      setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      // Intentar hacer una petición para verificar conexión real
      const response = await fetch('/api/health/', {
        method: 'HEAD',
        cache: 'no-store',
      });

      if (response.ok) {
        setIsOnline(true);
        setShowReconnected(true);
        onOnline?.();
        setTimeout(() => setShowReconnected(false), 3000);
      }
    } catch {
      // Aún sin conexión
    } finally {
      setIsRetrying(false);
    }
  };

  const positionClasses = {
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
  };

  return (
    <AnimatePresence>
      {(!isOnline || showReconnected) && (
        <motion.div
          initial={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn('fixed z-50 px-4 py-2', positionClasses[position], className)}
        >
          <div
            className={cn(
              'mx-auto max-w-md rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm',
              'flex items-center justify-between gap-3',
              !isOnline ? 'bg-amber-500/90 text-white' : 'bg-emerald-500/90 text-white'
            )}
          >
            <div className="flex items-center gap-3">
              {!isOnline ? (
                <WifiOff className="h-5 w-5 flex-shrink-0" />
              ) : (
                <Wifi className="h-5 w-5 flex-shrink-0" />
              )}

              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {!isOnline ? 'Sin conexión' : 'Conexión restaurada'}
                </span>
                {!isOnline && (
                  <span className="text-xs opacity-90">
                    Los cambios se sincronizarán al reconectar
                  </span>
                )}
              </div>
            </div>

            {!isOnline && showRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className={cn(
                  'flex items-center gap-1 rounded-md px-3 py-1.5',
                  'bg-white/20 text-sm font-medium',
                  'hover:bg-white/30 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <RefreshCw className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
                <span className="hidden sm:inline">Reintentar</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook para detectar estado de conexión
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default OfflineIndicator;
