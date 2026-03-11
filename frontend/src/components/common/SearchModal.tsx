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
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SEARCH_MODAL_LABELS } from '@/constants';

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

export const SearchModal = ({
  isOpen,
  onClose,
  placeholder = SEARCH_MODAL_LABELS.DEFAULT_PLACEHOLDER,
  value,
  onChange,
}: SearchModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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
        <div className="p-4 max-h-[300px] overflow-y-auto">
          {value ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {/* TODO: Mostrar resultados de busqueda */}
              <p>{SEARCH_MODAL_LABELS.SEARCHING(value)}</p>
            </div>
          ) : (
            <div className="space-y-3">
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
