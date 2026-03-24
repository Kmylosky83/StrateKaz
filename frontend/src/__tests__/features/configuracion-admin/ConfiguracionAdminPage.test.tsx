/**
 * Tests para ConfiguracionAdminPage
 *
 * Cobertura:
 * - Renderizado de la pagina y header
 * - Titulo dinamico segun tab (general, catalogos, conexiones)
 * - Secciones del tab router (modulos, consecutivos, catalogos, integraciones)
 * - Estado de carga (skeleton)
 * - Fallback para seccion desconocida
 * - Sub-tabs de navegacion
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfiguracionAdminPage } from '@/features/configuracion-admin/pages/ConfiguracionAdminPage';
import { render } from '@/__tests__/utils/test-utils';

// ==================== MOCKS ====================

const mockSetActiveSection = vi.fn();

// Mock useLocation
const mockPathname = vi.fn(() => '/configuracion-admin/general');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: mockPathname(),
      search: '',
      hash: '',
      state: null,
      key: 'default',
    }),
  };
});

// Mock usePageSections
vi.mock('@/hooks/usePageSections', () => ({
  usePageSections: vi.fn(() => ({
    sections: [
      { code: 'modulos', name: 'Módulos', order: 1 },
      { code: 'consecutivos', name: 'Consecutivos', order: 2 },
    ],
    activeSection: 'modulos',
    setActiveSection: mockSetActiveSection,
    activeSectionData: {
      description: 'Configuración de módulos del sistema',
    },
  })),
}));

// Mock useModuleColor
vi.mock('@/hooks/useModuleColor', () => ({
  useModuleColor: () => ({ color: '#F59E0B', isLoading: false, module: null }),
}));

// Mock ConfigAdminTab
vi.mock('@/features/configuracion-admin/components/ConfigAdminTab', () => ({
  ConfigAdminTab: ({ activeSection }: { activeSection: string }) => (
    <div data-testid="config-admin-tab">
      <span data-testid="config-active-section">{activeSection}</span>
    </div>
  ),
}));

// Mock PageHeader
vi.mock('@/components/layout', () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));

import { usePageSections } from '@/hooks/usePageSections';

describe('ConfiguracionAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/configuracion-admin/general');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== RENDERIZADO ====================

  describe('Renderizado', () => {
    it('debe renderizar el titulo segun tabCode "general"', () => {
      render(<ConfiguracionAdminPage />);
      expect(screen.getByText('Configuración General')).toBeInTheDocument();
    });

    it('debe renderizar la descripcion de la seccion', () => {
      render(<ConfiguracionAdminPage />);
      expect(screen.getByText('Configuración de módulos del sistema')).toBeInTheDocument();
    });

    it('debe renderizar el ConfigAdminTab con la seccion activa', () => {
      render(<ConfiguracionAdminPage />);
      expect(screen.getByTestId('config-admin-tab')).toBeInTheDocument();
      expect(screen.getByTestId('config-active-section')).toHaveTextContent('modulos');
    });
  });

  // ==================== TITULOS POR TAB ====================

  describe('Titulos por Tab', () => {
    it('debe mostrar titulo para tab "catalogos"', () => {
      mockPathname.mockReturnValue('/configuracion-admin/catalogos');
      render(<ConfiguracionAdminPage />);
      expect(screen.getByText('Catálogos Maestros')).toBeInTheDocument();
    });

    it('debe mostrar titulo para tab "conexiones"', () => {
      mockPathname.mockReturnValue('/configuracion-admin/conexiones');
      render(<ConfiguracionAdminPage />);
      expect(screen.getByText('Conexiones e Integraciones')).toBeInTheDocument();
    });

    it('debe mostrar titulo por defecto para tab desconocido', () => {
      mockPathname.mockReturnValue('/configuracion-admin/otro');
      render(<ConfiguracionAdminPage />);
      expect(screen.getByText('Configuración de Plataforma')).toBeInTheDocument();
    });
  });

  // ==================== ESTADO DE CARGA ====================

  describe('Estado de Carga', () => {
    it('debe mostrar skeleton cuando no hay seccion activa', () => {
      vi.mocked(usePageSections).mockReturnValue({
        sections: [],
        activeSection: '',
        setActiveSection: mockSetActiveSection,
        activeSectionData: { description: '' },
      } as unknown as ReturnType<typeof usePageSections>);

      const { container } = render(<ConfiguracionAdminPage />);
      const skeletons = container.querySelectorAll('.animate-pulse-subtle');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('no debe renderizar ConfigAdminTab cuando cargando', () => {
      vi.mocked(usePageSections).mockReturnValue({
        sections: [],
        activeSection: '',
        setActiveSection: mockSetActiveSection,
        activeSectionData: { description: '' },
      } as unknown as ReturnType<typeof usePageSections>);

      render(<ConfiguracionAdminPage />);
      expect(screen.queryByTestId('config-admin-tab')).not.toBeInTheDocument();
    });
  });

  // ==================== SUB-TABS ====================

  describe('Sub-Tabs de Navegacion', () => {
    it('debe renderizar botones de sub-tabs cuando hay mas de 1 seccion', () => {
      render(<ConfiguracionAdminPage />);
      expect(screen.getByText('Módulos')).toBeInTheDocument();
      expect(screen.getByText('Consecutivos')).toBeInTheDocument();
    });

    it('debe llamar setActiveSection al hacer clic en sub-tab', async () => {
      const user = userEvent.setup();
      render(<ConfiguracionAdminPage />);

      await user.click(screen.getByText('Consecutivos'));
      expect(mockSetActiveSection).toHaveBeenCalledWith('consecutivos');
    });

    it('no debe renderizar sub-tabs cuando solo hay 1 seccion', () => {
      vi.mocked(usePageSections).mockReturnValue({
        sections: [{ code: 'modulos', name: 'Módulos', order: 1 }],
        activeSection: 'modulos',
        setActiveSection: mockSetActiveSection,
        activeSectionData: { description: 'Solo modulos' },
      } as unknown as ReturnType<typeof usePageSections>);

      render(<ConfiguracionAdminPage />);
      // Solo deberia haber 1 seccion, no se renderiza la barra de tabs
      const buttons = screen.queryAllByRole('button');
      // No debe haber botones de sub-tab (Modulos no se repite como tab)
      const modulosButtons = buttons.filter((b) => b.textContent === 'Módulos');
      expect(modulosButtons.length).toBe(0);
    });
  });

  // ==================== DESCRIPCION POR DEFECTO ====================

  describe('Descripcion por defecto', () => {
    it('debe mostrar descripcion por defecto si no hay descripcion de seccion', () => {
      vi.mocked(usePageSections).mockReturnValue({
        sections: [{ code: 'modulos', name: 'Módulos', order: 1 }],
        activeSection: 'modulos',
        setActiveSection: mockSetActiveSection,
        activeSectionData: { description: '' },
      } as unknown as ReturnType<typeof usePageSections>);

      render(<ConfiguracionAdminPage />);
      expect(screen.getByText('Ajustes técnicos de la plataforma')).toBeInTheDocument();
    });
  });
});
