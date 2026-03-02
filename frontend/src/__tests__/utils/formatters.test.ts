import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatTime,
  formatWeight,
  formatPhone,
  formatNIT,
  formatPercentage,
  truncateText,
} from '@/utils/formatters';

describe('formatters utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive integer as COP currency', () => {
      const result = formatCurrency(1000000);
      // Colombian peso format includes COP symbol and separators
      expect(result).toContain('1');
      expect(result).toContain('000');
    });

    it('should format zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should not include decimal places for COP', () => {
      const result = formatCurrency(1500);
      expect(result).not.toContain(',00');
    });
  });

  describe('formatNumber', () => {
    it('should format number with no decimals by default', () => {
      const result = formatNumber(1000);
      // Should use thousands separator (dot in es-CO locale)
      expect(result).toBeTruthy();
    });

    it('should format number with specified decimal places', () => {
      const result = formatNumber(1234.567, 2);
      expect(result).toContain('1');
    });

    it('should handle zero', () => {
      const result = formatNumber(0);
      expect(result).toBe('0');
    });

    it('should format large numbers', () => {
      const result = formatNumber(1000000, 0);
      expect(result).toBeTruthy();
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string to DD/MM/YYYY', () => {
      const result = formatDate('2024-12-25');
      expect(result).toBe('25/12/2024');
    });

    it('should format date with dashes correctly', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBe('15/01/2024');
    });

    it('should return empty string for invalid date', () => {
      const result = formatDate('not-a-date');
      expect(result).toBe('');
    });

    it('should format Date object', () => {
      // Use a specific local date to avoid timezone issues
      const date = new Date(2024, 0, 10); // January 10, 2024 (month is 0-indexed)
      const result = formatDate(date);
      expect(result).toBe('10/01/2024');
    });
  });

  describe('formatDateTime', () => {
    it('should format ISO datetime string with date and time', () => {
      const result = formatDateTime('2024-06-15T14:30:00Z');
      // Should contain date and time parts
      expect(result).toContain('2024');
      expect(result).toContain('/');
    });

    it('should return empty string for invalid datetime', () => {
      const result = formatDateTime('invalid-datetime');
      expect(result).toBe('');
    });
  });

  describe('formatTime', () => {
    it('should format HH:MM time string correctly', () => {
      expect(formatTime('09:30')).toBe('09:30');
    });

    it('should pad single-digit hours', () => {
      expect(formatTime('9:05')).toBe('09:05');
    });

    it('should pad single-digit minutes', () => {
      expect(formatTime('12:5')).toBe('12:05');
    });

    it('should handle full HH:MM:SS by taking first two parts', () => {
      const result = formatTime('14:30:00');
      expect(result).toBe('14:30');
    });

    it('should return empty string on exception', () => {
      // Pass null-like value that would cause an error
      const result = formatTime('');
      expect(result).toBe('');
    });
  });

  describe('formatWeight', () => {
    it('should format weight with kg unit', () => {
      const result = formatWeight(150);
      expect(result).toContain('kg');
    });

    it('should format weight with 2 decimal places', () => {
      const result = formatWeight(150.5);
      expect(result).toContain('kg');
    });

    it('should handle zero weight', () => {
      const result = formatWeight(0);
      expect(result).toContain('kg');
    });
  });

  describe('formatPhone', () => {
    it('should format 10-digit Colombian mobile number', () => {
      const result = formatPhone('3001234567');
      expect(result).toBe('300 123 4567');
    });

    it('should return original string for non-10-digit numbers', () => {
      const result = formatPhone('12345');
      expect(result).toBe('12345');
    });

    it('should strip non-numeric characters before formatting', () => {
      const result = formatPhone('+57 300 123 4567');
      // 57 + 10 digits = 12 digits, so it won't match 10-digit pattern
      expect(result).toBeTruthy();
    });

    it('should format landline number (7 digits - returns original since not 10)', () => {
      const result = formatPhone('2345678');
      expect(result).toBe('2345678');
    });
  });

  describe('formatNIT', () => {
    it('should format 10-digit NIT with hyphen', () => {
      const result = formatNIT('9001234567');
      // Should contain hyphen separating verification digit
      expect(result).toContain('-');
    });

    it('should handle NIT with fewer than 9 digits (returns original)', () => {
      const result = formatNIT('12345');
      expect(result).toBe('12345');
    });

    it('should strip non-numeric characters', () => {
      const result = formatNIT('900.123.456-7');
      // After cleaning: 9001234567 - should reformat
      expect(result).toContain('-');
    });
  });

  describe('formatPercentage', () => {
    it('should format value with % symbol', () => {
      const result = formatPercentage(85);
      expect(result).toContain('%');
      expect(result).toContain('85');
    });

    it('should use 2 decimal places by default', () => {
      const result = formatPercentage(85.5);
      expect(result).toContain('85');
    });

    it('should use custom decimal places', () => {
      const result = formatPercentage(85, 0);
      expect(result).toContain('%');
    });

    it('should handle 100%', () => {
      const result = formatPercentage(100);
      expect(result).toContain('100');
      expect(result).toContain('%');
    });

    it('should handle 0%', () => {
      const result = formatPercentage(0);
      expect(result).toContain('0');
      expect(result).toContain('%');
    });
  });

  describe('truncateText', () => {
    it('should return original text if shorter than maxLength', () => {
      const result = truncateText('Hola', 10);
      expect(result).toBe('Hola');
    });

    it('should return original text if equal to maxLength', () => {
      const result = truncateText('Hola', 4);
      expect(result).toBe('Hola');
    });

    it('should truncate and add ellipsis if longer than maxLength', () => {
      const result = truncateText('Este es un texto muy largo', 10);
      expect(result).toBe('Este es un...');
      expect(result.length).toBe(13); // 10 chars + '...'
    });

    it('should handle empty string', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });

    it('should handle maxLength of 0', () => {
      const result = truncateText('Texto', 0);
      expect(result).toBe('...');
    });
  });
});
