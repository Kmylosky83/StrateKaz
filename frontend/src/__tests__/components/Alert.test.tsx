import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '@/components/common/Alert';

describe('Alert Component', () => {
  describe('Rendering', () => {
    it('should render message text', () => {
      render(<Alert message="Operación exitosa" />);
      expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
    });

    it('should render with role="alert"', () => {
      render(<Alert message="Alerta importante" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<Alert message="Detalles del éxito" title="Éxito" />);
      expect(screen.getByText('Éxito')).toBeInTheDocument();
      expect(screen.getByText('Detalles del éxito')).toBeInTheDocument();
    });

    it('should not render title when not provided', () => {
      render(<Alert message="Solo mensaje" />);
      // Only the message paragraph should exist, not a title h3
      const alert = screen.getByRole('alert');
      const headings = alert.querySelectorAll('h3');
      expect(headings.length).toBe(0);
    });
  });

  describe('Variants', () => {
    it('should render info variant by default', () => {
      render(<Alert message="Info message" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-info-50');
    });

    it('should render success variant', () => {
      render(<Alert variant="success" message="Success!" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-success-50');
    });

    it('should render warning variant', () => {
      render(<Alert variant="warning" message="Warning!" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-warning-50');
    });

    it('should render error variant', () => {
      render(<Alert variant="error" message="Error!" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-danger-50');
    });
  });

  describe('Icon rendering per variant', () => {
    it('should render an icon element for each variant', () => {
      const variants = ['info', 'success', 'warning', 'error'] as const;
      variants.forEach((variant) => {
        const { container, unmount } = render(
          <Alert variant={variant} message={`${variant} message`} />
        );
        // Each variant renders a Lucide icon as an SVG
        const svgIcon = container.querySelector('svg');
        expect(svgIcon).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Dismissible behavior', () => {
    it('should not show close button by default', () => {
      render(<Alert message="Not closable" />);
      expect(screen.queryByLabelText('Cerrar alerta')).not.toBeInTheDocument();
    });

    it('should not show close button when closable=true but onClose is undefined', () => {
      render(<Alert message="Missing handler" closable />);
      expect(screen.queryByLabelText('Cerrar alerta')).not.toBeInTheDocument();
    });

    it('should show close button when closable and onClose provided', () => {
      const onClose = vi.fn();
      render(<Alert message="Closable" closable onClose={onClose} />);
      expect(screen.getByLabelText('Cerrar alerta')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(<Alert message="Dismiss me" closable onClose={onClose} />);
      await userEvent.click(screen.getByLabelText('Cerrar alerta'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<Alert message="Custom" className="my-alert" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('my-alert');
    });

    it('should forward additional HTML attributes', () => {
      render(<Alert message="Test" data-testid="custom-alert" />);
      expect(screen.getByTestId('custom-alert')).toBeInTheDocument();
    });
  });
});
