/**
 * Tests para el componente Badge del Design System
 *
 * Cobertura:
 * - Renderizado básico
 * - Variantes de estilo
 * - Tamaños
 * - Clases personalizadas
 * - Accesibilidad
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  // ============================================
  // RENDERIZADO BÁSICO
  // ============================================
  describe('Renderizado básico', () => {
    it('renderiza correctamente con texto', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('aplica clases por defecto (variant=primary, size=md)', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-primary-100');
      expect(badge).toHaveClass('text-primary-800');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-1');
    });

    it('es un elemento span', () => {
      render(<Badge data-testid="badge">Test</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge.tagName).toBe('SPAN');
    });

    it('pasa atributos HTML nativos', () => {
      render(<Badge data-testid="my-badge" id="badge-1">Test</Badge>);
      const badge = screen.getByTestId('my-badge');
      expect(badge).toHaveAttribute('id', 'badge-1');
    });
  });

  // ============================================
  // VARIANTES
  // ============================================
  describe('Variantes', () => {
    it('aplica estilos de variante primary', () => {
      render(<Badge variant="primary">Primary</Badge>);
      const badge = screen.getByText('Primary');
      expect(badge).toHaveClass('bg-primary-100');
      expect(badge).toHaveClass('text-primary-800');
    });

    it('aplica estilos de variante secondary', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary-100');
      expect(badge).toHaveClass('text-secondary-800');
    });

    it('aplica estilos de variante accent', () => {
      render(<Badge variant="accent">Accent</Badge>);
      const badge = screen.getByText('Accent');
      expect(badge).toHaveClass('bg-accent-100');
      expect(badge).toHaveClass('text-accent-800');
    });

    it('aplica estilos de variante success', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-success-100');
      expect(badge).toHaveClass('text-success-800');
    });

    it('aplica estilos de variante warning', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-warning-100');
      expect(badge).toHaveClass('text-warning-800');
    });

    it('aplica estilos de variante danger', () => {
      render(<Badge variant="danger">Danger</Badge>);
      const badge = screen.getByText('Danger');
      expect(badge).toHaveClass('bg-danger-100');
      expect(badge).toHaveClass('text-danger-800');
    });

    it('aplica estilos de variante info', () => {
      render(<Badge variant="info">Info</Badge>);
      const badge = screen.getByText('Info');
      expect(badge).toHaveClass('bg-info-100');
      expect(badge).toHaveClass('text-info-800');
    });

    it('aplica estilos de variante gray', () => {
      render(<Badge variant="gray">Gray</Badge>);
      const badge = screen.getByText('Gray');
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-800');
    });
  });

  // ============================================
  // TAMAÑOS
  // ============================================
  describe('Tamaños', () => {
    it('aplica tamaño sm', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
    });

    it('aplica tamaño md (default)', () => {
      render(<Badge size="md">Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });

    it('aplica tamaño lg', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-base');
    });
  });

  // ============================================
  // CLASES PERSONALIZADAS
  // ============================================
  describe('Clases personalizadas', () => {
    it('permite añadir clases adicionales via className', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-class');
    });

    it('mantiene las clases base junto con las personalizadas', () => {
      render(<Badge className="my-custom" variant="success">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('my-custom');
      expect(badge).toHaveClass('bg-success-100');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  // ============================================
  // ESTILOS BASE
  // ============================================
  describe('Estilos base', () => {
    it('siempre tiene estilos base de badge', () => {
      render(<Badge>Base Styles</Badge>);
      const badge = screen.getByText('Base Styles');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('font-medium');
      expect(badge).toHaveClass('rounded-full');
    });
  });
});
