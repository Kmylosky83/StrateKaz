/**
 * Tests para MiEquipoPage — Portal del Jefe (MSS)
 *
 * Cobertura:
 * - Renderizado de la pagina principal
 * - Estado de carga
 * - Tabs (Mi equipo, Aprobaciones, Evaluaciones)
 * - Navegacion entre tabs
 * - Contenido de cada tab (equipo, aprobaciones, evaluaciones)
 * - Estados vacios
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import MiEquipoPage from '@/features/mi-equipo/pages/MiEquipoPage';
import type {
  ColaboradorEquipo,
  AprobacionPendiente,
  EvaluacionEquipo,
} from '@/features/mi-equipo/types';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockColaboradores: ColaboradorEquipo[] = [
  {
    id: 1,
    nombre_completo: 'Juan Perez',
    numero_identificacion: '1234567890',
    cargo_nombre: 'Operario',
    is_externo: false,
    estado: 'activo',
    fecha_ingreso: '2024-01-15',
    foto_url: null,
  },
  {
    id: 2,
    nombre_completo: 'Maria Lopez',
    numero_identificacion: '0987654321',
    cargo_nombre: 'Analista',
    is_externo: true,
    estado: 'activo',
    fecha_ingreso: '2024-03-01',
    foto_url: null,
  },
];

const mockAprobaciones: AprobacionPendiente[] = [
  {
    id: 1,
    tipo: 'vacaciones',
    colaborador_nombre: 'Juan Perez',
    fecha_solicitud: '2024-06-01',
    detalle: 'Vacaciones del 15 al 30 de junio',
    estado: 'pendiente',
  },
  {
    id: 2,
    tipo: 'permiso',
    colaborador_nombre: 'Maria Lopez',
    fecha_solicitud: '2024-06-05',
    detalle: 'Permiso medico',
    estado: 'pendiente',
  },
];

const mockEvaluaciones: EvaluacionEquipo[] = [
  {
    colaborador_id: 1,
    colaborador_nombre: 'Juan Perez',
    evaluacion_id: 10,
    estado: 'completada',
    calificacion_general: 4.5,
    fecha_evaluacion: '2024-05-15',
  },
  {
    colaborador_id: 2,
    colaborador_nombre: 'Maria Lopez',
    evaluacion_id: null,
    estado: 'pendiente',
    calificacion_general: null,
    fecha_evaluacion: null,
  },
];

// ============================================================================
// MOCKS
// ============================================================================

const mockUseMiEquipo = vi.fn();
const mockUseAprobacionesPendientes = vi.fn();
const mockUseAprobarSolicitud = vi.fn();
const mockUseEvaluacionesEquipo = vi.fn();

vi.mock('@/features/mi-equipo/api/miEquipoApi', () => ({
  useMiEquipo: (...args: unknown[]) => mockUseMiEquipo(...args),
  useAprobacionesPendientes: (...args: unknown[]) => mockUseAprobacionesPendientes(...args),
  useAprobarSolicitud: (...args: unknown[]) => mockUseAprobarSolicitud(...args),
  useEvaluacionesEquipo: (...args: unknown[]) => mockUseEvaluacionesEquipo(...args),
}));

// Mock framer-motion para evitar animaciones en tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...validProps } = props;
      return <div {...validProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), info: vi.fn() },
}));

// ============================================================================
// TESTS
// ============================================================================

describe('MiEquipoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Defaults: datos cargados exitosamente
    mockUseMiEquipo.mockReturnValue({
      data: mockColaboradores,
      isLoading: false,
    });
    mockUseAprobacionesPendientes.mockReturnValue({
      data: mockAprobaciones,
      isLoading: false,
    });
    mockUseAprobarSolicitud.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseEvaluacionesEquipo.mockReturnValue({
      data: mockEvaluaciones,
      isLoading: false,
    });
  });

  // --------------------------------------------------------------------------
  // RENDERIZADO PRINCIPAL
  // --------------------------------------------------------------------------

  describe('Renderizado principal', () => {
    it('debe renderizar la pagina con titulo y descripcion', () => {
      renderWithProviders(<MiEquipoPage />);

      expect(screen.getByText('Mi Equipo')).toBeInTheDocument();
      expect(screen.getByText(/Gestione su equipo directo/i)).toBeInTheDocument();
    });

    it('debe renderizar los tres tabs', () => {
      renderWithProviders(<MiEquipoPage />);

      expect(screen.getByText('Mi equipo')).toBeInTheDocument();
      expect(screen.getByText('Aprobaciones')).toBeInTheDocument();
      expect(screen.getByText('Evaluaciones')).toBeInTheDocument();
    });

    it('debe mostrar el tab Mi equipo activo por defecto', () => {
      renderWithProviders(<MiEquipoPage />);

      // EquipoResumen debe estar visible con los miembros
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ESTADO DE CARGA
  // --------------------------------------------------------------------------

  describe('Estado de carga', () => {
    it('debe mostrar skeletons cuando el equipo esta cargando', () => {
      mockUseMiEquipo.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { container } = renderWithProviders(<MiEquipoPage />);

      // EquipoResumen muestra Skeleton (bg-gray-200) en carga
      const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
      expect(skeletons.length).toBeGreaterThan(0);
      // No debe mostrar datos de colaboradores
      expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument();
    });

    it('debe mostrar skeletons cuando las aprobaciones estan cargando', async () => {
      const user = userEvent.setup();

      mockUseAprobacionesPendientes.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { container } = renderWithProviders(<MiEquipoPage />);

      // Navegar al tab de aprobaciones
      await user.click(screen.getByText('Aprobaciones'));

      const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // NAVEGACION ENTRE TABS
  // --------------------------------------------------------------------------

  describe('Navegacion entre tabs', () => {
    it('debe cambiar al tab de Aprobaciones al hacer clic', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MiEquipoPage />);

      await user.click(screen.getByText('Aprobaciones'));

      // Debe mostrar contenido de aprobaciones
      await waitFor(() => {
        expect(screen.getByText(/solicitudes pendientes/i)).toBeInTheDocument();
      });
    });

    it('debe cambiar al tab de Evaluaciones al hacer clic', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MiEquipoPage />);

      await user.click(screen.getByText('Evaluaciones'));

      // Debe mostrar contenido de evaluaciones
      await waitFor(() => {
        expect(screen.getByText('4.5')).toBeInTheDocument();
      });
    });

    it('debe volver al tab Mi equipo desde Aprobaciones', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MiEquipoPage />);

      // Ir a Aprobaciones
      await user.click(screen.getByText('Aprobaciones'));
      await waitFor(() => {
        expect(screen.getByText(/solicitudes pendientes/i)).toBeInTheDocument();
      });

      // Volver a Mi equipo
      await user.click(screen.getByText('Mi equipo'));
      await waitFor(() => {
        expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // TAB: MI EQUIPO
  // --------------------------------------------------------------------------

  describe('Tab Mi equipo', () => {
    it('debe mostrar el numero de miembros', () => {
      renderWithProviders(<MiEquipoPage />);

      expect(screen.getByText(/2 miembros/i)).toBeInTheDocument();
    });

    it('debe mostrar el cargo de cada colaborador', () => {
      renderWithProviders(<MiEquipoPage />);

      expect(screen.getByText('Operario')).toBeInTheDocument();
      expect(screen.getByText('Analista')).toBeInTheDocument();
    });

    it('debe mostrar badge Externo para colaboradores externos', () => {
      renderWithProviders(<MiEquipoPage />);

      expect(screen.getByText('Externo')).toBeInTheDocument();
    });

    it('debe mostrar estado vacio cuando no hay equipo', () => {
      mockUseMiEquipo.mockReturnValue({
        data: [],
        isLoading: false,
      });

      renderWithProviders(<MiEquipoPage />);

      expect(screen.getByText('Sin equipo asignado')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // TAB: APROBACIONES
  // --------------------------------------------------------------------------

  describe('Tab Aprobaciones', () => {
    it('debe mostrar solicitudes pendientes con detalle', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MiEquipoPage />);

      await user.click(screen.getByText('Aprobaciones'));

      await waitFor(() => {
        expect(screen.getByText('Vacaciones del 15 al 30 de junio')).toBeInTheDocument();
        expect(screen.getByText('Permiso medico')).toBeInTheDocument();
      });
    });

    it('debe mostrar boton Aprobar en cada solicitud', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MiEquipoPage />);

      await user.click(screen.getByText('Aprobaciones'));

      await waitFor(() => {
        const approveButtons = screen.getAllByText('Aprobar');
        expect(approveButtons.length).toBe(2);
      });
    });

    it('debe mostrar estado vacio cuando no hay aprobaciones', async () => {
      const user = userEvent.setup();
      mockUseAprobacionesPendientes.mockReturnValue({
        data: [],
        isLoading: false,
      });

      renderWithProviders(<MiEquipoPage />);
      await user.click(screen.getByText('Aprobaciones'));

      await waitFor(() => {
        expect(screen.getByText('Sin solicitudes pendientes')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // TAB: EVALUACIONES
  // --------------------------------------------------------------------------

  describe('Tab Evaluaciones', () => {
    it('debe mostrar calificaciones del equipo', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MiEquipoPage />);

      await user.click(screen.getByText('Evaluaciones'));

      await waitFor(() => {
        expect(screen.getByText('4.5')).toBeInTheDocument();
        expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      });
    });

    it('debe mostrar estado de cada evaluacion', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MiEquipoPage />);

      await user.click(screen.getByText('Evaluaciones'));

      await waitFor(() => {
        expect(screen.getByText('completada')).toBeInTheDocument();
        expect(screen.getByText('pendiente')).toBeInTheDocument();
      });
    });

    it('debe mostrar estado vacio cuando no hay evaluaciones', async () => {
      const user = userEvent.setup();
      mockUseEvaluacionesEquipo.mockReturnValue({
        data: [],
        isLoading: false,
      });

      renderWithProviders(<MiEquipoPage />);
      await user.click(screen.getByText('Evaluaciones'));

      await waitFor(() => {
        expect(screen.getByText('Sin evaluaciones')).toBeInTheDocument();
      });
    });
  });
});
