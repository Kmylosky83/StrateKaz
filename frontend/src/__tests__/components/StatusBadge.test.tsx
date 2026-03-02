import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, formatStatusLabel } from '@/components/common/StatusBadge';

describe('StatusBadge Component', () => {
  describe('formatStatusLabel helper', () => {
    it('should replace underscores with spaces', () => {
      expect(formatStatusLabel('EN_PROCESO')).toBe('En Proceso');
    });

    it('should capitalize the first letter of each word', () => {
      expect(formatStatusLabel('COMPLETADO')).toBe('Completado');
    });

    it('should handle multi-word statuses', () => {
      expect(formatStatusLabel('EN_REVISION')).toBe('En Revision');
    });

    it('should handle single-word status', () => {
      expect(formatStatusLabel('ACTIVO')).toBe('Activo');
    });

    it('should lowercase then capitalize', () => {
      expect(formatStatusLabel('PENDIENTE')).toBe('Pendiente');
    });
  });

  describe('Rendering', () => {
    it('should render with string status', () => {
      render(<StatusBadge status="ACTIVO" />);
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('should render with number status (cumplimiento preset)', () => {
      render(<StatusBadge status={85} preset="cumplimiento" />);
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should use custom label when provided', () => {
      render(<StatusBadge status="EN_PROCESO" label="En curso" />);
      expect(screen.getByText('En curso')).toBeInTheDocument();
      expect(screen.queryByText('En Proceso')).not.toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      const Icon = () => <span data-testid="status-icon">!</span>;
      render(<StatusBadge status="ACTIVO" icon={<Icon />} />);
      expect(screen.getByTestId('status-icon')).toBeInTheDocument();
    });
  });

  describe('Gravedad Preset', () => {
    it('should apply danger variant for GRAVE', () => {
      render(<StatusBadge status="GRAVE" preset="gravedad" data-testid="badge" />);
      const badge = screen.getByText('Grave').closest('span');
      expect(badge).toHaveClass('bg-danger-100');
    });

    it('should apply warning variant for LEVE', () => {
      render(<StatusBadge status="LEVE" preset="gravedad" />);
      const badge = screen.getByText('Leve').closest('span');
      expect(badge).toHaveClass('bg-warning-100');
    });

    it('should apply success variant for BAJO', () => {
      render(<StatusBadge status="BAJO" preset="gravedad" />);
      const badge = screen.getByText('Bajo').closest('span');
      expect(badge).toHaveClass('bg-success-100');
    });
  });

  describe('Prioridad Preset', () => {
    it('should apply danger variant for CRITICA', () => {
      render(<StatusBadge status="CRITICA" preset="prioridad" />);
      const badge = screen.getByText('Critica').closest('span');
      expect(badge).toHaveClass('bg-danger-100');
    });

    it('should apply warning variant for ALTA', () => {
      render(<StatusBadge status="ALTA" preset="prioridad" />);
      const badge = screen.getByText('Alta').closest('span');
      expect(badge).toHaveClass('bg-warning-100');
    });

    it('should apply gray variant for BAJA', () => {
      render(<StatusBadge status="BAJA" preset="prioridad" />);
      const badge = screen.getByText('Baja').closest('span');
      expect(badge).toHaveClass('bg-gray-100');
    });
  });

  describe('Proceso Preset', () => {
    it('should apply success variant for COMPLETADO', () => {
      render(<StatusBadge status="COMPLETADO" preset="proceso" />);
      const badge = screen.getByText('Completado').closest('span');
      expect(badge).toHaveClass('bg-success-100');
    });

    it('should apply gray variant for PENDIENTE', () => {
      render(<StatusBadge status="PENDIENTE" preset="proceso" />);
      const badge = screen.getByText('Pendiente').closest('span');
      expect(badge).toHaveClass('bg-gray-100');
    });

    it('should apply info variant for EN_PROCESO', () => {
      render(<StatusBadge status="EN_PROCESO" preset="proceso" />);
      const badge = screen.getByText('En Proceso').closest('span');
      expect(badge).toHaveClass('bg-info-100');
    });

    it('should apply danger variant for VENCIDO', () => {
      render(<StatusBadge status="VENCIDO" preset="proceso" />);
      const badge = screen.getByText('Vencido').closest('span');
      expect(badge).toHaveClass('bg-danger-100');
    });
  });

  describe('Cumplimiento Preset', () => {
    it('should apply success variant for value >= 90', () => {
      render(<StatusBadge status={95} preset="cumplimiento" />);
      const badge = screen.getByText('95%').closest('span');
      expect(badge).toHaveClass('bg-success-100');
    });

    it('should apply primary variant for value between 70 and 89', () => {
      render(<StatusBadge status={75} preset="cumplimiento" />);
      const badge = screen.getByText('75%').closest('span');
      expect(badge).toHaveClass('bg-primary-100');
    });

    it('should apply warning variant for value between 50 and 69', () => {
      render(<StatusBadge status={60} preset="cumplimiento" />);
      const badge = screen.getByText('60%').closest('span');
      expect(badge).toHaveClass('bg-warning-100');
    });

    it('should apply danger variant for value below 50', () => {
      render(<StatusBadge status={30} preset="cumplimiento" />);
      const badge = screen.getByText('30%').closest('span');
      expect(badge).toHaveClass('bg-danger-100');
    });
  });

  describe('Variant Override', () => {
    it('should use provided variant override instead of preset', () => {
      render(<StatusBadge status="PENDIENTE" preset="proceso" variant="danger" />);
      const badge = screen.getByText('Pendiente').closest('span');
      // danger variant overrides the gray that proceso preset would give
      expect(badge).toHaveClass('bg-danger-100');
    });
  });

  describe('Default Preset', () => {
    it('should resolve unknown status to gray', () => {
      render(<StatusBadge status="ESTADO_DESCONOCIDO" />);
      const badge = screen.getByText('Estado Desconocido').closest('span');
      expect(badge).toHaveClass('bg-gray-100');
    });
  });
});
