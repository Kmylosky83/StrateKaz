/**
 * Responsive utilities for class name generation
 * Type-safe utilities for managing responsive classes
 */

import { type Breakpoint } from '@/config/responsive.config';

type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;
type ClassValue = string | undefined | null | false;
type ClassArray = ClassValue[];
type ClassDictionary = Record<string, boolean | undefined>;

/**
 * Combines class names conditionally
 */
export function cn(
  ...inputs: (ClassValue | ClassArray | ClassDictionary)[]
): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (Array.isArray(input)) {
      classes.push(cn(...input));
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.filter(Boolean).join(' ');
}

/**
 * Generates responsive classes based on breakpoint values
 */
export function responsive<T extends string>(
  values: ResponsiveValue<T>,
  prefix = ''
): string {
  if (typeof values === 'string') {
    return prefix ? `${prefix}${values}` : values;
  }

  const classes: string[] = [];

  for (const [breakpoint, value] of Object.entries(values)) {
    if (!value) continue;

    const bp = breakpoint === 'xs' ? '' : `${breakpoint}:`;
    const className = prefix ? `${bp}${prefix}${value}` : `${bp}${value}`;
    classes.push(className);
  }

  return classes.join(' ');
}

/**
 * Container class generators
 */
export const container = {
  /**
   * Full-width responsive container with proper padding
   */
  responsive: (customClasses?: string): string => {
    return cn('container-responsive', customClasses);
  },

  /**
   * Content container with optimal reading width
   */
  content: (customClasses?: string): string => {
    return cn('container-content', customClasses);
  },

  /**
   * Narrow container for CTAs and focused content
   */
  narrow: (customClasses?: string): string => {
    return cn('container-narrow', customClasses);
  },

  /**
   * Full-width container without max-width constraints
   */
  full: (customClasses?: string): string => {
    return cn('container-full', customClasses);
  },

  /**
   * Custom container with responsive max-widths
   */
  custom: (
    maxWidths: ResponsiveValue<string>,
    customClasses?: string
  ): string => {
    const widthClasses = responsive(maxWidths, 'max-w-');
    return cn(
      'w-full mx-auto px-4 sm:px-6 lg:px-8',
      widthClasses,
      customClasses
    );
  },
};

/**
 * Spacing utilities
 */
export const spacing = {
  /**
   * Responsive padding
   */
  padding: (values: ResponsiveValue<string | number>): string => {
    if (typeof values === 'number') {
      return `p-${values}`;
    }
    return responsive(values as ResponsiveValue<string>, 'p-');
  },

  /**
   * Responsive padding horizontal
   */
  px: (values: ResponsiveValue<string | number>): string => {
    if (typeof values === 'number') {
      return `px-${values}`;
    }
    return responsive(values as ResponsiveValue<string>, 'px-');
  },

  /**
   * Responsive padding vertical
   */
  py: (values: ResponsiveValue<string | number>): string => {
    if (typeof values === 'number') {
      return `py-${values}`;
    }
    return responsive(values as ResponsiveValue<string>, 'py-');
  },

  /**
   * Responsive margin
   */
  margin: (values: ResponsiveValue<string | number>): string => {
    if (typeof values === 'number') {
      return `m-${values}`;
    }
    return responsive(values as ResponsiveValue<string>, 'm-');
  },

  /**
   * Section spacing
   */
  section: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): string => {
    return cn({
      'py-8 sm:py-12 lg:py-16': size === 'xs',
      'py-12 sm:py-16 lg:py-20': size === 'sm',
      'py-16 sm:py-20 lg:py-24': size === 'md',
      'py-20 sm:py-24 lg:py-32': size === 'lg',
      'py-24 sm:py-32 lg:py-40': size === 'xl',
    });
  },
};

/**
 * Grid utilities
 */
