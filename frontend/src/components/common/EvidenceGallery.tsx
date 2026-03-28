/**
 * EvidenceGallery - Galería/lista de evidencias de una entidad.
 *
 * Uso:
 * ```tsx
 * <EvidenceGallery
 *   entityType="calidad.noconformidad"
 *   entityId={nc.id}
 *   layout="grid"
 *   showActions
 * />
 * ```
 */
import { useState } from 'react';
import {
  Download,
  CheckCircle2,
  XCircle,
  Archive,
  Trash2,
  Eye,
  FileText,
  Image as ImageIcon,
  File,
  Film,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from './Badge';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';
import { ConfirmDialog } from './ConfirmDialog';
import { StatusBadge } from './StatusBadge';
import { Dropdown } from './Dropdown';
import {
  useEvidenciasPorEntidad,
  useAprobarEvidencia,
  useRechazarEvidencia,
  useArchivarEvidencia,
  useEliminarEvidencia,
} from '@/features/cumplimiento/hooks/useEvidencias';
import type { Evidencia, EstadoEvidencia } from '@/features/cumplimiento/types/evidencia.types';

export interface EvidenceGalleryProps {
  /** Tipo de entidad: "app_label.model" */
  entityType: string;
  /** ID de la entidad */
  entityId: number;
  /** Layout de la galería */
  layout?: 'grid' | 'list' | 'compact';
  /** Mostrar acciones (aprobar, rechazar, etc.) */
  showActions?: boolean;
  /** Mensaje cuando no hay evidencias */
  emptyMessage?: string;
  /** Clases adicionales */
  className?: string;
}

const ESTADO_BADGE_MAP: Record<
  EstadoEvidencia,
  { variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary' }
> = {
  PENDIENTE: { variant: 'warning' },
  APROBADA: { variant: 'success' },
  RECHAZADA: { variant: 'danger' },
  VENCIDA: { variant: 'info' },
  ARCHIVADA: { variant: 'secondary' },
};

function getFileIcon(mimeType: string, className = 'h-8 w-8') {
  if (mimeType.startsWith('image/'))
    return <ImageIcon className={cn(className, 'text-blue-500')} />;
  if (mimeType === 'application/pdf') return <FileText className={cn(className, 'text-red-500')} />;
  if (mimeType.startsWith('video/')) return <Film className={cn(className, 'text-purple-500')} />;
  return <File className={cn(className, 'text-gray-500')} />;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function EvidenceGallery({
  entityType,
  entityId,
  layout = 'grid',
  showActions = false,
  emptyMessage = 'No hay evidencias registradas',
  className,
}: EvidenceGalleryProps) {
  const { data: evidencias, isLoading } = useEvidenciasPorEntidad(entityType, entityId);
  const aprobar = useAprobarEvidencia();
  const rechazar = useRechazarEvidencia();
  const archivar = useArchivarEvidencia();
  const eliminar = useEliminarEvidencia();

  const [confirmAction, setConfirmAction] = useState<{
    type: 'aprobar' | 'rechazar' | 'archivar' | 'eliminar';
    evidencia: Evidencia;
  } | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!evidencias?.length) {
    return <EmptyState title="Sin evidencias" description={emptyMessage} className={className} />;
  }

  const handleAction = async () => {
    if (!confirmAction) return;
    const { type, evidencia } = confirmAction;

    switch (type) {
      case 'aprobar':
        await aprobar.mutateAsync(evidencia.id);
        break;
      case 'rechazar':
        await rechazar.mutateAsync({ id: evidencia.id, payload: { motivo: motivoRechazo } });
        setMotivoRechazo('');
        break;
      case 'archivar':
        await archivar.mutateAsync(evidencia.id);
        break;
      case 'eliminar':
        await eliminar.mutateAsync(evidencia.id);
        break;
    }
    setConfirmAction(null);
  };

  const getActionItems = (ev: Evidencia) => {
    const items = [];
    if (ev.estado === 'PENDIENTE') {
      items.push(
        {
          label: 'Aprobar',
          icon: <CheckCircle2 className="h-4 w-4" />,
          onClick: () => setConfirmAction({ type: 'aprobar', evidencia: ev }),
        },
        {
          label: 'Rechazar',
          icon: <XCircle className="h-4 w-4" />,
          onClick: () => setConfirmAction({ type: 'rechazar', evidencia: ev }),
        }
      );
    }
    if (ev.estado === 'APROBADA' || ev.estado === 'VENCIDA') {
      items.push({
        label: 'Archivar',
        icon: <Archive className="h-4 w-4" />,
        onClick: () => setConfirmAction({ type: 'archivar', evidencia: ev }),
      });
    }
    items.push({
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setConfirmAction({ type: 'eliminar', evidencia: ev }),
      danger: true,
    });
    return items;
  };

  // ============ COMPACT LAYOUT ============
  if (layout === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {evidencias.map((ev) => (
          <a
            key={ev.id}
            href={ev.archivo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {getFileIcon(ev.mime_type, 'h-3.5 w-3.5')}
            <span className="max-w-[120px] truncate">{ev.titulo}</span>
            <Badge variant={ESTADO_BADGE_MAP[ev.estado].variant} size="sm">
              {ev.estado}
            </Badge>
          </a>
        ))}
      </div>
    );
  }

  // ============ LIST LAYOUT ============
  if (layout === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {evidencias.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            {getFileIcon(ev.mime_type, 'h-5 w-5')}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{ev.titulo}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{ev.tamano_legible}</span>
                <span>&middot;</span>
                <span>{ev.subido_por_nombre}</span>
                <span>&middot;</span>
                <span>{formatRelativeDate(ev.created_at)}</span>
              </div>
            </div>
            <StatusBadge status={ev.estado} size="sm" />
            <a
              href={ev.archivo}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Descargar"
            >
              <Download className="h-4 w-4 text-gray-500" />
            </a>
            {showActions && (
              <Dropdown
                trigger={
                  <button
                    className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Más opciones"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </button>
                }
                items={getActionItems(ev)}
              />
            )}
          </div>
        ))}

        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => {
            setConfirmAction(null);
            setMotivoRechazo('');
          }}
          onConfirm={handleAction}
          title={
            confirmAction?.type === 'aprobar'
              ? 'Aprobar Evidencia'
              : confirmAction?.type === 'rechazar'
                ? 'Rechazar Evidencia'
                : confirmAction?.type === 'archivar'
                  ? 'Archivar Evidencia'
                  : 'Eliminar Evidencia'
          }
          message={
            confirmAction?.type === 'rechazar' ? (
              <div className="space-y-3">
                <p>¿Rechazar la evidencia "{confirmAction.evidencia.titulo}"?</p>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Motivo del rechazo..."
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-sm bg-transparent"
                  rows={3}
                />
              </div>
            ) : (
              `¿${confirmAction?.type === 'eliminar' ? 'Eliminar' : confirmAction?.type === 'archivar' ? 'Archivar' : 'Aprobar'} la evidencia "${confirmAction?.evidencia.titulo}"?`
            )
          }
          variant={
            confirmAction?.type === 'eliminar'
              ? 'danger'
              : confirmAction?.type === 'rechazar'
                ? 'warning'
                : 'info'
          }
          confirmText={
            confirmAction?.type === 'aprobar'
              ? 'Aprobar'
              : confirmAction?.type === 'rechazar'
                ? 'Rechazar'
                : confirmAction?.type === 'archivar'
                  ? 'Archivar'
                  : 'Eliminar'
          }
        />
      </div>
    );
  }

  // ============ GRID LAYOUT (default) ============
  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {evidencias.map((ev) => (
          <div
            key={ev.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Preview Area */}
            <div className="relative h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {ev.es_imagen ? (
                <img
                  src={ev.archivo}
                  alt={ev.titulo}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                getFileIcon(ev.mime_type, 'h-12 w-12')
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={ESTADO_BADGE_MAP[ev.estado].variant} size="sm">
                  {ev.estado}
                </Badge>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              <p className="text-sm font-medium truncate" title={ev.titulo}>
                {ev.titulo}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{ev.tamano_legible}</span>
                <span>&middot;</span>
                <Clock className="h-3 w-3" />
                <span>{formatRelativeDate(ev.created_at)}</span>
              </div>
              {ev.normas_relacionadas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ev.normas_relacionadas.map((n) => (
                    <Badge key={n} variant="secondary" size="sm">
                      {n.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-700">
                <a
                  href={ev.archivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Ver / Descargar"
                >
                  <Eye className="h-4 w-4 text-gray-500" />
                </a>
                <a
                  href={ev.archivo}
                  download={ev.nombre_original}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Descargar"
                >
                  <Download className="h-4 w-4 text-gray-500" />
                </a>
                {showActions && ev.estado === 'PENDIENTE' && (
                  <>
                    <button
                      onClick={() => setConfirmAction({ type: 'aprobar', evidencia: ev })}
                      className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/20"
                      title="Aprobar"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'rechazar', evidencia: ev })}
                      className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                      title="Rechazar"
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                    </button>
                  </>
                )}
                {showActions && (
                  <button
                    onClick={() => setConfirmAction({ type: 'eliminar', evidencia: ev })}
                    className="ml-auto p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => {
          setConfirmAction(null);
          setMotivoRechazo('');
        }}
        onConfirm={handleAction}
        title={
          confirmAction?.type === 'aprobar'
            ? 'Aprobar Evidencia'
            : confirmAction?.type === 'rechazar'
              ? 'Rechazar Evidencia'
              : confirmAction?.type === 'archivar'
                ? 'Archivar Evidencia'
                : 'Eliminar Evidencia'
        }
        message={
          confirmAction?.type === 'rechazar' ? (
            <div className="space-y-3">
              <p>¿Rechazar la evidencia "{confirmAction.evidencia.titulo}"?</p>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Motivo del rechazo..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-sm bg-transparent"
                rows={3}
              />
            </div>
          ) : (
            `¿${confirmAction?.type === 'eliminar' ? 'Eliminar' : confirmAction?.type === 'archivar' ? 'Archivar' : 'Aprobar'} la evidencia "${confirmAction?.evidencia.titulo}"?`
          )
        }
        variant={
          confirmAction?.type === 'eliminar'
            ? 'danger'
            : confirmAction?.type === 'rechazar'
              ? 'warning'
              : 'info'
        }
        confirmText={
          confirmAction?.type === 'aprobar'
            ? 'Aprobar'
            : confirmAction?.type === 'rechazar'
              ? 'Rechazar'
              : confirmAction?.type === 'archivar'
                ? 'Archivar'
                : 'Eliminar'
        }
      />
    </div>
  );
}
