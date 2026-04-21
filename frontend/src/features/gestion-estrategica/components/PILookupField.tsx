/**
 * PILookupField — Campo de búsqueda para vincular una Parte Interesada (C1).
 *
 * Cross-module: usado por Supply Chain (Proveedor), Sales CRM (Cliente),
 * Talent Hub (Colaborador) para vincular con PI de Fundación.
 *
 * Doctrina 2026-04-21: vincular una PI NO requiere permiso de gestión sobre
 * fundacion.partes_interesadas. Usa el endpoint ligero /core/select-lists/
 * que solo exige estar autenticado. La gestión completa sigue restringida.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { Link2, X, Search, AlertTriangle } from 'lucide-react';
import { useSelectPartesInteresadas } from '@/hooks/useSelectLists';

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

  const { data: piData = [], isLoading, isError } = useSelectPartesInteresadas();
  const items = useMemo(() => {
    if (!search) return piData.slice(0, 50);
    const lower = search.toLowerCase();
    return piData
      .filter((pi) => {
        const tipoNombre = String(pi.extra?.tipo_nombre ?? '');
        return pi.label.toLowerCase().includes(lower) || tipoNombre.toLowerCase().includes(lower);
      })
      .slice(0, 50);
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
            {isLoading ? (
              <li className="px-3 py-4 text-sm text-gray-500 italic text-center">
                Cargando partes interesadas...
              </li>
            ) : isError ? (
              <li className="px-3 py-4 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Error al cargar partes interesadas</span>
              </li>
            ) : items.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 italic">
                {search
                  ? 'Sin resultados. Pruebe con otra búsqueda.'
                  : 'No hay partes interesadas registradas. Cree una en Fundación → Contexto.'}
              </li>
            ) : (
              items.map((pi) => (
                <li
                  key={pi.id}
                  onMouseDown={() => handleSelect(pi.id, pi.label)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20"
                >
                  <p className="font-medium text-gray-900 dark:text-white">{pi.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {pi.extra?.tipo_nombre}
                    {pi.extra?.grupo_nombre ? ` · ${pi.extra.grupo_nombre}` : ''}
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
