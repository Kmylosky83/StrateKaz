/**
 * useConfirm - Hook para confirmaciones programáticas
 *
 * Permite mostrar modales de confirmación de forma imperativa
 * sin necesidad de declarar el componente en el JSX.
 */
import { useState, useCallback, ReactNode } from 'react';
import { ConfirmVariant } from './ConfirmModal';

interface ConfirmOptions {
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
  /** Frase requerida para confirmar */
  confirmPhrase?: string;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

interface UseConfirmReturn {
  /** Estado del modal de confirmación */
  confirmState: ConfirmState;
  /** Mostrar confirmación y esperar respuesta */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Confirmar la acción */
  handleConfirm: () => void;
  /** Cancelar la acción */
  handleCancel: () => void;
}

/**
 * Hook para mostrar confirmaciones de forma programática
 *
 * @example
 * const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Eliminar usuario',
 *     message: '¿Estás seguro de eliminar este usuario?',
 *     variant: 'danger',
 *     confirmLabel: 'Eliminar',
 *   });
 *
 *   if (confirmed) {
 *     await deleteUser(userId);
 *   }
 * };
 *
 * // En el JSX
 * <ConfirmModal
 *   isOpen={confirmState.isOpen}
 *   onClose={handleCancel}
 *   onConfirm={handleConfirm}
 *   title={confirmState.title}
 *   message={confirmState.message}
 *   variant={confirmState.variant}
 *   confirmLabel={confirmState.confirmLabel}
 *   cancelLabel={confirmState.cancelLabel}
 *   confirmPhrase={confirmState.confirmPhrase}
 * />
 */
export function useConfirm(): UseConfirmReturn {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        ...options,
        isOpen: true,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState.resolve) {
      confirmState.resolve(true);
    }
    setConfirmState((prev) => ({
      ...prev,
      isOpen: false,
      resolve: null,
    }));
  }, [confirmState.resolve]);

  const handleCancel = useCallback(() => {
    if (confirmState.resolve) {
      confirmState.resolve(false);
    }
    setConfirmState((prev) => ({
      ...prev,
      isOpen: false,
      resolve: null,
    }));
  }, [confirmState.resolve]);

  return {
    confirmState,
    confirm,
    handleConfirm,
    handleCancel,
  };
}

/**
 * Hook simplificado para confirmaciones de eliminación
 *
 * @example
 * const { confirmDelete, ...confirmProps } = useDeleteConfirm();
 *
 * const handleDelete = async (item: Item) => {
 *   const confirmed = await confirmDelete(item.name);
 *   if (confirmed) {
 *     await deleteItem(item.id);
 *   }
 * };
 */
export function useDeleteConfirm() {
  const { confirm, ...rest } = useConfirm();

  const confirmDelete = useCallback(
    (itemName: string, options?: Partial<ConfirmOptions>) => {
      return confirm({
        title: 'Confirmar eliminación',
        message: `¿Estás seguro de eliminar "${itemName}"? Esta acción no se puede deshacer.`,
        variant: 'danger',
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        ...options,
      });
    },
    [confirm]
  );

  return {
    confirmDelete,
    ...rest,
  };
}

/**
 * Hook para confirmaciones de cambio de estado
 *
 * @example
 * const { confirmStatusChange, ...confirmProps } = useStatusChangeConfirm();
 *
 * const handleToggleActive = async (user: User) => {
 *   const confirmed = await confirmStatusChange(
 *     user.isActive ? 'desactivar' : 'activar',
 *     user.name
 *   );
 *   if (confirmed) {
 *     await toggleUserStatus(user.id);
 *   }
 * };
 */
export function useStatusChangeConfirm() {
  const { confirm, ...rest } = useConfirm();

  const confirmStatusChange = useCallback(
    (action: string, itemName: string, options?: Partial<ConfirmOptions>) => {
      return confirm({
        title: `Confirmar ${action}`,
        message: `¿Estás seguro de ${action} "${itemName}"?`,
        variant: 'warning',
        confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
        cancelLabel: 'Cancelar',
        ...options,
      });
    },
    [confirm]
  );

  return {
    confirmStatusChange,
    ...rest,
  };
}
