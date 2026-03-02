import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseLocalDate,
  addDaysToDateString,
  formatFechaCorta,
  isFechaPasada,
  isFechaHoy,
  getFechaManana,
} from '@/utils/dateUtils';

describe('dateUtils utilities', () => {
  describe('parseLocalDate', () => {
    it('should return null for null input', () => {
      expect(parseLocalDate(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseLocalDate(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseLocalDate('')).toBeNull();
    });

    it('should parse YYYY-MM-DD string to local Date', () => {
      const result = parseLocalDate('2024-06-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(5); // June = 5 (0-indexed)
      expect(result?.getDate()).toBe(15);
    });

    it('should parse datetime string with T separator', () => {
      const result = parseLocalDate('2024-06-15T10:30:00');
      expect(result).toBeInstanceOf(Date);
    });

    it('should correctly parse start of year', () => {
      const result = parseLocalDate('2024-01-01');
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January = 0
      expect(result?.getDate()).toBe(1);
    });

    it('should correctly parse end of year', () => {
      const result = parseLocalDate('2024-12-31');
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(11); // December = 11
      expect(result?.getDate()).toBe(31);
    });
  });

  describe('addDaysToDateString', () => {
    it('should add 1 day to date string', () => {
      const result = addDaysToDateString('2024-01-15', 1);
      expect(result).toBe('2024-01-16');
    });

    it('should add 7 days to date string', () => {
      const result = addDaysToDateString('2024-01-25', 7);
      expect(result).toBe('2024-02-01');
    });

    it('should handle month rollover', () => {
      const result = addDaysToDateString('2024-01-31', 1);
      expect(result).toBe('2024-02-01');
    });

    it('should handle year rollover', () => {
      const result = addDaysToDateString('2024-12-31', 1);
      expect(result).toBe('2025-01-01');
    });

    it('should handle adding 0 days (returns same date)', () => {
      const result = addDaysToDateString('2024-06-15', 0);
      expect(result).toBe('2024-06-15');
    });

    it('should handle negative days (subtract)', () => {
      const result = addDaysToDateString('2024-06-15', -5);
      expect(result).toBe('2024-06-10');
    });

    it('should return zero-padded month and day', () => {
      const result = addDaysToDateString('2024-01-01', 0);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatFechaCorta', () => {
    it('should return dash for null input', () => {
      expect(formatFechaCorta(null)).toBe('-');
    });

    it('should return dash for undefined input', () => {
      expect(formatFechaCorta(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(formatFechaCorta('')).toBe('-');
    });

    it('should format date string in DD/MM/YYYY format', () => {
      const result = formatFechaCorta('2024-06-15');
      // es-CO locale formats as DD/MM/YYYY
      expect(result).toContain('15');
      expect(result).toContain('06');
      expect(result).toContain('2024');
    });
  });

  describe('isFechaPasada', () => {
    it('should return true for past date', () => {
      // A date clearly in the past
      expect(isFechaPasada('2020-01-01')).toBe(true);
    });

    it('should return false for future date', () => {
      // A date clearly in the future
      expect(isFechaPasada('2099-12-31')).toBe(false);
    });
  });

  describe('isFechaHoy', () => {
    it('should return false for a past date', () => {
      expect(isFechaHoy('2020-01-01')).toBe(false);
    });

    it('should return false for a future date', () => {
      expect(isFechaHoy('2099-12-31')).toBe(false);
    });
  });

  describe('getFechaManana', () => {
    it('should return a string in YYYY-MM-DD format', () => {
      const result = getFechaManana();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return a date that is after today', () => {
      const tomorrow = getFechaManana();
      // Tomorrow should not be in the past
      expect(isFechaPasada(tomorrow)).toBe(false);
    });
  });
});
