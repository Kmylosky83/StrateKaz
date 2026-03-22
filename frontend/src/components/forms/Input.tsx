import { InputHTMLAttributes, forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  labelClassName?: string;
  /** Muestra un botón para alternar visibilidad de contraseña. Solo aplica cuando type="password". */
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      labelClassName,
      showPasswordToggle,
      id,
      type,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [passwordVisible, setPasswordVisible] = useState(false);

    const isPasswordToggle = showPasswordToggle && type === 'password';
    const resolvedType = isPasswordToggle && passwordVisible ? 'text' : type;
    const hasRightElement = rightIcon || isPasswordToggle;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">{leftIcon}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className={cn(
              'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-400',
              leftIcon && 'pl-10',
              hasRightElement && 'pr-10',
              error &&
                'border-danger-500 focus:border-danger-500 focus:ring-danger-500',
              className
            )}
            {...props}
          />

          {isPasswordToggle ? (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center min-w-[44px] min-h-[44px] justify-center"
              onClick={() => setPasswordVisible((prev) => !prev)}
              aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >
              {passwordVisible ? (
                <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          ) : rightIcon ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">
                {rightIcon}
              </span>
            </div>
          ) : null}
        </div>

        {error && (
          <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
