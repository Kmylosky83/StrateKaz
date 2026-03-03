import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResponsive, useIsMobile } from '@/hooks/useResponsive';

describe('useResponsive Hook', () => {
  const originalInnerWidth = window.innerWidth;

  // Helper to set window width BEFORE rendering
  function setWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  }

  afterEach(() => {
    setWidth(originalInnerWidth);
    vi.restoreAllMocks();
  });

  describe('Mobile detection (< 768px)', () => {
    it('should detect mobile viewport at 375px', () => {
      setWidth(375);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.breakpoint).toBe('mobile');
    });

    it('should detect mobile at 767px', () => {
      setWidth(767);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isMobile).toBe(true);
      expect(result.current.breakpoint).toBe('mobile');
    });

    it('should report correct width value', () => {
      setWidth(500);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.width).toBe(500);
    });
  });

  describe('Tablet detection (768px - 1023px)', () => {
    it('should detect tablet at 768px', () => {
      setWidth(768);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.breakpoint).toBe('tablet');
    });

    it('should detect tablet at 1023px', () => {
      setWidth(1023);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isTablet).toBe(true);
      expect(result.current.breakpoint).toBe('tablet');
    });
  });

  describe('Desktop detection (1024px - 1279px)', () => {
    it('should detect desktop at 1024px', () => {
      setWidth(1024);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.breakpoint).toBe('desktop');
    });

    it('should detect desktop at 1279px (not wide)', () => {
      setWidth(1279);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isWide).toBe(false);
    });
  });

  describe('Wide detection (>= 1280px)', () => {
    it('should detect wide at 1280px', () => {
      setWidth(1280);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isWide).toBe(true);
      // isDesktop includes wide
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.breakpoint).toBe('wide');
    });

    it('should detect wide at 1920px', () => {
      setWidth(1920);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isWide).toBe(true);
      expect(result.current.breakpoint).toBe('wide');
    });
  });

  describe('Width tracking', () => {
    it('should report current window width', () => {
      setWidth(1024);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.width).toBe(1024);
    });
  });
});

describe('useIsMobile Hook', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('should return true for mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should return false for desktop viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
