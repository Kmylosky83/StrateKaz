/**
 * useResponsive - Hook centralizado para responsive breakpoints
 *
 * Sincronizado con Tailwind breakpoints:
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 *
 * @example
 * const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
 * if (isMobile) return <MobileView />;
 */

import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface ResponsiveState {
  /** Mobile: < 768px */
  isMobile: boolean;
  /** Tablet: >= 768px && < 1024px */
  isTablet: boolean;
  /** Desktop: >= 1024px */
  isDesktop: boolean;
  /** Wide: >= 1280px */
  isWide: boolean;
  /** Current breakpoint */
  breakpoint: Breakpoint;
  /** Window width */
  width: number;
}

const getBreakpoint = (width: number): Breakpoint => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1280) return 'desktop';
  return 'wide';
};

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    // SSR-safe initialization
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: false,
        breakpoint: 'desktop',
        width: 1024,
      };
    }

    const width = window.innerWidth;
    const breakpoint = getBreakpoint(width);

    return {
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
      isWide: breakpoint === 'wide',
      breakpoint,
      width,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events (optimización performance)
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const breakpoint = getBreakpoint(width);

        setState({
          isMobile: breakpoint === 'mobile',
          isTablet: breakpoint === 'tablet',
          isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
          isWide: breakpoint === 'wide',
          breakpoint,
          width,
        });
      }, 150); // 150ms debounce
    };

    window.addEventListener('resize', handleResize);

    // Initial call
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return state;
}

/**
 * Hook simplificado para detectar solo si es móvil
 */
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

/**
 * Hook para detectar orientación en móviles
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
}
