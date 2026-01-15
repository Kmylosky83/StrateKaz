/**
 * ColaboradoresSection - Sección de Colaboradores para el módulo Organización
 *
 * Este componente gestiona los usuarios/colaboradores del sistema desde el contexto
 * del módulo de Gestión Estratégica > Organización.
 *
 * REFACTORIZACIÓN:
 * - NO importa UsersPage directamente (evita acoplamiento entre features)
 * - Reutiliza hooks y componentes específicos del feature users
 * - Implementa su propia lógica de presentación adaptada al contexto organizacional
 */

import { useState, useMemo } from 'react';
import { UserPlus, Users, UserCheck, UserX, Shield } from 'lucide-react';

// Componentes comunes de layout
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import {
  PageHeader,
  FilterCard,
  FilterGrid,
  DataTableCard,
  StatsGrid,
  StatsGridSkeleton,
} from '@/components/layout';
import type { StatItem } from '@/components/layout';

// Componentes reutilizables del feature users
import { UsersTable } from '@/features/users/components/UsersTable';
import { UserForm } from '@/features/users/components/UserForm';
import { DeleteConfirmModal } from '@/components/users/DeleteConfirmModal';

// Hooks del feature users
import {
  useUsers,
  useCargos,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useToggleUserStatus,
} from '@/features/users/hooks/useUsers';

// Hooks de configuración
// import { useRoles } from '@/features/configuracion/hooks/useRoles';

// Types
import type { User, CreateUserDTO, UpdateUserDTO, UserFilters } from '@/types/users.types';

// Hooks de utilidades
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

/**
 * ColaboradoresSection Component
 *
 * Proporciona una interfaz completa para gestionar colaboradores (usuarios)
 * en el contexto del módulo de Organización.
 */
export const ColaboradoresSection = () => {
  // Color del módulo para mantener consistencia visual
  const { color: moduleColor } = useModuleColor('ORGANIZACION');

  // RBAC Permission Checks
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_ESTRATEGICA, Sections.COLABORADORES, 'create');

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    cargo: '',
    is_active: undefined,
    page: 1,
    page_size: 10,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [userToDelete, setUserToDelete] = useState<User | undefined>();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: usersData, isLoading: isLoadingUsers } = useUsers(filters);
  const { data: cargos = [] } = useCargos();
  // const { data: rolesData } = useRoles({ is_active: true });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();

  // ============================================================================
  // EVENT HANDLERS - FORM MANAGEMENT
  // ============================================================================

  const handleOpenCreateForm = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedUser(undefined);
  };

  const handleSubmit = async (data: CreateUserDTO | UpdateUserDTO) => {
    try {
      if (selectedUser) {
        await updateUserMutation.mutateAsync({
          id: selectedUser.id,
          data: data as UpdateUserDTO,
        });
      } else {
        await createUserMutation.mutateAsync(data as CreateUserDTO);
      }
      handleCloseForm();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  };

  // ============================================================================
  // EVENT HANDLERS - DELETE MANAGEMENT
  // ============================================================================

  const handleOpenDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(undefined);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUserMutation.mutateAsync(userToDelete.id);
        handleCloseDeleteModal();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  // ============================================================================
  // EVENT HANDLERS - USER ACTIONS
  // ============================================================================

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: user.id,
        is_active: !user.is_active,
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  // ============================================================================
  // EVENT HANDLERS - FILTERS
  // ============================================================================

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      cargo: '',
      is_active: undefined,
      page: 1,
      page_size: 10,
    });
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const activeFiltersCount = [
    filters.cargo,
    filters.is_active !== undefined ? 'active' : '',
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  const cargoFilterOptions = [
    { value: '', label: 'Todos los cargos' },
    ...cargos.map((cargo) => ({ value: String(cargo.id), label: cargo.name })),
  ];

  const statusFilterOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' },
  ];

  const users = usersData?.results || [];
  const totalUsers = usersData?.count || 0;

  // ============================================================================
  // STATISTICS CALCULATION
  // ============================================================================

  const userStats: StatItem[] = useMemo(() => {
    const activos = users.filter((u) => u.is_active).length;
    const inactivos = users.filter((u) => !u.is_active).length;
    const conCargo = users.filter((u) => u.cargo).length;

    return [
      {
        label: 'Total Colaboradores',
        value: totalUsers,
        icon: Users,
        iconColor: 'info' as const,
      },
      {
        label: 'Activos',
        value: activos,
        icon: UserCheck,
        iconColor: 'success' as const,
      },
      {
        label: 'Inactivos',
        value: inactivos,
        icon: UserX,
        iconColor: 'gray' as const,
      },
      {
        label: 'Con Cargo Asignado',
        value: conCargo,
        icon: Shield,
        iconColor: 'info' as const,
      },
    ];
  }, [users, totalUsers]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Gestión de Colaboradores"
        description="Administración de colaboradores y sus cargos en la organización"
        actions={
          canCreate ? (
            <Button onClick={handleOpenCreateForm} leftIcon={<UserPlus className="h-4 w-4" />}>
              Nuevo Colaborador
            </Button>
          ) : undefined
        }
      />

      {/* ESTADÍSTICAS */}
      {isLoadingUsers ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={userStats} columns={4} moduleColor={moduleColor} />
      )}

      {/* FILTROS */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por nombre o username..."
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={3}>
          <Select
            label="Cargo"
            options={cargoFilterOptions}
            value={filters.cargo}
            onChange={(e) => handleFilterChange('cargo', e.target.value)}
          />
          <Select
            label="Estado"
            options={statusFilterOptions}
            value={String(filters.is_active || '')}
            onChange={(e) =>
              handleFilterChange(
                'is_active',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
          />
        </FilterGrid>
      </FilterCard>

      {/* TABLA */}
      <DataTableCard
        pagination={{
          currentPage: filters.page || 1,
          pageSize: filters.page_size || 10,
          totalItems: totalUsers,
          hasPrevious: !!usersData?.previous,
          hasNext: !!usersData?.next,
          onPageChange: (page) => handleFilterChange('page', page),
        }}
        isEmpty={users.length === 0}
        isLoading={isLoadingUsers}
        emptyMessage="No se encontraron colaboradores"
      >
        <UsersTable
          users={users}
          isLoading={isLoadingUsers}
          onEdit={handleOpenEditForm}
          onDelete={handleOpenDeleteModal}
          onToggleStatus={handleToggleStatus}
          module={Modules.GESTION_ESTRATEGICA}
          section={Sections.COLABORADORES}
        />
      </DataTableCard>

      {/* MODALS */}
      <UserForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        user={selectedUser}
        cargos={cargos}
        isLoading={createUserMutation.isPending || updateUserMutation.isPending}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        userName={userToDelete?.full_name || ''}
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  );
};

export default ColaboradoresSection;
