import React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@utils/cn';

const alertVariants = cva(
  'relative flex gap-3 rounded-lg border p-4 font-content text-sm',
  {
    variants: {
      variant: {
        info:    'bg-system-blue-500/10 border-system-blue-500/30 text-white-text',
        success: 'bg-success-500/10 border-success-500/30 text-white-text',
        warning: 'bg-warning-500/10 border-warning-500/30 text-white-text',
        error:   'bg-error-500/10 border-error-500/30 text-white-text',
      },
    },
    defaultVariants: { variant: 'info' },
  }
);

const ICONS = {
  info:    <Info    className='h-5 w-5 shrink-0 text-system-blue-500' aria-hidden='true' />,
  success: <CheckCircle className='h-5 w-5 shrink-0 text-success-500' aria-hidden='true' />,
  warning: <AlertTriangle className='h-5 w-5 shrink-0 text-warning-500' aria-hidden='true' />,
  error:   <XCircle className='h-5 w-5 shrink-0 text-error-500' aria-hidden='true' />,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  onClose?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, onClose, ...props }, ref) => (
    <div
      ref={ref}
      role='alert'
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {ICONS[variant ?? 'info']}

      <div className='flex-1 min-w-0'>
        {title && (
          <p className='font-semibold text-white-text font-ui mb-0.5'>{title}</p>
        )}
        {children && (
          <div className='text-white-muted'>{children}</div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          aria-label='Cerrar alerta'
          className='shrink-0 text-accent-icon hover:text-white-text transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-2'
        >
          <X className='h-4 w-4' />
        </button>
      )}
    </div>
  )
);
Alert.displayName = 'Alert';

export { Alert };
