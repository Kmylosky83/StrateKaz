/**
 * AlertModal - Modal para alertas y notificaciones importantes
 *
 * Características:
 * - Auto-cierre opcional
 * - 4 variantes: success, error, warning, info
 * - Acciones primarias/secundarias
 * - Ideal para notificaciones
 */
import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button } from '@/components/common/Button';
import { backdropVariants, modalVariants } from '@/lib/animations';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertModalProps {
  /** Control de apertura del modal */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Título del modal */
  title: string;
  /** Mensaje de la alerta */
  message: string;
  /** Variante visual */
  variant?: AlertVariant;
  /** Auto-cerrar después de X ms (0 = desactivado) */
  autoClose?: number;
  /** Callback para acción primaria */
  onPrimaryAction?: () => void;
  /** Texto de acción primaria */
  primaryLabel?: string;
  /** Callback para acción secundaria */
  onSecondaryAction?: () => void;
  /** Texto de acción secundaria */
  secondaryLabel?: string;
  /** Mostrar botón de cerrar */
  showCloseButton?: boolean;
}

const variantConfig: Record<
  AlertVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    borderColor: string;
  }
> = {
  success: {
    icon: CheckCircle,
    iconBg: 'bg-success-100 dark:bg-success-900/30',
    iconColor: 'text-success-600 dark:text-success-400',
    borderColor: 'border-success-200 dark:border-success-800',
  },
  error: {
    icon: XCircle,
    iconBg: 'bg-danger-100 dark:bg-danger-900/30',
    iconColor: 'text-danger-600 dark:text-danger-400',
    borderColor: 'border-danger-200 dark:border-danger-800',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning-100 dark:bg-warning-900/30',
    iconColor: 'text-warning-600 dark:text-warning-400',
    borderColor: 'border-warning-200 dark:border-warning-800',
  },
  info: {
    icon: Info,
    iconBg: 'bg-info-100 dark:bg-info-900/30',
    iconColor: 'text-info-600 dark:text-info-400',
    borderColor: 'border-info-200 dark:border-info-800',
  },
};

export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  autoClose = 0,
  onPrimaryAction,
  primaryLabel,
  onSecondaryAction,
  secondaryLabel,
  showCloseButton = true,
}: AlertModalProps) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  // Auto-cierre
  useEffect(() => {
    if (isOpen && autoClose > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const hasActions = onPrimaryAction || onSecondaryAction;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`
              w-full max-w-md
              bg-white dark:bg-gray-800
              rounded-2xl shadow-xl
              border-l-4 ${config.borderColor}
              overflow-hidden
            `}
          >
            {/* Content */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-2 rounded-full ${config.iconBg} flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${config.iconColor}`} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </h3>
                    {showCloseButton && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
                </div>
              </div>

              {/* Actions */}
              {hasActions && (
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {onSecondaryAction && secondaryLabel && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        onSecondaryAction();
                        onClose();
                      }}
                    >
                      {secondaryLabel}
                    </Button>
                  )}
                  {onPrimaryAction && primaryLabel && (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        onPrimaryAction();
                        onClose();
                      }}
                    >
                      {primaryLabel}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Auto-close progress bar */}
            {autoClose > 0 && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: autoClose / 1000, ease: 'linear' }}
                className={`h-1 origin-left ${
                  variant === 'success'
                    ? 'bg-success-500'
                    : variant === 'error'
                    ? 'bg-danger-500'
                    : variant === 'warning'
                    ? 'bg-warning-500'
                    : 'bg-info-500'
                }`}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