export const grid = {
  /**
   * Responsive grid columns
   */
  cols: (values: ResponsiveValue<number>): string => {
    if (typeof values === 'number') {
      return `grid-cols-${values}`;
    }

    const classes: string[] = [];
    for (const [breakpoint, cols] of Object.entries(values)) {
      if (cols === undefined || cols === null) continue;
      const bp = breakpoint === 'xs' ? '' : `${breakpoint}:`;
      classes.push(`${bp}grid-cols-${cols}`);
    }

    return cn('grid', classes.join(' '));
  },

  /**
   * Responsive gap
   */
  gap: (values: ResponsiveValue<number>): string => {
    if (typeof values === 'number') {
      return `gap-${values}`;
    }
    // Convert number values to string for responsive function
    const stringValues = Object.fromEntries(
      Object.entries(values)
        .map(([k, v]) => [k, v?.toString()])
        .filter(([, v]) => v !== undefined)
    ) as Partial<Record<Breakpoint, string>>;
    return responsive(stringValues, 'gap-');
  },

  /**
   * Common grid patterns
   */
  pattern: (pattern: 'cards' | 'features' | 'gallery' | 'blog'): string => {
    return cn({
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6':
        pattern === 'cards',
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8':
        pattern === 'features',
      'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4':
        pattern === 'gallery',
      'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8':
        pattern === 'blog',
    });
  },
};

/**
 * Typography utilities
 */
export const typography = {
  /**
   * Responsive font size
   */
  size: (values: ResponsiveValue<string>): string => {
    if (typeof values === 'string') {
      return `text-${values}`;
    }
    return responsive(values, 'text-');
  },

  /**
   * Fluid typography classes
   */
  fluid: (
    size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  ): string => {
    return `text-fluid-${size}`;
  },

  /**
   * Heading styles with responsive sizing
   */
  heading: (level: 1 | 2 | 3 | 4 | 5 | 6): string => {
    return cn({
      'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold': level === 1,
      'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold': level === 2,
      'text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold': level === 3,
      'text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold': level === 4,
      'text-base sm:text-lg lg:text-xl xl:text-2xl font-medium': level === 5,
      'text-sm sm:text-base lg:text-lg xl:text-xl font-medium': level === 6,
    });
  },
};

/**
 * Display utilities
 */
export const display = {
  /**
   * Show/hide based on breakpoint
   */
  show: (breakpoint: Breakpoint): string => {
    return breakpoint === 'xs' ? 'block' : `hidden ${breakpoint}:block`;
  },

  hide: (breakpoint: Breakpoint): string => {
    return breakpoint === 'xs' ? 'hidden' : `${breakpoint}:hidden`;
  },

  /**
   * Show only on specific breakpoint range
   */
  only: (min: Breakpoint, max?: Breakpoint): string => {
    if (!max) {
      return `hidden ${min}:block`;
    }

    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const minIndex = breakpoints.indexOf(min);
    const maxIndex = breakpoints.indexOf(max);

    if (minIndex === -1 || maxIndex === -1 || minIndex >= maxIndex) {
      return '';
    }

    const nextBreakpoint = breakpoints[maxIndex + 1];
    return nextBreakpoint
      ? `hidden ${min}:block ${nextBreakpoint}:hidden`
      : `hidden ${min}:block`;
  },
};

/**
 * Flex utilities
 */
export const flex = {
  /**
   * Responsive flex direction
   */
  direction: (
    values: ResponsiveValue<'row' | 'col' | 'row-reverse' | 'col-reverse'>
  ): string => {
    if (typeof values === 'string') {
      return `flex-${values}`;
    }

    const classes: string[] = [];
    for (const [breakpoint, direction] of Object.entries(values)) {
      const bp = breakpoint === 'xs' ? '' : `${breakpoint}:`;
      classes.push(`${bp}flex-${direction}`);
    }

    return cn('flex', classes.join(' '));
  },

  /**
   * Responsive justify content
   */
  justify: (
    values: ResponsiveValue<
      'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
    >
  ): string => {
    if (typeof values === 'string') {
      return `justify-${values}`;
    }
    return responsive(values, 'justify-');
  },

  /**
   * Responsive align items
   */
  align: (
    values: ResponsiveValue<'start' | 'end' | 'center' | 'baseline' | 'stretch'>
  ): string => {
    if (typeof values === 'string') {
      return `items-${values}`;
    }
    return responsive(values, 'items-');
  },

  /**
   * Common flex patterns
   */
  pattern: (
    pattern: 'center' | 'between' | 'start-center' | 'end-center'
  ): string => {
    return cn('flex', {
      'justify-center items-center': pattern === 'center',
      'justify-between items-center': pattern === 'between',
      'justify-start items-center': pattern === 'start-center',
      'justify-end items-center': pattern === 'end-center',
    });
  },
};

// Export all utilities
export default {
  cn,
  responsive,
  container,
  spacing,
  grid,
  typography,
  display,
  flex,
};
