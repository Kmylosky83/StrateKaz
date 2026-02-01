import { InputHTMLAttributes, forwardRef, ChangeEvent, useId } from 'react';
import { cn } from '@/utils/cn';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Callback cuando cambia el estado (alternativa a onChange) */
  onCheckedChange?: (checked: boolean) => void;
  /** onChange nativo del input */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      label,
      description,
      size = 'md',
      id,
      checked,
      onCheckedChange,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const switchId = id || generatedId;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      onCheckedChange?.(event.target.checked);
    };

    const sizeClasses = {
      sm: {
        track: 'h-5 w-9',
        thumb: 'h-4 w-4',
        translate: 'translate-x-4',
      },
      md: {
        track: 'h-6 w-11',
        thumb: 'h-5 w-5',
        translate: 'translate-x-5',
      },
      lg: {
        track: 'h-7 w-14',
        thumb: 'h-6 w-6',
        translate: 'translate-x-7',
      },
    };

    return (
      <div className="flex items-center flex-shrink-0">
        <div className="relative inline-flex items-center flex-shrink-0">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            onChange={handleChange}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={switchId}
            className={cn(
              'flex cursor-pointer items-center rounded-full bg-gray-300 transition-colors peer-checked:bg-primary-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:bg-gray-700 dark:peer-checked:bg-primary-500 dark:peer-focus:ring-primary-400 dark:peer-focus:ring-offset-gray-900',
              sizeClasses[size].track,
              className
            )}
          >
            <span
              className={cn(
                'inline-block transform rounded-full bg-white shadow-md transition-transform',
                sizeClasses[size].thumb,
                checked ? sizeClasses[size].translate : 'translate-x-0.5'
              )}
            />
          </label>
        </div>

        {(label || description) && (
          <div className="ml-3 flex-shrink-0">
            {label && (
              <span
                className={cn(
                  'text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap',
                  props.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {label}
              </span>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
