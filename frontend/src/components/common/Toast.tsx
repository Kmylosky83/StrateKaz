/**
 * Toast Component - Wrapper sobre Sonner
 *
 * Proporciona una API simplificada para mostrar notificaciones toast.
 *
 * Uso:
 *   import { toast } from '@/components/common/Toast';
 *   toast.success('Guardado exitosamente');
 *   toast.error('Error al guardar');
 *   toast.promise(asyncFn, { loading: '...', success: '...', error: '...' });
 */
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export interface ToastOptions {
  /** Duration in milliseconds */
  duration?: number;
  /** Position */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  /** Custom description */
  description?: string;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Cancel button */
  cancel?: {
    label: string;
    onClick: () => void;
  };
  /** On dismiss callback */
  onDismiss?: () => void;
  /** On auto close callback */
  onAutoClose?: () => void;
}

export interface PromiseOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
}

/**
 * Toast API
 */
export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      ...options,
      icon: <CheckCircle className="h-5 w-5 text-success-500" />,
    });
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration ?? 5000,
      ...options,
      icon: <XCircle className="h-5 w-5 text-danger-500" />,
    });
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      ...options,
      icon: <AlertCircle className="h-5 w-5 text-warning-500" />,
    });
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      ...options,
      icon: <Info className="h-5 w-5 text-info-500" />,
    });
  },

  /**
   * Show a loading toast
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      ...options,
      icon: <Loader2 className="h-5 w-5 animate-spin text-primary-500" />,
    });
  },

  /**
   * Show a toast for a promise
   */
  promise: <T,>(
    promise: Promise<T> | (() => Promise<T>),
    options: PromiseOptions<T>
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    });
  },

  /**
   * Dismiss a toast by ID
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    sonnerToast.dismiss();
  },

  /**
   * Show a custom toast
   */
  custom: sonnerToast,
};

/**
 * Toaster Component
 *
 * Place this component at the root of your app to enable toasts.
 *
 * Usage:
 *   <Toaster />
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-gray-800 dark:group-[.toaster]:text-gray-100 dark:group-[.toaster]:border-gray-700',
          description: 'group-[.toast]:text-gray-500 dark:group-[.toast]:text-gray-400',
          actionButton:
            'group-[.toast]:bg-primary-500 group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500 dark:group-[.toast]:bg-gray-700 dark:group-[.toast]:text-gray-400',
        },
      }}
    />
  );
}

export default toast;
