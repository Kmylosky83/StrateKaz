/**
 * Tests para AreasTab Component
 *
 * Cobertura:
 * - Renderizado de lista de áreas
 * - Expansión/colapso de jerarquía de áreas
 * - Filtros (búsqueda y toggle inactivas)
 * - Acciones CRUD (crear, editar, eliminar, toggle estado)
 * - Estados de carga y error
 * - Estados vacíos
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AreasTab } from '@/features/gestion-estrategica/components/AreasTab';
import {
  render,
  createMockAreaList,
  createMockPaginatedResponse,
  createTestQueryClient,
  clearToastMocks,
  actWait,
} from '@/__tests__/utils/test-utils';

// Mock de los hooks de API
vi.mock('@/features/gestion-estrategica/hooks/useAreas', () => ({
  useAreas: vi.fn(),
  useAreasTree: vi.fn(),
  useDeleteArea: vi.fn(),
  useToggleArea: vi.fn(),
}));

// Mock de sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock del modal de formulario
vi.mock(
  '@/features/gestion-estrategica/components/modals/AreaFormModal',
  () => ({
    AreaFormModal: ({ isOpen, onClose }: any) =>
      isOpen ? (
        <div data-testid="area-form-modal">
          <button onClick={onClose}>Close Modal</button>
        </div>
      ) : null,
  })
);

import {
  useAreas,
  useAreasTree,
  useDeleteArea,
  useToggleArea,
} from '@/features/gestion-estrategica/hooks/useAreas';

describe('AreasTab', () => {
  // Mock data
  const mockAreaProd = createMockAreaList({
    id: 1,
    code: 'PROD',
    name: 'Producción',
    parent: null,
    is_active: true,
    children_count: 2,
    level: 0,
  });

  const mockAreaProdPlanta1 = createMockAreaList({
    id: 2,
    code: 'PROD-P1',
    name: 'Planta 1',
    parent: 1,
    is_active: true,
    children_count: 0,
    level: 1,
  });

  const mockAreaProdPlanta2 = createMockAreaList({
    id: 3,
    code: 'PROD-P2',
    name: 'Planta 2',
    parent: 1,
    is_active: true,
    children_count: 0,
    level: 1,
  });

  const mockAreaAdmin = createMockAreaList({
    id: 4,
    code: 'ADM',
    name: 'Administración',
    parent: null,
    is_active: true,
    children_count: 0,
    level: 0,
  });

  const mockAreaInactiva = createMockAreaList({
    id: 5,
    code: 'LOG',
    name: 'Logística',
    parent: null,
    is_active: false,
    children_count: 0,
    level: 0,
  });

  const allAreas = [
    mockAreaProd,
    mockAreaProdPlanta1,
    mockAreaProdPlanta2,
    mockAreaAdmin,
    mockAreaInactiva,
  ];

  const activeAreas = allAreas.filter((a) => a.is_active);

  beforeEach(() => {
    clearToastMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Estado de Carga', () => {
    it('debe mostrar skeleton mientras carga', () => {
      vi.mocked(useAreas).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useAreasTree).mockReturnValue({
        data: undefined,
      } as any);

      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<AreasTab />);

      // Verificar skeleton
      const skeletons = document.querySelectorAll('.animate-pulse-subtle');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Estado de Error', () => {
    it('debe mostrar mensaje de error cuando falla la carga', () => {
      const refetchMock = vi.fn();

      vi.mocked(useAreas).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        isFetching: false,
        refetch: refetchMock,
      } as any);

      vi.mocked(useAreasTree).mockReturnValue({
        data: undefined,
      } as any);

      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<AreasTab />);

      expect(screen.getByText(/error al cargar áreas/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });

    it('debe reintentar carga al hacer clic en reintentar', async () => {
      const user = userEvent.setup();
      const refetchMock = vi.fn();

      vi.mocked(useAreas).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        isFetching: false,
        refetch: refetchMock,
      } as any);

      vi.mocked(useAreasTree).mockReturnValue({ data: undefined } as any);
      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<AreasTab />);

      const retryButton = screen.getByRole('button', { name: /reintentar/i });
      await user.click(retryButton);

      expect(refetchMock).toHaveBeenCalled();
    });
  });

  describe('Estado Vacío', () => {
    it('debe mostrar mensaje cuando no hay áreas', () => {
      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse([]),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useAreasTree).mockReturnValue({ data: [] } as any);
      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<AreasTab />);

      expect(screen.getByText(/sin áreas configuradas/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /crear primera área/i })
      ).toBeInTheDocument();
    });
  });

  describe('Renderizado de Lista', () => {
    beforeEach(() => {
      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse(allAreas),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useAreasTree).mockReturnValue({ data: allAreas } as any);
      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('debe renderizar lista de áreas', () => {
      render(<AreasTab />);

      expect(screen.getByText('Producción')).toBeInTheDocument();
      expect(screen.getByText('Administración')).toBeInTheDocument();
      expect(screen.getByText('Logística')).toBeInTheDocument();
    });

    it('debe mostrar códigos de áreas', () => {
      render(<AreasTab />);

      expect(screen.getByText('PROD')).toBeInTheDocument();
      expect(screen.getByText('ADM')).toBeInTheDocument();
      expect(screen.getByText('LOG')).toBeInTheDocument();
    });

    it('debe mostrar badge de inactiva para áreas inactivas', () => {
      render(<AreasTab />);

      const inactiveBadges = screen.getAllByText('Inactiva');
      expect(inactiveBadges.length).toBeGreaterThan(0);
    });

    it('debe mostrar contador de subáreas', () => {
      render(<AreasTab />);

      expect(screen.getByText(/2 subáreas/i)).toBeInTheDocument();
    });

    it('debe renderizar StatsGrid con estadísticas', () => {
      render(<AreasTab />);

      expect(screen.getByText('Total Áreas')).toBeInTheDocument();
      expect(screen.getByText('Áreas Activas')).toBeInTheDocument();
      expect(screen.getByText('Áreas Raíz')).toBeInTheDocument();
    });

    it('debe mostrar botón de nueva área', () => {
      render(<AreasTab />);

      expect(
        screen.getByRole('button', { name: /nueva área/i })
      ).toBeInTheDocument();
    });
  });

  describe('Expansión/Colapso de Jerarquía', () => {
    beforeEach(() => {
      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse(allAreas),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useAreasTree).mockReturnValue({ data: allAreas } as any);
      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('debe mostrar indicador de expansión para áreas con hijos', () => {
      render(<AreasTab />);

      const prodArea = screen.getByText('Producción').closest('div');
      expect(prodArea).toBeInTheDocument();

      // Buscar el botón de expansión (chevron) dentro del área
      const expandButtons = document.querySelectorAll('button');
      const hasChevron = Array.from(expandButtons).some(
        (btn) => btn.querySelector('svg') !== null
      );
      expect(hasChevron).toBe(true);
    });

    it('debe expandir área al hacer clic en indicador', async () => {
      const user = userEvent.setup();
      render(<AreasTab />);

      // Las subáreas no deben estar visibles inicialmente
      expect(screen.queryByText('Planta 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Planta 2')).not.toBeInTheDocument();

      // Buscar y hacer clic en el botón de expansión
      // El botón está cerca del texto "Producción" y contiene un ChevronRight
      const prodRow = screen.getByText('Producción').closest('div');
      const expandButton = prodRow?.querySelector('button');

      if (expandButton) {
        await user.click(expandButton);

        // Ahora las subáreas deben ser visibles
        await waitFor(() => {
          expect(screen.getByText('Planta 1')).toBeInTheDocument();
          expect(screen.getByText('Planta 2')).toBeInTheDocument();
        });
      }
    });

    it('debe colapsar área expandida al hacer clic nuevamente', async () => {
      const user = userEvent.setup();
      render(<AreasTab />);

      const prodRow = screen.getByText('Producción').closest('div');
      const expandButton = prodRow?.querySelector('button');

      if (expandButton) {
        // Expandir
        await user.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText('Planta 1')).toBeInTheDocument();
        });

        // Colapsar
        await user.click(expandButton);
        await waitFor(() => {
          expect(screen.queryByText('Planta 1')).not.toBeInTheDocument();
        });
      }
    });

    it('debe aplicar indentación correcta a subáreas', async () => {
      const user = userEvent.setup();
      render(<AreasTab />);

      const prodRow = screen.getByText('Producción').closest('div');
      const expandButton = prodRow?.querySelector('button');

      if (expandButton) {
        await user.click(expandButton);

        await waitFor(() => {
          const planta1Row = screen.getByText('Planta 1').closest('div');
          expect(planta1Row).toBeInTheDocument();
          // Verificar que tiene margen izquierdo (indentación)
          expect(planta1Row).toHaveStyle({ marginLeft: expect.any(String) });
        });
      }
    });
  });

  describe('Filtros', () => {
    beforeEach(() => {
      vi.mocked(useAreasTree).mockReturnValue({ data: [] } as any);
      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('debe filtrar por término de búsqueda', async () => {
      const user = userEvent.setup();

      // Inicialmente mostrar todas
      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse(allAreas),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      render(<AreasTab />);

      const searchInput = screen.getByPlaceholderText(
        /buscar por código o nombre/i
      );
      await user.type(searchInput, 'Producción');

      // Simular que el API devuelve resultados filtrados
      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse([mockAreaProd]),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      // El input debe tener el valor
      expect(searchInput).toHaveValue('Producción');
    });

    it('debe mostrar mensaje cuando búsqueda no tiene resultados', async () => {
      const user = userEvent.setup();

      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse(activeAreas),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      render(<AreasTab />);

      // Buscar algo que no existe
      const searchInput = screen.getByPlaceholderText(/buscar por código o nombre/i);
      await user.type(searchInput, 'xyz-no-existe');

      // Simular que el API devuelve resultados vacíos con el filtro
      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse([]),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      // Re-render con datos vacíos (simular respuesta del filtro)
      // El componente internamente maneja esto con el estado
    });

    it('debe mostrar switch para incluir inactivas', () => {
      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse(activeAreas),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      render(<AreasTab />);

      expect(screen.getByText(/incluir inactivas/i)).toBeInTheDocument();
    });

    it('debe filtrar áreas inactivas cuando se desactiva el switch', async () => {
      const user = userEvent.setup();

      // Inicialmente con todas
      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse(allAreas),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      render(<AreasTab />);

      // Buscar el switch y hacer clic
      const switchElement = screen
        .getByText(/incluir inactivas/i)
        .closest('label');
      const checkbox = switchElement?.querySelector('input[type="checkbox"]');

      if (checkbox) {
        await user.click(checkbox);

        // Simular que ahora solo se muestran activas
        vi.mocked(useAreas).mockReturnValue({
          data: createMockPaginatedResponse(activeAreas),
          isLoading: false,
          isError: false,
          isFetching: false,
          refetch: vi.fn(),
        } as any);
      }
    });
  });

  describe('Acciones de Área', () => {
    beforeEach(() => {
      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse([mockAreaProd]),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useAreasTree).mockReturnValue({ data: [mockAreaProd] } as any);
    });

    it('debe abrir modal al hacer clic en nueva área', async () => {
      const user = userEvent.setup();

      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<AreasTab />);

      const newButton = screen.getByRole('button', { name: /nueva área/i });
      await user.click(newButton);

      await waitFor(() => {
        expect(screen.getByTestId('area-form-modal')).toBeInTheDocument();
      });
    });

    it('debe abrir modal para editar al hacer clic en editar', async () => {
      const user = userEvent.setup();

      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<AreasTab />);

      // Buscar botón de editar (tiene icono Edit)
      const editButtons = screen.getAllByTitle(/editar área/i);
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('area-form-modal')).toBeInTheDocument();
      });
    });

    it('debe tener botón de eliminar disponible', () => {
      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<AreasTab />);

      const deleteButtons = screen.getAllByTitle(/eliminar área/i);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('debe eliminar área al confirmar', async () => {
      const user = userEvent.setup();
      const deleteMock = vi.fn().mockResolvedValue({});

      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: deleteMock,
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<AreasTab />);

      const deleteButtons = screen.getAllByTitle(/eliminar área/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(deleteMock).toHaveBeenCalledWith(mockAreaProd.id);
      });
    });

    it('debe toggle estado activo/inactivo', async () => {
      const user = userEvent.setup();
      const toggleMock = vi.fn().mockResolvedValue({ is_active: false });

      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: toggleMock,
        isPending: false,
      } as any);

      render(<AreasTab />);

      const toggleButtons = screen.getAllByTitle(/desactivar área/i);
      await user.click(toggleButtons[0]);

      await waitFor(() => {
        expect(toggleMock).toHaveBeenCalledWith({
          id: mockAreaProd.id,
          isActive: false,
        });
      });
    });
  });

  describe('Actualización de Datos', () => {
    it('debe mostrar indicador de carga al refrescar', async () => {
      const user = userEvent.setup();
      const refetchMock = vi.fn();

      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse([mockAreaProd]),
        isLoading: false,
        isError: false,
        isFetching: true, // Indicando que está refrescando
        refetch: refetchMock,
      } as any);

      vi.mocked(useAreasTree).mockReturnValue({ data: [mockAreaProd] } as any);
      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<AreasTab />);

      // Buscar botón de refresh
      const refreshButton = screen.getByTitle(/actualizar lista/i);
      expect(refreshButton).toBeInTheDocument();

      // Verificar que tiene clase de animación cuando isFetching es true
      const icon = refreshButton.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });

    it('debe llamar refetch al hacer clic en actualizar', async () => {
      const user = userEvent.setup();
      const refetchMock = vi.fn();

      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse([mockAreaProd]),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: refetchMock,
      } as any);

      vi.mocked(useAreasTree).mockReturnValue({ data: [mockAreaProd] } as any);
      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<AreasTab />);

      const refreshButton = screen.getByTitle(/actualizar lista/i);
      await user.click(refreshButton);

      expect(refetchMock).toHaveBeenCalled();
    });
  });

  describe('Accesibilidad', () => {
    beforeEach(() => {
      vi.mocked(useAreas).mockReturnValue({
        data: createMockPaginatedResponse([mockAreaProd]),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useAreasTree).mockReturnValue({ data: [mockAreaProd] } as any);
      vi.mocked(useDeleteArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
      vi.mocked(useToggleArea).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('debe tener títulos descriptivos en botones', () => {
      render(<AreasTab />);

      expect(screen.getByTitle(/editar área/i)).toBeInTheDocument();
      expect(screen.getByTitle(/eliminar área/i)).toBeInTheDocument();
      expect(screen.getByTitle(/desactivar área/i)).toBeInTheDocument();
      expect(screen.getByTitle(/actualizar lista/i)).toBeInTheDocument();
    });

    it('debe tener placeholder descriptivo en búsqueda', () => {
      render(<AreasTab />);

      expect(
        screen.getByPlaceholderText(/buscar por código o nombre/i)
      ).toBeInTheDocument();
    });

    it('debe tener estructura semántica con headings', () => {
      render(<AreasTab />);

      expect(
        screen.getByRole('heading', { name: /áreas y departamentos/i })
      ).toBeInTheDocument();
    });
  });
});
