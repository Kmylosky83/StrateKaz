/**
 * Tests for useDynamicTheme hook utility functions.
 *
 * Since useDynamicTheme depends on useBrandingConfig (which requires React Query + API),
 * we test the exported pure utility functions (hexToRgb, generateColorVariants)
 * by importing them indirectly through the module.
 *
 * We also test the hook behavior by mocking useBrandingConfig.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock useBrandingConfig before importing useDynamicTheme
vi.mock('@/hooks/useBrandingConfig', () => ({
  useBrandingConfig: vi.fn(),
}));

import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import type { UseBrandingConfigReturn } from '@/hooks/useBrandingConfig';

const mockedUseBrandingConfig = vi.mocked(useBrandingConfig);

describe('useDynamicTheme Hook', () => {
  beforeEach(() => {
    // Default mock: loading state (no changes applied)
    mockedUseBrandingConfig.mockReturnValue({
      primaryColor: '',
      secondaryColor: '',
      accentColor: '',
      sidebarColor: '',
      backgroundColor: '',
      favicon: '',
      companyName: '',
      companySlogan: '',
      logo: '',
      logoWhite: '',
      loginBackground: '',
      isLoading: true,
      isError: false,
      branding: null,
      pwaIcon192: '',
      pwaIcon512: '',
      pwaThemeColor: '',
    } as unknown as UseBrandingConfigReturn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up CSS variables set on :root
    const root = document.documentElement;
    root.style.cssText = '';
  });

  describe('Loading state', () => {
    it('should not set CSS variables while loading', () => {
      renderHook(() => useDynamicTheme());
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary')).toBe('');
    });
  });

  describe('Error state', () => {
    it('should not set CSS variables on error', () => {
      mockedUseBrandingConfig.mockReturnValue({
        primaryColor: '#ec268f',
        secondaryColor: '#3B82F6',
        accentColor: '#10B981',
        sidebarColor: '',
        backgroundColor: '',
        favicon: '',
        companyName: '',
        companySlogan: '',
        logo: '',
        logoWhite: '',
        loginBackground: '',
        isLoading: false,
        isError: true,
        branding: null,
        pwaIcon192: '',
        pwaIcon512: '',
        pwaThemeColor: '',
      } as unknown as UseBrandingConfigReturn);

      renderHook(() => useDynamicTheme());
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary')).toBe('');
    });
  });

  describe('With valid branding', () => {
    it('should set primary color CSS variables', () => {
      mockedUseBrandingConfig.mockReturnValue({
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        sidebarColor: '#1F2937',
        backgroundColor: '#F9FAFB',
        favicon: '/favicon.ico',
        companyName: 'Test Company',
        companySlogan: 'Test Slogan',
        logo: '/logo.png',
        logoWhite: '/logo-white.png',
        loginBackground: '',
        isLoading: false,
        isError: false,
        branding: {
          company_name: 'Test Company',
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B',
        },
        pwaIcon192: '',
        pwaIcon512: '',
        pwaThemeColor: '',
      } as unknown as UseBrandingConfigReturn);

      renderHook(() => useDynamicTheme());
      const root = document.documentElement;

      // Should have set --color-primary with RGB values of #3B82F6
      const primaryValue = root.style.getPropertyValue('--color-primary');
      expect(primaryValue).toBeTruthy();
      expect(primaryValue).toContain('59'); // R from #3B = 59
    });

    it('should set secondary color CSS variables', () => {
      mockedUseBrandingConfig.mockReturnValue({
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        sidebarColor: '',
        backgroundColor: '',
        favicon: '',
        companyName: 'Test',
        companySlogan: '',
        logo: '',
        logoWhite: '',
        loginBackground: '',
        isLoading: false,
        isError: false,
        branding: {
          company_name: 'Test',
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B',
        },
        pwaIcon192: '',
        pwaIcon512: '',
        pwaThemeColor: '',
      } as unknown as UseBrandingConfigReturn);

      renderHook(() => useDynamicTheme());
      const root = document.documentElement;

      const secondaryValue = root.style.getPropertyValue('--color-secondary');
      expect(secondaryValue).toBeTruthy();
    });

    it('should set color variant shades (50 through 950)', () => {
      mockedUseBrandingConfig.mockReturnValue({
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        sidebarColor: '',
        backgroundColor: '',
        favicon: '',
        companyName: 'Test',
        companySlogan: '',
        logo: '',
        logoWhite: '',
        loginBackground: '',
        isLoading: false,
        isError: false,
        branding: {
          company_name: 'Test',
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#F59E0B',
        },
        pwaIcon192: '',
        pwaIcon512: '',
        pwaThemeColor: '',
      } as unknown as UseBrandingConfigReturn);

      renderHook(() => useDynamicTheme());
      const root = document.documentElement;

      // Should have set shades 50-950 for primary
      const shade500 = root.style.getPropertyValue('--color-primary-500');
      expect(shade500).toBeTruthy();

      const shade100 = root.style.getPropertyValue('--color-primary-100');
      expect(shade100).toBeTruthy();

      const shade900 = root.style.getPropertyValue('--color-primary-900');
      expect(shade900).toBeTruthy();
    });
  });

  describe('Document title update', () => {
    it('should set document.title when companyName is provided', () => {
      mockedUseBrandingConfig.mockReturnValue({
        primaryColor: '',
        secondaryColor: '',
        accentColor: '',
        sidebarColor: '',
        backgroundColor: '',
        favicon: '',
        companyName: 'Mi Empresa SAS',
        companySlogan: '',
        logo: '',
        logoWhite: '',
        loginBackground: '',
        isLoading: false,
        isError: false,
        branding: null,
        pwaIcon192: '',
        pwaIcon512: '',
        pwaThemeColor: '',
      } as unknown as UseBrandingConfigReturn);

      renderHook(() => useDynamicTheme());
      expect(document.title).toBe('Mi Empresa SAS');
    });
  });
});
