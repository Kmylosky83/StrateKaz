import React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-ui font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-brand-500/10 text-brand-500 border border-brand-500/20',
        secondary:   'bg-black-hover text-white-muted border border-black-border',
        success:     'bg-success-500/10 text-success-500 border border-success-500/20',
        warning:     'bg-warning-500/10 text-warning-500 border border-warning-500/20',
        error:       'bg-error-500/10 text-error-500 border border-error-500/20',
        blue:        'bg-system-blue-500/10 text-system-blue-500 border border-system-blue-500/20',
        green:       'bg-system-green-500/10 text-system-green-500 border border-system-green-500/20',
        orange:      'bg-system-orange-500/10 text-system-orange-500 border border-system-orange-500/20',
        purple:      'bg-system-purple-500/10 text-system-purple-500 border border-system-purple-500/20',
        yellow:      'bg-system-yellow-500/10 text-system-yellow-500 border border-system-yellow-500/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span className='w-1.5 h-1.5 rounded-full bg-current' aria-hidden='true' />
      )}
      {children}
    </span>
  )
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
