/**
 * Custom hooks for responsive design
 * Provides utilities for responsive behavior in React components
 */

import { useState, useEffect, useMemo } from 'react';
import { BREAKPOINTS, type Breakpoint } from '@/config/responsive.config';

/**
 * Hook to detect current breakpoint
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const breakpoints = Object.entries(BREAKPOINTS).reverse() as [
        Breakpoint,
        number,
      ][];

      for (const [key, value] of breakpoints) {
        if (width >= value) {
          setBreakpoint(key);
          break;
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

/**
 * Hook to check if current viewport matches a media query
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

/**
 * Hook to check if viewport is at or above a breakpoint
 */
export const useIsAbove = (breakpoint: Breakpoint): boolean => {
  const query = useMemo(
    () => `(min-width: ${BREAKPOINTS[breakpoint]}px)`,
    [breakpoint]
  );

  return useMediaQuery(query);
};

/**
 * Hook to check if viewport is below a breakpoint
 */
export const useIsBelow = (breakpoint: Breakpoint): boolean => {
  const query = useMemo(
    () => `(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`,
    [breakpoint]
  );

  return useMediaQuery(query);
};

/**
 * Hook to check if viewport is between two breakpoints
 */
export const useIsBetween = (min: Breakpoint, max: Breakpoint): boolean => {
  const query = useMemo(
    () =>
      `(min-width: ${BREAKPOINTS[min]}px) and (max-width: ${
        BREAKPOINTS[max] - 1
      }px)`,
    [min, max]
  );

  return useMediaQuery(query);
};

/**
 * Hook to detect mobile devices
 */
export const useIsMobile = (): boolean => {
  return useIsBelow('md');
};

/**
 * Hook to detect tablet devices
 */
export const useIsTablet = (): boolean => {
  return useIsBetween('md', 'lg');
};

/**
 * Hook to detect desktop devices
 */
export const useIsDesktop = (): boolean => {
  return useIsAbove('lg');
};

/**
 * Hook to get viewport dimensions
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

/**
 * Hook for responsive values based on breakpoint
 */
export const useResponsiveValue = <T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T => {
  const currentBreakpoint = useBreakpoint();
  const breakpointKeys = Object.keys(BREAKPOINTS) as Breakpoint[];
  const currentIndex = breakpointKeys.indexOf(currentBreakpoint);

  // Find the value for current or nearest smaller breakpoint
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointKeys[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }

  return defaultValue;
};

/**
 * Hook for conditional rendering based on breakpoint
 */
export const useShowOn = (breakpoints: Breakpoint[]): boolean => {
  const currentBreakpoint = useBreakpoint();
  return breakpoints.includes(currentBreakpoint);
};

/**
 * Hook for conditional hiding based on breakpoint
 */
export const useHideOn = (breakpoints: Breakpoint[]): boolean => {
  const currentBreakpoint = useBreakpoint();
  return !breakpoints.includes(currentBreakpoint);
};

/**
 * Hook to detect touch devices
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
      );
    };

    checkTouch();
  }, []);

  return isTouch;
};

/**
 * Hook to detect device orientation
 */
export const useOrientation = (): 'portrait' | 'landscape' => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

// Export all hooks
export default {
  useBreakpoint,
  useMediaQuery,
  useIsAbove,
  useIsBelow,
  useIsBetween,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useViewport,
  useResponsiveValue,
  useShowOn,
  useHideOn,
  useIsTouchDevice,
  useOrientation,
};
