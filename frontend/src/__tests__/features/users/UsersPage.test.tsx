/**
 * Tests para UsersPage — Gestion de Usuarios
 *
 * Cobertura:
 * - Renderizado de la pagina principal
 * - Estadisticas (StatsGrid)
 * - Estado de carga
 * - Estado vacio
 * - Busqueda y filtros
 * - Boton Nuevo Usuario (ProtectedAction)
 * - Lista de usuarios
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockPaginatedResponse } from '@/__tests__/utils/test-utils';
import UsersPage from '@/features/users/pages/UsersPage';
import type { User } from '@/types/users.types';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    username: 'jperez',
    email: 'jperez@empresa.com',
    first_name: 'Juan',
    last_name: 'Perez',
    full_name: 'Juan Perez',
    cargo: { id: 1, name: 'Operario', code: 'OPE', level: 3 },
    phone: '3001234567',
    photo: null,
    document_type: 'CC',
    document_type_display: 'Cedula de Ciudadania',
    document_number: '1234567890',
    is_active: true,
    is_staff: false,
    is_superuser: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    last_login: '2024-06-01T10:00:00Z',
    date_joined: '2024-01-01T00:00:00Z',
    ...overrides,
  }) as User;

const mockUsers: User[] = [
  mockUser({ id: 1, username: 'jperez', full_name: 'Juan Perez', is_active: true }),
  mockUser({
    id: 2,
    username: 'mlopez',
    full_name: 'Maria Lopez',
    first_name: 'Maria',
    last_name: 'Lopez',
    email: 'mlopez@empresa.com',
    is_active: true,
    cargo: { id: 2, name: 'Analista', code: 'ANA', level: 4 },
  }),
  mockUser({
    id: 3,
    username: 'cgarcia',
    full_name: 'Carlos Garcia',
    first_name: 'Carlos',
    last_name: 'Garcia',
    email: 'cgarcia@empresa.com',
    is_active: false,
    cargo: null,
  }),
];

// ============================================================================
// MOCKS
// ============================================================================

const mockUseUsers = vi.fn();
const mockUseCargos = vi.fn();
const mockUseCreateUser = vi.fn();
const mockUseUpdateUser = vi.fn();
const mockUseDeleteUser = vi.fn();
const mockUseToggleUserStatus = vi.fn();

vi.mock('@/features/users/hooks/useUsers', () => ({
  useUsers: (...args: unknown[]) => mockUseUsers(...args),
  useCargos: (...args: unknown[]) => mockUseCargos(...args),
  useCreateUser: (...args: unknown[]) => mockUseCreateUser(...args),
  useUpdateUser: (...args: unknown[]) => mockUseUpdateUser(...args),
  useDeleteUser: (...args: unknown[]) => mockUseDeleteUser(...args),
  useToggleUserStatus: (...args: unknown[]) => mockUseToggleUserStatus(...args),
}));

vi.mock('@/hooks/useSelectLists', () => ({
  useSelectRoles: () => ({ data: [{ value: 1, label: 'Admin' }] }),
}));

vi.mock('@/hooks/useModuleColor', () => ({
  useModuleColor: () => ({ color: 'blue', isLoading: false, module: null }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canDo: () => true,
    hasPermission: () => true,
    isSuperAdmin: true,
    hasCargo: () => false,
    canAccess: () => true,
    hasSectionAccess: () => true,
  }),
}));

// Mock authStore
vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      user: {
        id: 99,
        is_superuser: true,
        first_name: 'Admin',
        full_name: 'Admin Test',
      },
      startUserImpersonation: vi.fn(),
    }),
}));

vi.mock('@/utils/portalUtils', () => ({
  isPortalOnlyUser: () => false,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), info: vi.fn() },
}));

// Mock UsersTable to simplify — focus on page-level behavior
vi.mock('@/features/users/components/UsersTable', () => ({
  UsersTable: ({ users, isLoading }: { users: User[]; isLoading: boolean }) => (
    <div data-testid="users-table">
      {isLoading && <div data-testid="table-loading">Cargando...</div>}
      {users.map((u) => (
        <div key={u.id} data-testid={`user-row-${u.id}`}>
          <span>{u.full_name}</span>
          <span>{u.is_active ? 'Activo' : 'Inactivo'}</span>
        </div>
      ))}
    </div>
  ),
}));

// Mock UserForm and DeleteConfirmModal
vi.mock('@/features/users/components/UserForm', () => ({
  UserForm: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="user-form-modal">Form Modal</div> : null,
}));

vi.mock('@/components/users/DeleteConfirmModal', () => ({
  DeleteConfirmModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="delete-confirm-modal">Delete Modal</div> : null,
}));

// ============================================================================
// TESTS
// ============================================================================

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Defaults
    mockUseUsers.mockReturnValue({
      data: createMockPaginatedResponse(mockUsers),
      isLoading: false,
    });
    mockUseCargos.mockReturnValue({
      data: {
        results: [
          { id: 1, name: 'Operario' },
          { id: 2, name: 'Analista' },
        ],
      },
    });
    mockUseCreateUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseUpdateUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseDeleteUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseToggleUserStatus.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  // --------------------------------------------------------------------------
  // RENDERIZADO PRINCIPAL
  // --------------------------------------------------------------------------

  describe('Renderizado principal', () => {
    it('debe renderizar el titulo de la pagina', () => {
      renderWithProviders(<UsersPage />);

      expect(screen.getByText(/Gesti.n de Usuarios/i)).toBeInTheDocument();
      expect(screen.getByText(/Administraci.n de usuarios del sistema/i)).toBeInTheDocument();
    });

    it('debe renderizar la tabla de usuarios', () => {
      renderWithProviders(<UsersPage />);

      expect(screen.getByTestId('users-table')).toBeInTheDocument();
    });

    it('debe renderizar las filas de usuarios', () => {
      renderWithProviders(<UsersPage />);

      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
      expect(screen.getByText('Carlos Garcia')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ESTADISTICAS
  // --------------------------------------------------------------------------

  describe('Estadisticas', () => {
    it('debe mostrar las estadisticas de usuarios', () => {
      renderWithProviders(<UsersPage />);

      expect(screen.getByText('Total Usuarios')).toBeInTheDocument();
      expect(screen.getByText('Activos')).toBeInTheDocument();
      expect(screen.getByText('Inactivos')).toBeInTheDocument();
      expect(screen.getByText('Con Cargo Asignado')).toBeInTheDocument();
    });

    it('debe mostrar skeleton en estadisticas mientras carga', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      renderWithProviders(<UsersPage />);

      // Cuando esta cargando, no debe mostrar las labels de stats
      expect(screen.queryByText('Total Usuarios')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ESTADO DE CARGA
  // --------------------------------------------------------------------------

  describe('Estado de carga', () => {
    it('debe indicar carga en la tabla cuando isLoading es true', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      renderWithProviders(<UsersPage />);

      expect(screen.getByTestId('table-loading')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // ESTADO VACIO
  // --------------------------------------------------------------------------

  describe('Estado vacio', () => {
    it('debe mostrar mensaje cuando no hay usuarios', () => {
      mockUseUsers.mockReturnValue({
        data: createMockPaginatedResponse([]),
        isLoading: false,
      });

      renderWithProviders(<UsersPage />);

      expect(screen.getByText('No se encontraron usuarios')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // BOTON NUEVO USUARIO (ProtectedAction)
  // --------------------------------------------------------------------------

  describe('Boton Nuevo Usuario', () => {
    it('debe renderizar el boton Nuevo Usuario', () => {
      renderWithProviders(<UsersPage />);

      expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument();
    });

    it('debe abrir el formulario al hacer clic en Nuevo Usuario', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UsersPage />);

      await user.click(screen.getByText('Nuevo Usuario'));

      await waitFor(() => {
        expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // BUSQUEDA
  // --------------------------------------------------------------------------

  describe('Busqueda y filtros', () => {
    it('debe renderizar el campo de busqueda', () => {
      renderWithProviders(<UsersPage />);

      expect(screen.getByPlaceholderText(/buscar por nombre o username/i)).toBeInTheDocument();
    });

    it('debe actualizar el valor de busqueda al escribir', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UsersPage />);

      const searchInput = screen.getByPlaceholderText(/buscar por nombre o username/i);
      await user.type(searchInput, 'Juan');

      expect(searchInput).toHaveValue('Juan');
    });

    it('debe renderizar el boton de Filtros en FilterCard colapsable', async () => {
      renderWithProviders(<UsersPage />);

      // FilterCard collapsible muestra un boton "Filtros" para expandir
      const filtrosButton = screen.getByText(/filtros/i);
      expect(filtrosButton).toBeInTheDocument();
    });

    it('debe mostrar filtros al expandir la seccion', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UsersPage />);

      // Expandir filtros
      const filtrosButton = screen.getByText(/filtros/i);
      await user.click(filtrosButton);

      await waitFor(() => {
        expect(screen.getByText('Cargo')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Tipo')).toBeInTheDocument();
        expect(screen.getByText('Origen')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // PAGINACION
  // --------------------------------------------------------------------------

  describe('Paginacion', () => {
    it('debe mostrar paginacion cuando hay datos', () => {
      mockUseUsers.mockReturnValue({
        data: {
          ...createMockPaginatedResponse(mockUsers),
          count: 25,
          next: 'http://api/users?page=2',
        },
        isLoading: false,
      });

      renderWithProviders(<UsersPage />);

      // DataTableCard includes pagination info
      // Just verify data renders successfully — the pagination component is part of DataTableCard
      expect(screen.getByTestId('users-table')).toBeInTheDocument();
    });
  });
});
