import React from 'react';
import { cn } from '@utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, disabled, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className='w-full space-y-1.5'>
        {label && (
          <label
            htmlFor={inputId}
            className='block text-sm font-medium text-white-muted font-ui'
          >
            {label}
          </label>
        )}

        <div className='relative'>
          {leftIcon && (
            <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-accent-icon'>
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              'block w-full rounded-lg border bg-black-card text-white-text placeholder-white-subtle',
              'font-content text-sm transition-colors duration-200',
              'focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500',
              'disabled:bg-black-hover disabled:cursor-not-allowed disabled:opacity-60',
              'min-h-[44px] py-2',
              leftIcon  ? 'pl-10 pr-3' : 'px-3',
              rightIcon ? 'pr-10'      : '',
              error
                ? 'border-error-500 focus:ring-error-500 focus:border-error-500'
                : 'border-black-border',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-accent-icon'>
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className='text-xs text-error-500 font-content'>
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className='text-xs text-white-subtle font-content'>
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
