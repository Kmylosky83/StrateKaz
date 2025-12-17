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
 */
import { ReactNode, useEffect, useRef, useCallback } from 'react';
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

const sizeClasses: Record<ModalSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
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
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Manejar tecla Escape
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Focus trap y scroll lock
  useEffect(() => {
    if (isOpen) {
      // Guardar elemento activo actual
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Bloquear scroll del body
      document.body.style.overflow = 'hidden';

      // Agregar listener de Escape
      document.addEventListener('keydown', handleKeyDown);

      // Focus al modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);

      return () => {
        // Restaurar scroll
        document.body.style.overflow = '';

        // Remover listener
        document.removeEventListener('keydown', handleKeyDown);

        // Restaurar focus
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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
              rounded-2xl shadow-xl
              max-h-[90vh] flex flex-col
              outline-none
              ${className}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
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
