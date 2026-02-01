/**
 * ValoresDragDrop - Gestion de Valores Corporativos con Drag & Drop
 * Sistema de Gestion StrateKaz
 *
 * Vista 2B Especial: DataSection (externo) + Card con contenido interactivo
 * - El header (DataSection) se maneja desde el componente padre (ValoresSection)
 * - Este componente solo renderiza el contenido del grid/lista con Drag & Drop
 *
 * Caracteristicas:
 * - Reordenamiento visual con arrastrar y soltar
 * - Seleccion de iconos dinamica desde la API (IconPicker del Design System)
 * - Edicion inline
 * - Animaciones suaves con Framer Motion
 * - Colores dinamicos desde el branding de la empresa
 *
 * NOTA: Los iconos vienen de la base de datos via /api/configuracion/icons/
 * No hay iconos hardcodeados - todo es dinamico.
 */
import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, DynamicIcon, IconPicker } from '@/components/common';
import { Input, Textarea } from '@/components/forms';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import type { CorporateValue, CreateCorporateValueDTO, UpdateCorporateValueDTO } from '../types/strategic.types';
import { cn } from '@/lib/utils';

/**
 * Convierte un color hex a RGB para usar en rgba()
 */
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '139, 92, 246'; // Fallback purple
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

// ============================================================================
// SORTABLE VALUE ITEM (Vista Lista)
// ============================================================================
interface SortableValueItemProps {
  value: CorporateValue;
  onEdit: (value: CorporateValue) => void;
  onDelete: (value: CorporateValue) => void;
  isEditing: boolean;
  editData: Partial<CorporateValue>;
  onEditChange: (field: keyof CorporateValue, val: string) => void;
  onEditIconChange: (iconName: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isLoading?: boolean;
  accentColor: string;
  accentRgb: string;
  readOnly?: boolean;
}

const SortableValueItem = ({
  value,
  onEdit,
  onDelete,
  isEditing,
  editData,
  onEditChange,
  onEditIconChange,
  onSaveEdit,
  onCancelEdit,
  isLoading,
  accentColor,
  accentRgb,
  readOnly,
}: SortableValueItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const currentIcon = isEditing ? editData.icon : value.icon;

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          borderColor: accentColor,
        }}
        className={cn(
          'p-4 bg-white dark:bg-gray-800 rounded-lg border-2 shadow-lg',
          isDragging && 'opacity-50'
        )}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
              >
                <DynamicIcon
                  name={currentIcon}
                  size={24}
                  color={accentColor}
                />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <Input
                label="Nombre del Valor"
                value={editData.name || ''}
                onChange={(e) => onEditChange('name', e.target.value)}
                placeholder="Ej: Integridad"
              />
              <Textarea
                label="Descripcion"
                value={editData.description || ''}
                onChange={(e) => onEditChange('description', e.target.value)}
                placeholder="Describe que significa este valor para la organizacion..."
                rows={3}
              />
            </div>
          </div>

          {/* IconPicker dinamico del Design System */}
          <IconPicker
            label="Seleccionar Icono"
            value={editData.icon}
            onChange={onEditIconChange}
            category="VALORES"
            columns={6}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSaveEdit}
              disabled={isLoading || !editData.name || !editData.description}
              isLoading={isLoading}
            >
              <Save className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        ['--accent-color' as string]: accentColor,
        ['--accent-rgb' as string]: accentRgb,
      }}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'hover:shadow-md transition-all',
        isDragging && 'opacity-50 shadow-xl'
      )}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = accentColor;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '';
      }}
    >
      {/* Drag Handle */}
      {!readOnly && (
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      )}

      {/* Icon - Dinamico desde DB con color del branding */}
      <div className="flex-shrink-0">
        <div
          className="p-3 rounded-xl transition-colors"
          style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
        >
          <DynamicIcon
            name={value.icon}
            size={24}
            color={accentColor}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          {value.name}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
          {value.description}
        </p>
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(value)}
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(value)}
            title="Eliminar"
            className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// SORTABLE VALUE CARD (Grid View)
