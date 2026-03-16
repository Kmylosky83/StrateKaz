/**
 * IconPicker - Selector de iconos de Lucide React
 *
 * Usa directamente el catálogo completo de Lucide (1400+ iconos)
 * sin depender de API backend. Búsqueda por nombre con scroll virtual.
 *
 * @example
 * ```tsx
 * <IconPicker value={selectedIcon} onChange={setSelectedIcon} />
 * <IconPicker value={icon} onChange={setIcon} label="Seleccionar Icono" />
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DynamicIcon, getAvailableIconNames } from './DynamicIcon';

// ==================== TYPES ====================

export interface IconPickerProps {
  /** Nombre del icono seleccionado */
  value?: string | null;
  /** Callback cuando se selecciona un icono */
  onChange: (iconName: string) => void;
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
  /** Numero de columnas del grid (default: 8) */
  columns?: number;
  /** Tamano de los iconos en el picker (default: 20) */
  iconSize?: number;
  /** Máximo de iconos a mostrar (default: 200) */
  maxVisible?: number;
}

// Catálogo de iconos cacheado (se calcula 1 sola vez)
let _cachedIcons: string[] | null = null;
function getAllIcons(): string[] {
  if (!_cachedIcons) {
    _cachedIcons = getAvailableIconNames();
  }
  return _cachedIcons;
}

// ==================== COMPONENT ====================

export function IconPicker({
  value,
  onChange,
  label,
  error,
  helperText,
  disabled = false,
  className,
  columns = 8,
  iconSize = 20,
  maxVisible = 200,
}: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const allIcons = getAllIcons();

  // Filtrar y limitar iconos
  const filteredIcons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allIcons.slice(0, maxVisible);

    return allIcons.filter((name) => name.toLowerCase().includes(q)).slice(0, maxVisible);
  }, [allIcons, searchQuery, maxVisible]);

  const handleSelect = useCallback(
    (iconName: string) => {
      if (!disabled) onChange(iconName);
    },
    [disabled, onChange]
  );

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

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
          {filteredIcons.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <DynamicIcon name="SearchX" size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron iconos</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-2 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {filteredIcons.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => handleSelect(iconName)}
                  disabled={disabled}
                  title={iconName}
                  className={cn(
                    'p-2 rounded-lg transition-all flex items-center justify-center',
                    value === iconName
                      ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500 dark:bg-purple-900/50 dark:text-purple-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <DynamicIcon name={iconName} size={iconSize} />
                </button>
              ))}
            </div>
          )}

          {/* Indicador de total */}
          {!searchQuery && allIcons.length > maxVisible && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
              Mostrando {maxVisible} de {allIcons.length} iconos — busca para filtrar
            </p>
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

      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}
    </div>
  );
}

export default IconPicker;
