/**
 * Tests para el componente Card del Design System
 *
 * Cobertura:
 * - Renderizado básico
 * - Variantes de estilo
 * - Padding
 * - Clases personalizadas
 * - Composición
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  // ============================================
  // RENDERIZADO BÁSICO
  // ============================================
  describe('Renderizado básico', () => {
    it('renderiza correctamente con contenido', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('aplica clases por defecto (variant=default, padding=md)', () => {
      render(<Card data-testid="card">Default Card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('shadow-sm');
      expect(card).toHaveClass('p-6');
      expect(card).toHaveClass('rounded-xl');
    });

    it('es un elemento div', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');
      expect(card.tagName).toBe('DIV');
    });

    it('pasa atributos HTML nativos', () => {
      render(<Card data-testid="my-card" id="card-1">Test</Card>);
      const card = screen.getByTestId('my-card');
      expect(card).toHaveAttribute('id', 'card-1');
    });
  });

  // ============================================
  // VARIANTES
  // ============================================
  describe('Variantes', () => {
    it('aplica estilos de variante default', () => {
      render(<Card variant="default" data-testid="card">Default</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('shadow-sm');
    });

    it('aplica estilos de variante bordered', () => {
      render(<Card variant="bordered" data-testid="card">Bordered</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-gray-200');
    });

    it('aplica estilos de variante elevated', () => {
      render(<Card variant="elevated" data-testid="card">Elevated</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('shadow-lg');
    });
  });

  // ============================================
  // PADDING
  // ============================================
  describe('Padding', () => {
    it('aplica padding none', () => {
      render(<Card padding="none" data-testid="card">No Padding</Card>);
      const card = screen.getByTestId('card');
      // padding none no añade clase de padding
      expect(card).not.toHaveClass('p-4');
      expect(card).not.toHaveClass('p-6');
      expect(card).not.toHaveClass('p-8');
    });

    it('aplica padding sm', () => {
      render(<Card padding="sm" data-testid="card">Small Padding</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-4');
    });

    it('aplica padding md (default)', () => {
      render(<Card padding="md" data-testid="card">Medium Padding</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-6');
    });

    it('aplica padding lg', () => {
      render(<Card padding="lg" data-testid="card">Large Padding</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-8');
    });
  });

  // ============================================
  // CLASES PERSONALIZADAS
  // ============================================
  describe('Clases personalizadas', () => {
    it('permite añadir clases adicionales via className', () => {
      render(<Card className="custom-class" data-testid="card">Custom</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('mantiene las clases base junto con las personalizadas', () => {
      render(<Card className="my-custom" variant="bordered" data-testid="card">Custom</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('my-custom');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('rounded-xl');
    });
  });

  // ============================================
  // COMPOSICIÓN
  // ============================================
  describe('Composición', () => {
    it('puede contener elementos complejos', () => {
      render(
        <Card data-testid="card">
          <h2>Title</h2>
          <p>Description</p>
          <button>Action</button>
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toContainElement(screen.getByText('Title'));
      expect(card).toContainElement(screen.getByText('Description'));
      expect(card).toContainElement(screen.getByRole('button'));
    });

    it('puede anidar otras Cards', () => {
      render(
        <Card data-testid="outer">
          <Card data-testid="inner">Inner Card</Card>
        </Card>
      );
      const outer = screen.getByTestId('outer');
      const inner = screen.getByTestId('inner');
      expect(outer).toContainElement(inner);
    });
  });

  // ============================================
  // ESTILOS BASE
  // ============================================
  describe('Estilos base', () => {
    it('siempre tiene rounded-xl', () => {
      render(<Card data-testid="card">Base</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-xl');
    });
  });
});
