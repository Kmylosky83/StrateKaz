import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
  title?: string;
  message?: string;
  confirmButtonText?: string;
  isLoading?: boolean;
}

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  title = 'Confirmar Eliminación',
  message,
  confirmButtonText = 'Desactivar Usuario',
  isLoading,
}: DeleteConfirmModalProps) => {
  const defaultMessage = userName
    ? `Estás a punto de desactivar al usuario: ${userName}`
    : 'Estás a punto de eliminar este registro. Esta acción no se puede deshacer.';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-warning-900 dark:text-warning-100">
              {userName ? 'Esta acción es reversible' : 'Atención'}
            </h4>
            <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
              {userName
                ? 'El usuario será desactivado pero no eliminado permanentemente. Podrás reactivarlo más tarde si es necesario.'
                : 'Por favor confirma que deseas continuar con esta acción.'}
            </p>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300">
          {message || (
            <>
              {defaultMessage}
              {userName && <span className="font-semibold"> {userName}</span>}
            </>
          )}
        </p>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
