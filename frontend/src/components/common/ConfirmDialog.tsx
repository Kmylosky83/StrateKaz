import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) => {
  const variantConfig = {
    danger: {
      icon: AlertCircle,
      iconBg: 'bg-danger-100 dark:bg-danger-900/30',
      iconColor: 'text-danger-600 dark:text-danger-400',
      buttonVariant: 'danger' as const,
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-warning-100 dark:bg-warning-900/30',
      iconColor: 'text-warning-600 dark:text-warning-400',
      buttonVariant: 'primary' as const,
    },
    info: {
      icon: Info,
      iconBg: 'bg-info-100 dark:bg-info-900/30',
      iconColor: 'text-info-600 dark:text-info-400',
      buttonVariant: 'primary' as const,
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" showCloseButton={false}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={cn('flex-shrink-0 rounded-full p-3', config.iconBg)}>
            <Icon className={cn('h-6 w-6', config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
