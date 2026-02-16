/**
 * BaseModal - Modal base con Framer Motion
 *
 * Características:
 * - Animaciones de entrada/salida suaves
 * - Focus trap automático
 * - Cierre con Escape y click fuera
 * - Body scroll lock
 * - 9 tamaños configurables
 * - Accesibilidad completa (ARIA)
 * - Portal rendering
 * - MS-002: Indicadores de scroll (sombras arriba/abajo)
 */
import { ReactNode, useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { backdropVariants, modalVariants } from '@/lib/animations';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';

export interface BaseModalProps {
  /** Control de apertura del modal */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Título del modal */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Contenido del modal */
  children: ReactNode;
  /** Tamaño del modal */
  size?: ModalSize;
  /** Mostrar botón de cerrar */
  showCloseButton?: boolean;
  /** Cerrar al hacer click fuera */
  closeOnBackdrop?: boolean;
  /** Cerrar con tecla Escape */
  closeOnEscape?: boolean;
  /** Footer personalizado */
  footer?: ReactNode;
  /** Clases adicionales para el contenedor */
  className?: string;
  /** ID para accesibilidad */
  id?: string;
}

// MS-003: Responsive - En mobile todos los modales ocupan ancho completo
const sizeClasses: Record<ModalSize, string> = {
  xs: 'max-w-xs w-full',
  sm: 'max-w-sm w-full',
  md: 'max-w-md w-full',
  lg: 'max-w-lg w-full',
  xl: 'max-w-xl w-full',
  '2xl': 'max-w-2xl w-full',
  '3xl': 'max-w-3xl w-full',
  '4xl': 'max-w-4xl w-full',
  full: 'max-w-[95vw] w-full',
};

export const BaseModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  className = '',
  id,
}: BaseModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const hasInitialFocus = useRef(false);

  // MS-002: Estado para indicadores de scroll
  const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false });

  // MS-002: Actualizar estado de scroll
  const updateScrollIndicators = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    const canScrollUp = el.scrollTop > 0;
    const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1;

    setScrollState((prev) => {
      if (prev.canScrollUp !== canScrollUp || prev.canScrollDown !== canScrollDown) {
        return { canScrollUp, canScrollDown };
      }
      return prev;
    });
  }, []);

  // Refs estables para callbacks (evita re-ejecutar effects en cada render)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeOnEscapeRef = useRef(closeOnEscape);
  closeOnEscapeRef.current = closeOnEscape;

  // Focus trap y scroll lock — SOLO depende de isOpen
  useEffect(() => {
    if (isOpen) {
      // Guardar elemento activo actual
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Bloquear scroll del body
      document.body.style.overflow = 'hidden';

      // Agregar listener de Escape (usa refs para evitar recrear el handler)
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscapeRef.current) {
          onCloseRef.current();
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      // Focus al modal SOLO en la primera apertura
      if (!hasInitialFocus.current) {
        setTimeout(() => {
          modalRef.current?.focus();
          updateScrollIndicators();
        }, 100);
        hasInitialFocus.current = true;
      }

      return () => {
        // Restaurar scroll
        document.body.style.overflow = '';

        // Remover listener
        document.removeEventListener('keydown', handleKeyDown);

        // Restaurar focus
        previousActiveElement.current?.focus();

        // Reset para próxima apertura
        hasInitialFocus.current = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // MS-002: Observer para detectar cambios de contenido
  useEffect(() => {
    const el = contentRef.current;
    if (!el || !isOpen) return;

    const resizeObserver = new ResizeObserver(updateScrollIndicators);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, [isOpen, updateScrollIndicators]);

  // Click en backdrop
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
          aria-labelledby={id ? `${id}-title` : undefined}
          aria-describedby={id ? `${id}-description` : undefined}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            className={`
              w-full ${sizeClasses[size]}
              bg-white dark:bg-gray-800
              rounded-xl sm:rounded-2xl shadow-xl
              max-h-[95vh] sm:max-h-[90vh] flex flex-col
              outline-none
              ${className}
            `}
          >
            {/* Header - MS-003: Responsive padding */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h2
                  id={id ? `${id}-title` : undefined}
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  {title}
                </h2>
                {subtitle && (
                  <p
                    id={id ? `${id}-description` : undefined}
                    className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1.5 -mr-1.5 -mt-1.5"
                  aria-label="Cerrar modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Body - Con scroll */}
            <div
              ref={contentRef}
              onScroll={updateScrollIndicators}
              className="flex-1 overflow-y-auto p-4 sm:p-6 relative"
              style={{ minHeight: 0 }}
            >
              {/* Sombra superior (indica más contenido arriba) */}
              <div
                className={`
                  sticky top-0 left-0 right-0 h-4 -mt-4 -mx-4 sm:-mx-6 z-10
                  bg-gradient-to-b from-white/90 dark:from-gray-800/90 to-transparent
                  pointer-events-none transition-opacity duration-200
                  ${scrollState.canScrollUp ? 'opacity-100' : 'opacity-0'}
                `}
              />

              {children}

              {/* Sombra inferior (indica más contenido abajo) */}
              <div
                className={`
                  sticky bottom-0 left-0 right-0 h-4 -mb-4 -mx-4 sm:-mx-6 z-10
                  bg-gradient-to-t from-white/90 dark:from-gray-800/90 to-transparent
                  pointer-events-none transition-opacity duration-200
                  ${scrollState.canScrollDown ? 'opacity-100' : 'opacity-0'}
                `}
              />
            </div>

            {/* Footer - MS-003: Responsive padding */}
            {footer && (
              <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Renderizar en portal
  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
