/**
 * GDSearchModal — Búsqueda rápida de documentos (Ctrl+K).
 *
 * Filtra client-side sobre código + título de documentos ya cargados.
 * Resultados con teclado: ↑↓ navegar, Enter abrir, Escape cerrar.
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/common';
import { useDocumentos } from '../hooks/useGestionDocumental';

const ESTADO_VARIANT: Record<string, 'success' | 'warning' | 'secondary' | 'info' | 'danger'> = {
  PUBLICADO: 'success',
  APROBADO: 'info',
  EN_REVISION: 'warning',
  BORRADOR: 'secondary',
  OBSOLETO: 'danger',
  ARCHIVADO: 'secondary',
};

interface GDSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocumento: (id: number) => void;
}

export function GDSearchModal({ isOpen, onClose, onSelectDocumento }: GDSearchModalProps) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { data: documentos = [] } = useDocumentos();

  const results = useMemo(() => {
    if (!query.trim()) return documentos.slice(0, 8);
    const term = query.toLowerCase();
    return documentos
      .filter((d) => d.titulo.toLowerCase().includes(term) || d.codigo.toLowerCase().includes(term))
      .slice(0, 12);
  }, [query, documentos]);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Mantener cursor dentro de rango cuando cambian resultados
  useEffect(() => {
    setCursor(0);
  }, [results.length]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && results[cursor]) {
      handleSelect(results[cursor].id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  function handleSelect(id: number) {
    onSelectDocumento(id);
    onClose();
  }

  if (!isOpen) return null;

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar documentos por código o título..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-base text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resultados */}
        {results.length > 0 ? (
          <ul ref={listRef} className="max-h-80 overflow-y-auto py-1">
            {results.map((doc, idx) => (
              <li key={doc.id}>
                <button
                  onClick={() => handleSelect(doc.id)}
                  onMouseEnter={() => setCursor(idx)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors',
                    cursor === idx
                      ? 'bg-indigo-50 dark:bg-indigo-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                >
                  <FileText className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {doc.codigo}
                      </span>
                      <Badge variant={ESTADO_VARIANT[doc.estado] || 'secondary'} size="sm">
                        {doc.estado}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5 truncate">
                      {doc.titulo}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No se encontraron documentos
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-400">
          <span>
            <kbd className="font-mono">↑↓</kbd> navegar
          </span>
          <span>
            <kbd className="font-mono">Enter</kbd> abrir
          </span>
          <span>
            <kbd className="font-mono">Esc</kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
