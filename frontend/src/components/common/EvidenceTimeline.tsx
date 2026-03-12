/**
 * EvidenceTimeline - Timeline del historial de una evidencia (cadena de custodia).
 *
 * Uso:
 * ```tsx
 * <EvidenceTimeline evidenciaId={evidencia.id} />
 * ```
 */
import {
  Upload,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Archive,
  Clock,
  Edit3,
  User,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Spinner } from './Spinner';
import { useHistorialEvidencia } from '@/features/cumplimiento/hooks/useEvidencias';
import type { HistorialEvidencia } from '@/features/cumplimiento/types/evidencia.types';

export interface EvidenceTimelineProps {
  /** ID de la evidencia */
  evidenciaId: number | null;
  /** Clases adicionales */
  className?: string;
}

const ACCION_CONFIG: Record<string, { icon: typeof Upload; color: string; bg: string }> = {
  CREADA: { icon: Upload, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  APROBADA: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  RECHAZADA: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  RESUBIDA: {
    icon: RotateCcw,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  ARCHIVADA: { icon: Archive, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700' },
  VENCIDA: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  METADATA_ACTUALIZADA: {
    icon: Edit3,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
};

const ACCION_LABELS: Record<string, string> = {
  CREADA: 'Evidencia creada',
  APROBADA: 'Evidencia aprobada',
  RECHAZADA: 'Evidencia rechazada',
  RESUBIDA: 'Evidencia re-subida',
  ARCHIVADA: 'Evidencia archivada',
  VENCIDA: 'Marcada como vencida',
  METADATA_ACTUALIZADA: 'Metadata actualizada',
};

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EvidenceTimeline({ evidenciaId, className }: EvidenceTimelineProps) {
  const { data: historial, isLoading } = useHistorialEvidencia(evidenciaId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!historial?.length) {
    return (
      <p className={cn('text-sm text-gray-500 italic py-4', className)}>Sin historial registrado</p>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-4">
        {(historial as HistorialEvidencia[]).map((entry, _index) => {
          const config = ACCION_CONFIG[entry.accion] || ACCION_CONFIG.CREADA;
          const Icon = config.icon;
          const label = ACCION_LABELS[entry.accion] || entry.accion;

          return (
            <div key={entry.id} className="relative flex gap-3 pl-1">
              {/* Icon dot */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  config.bg
                )}
              >
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {label}
                  </span>
                  <span className="text-xs text-gray-500">{formatDateTime(entry.fecha)}</span>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{entry.usuario_nombre}</span>
                </div>

                {entry.comentario && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                    {entry.comentario}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
