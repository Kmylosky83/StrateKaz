/**
 * FieldList - Lista de campos con drag-drop via @dnd-kit
 */
import { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '../Badge';
import { FIELD_TYPE_METADATA, type CampoFormulario } from './types';

interface FieldListProps {
  campos: Partial<CampoFormulario>[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onReorder: (campos: Partial<CampoFormulario>[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

// ==================== SORTABLE ITEM ====================

interface SortableFieldItemProps {
  campo: Partial<CampoFormulario>;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  disabled?: boolean;
  id: string;
}

function SortableFieldItem({
  campo,
  isSelected,
  onSelect,
  onRemove,
  disabled,
  id,
}: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = campo.tipo_campo ? FIELD_TYPE_METADATA[campo.tipo_campo] : null;
  const Icon = meta?.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
        'bg-white dark:bg-gray-800',
        isSelected
          ? 'border-indigo-500 ring-1 ring-indigo-500/30 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        isDragging && 'opacity-50 shadow-lg',
        disabled && 'opacity-50'
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Click to select */}
      <button
        type="button"
        className="flex-1 flex items-center gap-2 min-w-0 text-left"
        onClick={onSelect}
      >
        {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
        <span className="truncate text-sm text-gray-900 dark:text-white font-medium">
          {campo.etiqueta || 'Sin nombre'}
        </span>
        {campo.es_obligatorio && <span className="text-red-500 text-xs shrink-0">*</span>}
      </button>

      {/* Type badge */}
      {meta && (
        <Badge variant="secondary" size="sm" className="shrink-0 text-[10px]">
          {meta.label}
        </Badge>
      )}

      {/* Remove */}
      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ==================== FIELD LIST ====================

export function FieldList({
  campos,
  selectedIndex,
  onSelect,
  onReorder,
  onRemove,
  disabled,
}: FieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Stable IDs — use existing id or index-based fallback
  const items = useMemo(
    () => campos.map((c, i) => ({ ...c, _sortId: c.id ? `campo-${c.id}` : `new-${i}` })),
    [campos]
  );
  const itemIds = items.map((item) => item._sortId);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...campos];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Update orden
    const updated = reordered.map((c, i) => ({ ...c, orden: i }));
    onReorder(updated);

    // Keep selection on moved item
    if (selectedIndex === oldIndex) {
      onSelect(newIndex);
    }
  }

  if (campos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="text-gray-400 dark:text-gray-500">
          <p className="text-sm font-medium">Sin campos</p>
          <p className="text-xs mt-1">Agrega campos desde la paleta</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-1">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((campo, index) => (
            <SortableFieldItem
              key={campo._sortId}
              id={campo._sortId}
              campo={campo}
              index={index}
              isSelected={selectedIndex === index}
              onSelect={() => onSelect(index)}
              onRemove={() => onRemove(index)}
              disabled={disabled}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
