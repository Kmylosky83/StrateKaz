/**
 * SearchableSelect — Dropdown single-select con búsqueda (typeahead).
 *
 * Usage:
 *   <SearchableSelect
 *     label="Proveedor"
 *     options={proveedores.map(p => ({
 *       value: p.id,
 *       label: p.nombre_comercial,
 *       secondary: p.codigo,  // se muestra al lado del label
 *       description: p.ciudad_nombre,  // texto pequeño debajo
 *     }))}
 *     value={selectedId}
 *     onChange={setSelectedId}
 *     placeholder="Buscar proveedor..."
 *   />
 *
 * A11y: keyboard nav (arrow keys, Enter, Esc), focus visible, aria-expanded.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchableOption {
  value: number | string;
  label: string;
  secondary?: string;
  description?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  allowClear?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Seleccionar...',
  emptyMessage = 'Sin resultados',
  disabled = false,
  error,
  helperText,
  required = false,
  allowClear = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const haystack = [o.label, o.secondary, o.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [options, search]);

  // Click fuera cierra
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Focus input al abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Reset active cuando filtra
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  const handleSelect = useCallback(
    (opt: SearchableOption) => {
      if (opt.disabled) return;
      onChange(opt.value);
      setIsOpen(false);
      setSearch('');
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      setSearch('');
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      handleSelect(filtered[activeIndex]);
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-danger-600 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((o) => !o)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`
            w-full flex items-center justify-between gap-2
            min-h-[44px] px-3 py-2
            rounded-lg border bg-white dark:bg-gray-800
            text-left text-sm
            transition-colors
            ${
              disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:border-primary-400 dark:hover:border-primary-500'
            }
            ${
              error
                ? 'border-danger-500 focus:ring-danger-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-1
          `}
        >
          <span
            className={`flex-1 truncate ${
              selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.secondary && (
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    {selected.secondary}
                  </span>
                )}
                <span>{selected.label}</span>
              </span>
            ) : (
              placeholder
            )}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {selected && allowClear && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="text-gray-400 hover:text-danger-600 p-0.5 rounded"
                aria-label="Limpiar selección"
              >
                <X className="w-4 h-4" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {isOpen && (
          <div
            className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
            role="listbox"
          >
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
                  className="w-full pl-8 pr-2 py-1.5 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                  {emptyMessage}
                </li>
              ) : (
                filtered.map((opt, idx) => {
                  const isSel = opt.value === value;
                  const isActive = idx === activeIndex;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSel}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`
                        px-3 py-2 cursor-pointer text-sm flex items-start gap-2
                        ${
                          opt.disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : isActive
                              ? 'bg-primary-50 dark:bg-primary-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                        }
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {opt.secondary && (
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400 shrink-0">
                              {opt.secondary}
                            </span>
                          )}
                          <span className="truncate text-gray-900 dark:text-white">
                            {opt.label}
                          </span>
                        </div>
                        {opt.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {opt.description}
                          </p>
                        )}
                      </div>
                      {isSel && (
                        <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
