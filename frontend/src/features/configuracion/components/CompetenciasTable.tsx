/**
 * CompetenciasTable - Tabla editable enterprise para competencias del cargo
 *
 * Reemplaza el ListEditor de badges con una tabla estructurada:
 * - Nombre de la competencia
 * - Nivel (basico | intermedio | avanzado | experto)
 * - Descripcion detallada (expandible)
 *
 * Usado para: competencias_tecnicas y competencias_blandas
 * Compatible con datos legacy (string[]) via normalizeCompetencias()
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { cn } from '@/utils/cn';
import { Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { CompetenciaCargo, NivelCompetencia } from '../types/rbac.types';
import { NIVEL_COMPETENCIA_OPTIONS } from '../types/rbac.types';

interface CompetenciasTableProps {
  /** Label del campo */
  label: string;
  items: CompetenciaCargo[];
  onChange: (items: CompetenciaCargo[]) => void;
  /** Placeholder del input de nombre */
  placeholder?: string;
  /** Deshabilitar edicion */
  disabled?: boolean;
  /** Maximo de competencias permitidas */
  maxItems?: number;
}

/** Estado de una fila en edicion */
interface EditingRow {
  nombre: string;
  nivel: NivelCompetencia;
  descripcion: string;
}

const EMPTY_ROW: EditingRow = {
  nombre: '',
  nivel: 'intermedio',
  descripcion: '',
};

/** Mapeo de nivel a variant del Badge */
const NIVEL_BADGE: Record<NivelCompetencia, 'gray' | 'info' | 'success' | 'primary'> = {
  basico: 'gray',
  intermedio: 'info',
  avanzado: 'success',
  experto: 'primary',
};

export const CompetenciasTable = ({
  label,
  items,
  onChange,
  placeholder = 'Nombre de la competencia...',
  disabled = false,
  maxItems = 20,
}: CompetenciasTableProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newRow, setNewRow] = useState<EditingRow>(EMPTY_ROW);
  const [editRow, setEditRow] = useState<EditingRow>(EMPTY_ROW);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // --- Agregar ---
  const handleAdd = () => {
    if (!newRow.nombre.trim()) return;
    const competencia: CompetenciaCargo = {
      nombre: newRow.nombre.trim(),
      nivel: newRow.nivel,
      descripcion: newRow.descripcion.trim() || undefined,
    };
    onChange([...items, competencia]);
    setNewRow(EMPTY_ROW);
    setIsAdding(false);
  };

  // --- Editar ---
  const startEdit = (index: number) => {
    const item = items[index];
    setEditRow({
      nombre: item.nombre,
      nivel: item.nivel,
      descripcion: item.descripcion || '',
    });
    setEditingIndex(index);
    setExpandedIndex(null);
  };

  const confirmEdit = () => {
    if (editingIndex === null || !editRow.nombre.trim()) return;
    const updated = [...items];
    updated[editingIndex] = {
      nombre: editRow.nombre.trim(),
      nivel: editRow.nivel,
      descripcion: editRow.descripcion.trim() || undefined,
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

  const canAdd = items.length < maxItems && !disabled;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          <span className="ml-2 text-xs font-normal text-gray-400">({items.length})</span>
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
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Competencia
                </th>
                <th className="w-32 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Nivel
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
                    <td className="px-3 py-2">
                      <div className="space-y-2">
                        <Input
                          value={editRow.nombre}
                          onChange={(e) => setEditRow({ ...editRow, nombre: e.target.value })}
                          placeholder={placeholder}
                          className="text-sm"
                          autoFocus
                        />
                        <Textarea
                          value={editRow.descripcion}
                          onChange={(e) => setEditRow({ ...editRow, descripcion: e.target.value })}
                          placeholder="Descripcion o criterio de evaluacion (opcional)..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Select
                        value={editRow.nivel}
                        onChange={(e) =>
                          setEditRow({ ...editRow, nivel: e.target.value as NivelCompetencia })
                        }
                        options={NIVEL_COMPETENCIA_OPTIONS.map((o) => ({
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
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
                      <Badge variant={NIVEL_BADGE[item.nivel]} size="sm">
                        {NIVEL_COMPETENCIA_OPTIONS.find((o) => o.value === item.nivel)?.label ||
                          item.nivel}
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

      {/* Formulario para agregar */}
      {isAdding && (
        <div className="rounded-lg border border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/10 p-3">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8">
              <Input
                label="Competencia"
                value={newRow.nombre}
                onChange={(e) => setNewRow({ ...newRow, nombre: e.target.value })}
                placeholder={placeholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
            </div>
            <div className="col-span-4">
              <Select
                label="Nivel"
                value={newRow.nivel}
                onChange={(e) =>
                  setNewRow({ ...newRow, nivel: e.target.value as NivelCompetencia })
                }
                options={NIVEL_COMPETENCIA_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </div>
            <div className="col-span-12">
              <Textarea
                label="Descripcion (opcional)"
                value={newRow.descripcion}
                onChange={(e) => setNewRow({ ...newRow, descripcion: e.target.value })}
                placeholder="Criterios de evaluacion, ejemplos de aplicacion..."
                rows={2}
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
              Agregar
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !isAdding && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No hay competencias definidas.</p>
          {canAdd && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={14} className="mr-1" />
              Agregar competencia
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
