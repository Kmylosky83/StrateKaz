import { useState } from 'react';
import { ChevronDown, ChevronRight, Package, HelpCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  JERARQUIA_MATERIA_PRIMA,
  type CategoriaMateriaPrima,
  type CodigoMateriaPrima,
} from '@/types/proveedores.types';

interface MateriasPrimasSelectorProps {
  value: CodigoMateriaPrima[];
  onChange: (materias: CodigoMateriaPrima[]) => void;
  error?: string;
  disabled?: boolean;
}

const CATEGORIAS_ORDER: CategoriaMateriaPrima[] = ['HUESO', 'SEBO_CRUDO', 'SEBO_PROCESADO', 'OTROS'];

export const MateriasPrimasSelector = ({
  value = [],
  onChange,
  error,
  disabled = false,
}: MateriasPrimasSelectorProps) => {
  const [expandedCategories, setExpandedCategories] = useState<CategoriaMateriaPrima[]>(['HUESO', 'SEBO_CRUDO']);

  const toggleCategory = (categoria: CategoriaMateriaPrima) => {
    setExpandedCategories((prev) =>
      prev.includes(categoria)
        ? prev.filter((c) => c !== categoria)
        : [...prev, categoria]
    );
  };

  const toggleItem = (codigo: CodigoMateriaPrima) => {
    if (disabled) return;

    if (value.includes(codigo)) {
      onChange(value.filter((c) => c !== codigo));
    } else {
      onChange([...value, codigo]);
    }
  };

  const toggleAllInCategory = (categoria: CategoriaMateriaPrima) => {
    if (disabled) return;

    const items = JERARQUIA_MATERIA_PRIMA[categoria].items.map((i) => i.codigo);
    const allSelected = items.every((codigo) => value.includes(codigo));

    if (allSelected) {
      // Deseleccionar todos
      onChange(value.filter((c) => !items.includes(c)));
    } else {
      // Seleccionar todos los que faltan
      const newValues = [...value];
      items.forEach((codigo) => {
        if (!newValues.includes(codigo)) {
          newValues.push(codigo);
        }
      });
      onChange(newValues);
    }
  };

  const getCategorySelectionState = (categoria: CategoriaMateriaPrima): 'none' | 'partial' | 'all' => {
    const items = JERARQUIA_MATERIA_PRIMA[categoria].items.map((i) => i.codigo);
    const selectedCount = items.filter((codigo) => value.includes(codigo)).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === items.length) return 'all';
    return 'partial';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Materias Primas que maneja este proveedor *
      </label>

      {/* Caja de ayuda destacada */}
      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700 mb-3">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              ¿Qué debo seleccionar?
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Seleccione <strong>únicamente</strong> los tipos de materia prima que este proveedor le vende.
              Por ejemplo: si solo le compra "Hueso Crudo" y "Sebo Crudo Carnicería", seleccione solo esos dos.
              NO necesita seleccionar todos.
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        "border rounded-lg overflow-hidden",
        error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
        disabled && "opacity-60 cursor-not-allowed"
      )}>
        {CATEGORIAS_ORDER.map((categoriaKey) => {
          const categoria = JERARQUIA_MATERIA_PRIMA[categoriaKey];
          const isExpanded = expandedCategories.includes(categoriaKey);
          const selectionState = getCategorySelectionState(categoriaKey);

          return (
            <div key={categoriaKey} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              {/* Header de categoría */}
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                  disabled && "cursor-not-allowed"
                )}
                onClick={() => !disabled && toggleCategory(categoriaKey)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <Package className="h-4 w-4 text-primary-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {categoria.nombre}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({categoria.items.length} tipos)
                  </span>
                </div>

                {/* Checkbox de categoría completa */}
                <div className="flex items-center gap-2">
                  {selectionState !== 'none' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {categoria.items.filter((i) => value.includes(i.codigo)).length} seleccionados
                    </span>
                  )}
                  <input
                    type="checkbox"
                    checked={selectionState === 'all'}
                    ref={(el) => {
                      if (el) el.indeterminate = selectionState === 'partial';
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleAllInCategory(categoriaKey);
                    }}
                    disabled={disabled}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Items de la categoría */}
              {isExpanded && (
                <div className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {categoria.items.map((item) => {
                    const isSelected = value.includes(item.codigo);

                    return (
                      <label
                        key={item.codigo}
                        className={cn(
                          "flex items-center justify-between px-4 py-2.5 pl-12 cursor-pointer transition-colors",
                          isSelected
                            ? "bg-primary-50 dark:bg-primary-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800",
                          disabled && "cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(item.codigo)}
                            disabled={disabled}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <span className={cn(
                            "text-sm",
                            isSelected
                              ? "text-primary-700 dark:text-primary-300 font-medium"
                              : "text-gray-700 dark:text-gray-300"
                          )}>
                            {item.nombre}
                          </span>
                        </div>

                        {/* Badge de acidez para sebo procesado */}
                        {item.acidez_min !== undefined && (
                          <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Acidez: {item.acidez_min}% - {item.acidez_max === 100 ? '>' : item.acidez_max + '%'}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumen de selección */}
      {value.length > 0 && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
            {value.length} materia{value.length !== 1 ? 's' : ''} prima{value.length !== 1 ? 's' : ''} seleccionada{value.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Después de crear el proveedor, el Gerente podrá asignar precios a cada tipo de materia prima.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
