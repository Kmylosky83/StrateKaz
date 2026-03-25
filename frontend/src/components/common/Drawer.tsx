/**
 * Drawer - Panel lateral deslizable (Design System)
 *
 * Slide-over desde la derecha con Framer Motion.
 * Sigue el mismo patrón de BaseModal: portal, backdrop, Escape, scroll lock.
 */
import { ReactNode, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/common/Button';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DrawerProps {
  /** Control de apertura */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Título del drawer */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Contenido del drawer */
  children: ReactNode;
  /** Ancho del drawer */
  size?: DrawerSize;
  /** Footer sticky opcional */
  footer?: ReactNode;
  /** Cerrar al hacer click en backdrop */
  closeOnBackdrop?: boolean;
  /** Cerrar con tecla Escape */
  closeOnEscape?: boolean;
}

const sizeClasses: Record<DrawerSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const drawerVariants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } },
  exit: { x: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

export const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: DrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeOnEscapeRef = useRef(closeOnEscape);
  closeOnEscapeRef.current = closeOnEscape;

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget && closeOnBackdrop) {
        onClose();
      }
    },
    [onClose, closeOnBackdrop]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscapeRef.current) {
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    setTimeout(() => drawerRef.current?.focus(), 100);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            ref={drawerRef}
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            className={`
              w-full ${sizeClasses[size]}
              h-full flex flex-col outline-none
              bg-white dark:bg-gray-800
              shadow-2xl
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1.5 -mr-1.5 -mt-1.5 ml-4 flex-shrink-0"
                aria-label="Cerrar panel"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ minHeight: 0 }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
};
