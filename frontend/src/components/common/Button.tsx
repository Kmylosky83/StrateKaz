import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline' | 'outline-secondary' | 'outline-accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

    const variants = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600',
      secondary:
        'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-800 dark:text-secondary-200 dark:hover:bg-secondary-700',
      accent:
        'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400 dark:bg-accent-600 dark:hover:bg-accent-500',
      danger:
        'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
      ghost:
        'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
      outline:
        'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20',
      'outline-secondary':
        'border-2 border-secondary-600 text-secondary-700 hover:bg-secondary-50 focus:ring-secondary-500 dark:border-secondary-400 dark:text-secondary-300 dark:hover:bg-secondary-900/20',
      'outline-accent':
        'border-2 border-accent-600 text-accent-700 hover:bg-accent-50 focus:ring-accent-500 dark:border-accent-400 dark:text-accent-300 dark:hover:bg-accent-900/20',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
