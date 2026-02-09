import React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@utils/cn';

const buttonVariants = cva(
  'font-content inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black-deep disabled:opacity-50 disabled:cursor-not-allowed gap-2 min-h-[44px]',
  {
    variants: {
      variant: {
        default:
          'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 shadow-lg hover:shadow-brand-500/20',
        primary:
          'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 shadow-lg hover:shadow-brand-500/20',
        secondary:
          'bg-black-hover text-white-text hover:bg-black-border focus:ring-brand-500 border border-black-border hover:border-brand-500/50',
        ghost:
          'text-white-muted hover:bg-black-hover hover:text-white-text focus:ring-brand-500',
        outline:
          'border border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white focus:ring-brand-500 transition-all duration-300',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
        success:
          'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
      },
      size: {
        xs: 'px-3 py-2 text-xs min-h-[44px]',
        sm: 'px-3 py-2 text-sm min-h-[44px]',
        md: 'px-4 py-2.5 text-sm min-h-[44px]',
        lg: 'px-6 py-3 text-base min-h-[48px]',
        xl: 'px-8 py-4 text-lg min-h-[52px]',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild: _asChild = false,
      leftIcon,
      rightIcon,
      loading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
