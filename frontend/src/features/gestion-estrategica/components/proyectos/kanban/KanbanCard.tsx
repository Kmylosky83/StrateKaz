/**
 * KanbanCard - Tarjeta de actividad dentro del tablero Kanban
 *
 * Usa @dnd-kit/sortable para drag & drop.
 * Design System: Badge, Tooltip, Progress del sistema de diseno.
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, User, Clock } from 'lucide-react';
import { Badge, Tooltip, Progress } from '@/components/common';
import { cn } from '@/utils/cn';
import type { ActividadProyecto } from '../../../types/proyectos.types';

// Mapeo de prioridad numérica a etiqueta y variante de Badge
const PRIORITY_CONFIG: Record<
  number,
  { label: string; variant: 'danger' | 'warning' | 'info' | 'gray' }
> = {
  1: { label: 'Urgente', variant: 'danger' },
  2: { label: 'Alta', variant: 'warning' },
  3: { label: 'Alta', variant: 'warning' },
  4: { label: 'Normal', variant: 'info' },
  5: { label: 'Normal', variant: 'info' },
  6: { label: 'Normal', variant: 'info' },
  7: { label: 'Baja', variant: 'gray' },
  8: { label: 'Baja', variant: 'gray' },
  9: { label: 'Baja', variant: 'gray' },
  10: { label: 'Baja', variant: 'gray' },
};

function getPriorityConfig(prioridad: number) {
  return PRIORITY_CONFIG[prioridad] ?? { label: 'Normal', variant: 'info' as const };
}

interface KanbanCardProps {
  actividad: ActividadProyecto;
  onClick?: () => void;
}

export const KanbanCard = ({ actividad, onClick }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: actividad.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = getPriorityConfig(actividad.prioridad);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
    });
  };

  const fechaFin = formatDate(actividad.fecha_fin_plan);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        'rounded-lg p-3 cursor-grab shadow-sm',
        'hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary-400'
      )}
    >
      {/* Grip handle + Title */}
      <div className="flex items-start gap-2 mb-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0" onClick={onClick} role="button" tabIndex={0}>
          {actividad.codigo_wbs && (
            <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 block mb-0.5">
              {actividad.codigo_wbs}
            </span>
          )}
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
            {actividad.nombre}
          </h4>
        </div>
      </div>

      {/* Priority + Estado badges */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <Badge variant={priorityConfig.variant} size="sm">
          {priorityConfig.label}
        </Badge>
        {actividad.estado_display && (
          <Badge variant="gray" size="sm">
            {actividad.estado_display}
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      {actividad.porcentaje_avance > 0 && (
        <div className="mb-2">
          <Tooltip content={`${actividad.porcentaje_avance}% completado`}>
            <div>
              <Progress value={actividad.porcentaje_avance} size="sm" />
            </div>
          </Tooltip>
        </div>
      )}

      {/* Footer: responsable, fecha, duracion */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
        {actividad.responsable_nombre && (
          <div className="flex items-center gap-1 min-w-0">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[100px]">{actividad.responsable_nombre}</span>
          </div>
        )}
        {fechaFin && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{fechaFin}</span>
          </div>
        )}
        {actividad.duracion_estimada_dias && actividad.duracion_estimada_dias > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{actividad.duracion_estimada_dias}d</span>
          </div>
        )}
      </div>
    </div>
  );
};
