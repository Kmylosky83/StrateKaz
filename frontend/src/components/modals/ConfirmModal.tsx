/**
 * ConfirmModal - Modal de confirmación para acciones
 *
 * Características:
 * - 4 variantes: danger, warning, info, success
 * - Iconos contextuales
 * - Confirmación con frase para acciones críticas
 * - Loading state
 * - Ideal para acciones destructivas
 */
import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info, Trash2, X } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmModalProps {
  /** Control de apertura del modal */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Callback al confirmar */
  onConfirm: () => void | Promise<void>;
  /** Título del modal */
  title: string;
  /** Mensaje de confirmación */
  message: string;
  /** Variante visual */
  variant?: ConfirmVariant;
  /** Texto del botón de confirmar */
  confirmLabel?: string;
  /** Texto del botón de cancelar */
  cancelLabel?: string;
  /** Frase requerida para confirmar (para acciones críticas) */
  confirmPhrase?: string;
  /** Estado de carga */
  isLoading?: boolean;
  /** Icono personalizado */
  icon?: React.ComponentType<{ className?: string }>;
}

const variantConfig: Record<
  ConfirmVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    buttonVariant: 'danger' | 'warning' | 'primary' | 'success';
  }
> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-danger-100 dark:bg-danger-900/30',
    iconColor: 'text-danger-600 dark:text-danger-400',
    buttonVariant: 'danger',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning-100 dark:bg-warning-900/30',
    iconColor: 'text-warning-600 dark:text-warning-400',
    buttonVariant: 'warning',
  },
  info: {
    icon: Info,
    iconBg: 'bg-info-100 dark:bg-info-900/30',
    iconColor: 'text-info-600 dark:text-info-400',
    buttonVariant: 'primary',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-success-100 dark:bg-success-900/30',
    iconColor: 'text-success-600 dark:text-success-400',
    buttonVariant: 'success',
  },
};

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'danger',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmPhrase,
  isLoading = false,
  icon: CustomIcon,
}: ConfirmModalProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;

  // Reset input al cerrar
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  // Verificar si puede confirmar
  const canConfirm = confirmPhrase ? inputValue === confirmPhrase : true;

  // Manejar confirmación
  const handleConfirm = async () => {
    if (!canConfirm || isLoading || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error en confirmación:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isLoading || isSubmitting}
      >
        {cancelLabel}
      </Button>
      <Button
        type="button"
        variant={config.buttonVariant as any}
        onClick={handleConfirm}
        disabled={!canConfirm || isLoading || isSubmitting}
        isLoading={isLoading || isSubmitting}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center">
        {/* Icono */}
        <div className={`p-3 rounded-full ${config.iconBg} mb-4`}>
          <Icon className={`h-8 w-8 ${config.iconColor}`} />
        </div>

        {/* Mensaje */}
        <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>

        {/* Input de confirmación (si aplica) */}
        {confirmPhrase && (
          <div className="w-full mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Escribe <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">"{confirmPhrase}"</span> para confirmar:
            </p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={confirmPhrase}
              className="text-center"
              autoComplete="off"
            />
          </div>
        )}
      </div>
    </BaseModal>
  );
};
