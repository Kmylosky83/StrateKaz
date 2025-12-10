import { HTMLAttributes, forwardRef, ElementType } from 'react';
import { cn } from '@/utils/cn';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'bodyLarge'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'overline';

type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted';

type TypographyWeight = 'normal' | 'medium' | 'semibold' | 'bold';

type TypographyAlign = 'left' | 'center' | 'right';

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  color?: TypographyColor;
  weight?: TypographyWeight;
  align?: TypographyAlign;
  as?: ElementType;
}

// ============================================================================
// VARIANT CONFIGURATION
// ============================================================================

const variantConfig: Record<TypographyVariant, {
  tag: ElementType;
  classes: string;
}> = {
  h1: {
    tag: 'h1',
    classes: 'font-heading text-4xl font-bold tracking-tight',
  },
  h2: {
    tag: 'h2',
    classes: 'font-heading text-3xl font-bold tracking-tight',
  },
  h3: {
    tag: 'h3',
    classes: 'font-heading text-2xl font-semibold',
  },
  h4: {
    tag: 'h4',
    classes: 'font-heading text-xl font-semibold',
  },
  h5: {
    tag: 'h5',
    classes: 'font-heading text-lg font-semibold',
  },
  h6: {
    tag: 'h6',
    classes: 'font-heading text-base font-semibold',
  },
  bodyLarge: {
    tag: 'p',
    classes: 'font-body text-lg',
  },
  body: {
    tag: 'p',
    classes: 'font-body text-base',
  },
  bodySmall: {
    tag: 'p',
    classes: 'font-body text-sm',
  },
  label: {
    tag: 'span',
    classes: 'font-body text-sm font-medium',
  },
  caption: {
    tag: 'span',
    classes: 'font-body text-xs',
  },
  overline: {
    tag: 'span',
    classes: 'font-body text-xs font-semibold uppercase tracking-wider',
  },
};

const colorClasses: Record<TypographyColor, string> = {
  primary: 'text-gray-900 dark:text-gray-100',
  secondary: 'text-gray-700 dark:text-gray-300',
  success: 'text-success-700 dark:text-success-400',
  warning: 'text-warning-700 dark:text-warning-400',
  danger: 'text-danger-700 dark:text-danger-400',
  muted: 'text-gray-600 dark:text-gray-400',
};

const weightClasses: Record<TypographyWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const alignClasses: Record<TypographyAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = 'body',
      color = 'primary',
      weight,
      align,
      as,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const config = variantConfig[variant];
    const Component = as || config.tag;

    return (
      <Component
        ref={ref}
        className={cn(
          config.classes,
          colorClasses[color],
          weight && weightClasses[weight],
          align && alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = 'Typography';

// ============================================================================
// SHORTHAND COMPONENTS
// ============================================================================

export const Heading1 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h1" {...props} />
);
Heading1.displayName = 'Heading1';

export const Heading2 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h2" {...props} />
);
Heading2.displayName = 'Heading2';

export const Heading3 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h3" {...props} />
);
Heading3.displayName = 'Heading3';

export const Heading4 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h4" {...props} />
);
Heading4.displayName = 'Heading4';

export const Heading5 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h5" {...props} />
);
Heading5.displayName = 'Heading5';

export const Heading6 = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h6" {...props} />
);
Heading6.displayName = 'Heading6';

export const BodyText = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="body" {...props} />
);
BodyText.displayName = 'BodyText';

export const BodyLarge = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="bodyLarge" {...props} />
);
BodyLarge.displayName = 'BodyLarge';

export const BodySmall = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="bodySmall" {...props} />
);
BodySmall.displayName = 'BodySmall';

export const Label = forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="label" as="label" {...props} />
);
Label.displayName = 'Label';

export const Caption = forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="caption" {...props} />
);
Caption.displayName = 'Caption';

export const Overline = forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="overline" {...props} />
);
Overline.displayName = 'Overline';
