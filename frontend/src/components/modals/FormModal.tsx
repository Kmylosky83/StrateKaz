/**
 * FormModal - Modal para formularios con React Hook Form
 *
 * Características:
 * - Integración directa con React Hook Form
 * - Advertencia de cambios sin guardar
 * - Botones de acción estándar (Guardar/Cancelar/Limpiar)
 * - Loading state en botones
 * - Reset automático al cerrar
 */
import { ReactNode, useEffect, useCallback, useState } from 'react';
import { FieldValues, UseFormReturn, SubmitHandler, DefaultValues } from 'react-hook-form';
import { BaseModal, ModalSize } from './BaseModal';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export interface FormModalProps<T extends FieldValues> {
  /** Control de apertura del modal */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Callback al enviar el formulario */
  onSubmit: SubmitHandler<T>;
  /** Título del modal */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Instancia de useForm */
  form: UseFormReturn<T>;
  /** Contenido del formulario */
  children: ReactNode;
  /** Tamaño del modal */
  size?: ModalSize;
  /** Estado de carga */
  isLoading?: boolean;
  /** Texto del botón de guardar */
  submitLabel?: string;
  /** Texto del botón de cancelar */
  cancelLabel?: string;
  /** Mostrar botón de limpiar */
  showResetButton?: boolean;
  /** Advertir sobre cambios sin guardar */
  warnUnsavedChanges?: boolean;
  /** Valores iniciales para el reset */
  defaultValues?: DefaultValues<T>;
  /** Clases adicionales */
  className?: string;
}

export function FormModal<T extends FieldValues>({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  form,
  children,
  size = 'lg',
  isLoading = false,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  showResetButton = false,
  warnUnsavedChanges = true,
  defaultValues,
  className,
}: FormModalProps<T>) {
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const {
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = form;

  // Reset form cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      // Pequeño delay para permitir la animación de salida
      const timer = setTimeout(() => {
        reset(defaultValues);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, reset, defaultValues]);

  // Manejar cierre con verificación de cambios
  const handleClose = useCallback(() => {
    if (isDirty && warnUnsavedChanges && !isLoading) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  }, [isDirty, warnUnsavedChanges, isLoading, onClose]);

  // Confirmar descarte de cambios
  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    reset(defaultValues);
    onClose();
  };

  // Cancelar cierre
  const handleCancelClose = () => {
    setShowUnsavedWarning(false);
  };

  // Manejar reset
  const handleReset = () => {
    reset(defaultValues);
  };

  // Manejar submit
  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const footer = (
    <>
      {showResetButton && (
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          disabled={isLoading || isSubmitting || !isDirty}
          className="mr-auto"
        >
          Limpiar
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isLoading || isSubmitting}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleFormSubmit}
        disabled={isLoading || isSubmitting}
        isLoading={isLoading || isSubmitting}
      >
        {submitLabel}
      </Button>
    </>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title={title}
        subtitle={subtitle}
        size={size}
        footer={footer}
        closeOnBackdrop={!isDirty}
        className={className}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {children}
        </form>
      </BaseModal>

      {/* Diálogo de confirmación para cambios sin guardar */}
      <ConfirmDialog
        isOpen={showUnsavedWarning}
        onClose={handleCancelClose}
        onConfirm={handleConfirmClose}
        title="Cambios sin guardar"
        message="Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar sin guardar?"
        confirmText="Descartar cambios"
        cancelText="Continuar editando"
        variant="warning"
      />
    </>
  );
}
