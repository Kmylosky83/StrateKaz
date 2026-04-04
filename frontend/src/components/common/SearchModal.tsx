/**
 * SearchModal - Buscador contextual en modal flotante
 *
 * Se activa con un icono de lupa en el header.
 * No ocupa espacio permanente, aparece como popover/modal.
 *
 * Caracteristicas:
 * - Posicionado debajo del icono que lo activa
 * - Cierra al hacer click fuera o presionar Escape
 * - Muestra placeholder contextual
 * - Debounce en la busqueda
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SEARCH_MODAL_LABELS } from '@/constants';
import apiClient from '@/api/axios-config';

export interface SearchModalProps {
  /** Si el modal esta abierto */
  isOpen: boolean;
  /** Callback para cerrar */
  onClose: () => void;
  /** Placeholder del input */
  placeholder?: string;
  /** Valor actual */
  value: string;
  /** Callback cuando cambia el valor */
  onChange: (value: string) => void;
  /** Posicion del anchor (para posicionar el popover) */
  anchorRef?: React.RefObject<HTMLElement>;
}

interface DocumentoResult {
  id: number;
  codigo: string;
  titulo: string;
  estado: string;
  tipo_documento_nombre: string;
}

const ESTADO_LABELS: Record<string, string> = {
  PUBLICADO: 'Publicado',
  BORRADOR: 'Borrador',
  EN_REVISION: 'En Revisión',
  APROBADO: 'Aprobado',
  OBSOLETO: 'Obsoleto',
  ARCHIVADO: 'Archivado',
};

const ESTADO_COLORS: Record<string, string> = {
  PUBLICADO: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  BORRADOR: 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400',
  EN_REVISION: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
  APROBADO: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  OBSOLETO: 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  ARCHIVADO: 'text-gray-400 bg-gray-50 dark:bg-gray-800 dark:text-gray-500',
};

export const SearchModal = ({
  isOpen,
  onClose,
  placeholder = SEARCH_MODAL_LABELS.DEFAULT_PLACEHOLDER,
  value,
  onChange,
}: SearchModalProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce 350ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(value), 350);
    return () => clearTimeout(t);
  }, [value]);

  // Búsqueda de documentos via tsvector (≥3 chars)
  const { data: docResults, isFetching } = useQuery({
    queryKey: ['global-search-docs', debouncedQuery],
    queryFn: async () => {
      const res = await apiClient.get('/gestion-estrategica/documentos/', {
        params: { buscar: debouncedQuery, page_size: 6 },
      });
      const items = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      return items as DocumentoResult[];
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 30_000,
  });

  const handleSelect = useCallback(
    (id: number) => {
      navigate(`/gestion-documental/documentos?documento_id=${id}`);
      onClose();
      onChange('');
    },
    [navigate, onClose, onChange]
  );

  // Focus en el input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Pequeno delay para que el DOM este listo
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay para evitar que se cierre inmediatamente al abrir
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleClear = useCallback(() => {
    onChange('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  }, [onChange]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop sutil */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'fixed top-20 left-1/2 -translate-x-1/2 z-50',
          'w-full max-w-lg',
          'bg-white dark:bg-gray-800',
          'rounded-xl shadow-2xl',
          'border border-gray-200 dark:border-gray-700',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
      >
        {/* Header del modal */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'flex-1 bg-transparent',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-500 dark:placeholder:text-gray-400',
              'focus:outline-none',
              'text-base'
            )}
          />
          {value && (
            <button
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md',
              'text-xs text-gray-500 dark:text-gray-400',
              'bg-gray-100 dark:bg-gray-700',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'transition-colors'
            )}
          >
            <span>{SEARCH_MODAL_LABELS.ESCAPE}</span>
          </button>
        </div>

        {/* Contenido - Resultados o sugerencias */}
        <div className="max-h-[360px] overflow-y-auto">
          {/* Resultados de documentos */}
          {debouncedQuery.length >= 3 && (
            <div className="p-2">
              {isFetching ? (
                <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </div>
              ) : !docResults || docResults.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Sin resultados para &ldquo;{debouncedQuery}&rdquo;
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 py-1.5">
                    Documentos ({docResults.length})
                  </p>
                  {docResults.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelect(doc.id)}
                      className={cn(
                        'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left',
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
                      )}
                    >
                      <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {doc.codigo}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                              ESTADO_COLORS[doc.estado] ?? 'text-gray-500 bg-gray-100'
                            )}
                          >
                            {ESTADO_LABELS[doc.estado] ?? doc.estado}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {doc.titulo}
                        </p>
                        {doc.tipo_documento_nombre && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {doc.tipo_documento_nombre}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estado vacío inicial */}
          {debouncedQuery.length < 3 && (
            <div className="p-4 space-y-3">
              {value.length > 0 && value.length < 3 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
                  Escribe al menos 3 caracteres para buscar
                </p>
              ) : (
                <>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {SEARCH_MODAL_LABELS.QUICK_ACCESS}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <kbd className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      Ctrl + K
                    </kbd>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {SEARCH_MODAL_LABELS.SHORTCUT_DESCRIPTION}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer con atajos */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">↵</kbd>
              {SEARCH_MODAL_LABELS.SELECT}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">↑↓</kbd>
              {SEARCH_MODAL_LABELS.NAVIGATE}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Hook para controlar el SearchModal con atajo de teclado
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useSearchModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Atajo Ctrl+K para abrir
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
};

export default SearchModal;
