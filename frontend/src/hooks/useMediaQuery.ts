/**
 * useMediaQuery Hook - Enterprise Level
 *
 * Hook para detectar breakpoints responsivos de forma reactiva.
 * Optimizado para PWA con soporte completo de SSR.
 */
import { useState, useEffect, useCallback } from 'react';

// Breakpoints sincronizados con Tailwind CSS
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook genérico para media queries
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    // SSR-safe: check if window is available
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Handler for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Legacy browsers (Safari < 14)
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
};

/**
 * Hook para detectar si estamos en mobile (< md)
 */
export const useIsMobile = (): boolean => {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
};

/**
 * Hook para detectar si estamos en tablet (md - lg)
 */
export const useIsTablet = (): boolean => {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
};

/**
 * Hook para detectar si estamos en desktop (>= lg)
 */
export const useIsDesktop = (): boolean => {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
};

/**
 * Hook completo con todos los breakpoints
 */
export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isXLarge: boolean;
  is2XLarge: boolean;
  breakpoint: Breakpoint | 'xs';
}

export const useBreakpoint = (): BreakpointState => {
  const isSmall = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
  const isMedium = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isLarge = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isXLarge = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  const is2XLarge = useMediaQuery(`(min-width: ${BREAKPOINTS['2xl']}px)`);

  const getBreakpoint = useCallback((): Breakpoint | 'xs' => {
    if (is2XLarge) return '2xl';
    if (isXLarge) return 'xl';
    if (isLarge) return 'lg';
    if (isMedium) return 'md';
    if (isSmall) return 'sm';
    return 'xs';
  }, [isSmall, isMedium, isLarge, isXLarge, is2XLarge]);

  return {
    isMobile: !isMedium,
    isTablet: isMedium && !isLarge,
    isDesktop: isLarge,
    isSmall,
    isMedium,
    isLarge,
    isXLarge,
    is2XLarge,
    breakpoint: getBreakpoint(),
  };
};

/**
 * Hook para detectar orientación del dispositivo
 */
export const useOrientation = (): 'portrait' | 'landscape' => {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
};

/**
 * Hook para detectar si el usuario prefiere reduced motion
 */
export const usePrefersReducedMotion = (): boolean => {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
};

/**
 * Hook para detectar si el dispositivo tiene touch
 */
export const useHasTouch = (): boolean => {
  const [hasTouch, setHasTouch] = useState(false);

  useEffect(() => {
    setHasTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return hasTouch;
};

export default useMediaQuery;
