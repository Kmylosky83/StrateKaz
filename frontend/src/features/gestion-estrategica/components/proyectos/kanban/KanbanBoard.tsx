/**
 * KanbanBoard - Tablero Kanban principal para actividades de proyecto
 *
 * Sprint PLANNER-1: Kanban Board MVP
 *
 * Usa @dnd-kit/core DndContext con PointerSensor y KeyboardSensor
 * para drag & drop entre columnas y reordenamiento dentro de cada columna.
 *
 * Fetch de datos: /api/gestion-estrategica/actividades/kanban/?proyecto_id=X
 * Reorder: POST /api/gestion-estrategica/actividades/reorder/
 */
import { useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState } from 'react';
import { Spinner, EmptyState } from '@/components/common';
import { KanbanSquare } from 'lucide-react';
import { useKanbanData, useReorderActividades } from '../../../hooks/useKanban';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import type {
  ActividadProyecto,
  KanbanColumn as KanbanColumnType,
  KanbanReorderItem,
} from '../../../types/proyectos.types';

interface KanbanBoardProps {
  proyectoId: number | null;
  onCardClick?: (actividad: ActividadProyecto) => void;
  onAddActivity?: (column: KanbanColumnType) => void;
}

export const KanbanBoard = ({ proyectoId, onCardClick, onAddActivity }: KanbanBoardProps) => {
  const { data: kanbanData, isLoading, isError } = useKanbanData(proyectoId);
  const reorderMutation = useReorderActividades();
  const [activeItem, setActiveItem] = useState<ActividadProyecto | null>(null);

  // DnD sensors con activacion por distancia (evita clicks accidentales)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Estructura local de columnas para optimistic updates durante drag
  const [localColumns, setLocalColumns] = useState<Record<string, ActividadProyecto[]> | null>(
    null
  );

  // Columnas efectivas: local override o data del server
  const columns = useMemo(() => {
    if (localColumns) return localColumns;
    if (!kanbanData?.columns) return {};
    return kanbanData.columns;
  }, [localColumns, kanbanData]);

  const columnOrder = useMemo(
    () => kanbanData?.column_order ?? ['backlog', 'todo', 'in_progress', 'review', 'done'],
    [kanbanData?.column_order]
  );
  const columnLabels = useMemo(
    () =>
      kanbanData?.column_labels ?? {
        backlog: 'Backlog',
        todo: 'Por Hacer',
        in_progress: 'En Progreso',
        review: 'En Revisión',
        done: 'Completado',
      },
    [kanbanData?.column_labels]
  );

  // Encuentra la columna que contiene un item
  const findColumn = useCallback(
    (id: number | string): KanbanColumnType | null => {
      const cols = localColumns ?? columns;
      for (const [colId, items] of Object.entries(cols)) {
        if (Array.isArray(items) && items.some((item) => item.id === id)) {
          return colId as KanbanColumnType;
        }
      }
      // Tambien chequear si el id es una columna directamente
      if (columnOrder.includes(id as KanbanColumnType)) {
        return id as KanbanColumnType;
      }
      return null;
    },
    [columns, localColumns, columnOrder]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Encontrar la actividad arrastrada
    const cols = localColumns ?? columns;
    for (const items of Object.values(cols)) {
      if (Array.isArray(items)) {
        const found = items.find((item) => item.id === active.id);
        if (found) {
          setActiveItem(found);
          // Inicializar localColumns para optimistic updates
          if (!localColumns) {
            setLocalColumns({ ...columns });
          }
          break;
        }
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !localColumns) return;

    const activeId = active.id as number;
    const overId = over.id;

    const activeCol = findColumn(activeId);
    let overCol = findColumn(overId);

    // Si over es una columna directa (droppable id)
    if (columnOrder.includes(overId as KanbanColumnType)) {
      overCol = overId as KanbanColumnType;
    }

    if (!activeCol || !overCol || activeCol === overCol) return;

    // Mover item entre columnas (optimistic)
    setLocalColumns((prev) => {
      if (!prev) return prev;
      const sourceItems = [...(prev[activeCol] ?? [])];
      const destItems = [...(prev[overCol!] ?? [])];
      const activeIndex = sourceItems.findIndex((item) => item.id === activeId);
      if (activeIndex === -1) return prev;

      const [movedItem] = sourceItems.splice(activeIndex, 1);
      movedItem.kanban_column = overCol!;

      // Insertar al final de la columna destino
      const overIndex =
        typeof overId === 'number' ? destItems.findIndex((item) => item.id === overId) : -1;

      if (overIndex >= 0) {
        destItems.splice(overIndex, 0, movedItem);
      } else {
        destItems.push(movedItem);
      }

      return {
        ...prev,
        [activeCol]: sourceItems,
        [overCol!]: destItems,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    setActiveItem(null);

    if (!over || !localColumns) {
      setLocalColumns(null);
      return;
    }

    // Construir la lista de items a reordenar basado en el estado local
    const reorderItems: KanbanReorderItem[] = [];

    for (const [colId, items] of Object.entries(localColumns)) {
      if (!Array.isArray(items)) continue;
      items.forEach((item, index) => {
        // Solo incluir items que cambiaron de posicion o columna
        reorderItems.push({
          id: item.id,
          kanban_column: colId as KanbanColumnType,
          kanban_order: index,
        });
      });
    }

    if (reorderItems.length > 0) {
      reorderMutation.mutate(reorderItems);
    }

    // Reset local state - server will invalidate and refetch
    setLocalColumns(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
    setLocalColumns(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <EmptyState
        icon={<KanbanSquare className="h-12 w-12" />}
        title="Error al cargar el tablero"
        description="No se pudieron cargar las actividades. Intenta de nuevo."
      />
    );
  }

  // No project selected
  if (!proyectoId) {
    return (
      <EmptyState
        icon={<KanbanSquare className="h-12 w-12" />}
        title="Selecciona un proyecto"
        description="Elige un proyecto para ver su tablero Kanban de actividades."
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {columnOrder.map((colId) => (
          <KanbanColumn
            key={colId}
            columnId={colId as KanbanColumnType}
            label={columnLabels[colId] ?? colId}
            actividades={(columns[colId] as ActividadProyecto[]) ?? []}
            onCardClick={onCardClick}
            onAddClick={onAddActivity ? () => onAddActivity(colId as KanbanColumnType) : undefined}
          />
        ))}
      </div>

      {/* Drag overlay para feedback visual */}
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90 rotate-2 scale-105">
            <KanbanCard actividad={activeItem} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
