import React, { createContext, useContext, useCallback, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastVariant = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      setToasts(prev => [...prev, { id, ...opts }]);
      setTimeout(() => dismiss(id), opts.duration ?? 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ─── Visual components ────────────────────────────────────────────────────────

const STYLES: Record<ToastVariant, { wrapper: string; icon: React.ReactNode }> = {
  info: {
    wrapper: 'border-system-blue-500/30 bg-black-card',
    icon: <Info className='h-5 w-5 shrink-0 text-system-blue-500' aria-hidden='true' />,
  },
  success: {
    wrapper: 'border-success-500/30 bg-black-card',
    icon: <CheckCircle className='h-5 w-5 shrink-0 text-success-500' aria-hidden='true' />,
  },
  warning: {
    wrapper: 'border-warning-500/30 bg-black-card',
    icon: <AlertTriangle className='h-5 w-5 shrink-0 text-warning-500' aria-hidden='true' />,
  },
  error: {
    wrapper: 'border-error-500/30 bg-black-card',
    icon: <XCircle className='h-5 w-5 shrink-0 text-error-500' aria-hidden='true' />,
  },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const { wrapper, icon } = STYLES[toast.variant];

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 shadow-hard',
        'animate-slide-up w-full max-w-sm font-content text-sm',
        wrapper
      )}
    >
      {icon}
      <div className='flex-1 min-w-0'>
        {toast.title && (
          <p className='font-semibold text-white-text font-ui mb-0.5'>{toast.title}</p>
        )}
        <p className='text-white-muted'>{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label='Cerrar notificación'
        className='shrink-0 text-accent-icon hover:text-white-text transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-2'
      >
        <X className='h-4 w-4' />
      </button>
    </div>
  );
};

const ToastContainer: React.FC<{
  toasts: Toast[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div
      aria-label='Notificaciones'
      className='fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end'
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
