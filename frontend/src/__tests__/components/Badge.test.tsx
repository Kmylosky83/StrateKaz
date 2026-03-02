import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, type BadgeVariant, type BadgeSize } from '@/components/common/Badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render with text content', () => {
      render(<Badge>Activo</Badge>);
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('should render as a span element', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.tagName).toBe('SPAN');
    });

    it('should render with default variant (primary)', () => {
      render(<Badge>Primary</Badge>);
      expect(screen.getByText('Primary')).toHaveClass('bg-primary-100', 'text-primary-800');
    });
  });

  describe('Variants', () => {
    const variantTests: Array<{ variant: BadgeVariant; expectedClasses: string[] }> = [
      { variant: 'primary', expectedClasses: ['bg-primary-100', 'text-primary-800'] },
      { variant: 'secondary', expectedClasses: ['bg-secondary-100', 'text-secondary-800'] },
      { variant: 'success', expectedClasses: ['bg-success-100', 'text-success-800'] },
      { variant: 'warning', expectedClasses: ['bg-warning-100', 'text-warning-800'] },
      { variant: 'danger', expectedClasses: ['bg-danger-100', 'text-danger-800'] },
      { variant: 'info', expectedClasses: ['bg-info-100', 'text-info-800'] },
      { variant: 'gray', expectedClasses: ['bg-gray-100', 'text-gray-800'] },
    ];

    variantTests.forEach(({ variant, expectedClasses }) => {
      it(`should apply correct classes for variant "${variant}"`, () => {
        render(<Badge variant={variant}>{variant}</Badge>);
        const badge = screen.getByText(variant);
        expectedClasses.forEach((cls) => {
          expect(badge).toHaveClass(cls);
        });
      });
    });
  });

  describe('Sizes', () => {
    const sizeTests: Array<{ size: BadgeSize; expectedClasses: string[] }> = [
      { size: 'sm', expectedClasses: ['px-2', 'py-0.5', 'text-xs'] },
      { size: 'md', expectedClasses: ['px-2.5', 'py-1', 'text-sm'] },
      { size: 'lg', expectedClasses: ['px-3', 'py-1.5', 'text-base'] },
    ];

    sizeTests.forEach(({ size, expectedClasses }) => {
      it(`should apply correct padding and text size for size "${size}"`, () => {
        render(<Badge size={size}>{size}</Badge>);
        const badge = screen.getByText(size);
        expectedClasses.forEach((cls) => {
          expect(badge).toHaveClass(cls);
        });
      });
    });

    it('should default to "md" size', () => {
      render(<Badge>Default size</Badge>);
      const badge = screen.getByText('Default size');
      expect(badge).toHaveClass('px-2.5', 'py-1', 'text-sm');
    });
  });

  describe('Base Classes', () => {
    it('should always have rounded-full class', () => {
      render(<Badge>Rounded</Badge>);
      expect(screen.getByText('Rounded')).toHaveClass('rounded-full');
    });

    it('should always have font-medium class', () => {
      render(<Badge>Medium</Badge>);
      expect(screen.getByText('Medium')).toHaveClass('font-medium');
    });

    it('should have inline-flex class for icon support', () => {
      render(<Badge>Inline</Badge>);
      expect(screen.getByText('Inline')).toHaveClass('inline-flex');
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      expect(screen.getByText('Custom')).toHaveClass('custom-badge');
    });

    it('should pass through HTML attributes', () => {
      render(<Badge data-testid="my-badge">Test</Badge>);
      expect(screen.getByTestId('my-badge')).toBeInTheDocument();
    });

    it('should render with accent variant', () => {
      render(<Badge variant="accent">Accent</Badge>);
      expect(screen.getByText('Accent')).toHaveClass('bg-accent-100', 'text-accent-800');
    });
  });
});
