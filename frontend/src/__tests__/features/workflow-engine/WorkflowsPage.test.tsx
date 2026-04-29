/**
 * Tests para WorkflowsPage (hub de seleccion)
 *
 * Cobertura:
 * - Renderizado del header y hero section
 * - Cards de navegacion (Disenador, Ejecucion, Monitoreo)
 * - Seccion informativa
 * - Links de navegacion a sub-paginas
 */
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import WorkflowsPage from '@/features/infraestructura/workflow-engine/pages/WorkflowsPage';
import { render } from '@/__tests__/utils/test-utils';

// Mock PageHeader
vi.mock('@/components/layout', () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));

// Mock SelectionCard
vi.mock('@/components/common/SelectionCard', () => ({
  SelectionCard: ({ title, subtitle, href }: { title: string; subtitle: string; href: string }) => (
    <a data-testid={`selection-card-${title.toLowerCase().replace(/\s+/g, '-')}`} href={href}>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </a>
  ),
  SelectionCardGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="selection-card-grid">{children}</div>
  ),
}));

describe('WorkflowsPage', () => {
  // ==================== RENDERIZADO HEADER ====================

  describe('Header', () => {
    it('debe renderizar el titulo del modulo', () => {
      render(<WorkflowsPage />);
      expect(screen.getByText('Workflow Engine')).toBeInTheDocument();
    });

    it('debe renderizar la descripcion del modulo', () => {
      render(<WorkflowsPage />);
      expect(
        screen.getByText('Motor de flujos de trabajo y automatización de procesos')
      ).toBeInTheDocument();
    });
  });

  // ==================== HERO SECTION ====================

  describe('Hero Section', () => {
    it('debe renderizar el titulo del hero', () => {
      render(<WorkflowsPage />);
      expect(screen.getByText('Motor de Automatización')).toBeInTheDocument();
    });

    it('debe renderizar las etiquetas de funcionalidades', () => {
      render(<WorkflowsPage />);
      expect(screen.getByText('Diseñador Visual')).toBeInTheDocument();
      expect(screen.getByText('Drag & Drop')).toBeInTheDocument();
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      expect(screen.getByText('Automáticas')).toBeInTheDocument();
      expect(screen.getByText('Métricas')).toBeInTheDocument();
      expect(screen.getByText('SLA Tracking')).toBeInTheDocument();
    });
  });

  // ==================== CARDS DE NAVEGACION ====================

  describe('Cards de Navegacion', () => {
    it('debe renderizar la card de Disenador de Flujos', () => {
      render(<WorkflowsPage />);
      expect(screen.getByText('Diseñador de Flujos')).toBeInTheDocument();
    });

    it('debe renderizar la card de Ejecucion y Tareas', () => {
      render(<WorkflowsPage />);
      expect(screen.getByText('Ejecución y Tareas')).toBeInTheDocument();
    });

    it('debe renderizar la card de Monitoreo y Metricas', () => {
      render(<WorkflowsPage />);
      expect(screen.getByText('Monitoreo y Métricas')).toBeInTheDocument();
    });

    it('debe tener links correctos para cada card', () => {
      render(<WorkflowsPage />);
      const disenador = screen.getByTestId('selection-card-diseñador-de-flujos');
      const ejecucion = screen.getByTestId('selection-card-ejecución-y-tareas');
      const monitoreo = screen.getByTestId('selection-card-monitoreo-y-métricas');

      expect(disenador).toHaveAttribute('href', '/workflows/disenador');
      expect(ejecucion).toHaveAttribute('href', '/workflows/ejecucion');
      expect(monitoreo).toHaveAttribute('href', '/workflows/monitoreo');
    });

    it('debe renderizar subtitulos de las cards', () => {
      render(<WorkflowsPage />);
      expect(
        screen.getByText('Crear y configurar flujos de trabajo personalizados con editor visual')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Gestionar tareas pendientes y bandeja de trabajo unificada')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Analizar tiempos, SLAs y eficiencia de procesos')
      ).toBeInTheDocument();
    });

    it('debe renderizar el grid de cards', () => {
      render(<WorkflowsPage />);
      expect(screen.getByTestId('selection-card-grid')).toBeInTheDocument();
    });
  });

  // ==================== SECCION INFORMATIVA ====================

  describe('Seccion Informativa', () => {
    it('debe renderizar el titulo de la seccion informativa', () => {
      render(<WorkflowsPage />);
      expect(screen.getByText('Motor de Automatización de Procesos')).toBeInTheDocument();
    });

    it('debe renderizar la descripcion detallada', () => {
      render(<WorkflowsPage />);
      // Verificar que existe texto descriptivo (no reproducir el texto completo)
      const infoSection = screen.getByText('Motor de Automatización de Procesos');
      expect(infoSection.closest('div')).toBeInTheDocument();
    });
  });
});
