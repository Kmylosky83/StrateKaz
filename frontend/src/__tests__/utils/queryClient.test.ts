import { describe, it, expect, vi } from 'vitest';
import {
  queryClient,
  invalidateAllQueries,
  clearAllQueries,
  invalidateBrandingQueries,
} from '@/lib/queryClient';

describe('queryClient Configuration', () => {
  describe('Default options', () => {
    it('should have refetchOnWindowFocus disabled', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    });

    it('should have retry set to 1', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.retry).toBe(1);
    });

    it('should have staleTime set to 5 minutes (300000ms)', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
    });
  });

  describe('invalidateAllQueries', () => {
    it('should be a function', () => {
      expect(typeof invalidateAllQueries).toBe('function');
    });

    it('should call queryClient.invalidateQueries', () => {
      const spy = vi.spyOn(queryClient, 'invalidateQueries');
      invalidateAllQueries();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('clearAllQueries', () => {
    it('should be a function', () => {
      expect(typeof clearAllQueries).toBe('function');
    });

    it('should call queryClient.clear', () => {
      const spy = vi.spyOn(queryClient, 'clear');
      clearAllQueries();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('invalidateBrandingQueries', () => {
    it('should be a function', () => {
      expect(typeof invalidateBrandingQueries).toBe('function');
    });

    it('should call invalidateQueries for branding keys', () => {
      const spy = vi.spyOn(queryClient, 'invalidateQueries');
      invalidateBrandingQueries();
      // Should be called twice: once for 'branding' and once for 'brandings'
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith({ queryKey: ['branding'] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ['brandings'] });
      spy.mockRestore();
    });
  });
});
