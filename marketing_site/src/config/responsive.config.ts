/**
 * Responsive Design Configuration
 * Centralized responsive settings for the marketing site
 * Mobile-first approach with TypeScript type safety
 */

// Breakpoint definitions following mobile-first approach
export const BREAKPOINTS = {
  xs: 375, // Mobile small (iPhone SE/12/13)
  sm: 640, // Mobile large to tablet small
  md: 768, // Tablet
  lg: 1024, // Desktop small
  xl: 1280, // Desktop standard
  '2xl': 1536, // Desktop large
} as const;

// Container widths for different breakpoints
export const CONTAINER_WIDTHS = {
  xs: '100%', // Full width on mobile
  sm: '100%', // Full width on small devices
  md: '100%', // Full width on tablets
  lg: '100%', // Full width with max constraint
  xl: '1280px', // Max width for desktop
  '2xl': '1536px', // Max width for large desktop
} as const;

// Padding system for containers (in rem)
export const CONTAINER_PADDING = {
  xs: 1, // 16px on mobile
  sm: 1.5, // 24px on small tablets
  md: 2, // 32px on tablets
  lg: 2.5, // 40px on desktop
  xl: 3, // 48px on large desktop
  '2xl': 4, // 64px on extra large
} as const;

// Content max widths for readability
export const CONTENT_MAX_WIDTHS = {
  prose: '65ch', // For article/blog content
  narrow: '42rem', // 672px - for CTAs and focused content
  normal: '48rem', // 768px - for general content
  wide: '64rem', // 1024px - for wider content sections
  full: '100%', // Full width
} as const;

// Typography scale for responsive text
export const TYPOGRAPHY_SCALE = {
  xs: { min: 0.75, max: 0.875, unit: 'rem' }, // 12px -> 14px
  sm: { min: 0.875, max: 1, unit: 'rem' }, // 14px -> 16px
  base: { min: 1, max: 1.125, unit: 'rem' }, // 16px -> 18px
  lg: { min: 1.125, max: 1.25, unit: 'rem' }, // 18px -> 20px
  xl: { min: 1.25, max: 1.5, unit: 'rem' }, // 20px -> 24px
  '2xl': { min: 1.5, max: 1.875, unit: 'rem' }, // 24px -> 30px
  '3xl': { min: 1.875, max: 2.25, unit: 'rem' }, // 30px -> 36px
  '4xl': { min: 2.25, max: 3, unit: 'rem' }, // 36px -> 48px
  '5xl': { min: 3, max: 3.75, unit: 'rem' }, // 48px -> 60px
  '6xl': { min: 3.75, max: 4.5, unit: 'rem' }, // 60px -> 72px
} as const;

// Type definitions
export type Breakpoint = keyof typeof BREAKPOINTS;
export type ContainerWidth = keyof typeof CONTAINER_WIDTHS;
export type ContentMaxWidth = keyof typeof CONTENT_MAX_WIDTHS;
export type TypographySize = keyof typeof TYPOGRAPHY_SCALE;

// Utility functions
export const getBreakpointValue = (breakpoint: Breakpoint): number => {
  return BREAKPOINTS[breakpoint];
};

export const getContainerWidth = (breakpoint: ContainerWidth): string => {
  return CONTAINER_WIDTHS[breakpoint];
};

export const getContainerPadding = (breakpoint: Breakpoint): string => {
  return `${CONTAINER_PADDING[breakpoint]}rem`;
};

export const getContentMaxWidth = (size: ContentMaxWidth): string => {
  return CONTENT_MAX_WIDTHS[size];
};

// Generate clamp values for fluid typography
export const getFluidTypography = (size: TypographySize): string => {
  const scale = TYPOGRAPHY_SCALE[size];
  const minVw =
    ((scale.max - scale.min) / (BREAKPOINTS['2xl'] - BREAKPOINTS.xs)) * 100;
  const remBase = scale.min - (minVw * BREAKPOINTS.xs) / 100;

  return `clamp(${scale.min}${scale.unit}, ${remBase.toFixed(3)}rem + ${minVw.toFixed(2)}vw, ${scale.max}${scale.unit})`;
};

// Media query helpers
export const mediaQuery = {
  up: (breakpoint: Breakpoint): string =>
    `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`,

  down: (breakpoint: Breakpoint): string =>
    `@media (max-width: ${BREAKPOINTS[breakpoint] - 1}px)`,

  between: (min: Breakpoint, max: Breakpoint): string =>
    `@media (min-width: ${BREAKPOINTS[min]}px) and (max-width: ${BREAKPOINTS[max] - 1}px)`,

  only: (breakpoint: Breakpoint): string => {
    const breakpointKeys = Object.keys(BREAKPOINTS) as Breakpoint[];
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    const nextBreakpoint = breakpointKeys[currentIndex + 1];

    if (!nextBreakpoint) {
      return `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`;
    }

    return `@media (min-width: ${BREAKPOINTS[breakpoint]}px) and (max-width: ${BREAKPOINTS[nextBreakpoint] - 1}px)`;
  },
};

// Container style generator
export const generateContainerStyles = () => {
  const breakpoints = Object.keys(BREAKPOINTS) as Breakpoint[];

  return breakpoints.reduce(
    (styles, bp) => {
      return {
        ...styles,
        [mediaQuery.up(bp)]: {
          maxWidth: CONTAINER_WIDTHS[bp],
          paddingLeft: getContainerPadding(bp),
          paddingRight: getContainerPadding(bp),
        },
      };
    },
    {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
    }
  );
};

// Export default configuration object
export default {
  breakpoints: BREAKPOINTS,
  containerWidths: CONTAINER_WIDTHS,
  containerPadding: CONTAINER_PADDING,
  contentMaxWidths: CONTENT_MAX_WIDTHS,
  typographyScale: TYPOGRAPHY_SCALE,
  utils: {
    getBreakpointValue,
    getContainerWidth,
    getContainerPadding,
    getContentMaxWidth,
    getFluidTypography,
    mediaQuery,
    generateContainerStyles,
  },
};
