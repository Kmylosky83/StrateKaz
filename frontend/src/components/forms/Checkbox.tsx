import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      id,
      checked,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className="w-full">
        <div className="flex items-start">
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              checked={checked}
              className={cn(
                'peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white transition-colors checked:border-primary-600 checked:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:checked:bg-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:checked:border-primary-500 dark:checked:bg-primary-500 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-900',
                error &&
                  'border-danger-500 checked:border-danger-600 checked:bg-danger-600 focus:ring-danger-500',
                className
              )}
              {...props}
            />
            <Check
              className={cn(
                'pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100',
                props.disabled && 'text-gray-300'
              )}
              strokeWidth={3}
            />
          </div>

          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300',
                props.disabled && 'cursor-not-allowed opacity-50',
                !props.disabled && 'cursor-pointer'
              )}
            >
              {label}
            </label>
          )}
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

Checkbox.displayName = 'Checkbox';
