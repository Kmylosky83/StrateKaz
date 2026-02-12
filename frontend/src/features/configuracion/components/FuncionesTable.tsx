/**
 * FuncionesTable - Tabla editable enterprise para funciones del cargo
 *
 * Reemplaza el ListEditor de badges con una tabla estructurada:
 * - Nombre de la funcion
 * - Descripcion detallada (expandible)
 * - Frecuencia (diaria | semanal | mensual | ocasional)
 * - Criticidad (alta | media | baja) con badges de color
 *
 * CRUD inline: agregar, editar, eliminar filas
 * Compatible con datos legacy (string[]) via normalizeFunciones()
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { cn } from '@/utils/cn';
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  GripVertical,
  AlertTriangle,
} from 'lucide-react';
import type { FuncionCargo, FrecuenciaFuncion, CriticidadFuncion } from '../types/rbac.types';
import { FRECUENCIA_OPTIONS, CRITICIDAD_OPTIONS } from '../types/rbac.types';

interface FuncionesTableProps {
  items: FuncionCargo[];
  onChange: (items: FuncionCargo[]) => void;
  /** Deshabilitar edicion */
  disabled?: boolean;
  /** Maximo de funciones permitidas */
  maxItems?: number;
}

/** Estado de una fila en edicion */
interface EditingRow {
  nombre: string;
  descripcion: string;
  frecuencia: FrecuenciaFuncion;
  criticidad: CriticidadFuncion;
}

const EMPTY_ROW: EditingRow = {
  nombre: '',
  descripcion: '',
  frecuencia: 'diaria',
  criticidad: 'media',
};

/** Mapeo de criticidad a variant del Badge */
const CRITICIDAD_BADGE: Record<CriticidadFuncion, 'danger' | 'warning' | 'info'> = {
  alta: 'danger',
  media: 'warning',
  baja: 'info',
};

/** Mapeo de frecuencia a variant del Badge */
const FRECUENCIA_BADGE: Record<FrecuenciaFuncion, 'primary' | 'success' | 'info' | 'gray'> = {
  diaria: 'primary',
  semanal: 'success',
  mensual: 'info',
  ocasional: 'gray',
};

