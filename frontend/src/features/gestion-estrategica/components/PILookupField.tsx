/**
 * PILookupField — Campo de búsqueda para vincular una Parte Interesada (C1).
 *
 * Cross-module: usado por Supply Chain (Proveedor), Sales CRM (Cliente),
 * Talent Hub (Colaborador) para vincular con PI de Fundación.
 *
 * REORG-B7: Componente reutilizable.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { Link2, X, Search } from 'lucide-react';
import { usePartesInteresadas } from '../hooks/usePartesInteresadas';

interface PILookupFieldProps {
  value: number | null | undefined;
  displayName?: string;
  onChange: (piId: number | null, piNombre: string) => void;
  label?: string;
}

export const PILookupField = ({
  value,
  displayName,
  onChange,
  label = 'Parte Interesada',
}: PILookupFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: piData } = usePartesInteresadas();
  const items = useMemo(() => {
    const all = Array.isArray(piData) ? piData : (piData?.results ?? []);
    if (!search) return all.slice(0, 20);
    const lower = search.toLowerCase();
    return all
      .filter(
        (pi) =>
          pi.nombre.toLowerCase().includes(lower) || pi.tipo_nombre?.toLowerCase().includes(lower)
      )
      .slice(0, 20);
  }, [piData, search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (piId: number, piNombre: string) => {
    onChange(piId, piNombre);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange(null, '');
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        <Link2 className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
        {label}
      </label>

      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
          <Link2 className="h-4 w-4 text-violet-500 flex-shrink-0" />
          <span className="text-sm text-violet-700 dark:text-violet-300 flex-1 truncate">
            {displayName || `PI #${value}`}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 text-violet-400 hover:text-red-500 transition-colors"
            title="Desvincular"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-violet-400 dark:hover:border-violet-500 transition-colors bg-white dark:bg-gray-800"
        >
          <Search className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Buscar parte interesada...</span>
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nombre o tipo..."
              className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none"
              autoFocus
            />
          </div>
          <ul className="overflow-y-auto max-h-48">
            {items.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 italic">Sin resultados</li>
            ) : (
              items.map((pi) => (
                <li
                  key={pi.id}
                  onMouseDown={() => handleSelect(pi.id, pi.nombre)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20"
                >
                  <p className="font-medium text-gray-900 dark:text-white">{pi.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {pi.tipo_nombre} · {pi.grupo_nombre}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
