/**
 * MultiSelectCombobox — Dropdown multi-selección con chips y búsqueda.
 *
 * Usage:
 *   <MultiSelectCombobox
 *     label="Productos que suministra"
 *     options={productos.map(p => ({ value: p.id, label: p.nombre }))}
 *     value={selectedIds}
 *     onChange={setSelectedIds}
 *     placeholder="Buscar productos..."
 *   />
 *
 * Notas:
 *   - A11y: keyboard nav (flecha abajo/arriba, enter para toggle, esc cierra)
 *   - Chips removibles con X
 *   - Filtrado insensitive con highlighting básico
 *   - No depende de librerías externas (shadcn-style custom).
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Check, ChevronDown, X, Search } from 'lucide-react';

export interface MultiSelectOption {
  value: number | string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface MultiSelectComboboxProps {
  options: MultiSelectOption[];
  value: Array<number | string>;
  onChange: (value: Array<number | string>) => void;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  maxChipsVisible?: number;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function MultiSelectCombobox({
  options,
  value,
  onChange,
  label,
  placeholder = 'Seleccionar...',
  emptyMessage = 'Sin resultados',
  maxChipsVisible = 6,
  disabled = false,
  error,
  helperText,
  required = false,
}: MultiSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search al abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q))
    );
  }, [options, search]);

  const selectedOptions = useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value]
  );

  const toggleOption = useCallback(
    (optValue: number | string) => {
      const next = value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue];
      onChange(next);
    },
    [value, onChange]
  );

  const removeChip = (optValue: number | string) => {
    onChange(value.filter((v) => v !== optValue));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filteredOptions[activeIndex];
      if (opt && !opt.disabled) toggleOption(opt.value);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  };

  // Reset activeIndex cuando cambia el filtro
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  const extraCount = Math.max(0, selectedOptions.length - maxChipsVisible);
  const visibleChips = selectedOptions.slice(0, maxChipsVisible);

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger — div role=combobox para evitar <button> anidado en chips */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((v) => !v)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((v) => !v);
          } else if (e.key === 'ArrowDown' && !isOpen) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`w-full min-h-[2.5rem] px-3 py-1.5 rounded-lg border text-left flex items-center gap-2 flex-wrap transition-colors
          ${error ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60' : 'bg-white dark:bg-gray-800 hover:border-primary-400 cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-primary-500`}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-sm">{placeholder}</span>
        ) : (
          <>
            {visibleChips.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 rounded text-xs font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(opt.value);
                  }}
                  className="hover:text-primary-600 dark:hover:text-primary-100"
                  aria-label={`Quitar ${opt.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {extraCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">+{extraCount} más</span>
            )}
          </>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="relative">
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar..."
                  className="w-full pl-8 pr-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Options */}
            <div className="overflow-y-auto flex-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </div>
              ) : (
                <ul role="listbox" className="py-1">
                  {filteredOptions.map((opt, idx) => {
                    const selected = value.includes(opt.value);
                    const isActive = idx === activeIndex;
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => !opt.disabled && toggleOption(opt.value)}
                        className={`px-3 py-2 flex items-center gap-2 cursor-pointer text-sm
                          ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                          ${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''}
                          ${selected ? 'font-medium' : ''}`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                            ${selected ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-600'}`}
                        >
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 dark:text-white truncate">{opt.label}</div>
                          {opt.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {opt.description}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer con contador */}
            {selectedOptions.length > 0 && (
              <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {selectedOptions.length} de {options.length} seleccionado
                  {selectedOptions.length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-danger-600 hover:underline"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {(error || helperText) && (
        <p
          className={`mt-1 text-xs ${error ? 'text-danger-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default MultiSelectCombobox;