export const FuncionesTable = ({
  items,
  onChange,
  disabled = false,
  maxItems = 30,
}: FuncionesTableProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newRow, setNewRow] = useState<EditingRow>(EMPTY_ROW);
  const [editRow, setEditRow] = useState<EditingRow>(EMPTY_ROW);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // --- Agregar nueva funcion ---
  const handleAdd = () => {
    if (!newRow.nombre.trim()) return;
    const funcion: FuncionCargo = {
      nombre: newRow.nombre.trim(),
      descripcion: newRow.descripcion.trim() || undefined,
      frecuencia: newRow.frecuencia,
      criticidad: newRow.criticidad,
    };
    onChange([...items, funcion]);
    setNewRow(EMPTY_ROW);
    setIsAdding(false);
  };

  // --- Editar funcion existente ---
  const startEdit = (index: number) => {
    const item = items[index];
    setEditRow({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      frecuencia: item.frecuencia,
      criticidad: item.criticidad,
    });
    setEditingIndex(index);
    setExpandedIndex(null);
  };

  const confirmEdit = () => {
    if (editingIndex === null || !editRow.nombre.trim()) return;
    const updated = [...items];
    updated[editingIndex] = {
      nombre: editRow.nombre.trim(),
      descripcion: editRow.descripcion.trim() || undefined,
      frecuencia: editRow.frecuencia,
      criticidad: editRow.criticidad,
    };
    onChange(updated);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  // --- Eliminar ---
  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    if (editingIndex === index) setEditingIndex(null);
  };

  // --- Mover (drag visual) ---
  const moveItem = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= items.length) return;
    const updated = [...items];
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    onChange(updated);
  };

  const canAdd = items.length < maxItems && !disabled;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Funciones y Responsabilidades
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({items.length}
            {maxItems < 30 ? `/${maxItems}` : ''})
          </span>
        </label>
        {canAdd && !isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus size={14} className="mr-1" />
            Agregar
          </Button>
        )}
      </div>

      {/* Tabla */}
      {items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="w-8 px-2 py-2" />
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Funcion
                </th>
                <th className="w-28 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Frecuencia
                </th>
                <th className="w-24 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Criticidad
                </th>
                <th className="w-20 px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {items.map((item, index) =>
                editingIndex === index ? (
                  // --- Fila en modo edicion ---
                  <tr key={index} className="bg-primary-50/50 dark:bg-primary-900/10">
                    <td className="px-2 py-2" />
                    <td className="px-3 py-2">
                      <div className="space-y-2">
                        <Input
                          value={editRow.nombre}
                          onChange={(e) => setEditRow({ ...editRow, nombre: e.target.value })}
                          placeholder="Nombre de la funcion..."
                          className="text-sm"
                          autoFocus
                        />
                        <Textarea
                          value={editRow.descripcion}
                          onChange={(e) => setEditRow({ ...editRow, descripcion: e.target.value })}
                          placeholder="Descripcion detallada (opcional)..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Select
                        value={editRow.frecuencia}
                        onChange={(e) =>
                          setEditRow({
                            ...editRow,
                            frecuencia: e.target.value as FrecuenciaFuncion,
                          })
                        }
                        options={FRECUENCIA_OPTIONS.map((o) => ({
                          value: o.value,
                          label: o.label,
                        }))}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Select
                        value={editRow.criticidad}
                        onChange={(e) =>
                          setEditRow({
                            ...editRow,
                            criticidad: e.target.value as CriticidadFuncion,
                          })
                        }
                        options={CRITICIDAD_OPTIONS.map((o) => ({
                          value: o.value,
                          label: o.label,
                        }))}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={confirmEdit}
                          className="p-1 text-success-600 hover:text-success-700 dark:text-success-400"
                          title="Confirmar"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // --- Fila normal ---
                  <tr
                    key={index}
                    className={cn(
                      'group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
                      expandedIndex === index && 'bg-gray-50/50 dark:bg-gray-800/30'
                    )}
                  >
                    <td className="px-2 py-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveItem(index, 'up')}
                            className="p-0.5 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Mover arriba"
                          >
                            <GripVertical size={12} />
                          </button>
                        )}
                        <span className="text-xs text-gray-400 font-mono">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-start gap-2">
                        {item.descripcion && (
                          <button
                            type="button"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            className="mt-0.5 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                          >
                            {expandedIndex === index ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {item.nombre}
                          </p>
                          {expandedIndex === index && item.descripcion && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={FRECUENCIA_BADGE[item.frecuencia]} size="sm">
                        {FRECUENCIA_OPTIONS.find((o) => o.value === item.frecuencia)?.label ||
                          item.frecuencia}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={CRITICIDAD_BADGE[item.criticidad]} size="sm">
                        {item.criticidad === 'alta' && <AlertTriangle size={12} className="mr-1" />}
                        {CRITICIDAD_OPTIONS.find((o) => o.value === item.criticidad)?.label ||
                          item.criticidad}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!disabled && (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(index)}
                              className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(index)}
                              className="p-1 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Fila de agregar nueva funcion */}
      {isAdding && (
        <div className="rounded-lg border border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/10 p-3">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12">
              <Input
                label="Nombre de la funcion"
                value={newRow.nombre}
                onChange={(e) => setNewRow({ ...newRow, nombre: e.target.value })}
                placeholder="Ej: Gestionar operaciones diarias del area..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
            </div>
            <div className="col-span-12">
              <Textarea
                label="Descripcion (opcional)"
                value={newRow.descripcion}
                onChange={(e) => setNewRow({ ...newRow, descripcion: e.target.value })}
                placeholder="Detalle de actividades, alcance, responsabilidades..."
                rows={2}
              />
            </div>
            <div className="col-span-6">
              <Select
                label="Frecuencia"
                value={newRow.frecuencia}
                onChange={(e) =>
                  setNewRow({ ...newRow, frecuencia: e.target.value as FrecuenciaFuncion })
                }
                options={FRECUENCIA_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </div>
            <div className="col-span-6">
              <Select
                label="Criticidad"
                value={newRow.criticidad}
                onChange={(e) =>
                  setNewRow({ ...newRow, criticidad: e.target.value as CriticidadFuncion })
                }
                options={CRITICIDAD_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewRow(EMPTY_ROW);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={!newRow.nombre.trim()}
            >
              <Plus size={14} className="mr-1" />
              Agregar Funcion
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !isAdding && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No hay funciones definidas.</p>
          {canAdd && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={14} className="mr-1" />
              Agregar primera funcion
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
