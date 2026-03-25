import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import { toast } from 'sonner';
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
import { UsersTable } from '../components/UsersTable';
import { UserDetailDrawer } from '../components/UserDetailDrawer';
import { ImpersonateVerifyModal } from '../components/ImpersonateVerifyModal';
import { useUsers, useCargos, useToggleUserStatus } from '../hooks/useUsers';
import type { User, UserFilters, UserOrigen } from '@/types/users.types';
import { ORIGEN_LABELS } from '@/types/users.types';
import { useModuleColor } from '@/hooks/useModuleColor';

import { useAuthStore } from '@/store/authStore';
import { isPortalOnlyUser } from '@/utils/portalUtils';

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { color: moduleColor } = useModuleColor('USUARIOS');

  // Impersonación: solo disponible para superusers
  const currentUser = useAuthStore((s) => s.user);
  const startUserImpersonation = useAuthStore((s) => s.startUserImpersonation);
  const canImpersonate = currentUser?.is_superuser === true;

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    cargo: '',
    is_active: true,
    tipo: 'todos',
    origen: '',
    page: 1,
    page_size: 10,
  });

  // Estado del drawer de detalle
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const [impersonateTarget, setImpersonateTarget] = useState<User | null>(null);

  const { data: usersData, isLoading: isLoadingUsers } = useUsers(filters);
  const { data: cargosData } = useCargos();
  const cargos = cargosData?.results || [];
  const toggleStatusMutation = useToggleUserStatus();

  const handleViewDetail = (user: User) => {
    setDetailUser(user);
  };

  const handleCloseDetail = () => {
    setDetailUser(null);
  };

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

  const handleImpersonate = (user: User) => {
    // Si el superadmin tiene 2FA, abrir modal de verificación primero
    if (currentUser?.has_2fa_enabled) {
      setImpersonateTarget(user);
      return;
    }
    // Sin 2FA: impersonar directo
    executeImpersonation(user.id);
  };

  const executeImpersonation = async (userId: number, token?: string) => {
    try {
      await startUserImpersonation(userId, token);
      queryClient.removeQueries({ queryKey: ['modules'] });
      // Buscar usuario para determinar navegación
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser && isPortalOnlyUser(targetUser)) {
        const isCliente = targetUser.cargo?.code === 'CLIENTE_PORTAL';
        navigate(isCliente ? '/cliente-portal' : '/proveedor-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'No se pudo impersonar este usuario');
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: unknown) => {
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
      tipo: 'todos',
      origen: '',
      page: 1,
      page_size: 10,
    });
  };

  const activeFiltersCount = [
    filters.cargo,
    filters.is_active !== undefined ? 'active' : '',
    filters.tipo && filters.tipo !== 'todos' ? 'tipo' : '',
    filters.origen ? 'origen' : '',
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

  const tipoFilterOptions = [
    { value: 'todos', label: 'Todos los tipos' },
    { value: 'interno', label: 'Internos' },
    { value: 'externo', label: 'Externos' },
  ];

  const origenFilterOptions = [
    { value: '', label: 'Todos los orígenes' },
    ...Object.entries(ORIGEN_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const users = useMemo(() => usersData?.results || [], [usersData]);
  const totalUsers = usersData?.count || 0;

  // Calcular estadísticas para StatsGrid
  const userStats: StatItem[] = useMemo(() => {
    const activos = users.filter((u) => u.is_active).length;
    const inactivos = users.filter((u) => !u.is_active).length;
    const conCargo = users.filter((u) => u.cargo).length;

    return [
      { label: 'Total Usuarios', value: totalUsers, icon: Users, iconColor: 'info' as const },
      { label: 'Activos', value: activos, icon: UserCheck, iconColor: 'success' as const },
      { label: 'Inactivos', value: inactivos, icon: UserX, iconColor: 'gray' as const },
      { label: 'Con Cargo Asignado', value: conCargo, icon: Shield, iconColor: 'info' as const },
    ];
  }, [users, totalUsers]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Gestión de Usuarios"
        description="Centro de control de identidad digital — la edición de datos se realiza en el módulo origen"
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
        <FilterGrid columns={4}>
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
          <Select
            label="Tipo"
            options={tipoFilterOptions}
            value={filters.tipo || 'todos'}
            onChange={(e) =>
              handleFilterChange('tipo', e.target.value as 'todos' | 'interno' | 'externo')
            }
          />
          <Select
            label="Origen"
            options={origenFilterOptions}
            value={filters.origen || ''}
            onChange={(e) => handleFilterChange('origen', e.target.value as UserOrigen | '')}
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
        emptyMessage="No se encontraron usuarios"
      >
        <UsersTable
          users={users}
          isLoading={isLoadingUsers}
          onViewDetail={handleViewDetail}
          onToggleStatus={handleToggleStatus}
          onImpersonate={canImpersonate ? handleImpersonate : undefined}
          currentUserId={currentUser?.id}
        />
      </DataTableCard>

      {/* Drawer de detalle */}
      <UserDetailDrawer
        user={detailUser}
        isOpen={!!detailUser}
        onClose={handleCloseDetail}
        onToggleStatus={handleToggleStatus}
        onImpersonate={canImpersonate ? handleImpersonate : undefined}
        canImpersonate={canImpersonate}
        currentUserId={currentUser?.id}
      />

      {/* Modal 2FA para impersonación */}
      <ImpersonateVerifyModal
        isOpen={!!impersonateTarget}
        onClose={() => setImpersonateTarget(null)}
        targetUser={impersonateTarget}
        onVerified={(token) => {
          if (impersonateTarget) {
            executeImpersonation(impersonateTarget.id, token);
            setImpersonateTarget(null);
          }
        }}
      />
    </div>
  );
}
