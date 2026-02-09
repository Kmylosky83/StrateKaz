/**
 * Componente para mostrar el progreso de creación de un tenant
 *
 * Muestra una UI con barra de progreso y estado actual mientras
 * el backend crea el schema PostgreSQL de forma asíncrona.
 */
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Database,
  RefreshCw,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/common';
import { useTenantCreationStatus, useRetryTenantCreation, adminGlobalKeys } from '../hooks/useAdminGlobal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TenantCreationProgressProps {
  tenantId: number;
  tenantName: string;
  onComplete: () => void;
  onClose: () => void;
}

const phaseLabels: Record<string, string> = {
  queued: 'En cola de procesamiento',
  initializing: 'Inicializando',
  creating_schema: 'Creando schema de base de datos',
  running_migrations: 'Aplicando estructura de datos',
  finalizing: 'Finalizando configuración',
  done: 'Completado',
  error: 'Error',
};

export const TenantCreationProgress = ({
  tenantId,
  tenantName,
  onComplete,
  onClose,
}: TenantCreationProgressProps) => {
  const queryClient = useQueryClient();
  const { data: status, isLoading, error } = useTenantCreationStatus(tenantId);
  const retryMutation = useRetryTenantCreation();

  // Detección de progreso estancado
  const [isStale, setIsStale] = useState(false);
  const lastProgressRef = useRef<number>(0);
  const lastChangeRef = useRef<number>(Date.now());

  useEffect(() => {
    const currentProgress = status?.progress ?? 0;
    if (currentProgress !== lastProgressRef.current) {
      lastProgressRef.current = currentProgress;
      lastChangeRef.current = Date.now();
      setIsStale(false);
    }

    // Verificar cada 30 segundos si el progreso lleva >5 min sin cambiar
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastChangeRef.current;
      if (elapsed > 5 * 60 * 1000 && !isStale && status?.status !== 'ready' && status?.status !== 'completed' && status?.status !== 'failed') {
        setIsStale(true);
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [status?.progress, status?.status, isStale]);

  // Cuando el estado cambia a 'ready' o 'completed', notificar
  useEffect(() => {
    if (status?.status === 'ready' || status?.status === 'completed') {
      toast.success(`Empresa "${tenantName}" creada exitosamente`);
      // Invalidar la lista de tenants para que se actualice
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.tenants });
      // Esperar un momento antes de cerrar para que el usuario vea el estado completado
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status?.status, tenantName, onComplete, queryClient]);

  const handleRetry = () => {
    retryMutation.mutate(tenantId);
  };

  const getStatusIcon = () => {
    if (!status) return <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />;

    switch (status.status) {
      case 'ready':
      case 'completed':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />;
    }
  };

  const getProgressColor = () => {
    if (!status) return 'bg-purple-500';
    if (status.status === 'failed') return 'bg-red-500';
    if (status.status === 'ready' || status.status === 'completed') return 'bg-green-500';
    return 'bg-purple-500';
  };

  const progress = status?.progress ?? 0;
  const phase = status?.phase ?? 'queued';
  const message = status?.message ?? 'Iniciando...';
  const isFailed = status?.status === 'failed';
  const isComplete = status?.status === 'ready' || status?.status === 'completed';

  // Usar Portal para renderizar fuera del stacking context de Framer Motion
  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isComplete ? 'Empresa Creada' : isFailed ? 'Error al Crear' : 'Creando Empresa'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{tenantName}</p>
          </div>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700">
            {getStatusIcon()}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">
              {phaseLabels[phase] || phase}
            </span>
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {progress}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getProgressColor()} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Database className="h-4 w-4" />
            <span>{message}</span>
          </div>
          {status?.current_migration && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 ml-6 font-mono">
              {status.current_migration}
            </p>
          )}
        </div>

        {/* Error Message */}
        {isFailed && status?.error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{status.error}</p>
          </div>
        )}

        {/* Stale Warning */}
        {isStale && !isComplete && !isFailed && (
          <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                El progreso no ha avanzado en varios minutos
              </p>
            </div>
            <p className="text-xs text-amber-500 dark:text-amber-500">
              Es posible que la creación se haya detenido. Puedes reintentar o esperar un poco más.
            </p>
          </div>
        )}

        {/* Info Message */}
        {!isComplete && !isFailed && !isStale && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Este proceso puede tomar varios minutos. La empresa estará lista cuando
              la barra de progreso llegue al 100%.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {(isFailed || isStale) && (
            <Button
              variant="primary"
              onClick={handleRetry}
              disabled={retryMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
              Reintentar
            </Button>
          )}

          {(isComplete || isFailed) && (
            <Button variant="outline" onClick={onClose}>
              {isComplete ? 'Cerrar' : 'Cancelar'}
            </Button>
          )}

          {!isComplete && !isFailed && !isStale && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Puedes cerrar esta ventana. La creación continuará en segundo plano.
            </p>
          )}
        </div>

        {/* Duration info */}
        {status?.duration_seconds && isComplete && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            Completado en {Math.round(status.duration_seconds)} segundos
          </p>
        )}
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TenantCreationProgress;
