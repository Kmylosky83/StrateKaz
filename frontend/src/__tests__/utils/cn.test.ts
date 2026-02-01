import { describe, it, expect } from 'vitest';
import { cn } from '@/utils/cn';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('bg-red-500', 'text-white');
    expect(result).toContain('bg-red-500');
    expect(result).toContain('text-white');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('should ignore falsy values', () => {
    const result = cn('base-class', false && 'hidden', null, undefined, '');
    expect(result).toBe('base-class');
  });

  it('should override conflicting Tailwind classes', () => {
    // Assuming cn uses tailwind-merge internally
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toContain('bg-blue-500');
    expect(result).not.toContain('bg-red-500');
  });

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2', 'class3']);
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
  });

  it('should handle object with boolean values', () => {
    const result = cn({
      'base-class': true,
      'active': true,
      'disabled': false,
    });
    expect(result).toContain('base-class');
    expect(result).toContain('active');
    expect(result).not.toContain('disabled');
  });
});
