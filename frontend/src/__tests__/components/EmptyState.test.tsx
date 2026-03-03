import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/common/EmptyState';

describe('EmptyState Component', () => {
  describe('Rendering', () => {
    it('should render title text', () => {
      render(<EmptyState title="No hay datos" />);
      expect(screen.getByText('No hay datos')).toBeInTheDocument();
    });

    it('should render title as h3 heading', () => {
      render(<EmptyState title="Sin resultados" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Sin resultados');
    });

    it('should render description when provided', () => {
      render(
        <EmptyState title="Sin datos" description="No se encontraron registros para mostrar." />
      );
      expect(screen.getByText('No se encontraron registros para mostrar.')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const { container } = render(<EmptyState title="Sin datos" />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBe(0);
    });
  });

  describe('Icon', () => {
    it('should render icon when provided', () => {
      const icon = <span data-testid="empty-icon">📭</span>;
      render(<EmptyState title="Vacío" icon={icon} />);
      expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
    });

    it('should not render icon wrapper when no icon provided', () => {
      const { container } = render(<EmptyState title="Vacío" />);
      const iconWrapper = container.querySelector('.mb-4.text-gray-400');
      expect(iconWrapper).not.toBeInTheDocument();
    });
  });

  describe('Action Object', () => {
    it('should render action button from action config object', () => {
      const onClick = vi.fn();
      render(<EmptyState title="Sin datos" action={{ label: 'Crear nuevo', onClick }} />);
      expect(screen.getByRole('button', { name: /crear nuevo/i })).toBeInTheDocument();
    });

    it('should call onClick when action button is clicked', async () => {
      const onClick = vi.fn();
      render(<EmptyState title="Sin datos" action={{ label: 'Agregar', onClick }} />);
      await userEvent.click(screen.getByRole('button', { name: /agregar/i }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should render action button with icon', () => {
      const onClick = vi.fn();
      const actionIcon = <span data-testid="action-icon">+</span>;
      render(
        <EmptyState title="Sin datos" action={{ label: 'Crear', onClick, icon: actionIcon }} />
      );
      expect(screen.getByTestId('action-icon')).toBeInTheDocument();
    });
  });

  describe('Action ReactNode', () => {
    it('should render a ReactNode action directly', () => {
      render(
        <EmptyState
          title="Sin datos"
          action={<button data-testid="custom-action">Custom Button</button>}
        />
      );
      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(<EmptyState title="Vacío" className="my-custom-empty" />);
      expect(container.firstChild).toHaveClass('my-custom-empty');
    });
  });

  describe('No action', () => {
    it('should not render any button when action is not provided', () => {
      render(<EmptyState title="Sin datos" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
