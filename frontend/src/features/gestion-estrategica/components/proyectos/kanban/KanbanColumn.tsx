/**
 * KanbanColumn - Columna del tablero Kanban
 *
 * Usa @dnd-kit/core useDroppable + @dnd-kit/sortable SortableContext
 * para permitir drag & drop entre columnas y reordenar dentro.
 */
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Badge, Button } from '@/components/common';
import { cn } from '@/utils/cn';
import { KanbanCard } from './KanbanCard';
import type {
  ActividadProyecto,
  KanbanColumn as KanbanColumnType,
} from '../../../types/proyectos.types';

// Colores por columna
const COLUMN_STYLES: Record<KanbanColumnType, { bg: string; border: string; headerBg: string }> = {
  backlog: {
    bg: 'bg-gray-50 dark:bg-gray-900/40',
    border: 'border-gray-300 dark:border-gray-700',
    headerBg: 'bg-gray-200 dark:bg-gray-800',
  },
  todo: {
    bg: 'bg-blue-50/50 dark:bg-blue-900/10',
    border: 'border-blue-300 dark:border-blue-800',
    headerBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  in_progress: {
    bg: 'bg-amber-50/50 dark:bg-amber-900/10',
    border: 'border-amber-300 dark:border-amber-800',
    headerBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  review: {
    bg: 'bg-purple-50/50 dark:bg-purple-900/10',
    border: 'border-purple-300 dark:border-purple-800',
    headerBg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  done: {
    bg: 'bg-green-50/50 dark:bg-green-900/10',
    border: 'border-green-300 dark:border-green-800',
    headerBg: 'bg-green-100 dark:bg-green-900/30',
  },
};

interface KanbanColumnProps {
  columnId: KanbanColumnType;
  label: string;
  actividades: ActividadProyecto[];
  onCardClick?: (actividad: ActividadProyecto) => void;
  onAddClick?: () => void;
}

export const KanbanColumn = ({
  columnId,
  label,
  actividades,
  onCardClick,
  onAddClick,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  });

  const styles = COLUMN_STYLES[columnId];
  const itemIds = actividades.map((a) => a.id);

  return (
    <div className="flex-shrink-0 w-[300px]">
      <div
        ref={setNodeRef}
        className={cn(
          'rounded-xl border h-full flex flex-col',
          styles.bg,
          styles.border,
          isOver && 'ring-2 ring-primary-400 ring-offset-1'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2.5 rounded-t-xl',
            styles.headerBg
          )}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</h3>
            <Badge variant="gray" size="sm">
              {actividades.length}
            </Badge>
          </div>
          {onAddClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddClick}
              className="h-7 w-7 p-0"
              aria-label={`Agregar actividad a ${label}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Cards */}
        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[120px]">
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {actividades.length > 0 ? (
              actividades.map((actividad) => (
                <KanbanCard
                  key={actividad.id}
                  actividad={actividad}
                  onClick={() => onCardClick?.(actividad)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-20 text-xs text-gray-400 dark:text-gray-500 italic">
                Sin actividades
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    </div>
  );
};
