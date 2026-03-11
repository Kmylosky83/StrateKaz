/**
 * IconPicker - Selector de iconos dinamico desde la base de datos
 * Sistema de Gestion StrateKaz
 *
 * Permite seleccionar iconos que vienen de la API /icons/,
 * agrupados por categoria con busqueda integrada.
 *
 * @example
 * ```tsx
 * // Uso basico
 * <IconPicker
 *   value={selectedIcon}
 *   onChange={setSelectedIcon}
 * />
 *
 * // Filtrar por categoria
 * <IconPicker
 *   value={selectedIcon}
 *   onChange={setSelectedIcon}
 *   category="VALORES"
 * />
 *
 * // Con label y error
 * <IconPicker
 *   value={selectedIcon}
 *   onChange={setSelectedIcon}
 *   label="Seleccionar Icono"
 *   error="Este campo es requerido"
 * />
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DynamicIcon } from './DynamicIcon';
import { useIcons, useIconsByCategory, type IconRegistryItem } from '@/hooks/useIcons';
import { Input } from '@/components/forms';
import { Spinner } from './Spinner';

// ==================== TYPES ====================

export interface IconPickerProps {
  /** Nombre del icono seleccionado */
  value?: string | null;
  /** Callback cuando se selecciona un icono */
  onChange: (iconName: string) => void;
  /** Filtrar por categoria especifica */
  category?: string;
  /** Etiqueta del campo */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Texto de ayuda */
  helperText?: string;
  /** Deshabilitar el selector */
  disabled?: boolean;
  /** Clases CSS adicionales */
  className?: string;
  /** Numero de columnas del grid (default: 5) */
  columns?: number;
  /** Tamano de los iconos en el picker (default: 20) */
  iconSize?: number;
}

// ==================== COMPONENT ====================

export function IconPicker({
  value,
  onChange,
  category,
  label,
  error,
  helperText,
  disabled = false,
  className,
  columns = 5,
  iconSize = 20,
}: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Obtener iconos segun si hay categoria o no
  const {
    icons: allIcons,
    categories,
    isLoading: isLoadingAll,
  } = useIcons({
    enabled: !category,
  });

  const { icons: categoryIcons, isLoading: isLoadingCategory } = useIconsByCategory(category || '');

  // Determinar que iconos usar
  const icons = category ? categoryIcons : allIcons;
  const isLoading = category ? isLoadingCategory : isLoadingAll;

  // Filtrar iconos por busqueda
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return icons;

    const q = searchQuery.toLowerCase();
    return icons.filter(
      (icon) =>
        icon.name.toLowerCase().includes(q) ||
        icon.label.toLowerCase().includes(q) ||
        (icon.keywords && icon.keywords.toLowerCase().includes(q))
    );
  }, [icons, searchQuery]);

  // Agrupar por categoria si no hay filtro de categoria
  const groupedIcons = useMemo(() => {
    if (category) {
      return { [category]: filteredIcons };
    }

    const groups: Record<string, IconRegistryItem[]> = {};
    filteredIcons.forEach((icon) => {
      if (!groups[icon.category]) {
        groups[icon.category] = [];
      }
      groups[icon.category].push(icon);
    });
    return groups;
  }, [filteredIcons, category]);

  // Obtener nombre de categoria
  const getCategoryName = useCallback(
    (code: string) => {
      const cat = categories.find((c) => c.code === code);
      return cat?.name || code;
    },
    [categories]
  );

  // Manejar seleccion
  const handleSelect = useCallback(
    (iconName: string) => {
      if (!disabled) {
        onChange(iconName);
      }
    },
    [disabled, onChange]
  );

  // Limpiar busqueda
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Container */}
      <div
        className={cn(
          'border rounded-lg overflow-hidden transition-colors',
          error
            ? 'border-danger-500 dark:border-danger-400'
            : 'border-gray-300 dark:border-gray-600',
          disabled ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-white dark:bg-gray-900'
        )}
      >
        {/* Search Bar */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar icono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              className={cn(
                'w-full pl-9 pr-8 py-2 text-sm rounded-md',
                'bg-white dark:bg-gray-700',
                'border border-gray-200 dark:border-gray-600',
                'text-gray-900 dark:text-gray-100',
                'placeholder-gray-400 dark:placeholder-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
                disabled && 'cursor-not-allowed'
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="p-3 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
              <span className="ml-2 text-sm text-gray-500">Cargando iconos...</span>
            </div>
          ) : filteredIcons.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <DynamicIcon name="SearchX" size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron iconos</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-2 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  Limpiar busqueda
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedIcons).map(([categoryCode, categoryIcons]) => (
                <div key={categoryCode}>
                  {/* Category Header (only if showing all categories) */}
                  {!category && (
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {getCategoryName(categoryCode)}
                    </h4>
                  )}

                  {/* Icons Grid */}
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                  >
                    {categoryIcons.map((icon) => (
                      <button
                        key={`${icon.category}-${icon.name}`}
                        type="button"
                        onClick={() => handleSelect(icon.name)}
                        disabled={disabled}
                        title={icon.label}
                        className={cn(
                          'p-2 rounded-lg transition-all flex items-center justify-center',
                          value === icon.name
                            ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500 dark:bg-purple-900/50 dark:text-purple-300'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                          disabled && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <DynamicIcon name={icon.name} size={iconSize} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Icon Preview */}
        {value && (
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2 text-sm">
              <DynamicIcon
                name={value}
                size={16}
                className="text-purple-600 dark:text-purple-400"
              />
              <span className="text-gray-600 dark:text-gray-400">
                Seleccionado: <strong className="text-gray-900 dark:text-gray-100">{value}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}
    </div>
  );
}

export default IconPicker;
