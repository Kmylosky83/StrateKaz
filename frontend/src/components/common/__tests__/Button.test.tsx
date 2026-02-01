/**
 * Tests para el componente Button del Design System
 *
 * Cobertura:
 * - Renderizado básico
 * - Variantes de estilo
 * - Tamaños
 * - Estados (loading, disabled)
 * - Iconos
 * - Accesibilidad
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import { Plus, ArrowRight } from 'lucide-react';

describe('Button', () => {
  // ============================================
  // RENDERIZADO BÁSICO
  // ============================================
  describe('Renderizado básico', () => {
    it('renderiza correctamente con texto', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('aplica clases por defecto (variant=primary, size=md)', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-600');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });

    it('pasa atributos HTML nativos', () => {
      render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
      const button = screen.getByTestId('submit-btn');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  // ============================================
  // VARIANTES
  // ============================================
  describe('Variantes', () => {
    it('aplica estilos de variante primary', () => {
      render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-primary-600');
    });

    it('aplica estilos de variante secondary', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-secondary-100');
    });

    it('aplica estilos de variante accent', () => {
      render(<Button variant="accent">Accent</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-accent-500');
    });

    it('aplica estilos de variante danger', () => {
      render(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-danger-600');
    });

    it('aplica estilos de variante ghost', () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('text-gray-700');
    });

    it('aplica estilos de variante outline', () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('border-2');
      expect(screen.getByRole('button')).toHaveClass('border-primary-600');
    });
  });

  // ============================================
  // TAMAÑOS
  // ============================================
  describe('Tamaños', () => {
    it('aplica tamaño sm', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
      expect(button).toHaveClass('text-sm');
    });

    it('aplica tamaño md (default)', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('text-base');
    });

    it('aplica tamaño lg', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('text-lg');
    });
  });

  // ============================================
  // ESTADO LOADING
  // ============================================
  describe('Estado Loading', () => {
    it('muestra spinner cuando isLoading=true', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      // Lucide Loader2 tiene la clase animate-spin
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('deshabilita el botón cuando isLoading=true', () => {
      render(<Button isLoading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('oculta leftIcon cuando isLoading=true', () => {
      render(
        <Button isLoading leftIcon={<Plus data-testid="plus-icon" />}>
          Add
        </Button>
      );
      expect(screen.queryByTestId('plus-icon')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // ESTADO DISABLED
  // ============================================
  describe('Estado Disabled', () => {
    it('aplica estilos de disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('no dispara onClick cuando disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // ICONOS
  // ============================================
  describe('Iconos', () => {
    it('renderiza leftIcon correctamente', () => {
      render(
        <Button leftIcon={<Plus data-testid="left-icon" />}>Add Item</Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renderiza rightIcon correctamente', () => {
      render(
        <Button rightIcon={<ArrowRight data-testid="right-icon" />}>Next</Button>
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('renderiza ambos iconos cuando se proporcionan', () => {
      render(
        <Button
          leftIcon={<Plus data-testid="left" />}
          rightIcon={<ArrowRight data-testid="right" />}
        >
          Both
        </Button>
      );
      expect(screen.getByTestId('left')).toBeInTheDocument();
      expect(screen.getByTestId('right')).toBeInTheDocument();
    });
  });

  // ============================================
  // EVENTOS
  // ============================================
  describe('Eventos', () => {
    it('dispara onClick cuando se hace click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('pasa el evento al handler', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  // ============================================
  // CLASES PERSONALIZADAS
  // ============================================
  describe('Clases personalizadas', () => {
    it('permite añadir clases adicionales via className', () => {
      render(<Button className="custom-class w-full">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('w-full');
    });

    it('mantiene las clases base junto con las personalizadas', () => {
      render(<Button className="custom" variant="primary">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom');
      expect(button).toHaveClass('bg-primary-600');
    });
  });

  // ============================================
  // ACCESIBILIDAD
  // ============================================
  describe('Accesibilidad', () => {
    it('tiene role="button" por defecto', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('soporta aria-label', () => {
      render(<Button aria-label="Agregar elemento">+</Button>);
      expect(screen.getByLabelText('Agregar elemento')).toBeInTheDocument();
    });

    it('soporta aria-disabled cuando disabled', () => {
      render(<Button disabled aria-disabled="true">Disabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // ============================================
  // REF FORWARDING
  // ============================================
  describe('Ref Forwarding', () => {
    it('pasa ref correctamente al elemento button', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Ref Test</Button>);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
