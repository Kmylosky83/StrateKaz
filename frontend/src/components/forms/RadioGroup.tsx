import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: RadioOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  name: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      value,
      onChange,
      name,
      orientation = 'vertical',
      disabled = false,
    },
    ref
  ) => {
    const groupId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = (optionValue: string | number) => {
      if (onChange && !disabled) {
        onChange(optionValue);
      }
    };

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            id={groupId}
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            'flex gap-4',
            orientation === 'vertical' && 'flex-col',
            orientation === 'horizontal' && 'flex-row flex-wrap'
          )}
          role="radiogroup"
          aria-labelledby={label ? groupId : undefined}
        >
          {options.map((option) => {
            const radioId = `${name}-${option.value}`;
            const isChecked = value === option.value;
            const isDisabled = disabled || option.disabled;

            return (
              <div key={option.value} className="flex items-center">
                <div className="relative flex items-center">
                  <input
                    type="radio"
                    id={radioId}
                    name={name}
                    value={option.value}
                    checked={isChecked}
                    onChange={() => handleChange(option.value)}
                    disabled={isDisabled}
                    className={cn(
                      'peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 bg-white transition-colors checked:border-primary-600 checked:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:checked:border-primary-500 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-900',
                      error &&
                        'border-danger-500 checked:border-danger-600 focus:ring-danger-500'
                    )}
                  />
                  <div
                    className={cn(
                      'pointer-events-none absolute left-1 top-1 h-2 w-2 rounded-full bg-primary-600 opacity-0 transition-opacity peer-checked:opacity-100 dark:bg-primary-500',
                      isDisabled && 'bg-gray-400 dark:bg-gray-500',
                      error && 'bg-danger-600 dark:bg-danger-500'
                    )}
                  />
                </div>

                <label
                  htmlFor={radioId}
                  className={cn(
                    'ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300',
                    isDisabled && 'cursor-not-allowed opacity-50',
                    !isDisabled && 'cursor-pointer'
                  )}
                >
                  {option.label}
                </label>
              </div>
            );
          })}
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

RadioGroup.displayName = 'RadioGroup';
