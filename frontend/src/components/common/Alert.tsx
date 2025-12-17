import { HTMLAttributes } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  closable?: boolean;
}

export const Alert = ({
  className,
  variant = 'info',
  title,
  message,
  onClose,
  closable = false,
  ...props
}: AlertProps) => {
  const variantConfig = {
    success: {
      icon: CheckCircle,
      containerClasses:
        'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-900/30',
      iconColor: 'text-success-600 dark:text-success-400',
      titleColor: 'text-success-800 dark:text-success-400',
      messageColor: 'text-success-700 dark:text-success-400',
    },
    warning: {
      icon: AlertTriangle,
      containerClasses:
        'bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-900/30',
      iconColor: 'text-warning-600 dark:text-warning-400',
      titleColor: 'text-warning-800 dark:text-warning-400',
      messageColor: 'text-warning-700 dark:text-warning-400',
    },
    error: {
      icon: AlertCircle,
      containerClasses:
        'bg-danger-50 border-danger-200 dark:bg-danger-900/20 dark:border-danger-900/30',
      iconColor: 'text-danger-600 dark:text-danger-400',
      titleColor: 'text-danger-800 dark:text-danger-400',
      messageColor: 'text-danger-700 dark:text-danger-400',
    },
    info: {
      icon: Info,
      containerClasses:
        'bg-info-50 border-info-200 dark:bg-info-900/20 dark:border-info-900/30',
      iconColor: 'text-info-600 dark:text-info-400',
      titleColor: 'text-info-800 dark:text-info-400',
      messageColor: 'text-info-700 dark:text-info-400',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        config.containerClasses,
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn('text-sm font-semibold mb-1', config.titleColor)}>
              {title}
            </h3>
          )}
          <p className={cn('text-sm', config.messageColor)}>{message}</p>
        </div>
        {closable && onClose && (
          <button
            onClick={onClose}
            className={cn(
              'flex-shrink-0 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
              config.iconColor
            )}
            aria-label="Cerrar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
