import { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: BadgeProps) => {
  const variants = {
    primary:
      'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400',
    success:
      'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
    warning:
      'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
    danger:
      'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400',
    info: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