// ============================================================================
interface SortableValueCardProps {
  value: CorporateValue;
  onEdit: (value: CorporateValue) => void;
  onDelete: (value: CorporateValue) => void;
  accentColor: string;
  accentRgb: string;
  readOnly?: boolean;
}

const SortableValueCard = ({
  value,
  onEdit,
  onDelete,
  accentColor,
  accentRgb,
  readOnly,
}: SortableValueCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'group relative flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        'hover:shadow-lg transition-all cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-2xl z-50'
      )}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = accentColor;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '';
      }}
      {...(!readOnly ? attributes : {})}
      {...(!readOnly ? listeners : {})}
    >
      {/* Drag indicator */}
      {!readOnly && (
        <div className="absolute top-2 left-2 p-1 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Icon - con color dinamico del branding */}
      <div
        className="mb-4 p-4 rounded-2xl transition-colors"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb}, 0.2) 0%, rgba(${accentRgb}, 0.1) 100%)`,
        }}
      >
        <DynamicIcon
          name={value.icon}
          size={36}
          color={accentColor}
        />
      </div>

      {/* Name */}
      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
        {value.name}
      </h4>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center line-clamp-3 flex-1">
        {value.description}
      </p>

      {/* Actions (visible on hover) */}
      {!readOnly && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg px-2 py-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(value);
            }}
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(value);
            }}
            title="Eliminar"
            className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export type ViewMode = 'list' | 'cards';

interface ValoresDragDropProps {
  values: CorporateValue[];
  identityId: number;
  onReorder: (newOrder: { id: number; orden: number }[]) => Promise<void>;
  onCreate: (data: CreateCorporateValueDTO & { identity: number }) => Promise<void>;
  onUpdate: (id: number, data: UpdateCorporateValueDTO) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
  // Props controladas desde el padre (DataSection)
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isCreating: boolean;
  onCreateToggle: (creating: boolean) => void;
}

export const ValoresDragDrop = ({
  values,
  identityId,
  onReorder,
  onCreate,
  onUpdate,
  onDelete,
  isLoading,
  readOnly,
  // Props controladas desde el padre
  viewMode,
  onViewModeChange,
  isCreating,
  onCreateToggle,
}: ValoresDragDropProps) => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<CorporateValue>>({});
  const [newValue, setNewValue] = useState<Partial<CorporateValue>>({
    name: '',
    description: '',
    icon: 'Heart',
  });

  // Colores dinamicos del branding
  const { primaryColor } = useBrandingConfig();
  const accentColor = primaryColor;
  const accentRgb = useMemo(() => hexToRgb(primaryColor), [primaryColor]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedValues = useMemo(
    () => [...values].sort((a, b) => a.orden - b.orden),
    [values]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sortedValues.findIndex((v) => v.id === active.id);
      const newIndex = sortedValues.findIndex((v) => v.id === over.id);

      const newArray = arrayMove(sortedValues, oldIndex, newIndex);
      const newOrder = newArray.map((v, index) => ({
        id: v.id,
        orden: index + 1,
      }));

      await onReorder(newOrder);
    }
  };

  const handleEdit = (value: CorporateValue) => {
    setEditingId(value.id);
    setEditData({
      name: value.name,
      description: value.description,
      icon: value.icon,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editData.name || !editData.description) return;

    await onUpdate(editingId, {
      name: editData.name,
      description: editData.description,
      icon: editData.icon || undefined,
    });

    setEditingId(null);
    setEditData({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleCreate = async () => {
    if (!newValue.name || !newValue.description) return;

    await onCreate({
      identity: identityId,
      name: newValue.name,
      description: newValue.description,
      icon: newValue.icon || undefined,
      orden: sortedValues.length + 1,
    });

    onCreateToggle(false);
    setNewValue({ name: '', description: '', icon: 'Heart' });
  };

  const handleDelete = async (value: CorporateValue) => {
    if (window.confirm(`Eliminar el valor "${value.name}"?`)) {
      await onDelete(value.id);
    }
  };

  const activeValue = activeId
    ? sortedValues.find((v) => v.id === activeId)
    : null;

  return (
    <Card className="p-6">

      {/* Create New Value Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div
              className="p-4 rounded-lg border-2 border-dashed"
              style={{
                backgroundColor: `rgba(${accentRgb}, 0.05)`,
                borderColor: `rgba(${accentRgb}, 0.3)`,
              }}
            >
              <h4
                className="font-medium mb-4"
                style={{ color: accentColor }}
              >
                Nuevo Valor Corporativo
              </h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
                    >
                      <DynamicIcon
                        name={newValue.icon}
                        size={24}
                        color={accentColor}
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <Input
                      label="Nombre del Valor"
                      value={newValue.name || ''}
                      onChange={(e) => setNewValue({ ...newValue, name: e.target.value })}
                      placeholder="Ej: Integridad, Compromiso, Excelencia"
                    />
                    <Textarea
                      label="Descripcion"
                      value={newValue.description || ''}
                      onChange={(e) => setNewValue({ ...newValue, description: e.target.value })}
                      placeholder="Describe que significa este valor para la organizacion y como se vive en el dia a dia..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* IconPicker dinamico del Design System */}
                <IconPicker
                  label="Seleccionar Icono"
                  value={newValue.icon}
                  onChange={(iconName) => setNewValue({ ...newValue, icon: iconName })}
                  category="VALORES"
                  columns={6}
                />

                <div
                  className="flex justify-end gap-2 pt-2 border-t"
                  style={{ borderColor: `rgba(${accentRgb}, 0.2)` }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onCreateToggle(false);
                      setNewValue({ name: '', description: '', icon: 'Heart' });
                    }}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreate}
                    disabled={isLoading || !newValue.name || !newValue.description}
                    isLoading={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Crear Valor
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Values with Drag & Drop */}
      {sortedValues.length === 0 && !isCreating ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <DynamicIcon name="Heart" size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay valores corporativos definidos.</p>
          <p className="text-sm mt-1">Crea el primer valor para comenzar.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedValues.map((v) => v.id)}
            strategy={verticalListSortingStrategy}
          >
            {/* Cards View */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence>
                  {sortedValues.map((value) => (
                    editingId === value.id ? (
                      <SortableValueItem
                        key={value.id}
                        value={value}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isEditing={true}
                        editData={editData}
                        onEditChange={(field, val) => setEditData({ ...editData, [field]: val })}
                        onEditIconChange={(iconName) => setEditData({ ...editData, icon: iconName })}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        isLoading={isLoading}
                        accentColor={accentColor}
                        accentRgb={accentRgb}
                        readOnly={readOnly}
                      />
                    ) : (
                      <SortableValueCard
                        key={value.id}
                        value={value}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        accentColor={accentColor}
                        accentRgb={accentRgb}
                        readOnly={readOnly}
                      />
                    )
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                <AnimatePresence>
                  {sortedValues.map((value) => (
                    <SortableValueItem
                      key={value.id}
                      value={value}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isEditing={editingId === value.id}
                      editData={editData}
                      onEditChange={(field, val) => setEditData({ ...editData, [field]: val })}
                      onEditIconChange={(iconName) => setEditData({ ...editData, icon: iconName })}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      isLoading={isLoading}
                      accentColor={accentColor}
                      accentRgb={accentRgb}
                      readOnly={readOnly}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </SortableContext>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeValue && (
              <div
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 shadow-2xl opacity-90"
                style={{ borderColor: accentColor }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
                  >
                    <DynamicIcon
                      name={activeValue.icon}
                      size={24}
                      color={accentColor}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {activeValue.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {activeValue.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </Card>
  );
};

export default ValoresDragDrop;
