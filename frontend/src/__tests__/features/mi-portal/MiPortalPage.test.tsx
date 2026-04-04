/**
 * Tests para MiPortalPage — Portal del Empleado (ESS)
 *
 * Cobertura:
 * - Renderizado con perfil de colaborador
 * - Hero section con saludo y datos
 * - Tabs visibles (perfil, firma, lecturas, documentos)
 * - Tabs L60 ocultos (vacaciones, permisos, recibos, capacitaciones, evaluacion)
 * - Vista de admin (super admin sin Colaborador)
 * - Vista de usuario sin Colaborador
 * - Estado de carga
 * - Navegacion entre tabs
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import MiPortalPage from '@/features/mi-portal/pages/MiPortalPage';
import type { ColaboradorESS } from '@/features/mi-portal/types';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPerfil: ColaboradorESS = {
  id: 1,
  nombre_completo: 'Juan Carlos Perez',
  numero_identificacion: '1234567890',
  tipo_identificacion: 'CC',
  cargo_nombre: 'Jefe de Produccion',
  area_nombre: 'Produccion',
  fecha_ingreso: '2023-01-15',
  estado: 'activo',
  foto_url: null,
  email: 'jperez@empresa.com',
  email_personal: 'juan@gmail.com',
  celular: '3001234567',
  telefono: '6011234567',
  direccion: 'Calle 123 #45-67',
  ciudad: 'Bogota',
  contacto_emergencia_nombre: 'Ana Perez',
  contacto_emergencia_telefono: '3009876543',
  contacto_emergencia_parentesco: 'Esposa',
};

// ============================================================================
// MOCKS
// ============================================================================

const mockUseMiPerfil = vi.fn();
let mockIsSuperAdmin = false;
let mockIsExterno = false;
let mockAuthUser: Record<string, unknown> | null = null;
let mockIsLoadingUser = false;

vi.mock('@/features/mi-portal/api/miPortalApi', () => ({
  useMiPerfil: (...args: unknown[]) => mockUseMiPerfil(...args),
  useAdminStats: () => ({ data: null, isLoading: false }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canDo: () => true,
    hasPermission: () => true,
    isSuperAdmin: mockIsSuperAdmin,
    hasCargo: () => false,
    canAccess: () => true,
    hasSectionAccess: () => true,
  }),
  useIsSuperAdmin: () => mockIsSuperAdmin,
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      user: mockAuthUser,
      isLoadingUser: mockIsLoadingUser,
    }),
}));

vi.mock('@/hooks/useBrandingConfig', () => ({
  useBrandingConfig: () => ({
    primaryColor: '#3B82F6',
    logo: null,
    logoDark: null,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useIsExterno', () => ({
  useIsExterno: () => ({ isExterno: mockIsExterno }),
}));

// Mock framer-motion
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

// Mock lazy-loaded and complex sub-components
vi.mock('@/features/gestion-documental/components/LecturasPendientesTab', () => ({
  default: () => <div data-testid="lecturas-tab">Lecturas Pendientes Content</div>,
}));

vi.mock('@/features/mi-portal/components', () => ({
  MiPerfilCard: ({ perfil, isLoading }: { perfil: ColaboradorESS | null; isLoading: boolean }) =>
    isLoading ? (
      <div data-testid="perfil-loading">Cargando perfil...</div>
    ) : (
      <div data-testid="perfil-card">
        <span>{perfil?.nombre_completo}</span>
        <span>{perfil?.cargo_nombre}</span>
      </div>
    ),
  MiPerfilEditForm: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="edit-form">Edit Form</div> : null,
  MisDocumentos: () => <div data-testid="documentos-tab">Documentos Content</div>,
  MiHSEQ: () => <div data-testid="hseq-tab">HSEQ Content</div>,
  MiFirmaDigital: () => <div data-testid="firma-tab">Firma Digital Content</div>,
}));

vi.mock('@/components/common/AvatarUploadModal', () => ({
  AvatarUploadModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="avatar-modal">Avatar Modal</div> : null,
}));

// ============================================================================
// TESTS
// ============================================================================

describe('MiPortalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Defaults: empleado interno con perfil completo
    mockIsSuperAdmin = false;
    mockIsExterno = false;
    mockIsLoadingUser = false;
    mockAuthUser = {
      id: 1,
      first_name: 'Juan',
      full_name: 'Juan Carlos Perez',
      photo_url: null,
      cargo: { name: 'Jefe de Produccion' },
      area_nombre: 'Produccion',
    };

    mockUseMiPerfil.mockReturnValue({
      data: mockPerfil,
      isLoading: false,
    });
  });

  // --------------------------------------------------------------------------
  // RENDERIZADO CON PERFIL
  // --------------------------------------------------------------------------

  describe('Renderizado con perfil de colaborador', () => {
    it('debe renderizar el hero con el nombre del colaborador', () => {
      renderWithProviders(<MiPortalPage />);

      // firstName = primer nombre del perfil
      expect(screen.getByText('Juan')).toBeInTheDocument();
    });

    it('debe mostrar el cargo y area en el hero', () => {
      renderWithProviders(<MiPortalPage />);

      // Puede aparecer tanto en el hero como en MiPerfilCard
      const cargoElements = screen.getAllByText('Jefe de Produccion');
      expect(cargoElements.length).toBeGreaterThanOrEqual(1);

      const areaElements = screen.getAllByText('Produccion');
      expect(areaElements.length).toBeGreaterThanOrEqual(1);
    });

    it('debe mostrar el saludo dinamico', () => {
      renderWithProviders(<MiPortalPage />);

      // getGreeting returns Buenos dias / Buenas tardes / Buenas noches
      const greetings = ['Buenos dias', 'Buenas tardes', 'Buenas noches'];
      const hasGreeting = greetings.some((g) => screen.queryByText(g) !== null);
      expect(hasGreeting).toBe(true);
    });

    it('debe mostrar boton Editar perfil', () => {
      renderWithProviders(<MiPortalPage />);

      const editButtons = screen.getAllByText('Editar perfil');
      expect(editButtons.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // TABS VISIBLES (internos)
  // --------------------------------------------------------------------------

  describe('Tabs visibles para empleados internos', () => {
    it('debe mostrar tabs basicos: Mis datos, Mi Firma, Lecturas, Documentos', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.getByText('Mis datos')).toBeInTheDocument();
      expect(screen.getByText('Mi Firma')).toBeInTheDocument();
      expect(screen.getByText('Lecturas Pendientes')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
    });

    it('debe ocultar tabs L60 (vacaciones, permisos, recibos, capacitaciones, evaluacion)', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.queryByText('Vacaciones')).not.toBeInTheDocument();
      expect(screen.queryByText('Permisos')).not.toBeInTheDocument();
      expect(screen.queryByText('Recibos')).not.toBeInTheDocument();
      expect(screen.queryByText('Capacitaciones')).not.toBeInTheDocument();
      // "Evaluacion" tab label
      expect(screen.queryByRole('tab', { name: /evaluacion/i })).not.toBeInTheDocument();
    });

    it('debe ocultar tab HSEQ para empleados internos', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.queryByText('HSEQ')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // TABS PARA EXTERNOS
  // --------------------------------------------------------------------------

  describe('Tabs para colaboradores externos', () => {
    beforeEach(() => {
      mockIsExterno = true;
    });

    it('debe mostrar tab HSEQ para colaboradores externos', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.getByText('HSEQ')).toBeInTheDocument();
    });

    it('debe mostrar badge Colaborador Externo', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.getByText('Colaborador Externo')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // NAVEGACION ENTRE TABS
  // --------------------------------------------------------------------------

  describe('Navegacion entre tabs', () => {
    it('debe mostrar MiPerfilCard en tab Mis datos por defecto', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.getByTestId('perfil-card')).toBeInTheDocument();
    });

    it('debe cambiar al tab Mi Firma', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MiPortalPage />);

      await user.click(screen.getByText('Mi Firma'));

      await waitFor(() => {
        expect(screen.getByTestId('firma-tab')).toBeInTheDocument();
      });
    });

    it('debe cambiar al tab Documentos', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MiPortalPage />);

      await user.click(screen.getByText('Documentos'));

      await waitFor(() => {
        expect(screen.getByTestId('documentos-tab')).toBeInTheDocument();
      });
    });

    it('debe cambiar al tab Lecturas Pendientes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MiPortalPage />);

      await user.click(screen.getByText('Lecturas Pendientes'));

      await waitFor(() => {
        expect(screen.getByTestId('lecturas-tab')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // VISTA ADMIN (super admin sin Colaborador)
  // --------------------------------------------------------------------------

  describe('Vista admin (super admin sin Colaborador)', () => {
    beforeEach(() => {
      mockIsSuperAdmin = true;
      mockAuthUser = {
        id: 99,
        first_name: 'Admin',
        full_name: 'Admin Sistema',
        is_superuser: true,
        photo_url: null,
      };
      mockUseMiPerfil.mockReturnValue({
        data: null,
        isLoading: false,
      });
    });

    it('debe mostrar vista de Portal del Administrador', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.getByText('Portal del Administrador')).toBeInTheDocument();
    });

    it('debe mostrar enlace a Dashboard', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.getByText('Ir al Dashboard')).toBeInTheDocument();
    });

    it('debe mostrar enlace a Ver Usuarios', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.getByText('Ver Usuarios')).toBeInTheDocument();
    });

    it('no debe mostrar tabs de portal', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.queryByText('Mis datos')).not.toBeInTheDocument();
      expect(screen.queryByText('Mi Firma')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // VISTA USUARIO SIN COLABORADOR
  // --------------------------------------------------------------------------

  describe('Vista usuario sin Colaborador (consultores colocados)', () => {
    beforeEach(() => {
      mockIsSuperAdmin = false;
      mockAuthUser = {
        id: 5,
        first_name: 'Carlos',
        full_name: 'Carlos Consultor',
        photo_url: null,
        cargo: { name: 'Consultor' },
        area_nombre: 'IT',
      };
      mockUseMiPerfil.mockReturnValue({
        data: null,
        isLoading: false,
      });
    });

    it('debe mostrar vista simplificada con datos del User', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.getByText('Carlos')).toBeInTheDocument();
    });

    it('debe mostrar mensaje de perfil en configuracion', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.getByText(/Perfil en proceso de configuraci/i)).toBeInTheDocument();
    });

    it('debe mostrar enlace al Dashboard', () => {
      renderWithProviders(<MiPortalPage />);

      expect(screen.getByText('Ir al Dashboard')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ESTADO DE CARGA
  // --------------------------------------------------------------------------

  describe('Estado de carga', () => {
    it('debe mostrar HeroSkeleton mientras carga el perfil', () => {
      mockUseMiPerfil.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { container } = renderWithProviders(<MiPortalPage />);

      // HeroSkeleton uses animate-pulse
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('debe mostrar skeleton si user aun no se ha cargado y perfil es null', () => {
      mockAuthUser = null;
      mockIsLoadingUser = true;
      mockUseMiPerfil.mockReturnValue({
        data: null,
        isLoading: false,
      });

      const { container } = renderWithProviders(<MiPortalPage />);

      // Should show HeroSkeleton (early return path)
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
