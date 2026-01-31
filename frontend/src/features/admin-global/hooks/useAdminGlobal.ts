/**
 * Hooks para Admin Global - Panel de Superusuarios
 *
 * React Query hooks para gestión de Tenants, Planes y Usuarios Globales.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { plansApi, tenantsApi, tenantUsersApi } from '../api/adminGlobal.api';
import type {
  CreatePlanDTO,
  UpdatePlanDTO,
  CreateTenantDTO,
  UpdateTenantDTO,
  CreateTenantUserDTO,
  UpdateTenantUserDTO,
  AssignTenantDTO,
} from '../types';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const adminGlobalKeys = {
  // Plans
  plans: ['admin-global', 'plans'] as const,
  plansList: () => [...adminGlobalKeys.plans, 'list'] as const,
  plansDetail: (id: number) => [...adminGlobalKeys.plans, 'detail', id] as const,
  plansStats: () => [...adminGlobalKeys.plans, 'stats'] as const,

  // Tenants
  tenants: ['admin-global', 'tenants'] as const,
  tenantsList: (filters?: Record<string, unknown>) =>
    [...adminGlobalKeys.tenants, 'list', filters] as const,
  tenantsDetail: (id: number) => [...adminGlobalKeys.tenants, 'detail', id] as const,
  tenantsStats: () => [...adminGlobalKeys.tenants, 'stats'] as const,
  tenantsUsers: (id: number) => [...adminGlobalKeys.tenants, 'users', id] as const,

  // Tenant Users
  tenantUsers: ['admin-global', 'tenant-users'] as const,
  tenantUsersList: (filters?: Record<string, unknown>) =>
    [...adminGlobalKeys.tenantUsers, 'list', filters] as const,
  tenantUsersDetail: (id: number) => [...adminGlobalKeys.tenantUsers, 'detail', id] as const,
  tenantUsersStats: () => [...adminGlobalKeys.tenantUsers, 'stats'] as const,
};

// =============================================================================
// PLANES HOOKS
// =============================================================================

export const usePlans = () => {
  return useQuery({
    queryKey: adminGlobalKeys.plansList(),
    queryFn: plansApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const usePlan = (id: number) => {
  return useQuery({
    queryKey: adminGlobalKeys.plansDetail(id),
    queryFn: () => plansApi.getById(id),
    enabled: !!id,
  });
};

export const usePlansStats = () => {
  return useQuery({
    queryKey: adminGlobalKeys.plansStats(),
    queryFn: plansApi.getStats,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanDTO) => plansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.plans });
      toast.success('Plan creado correctamente');
    },
    onError: () => {
      toast.error('Error al crear el plan');
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanDTO }) => plansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.plans });
      toast.success('Plan actualizado correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar el plan');
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => plansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.plans });
      toast.success('Plan eliminado correctamente');
    },
    onError: () => {
      toast.error('Error al eliminar el plan');
    },
  });
};

// =============================================================================
// TENANTS HOOKS
// =============================================================================

export const useTenantsList = (filters?: {
  is_active?: boolean;
  is_trial?: boolean;
  plan?: number;
  tier?: string;
  search?: string;
  ordering?: string;
}) => {
  return useQuery({
    queryKey: adminGlobalKeys.tenantsList(filters),
    queryFn: () => tenantsApi.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const useTenant = (id: number) => {
  return useQuery({
    queryKey: adminGlobalKeys.tenantsDetail(id),
    queryFn: () => tenantsApi.getById(id),
    enabled: !!id,
  });
};

export const useTenantsStats = () => {
  return useQuery({
    queryKey: adminGlobalKeys.tenantsStats(),
    queryFn: tenantsApi.getStats,
    staleTime: 2 * 60 * 1000,
  });
};

export const useTenantUsers = (tenantId: number) => {
  return useQuery({
    queryKey: adminGlobalKeys.tenantsUsers(tenantId),
    queryFn: () => tenantsApi.getUsers(tenantId),
    enabled: !!tenantId,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantDTO) => tenantsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.tenants });
      toast.success('Empresa creada correctamente');
    },
    onError: () => {
      toast.error('Error al crear la empresa');
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTenantDTO }) => tenantsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.tenants });
      toast.success('Empresa actualizada correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar la empresa');
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tenantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.tenants });
      toast.success('Empresa eliminada correctamente');
    },
    onError: () => {
      toast.error('Error al eliminar la empresa');
    },
  });
};

export const useToggleTenantActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tenantsApi.toggleActive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.tenants });
      toast.success(data.message);
    },
    onError: () => {
      toast.error('Error al cambiar estado de la empresa');
    },
  });
};

// =============================================================================
// TENANT USERS HOOKS (Usuarios Globales)
// =============================================================================

export const useTenantUsersList = (filters?: {
  is_active?: boolean;
  is_superadmin?: boolean;
  search?: string;
  ordering?: string;
}) => {
  return useQuery({
    queryKey: adminGlobalKeys.tenantUsersList(filters),
    queryFn: () => tenantUsersApi.getAll(filters),
    staleTime: 2 * 60 * 1000,
  });
};

export const useTenantUser = (id: number) => {
  return useQuery({
    queryKey: adminGlobalKeys.tenantUsersDetail(id),
    queryFn: () => tenantUsersApi.getById(id),
    enabled: !!id,
  });
};

export const useTenantUsersStats = () => {
  return useQuery({
    queryKey: adminGlobalKeys.tenantUsersStats(),
    queryFn: tenantUsersApi.getStats,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateTenantUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantUserDTO) => tenantUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.tenantUsers });
      toast.success('Usuario creado correctamente');
    },
    onError: () => {
      toast.error('Error al crear el usuario');
    },
  });
};

export const useUpdateTenantUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTenantUserDTO }) =>
      tenantUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.tenantUsers });
      toast.success('Usuario actualizado correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar el usuario');
    },
  });
};

export const useDeleteTenantUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tenantUsersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.tenantUsers });
      toast.success('Usuario eliminado correctamente');
    },
    onError: () => {
      toast.error('Error al eliminar el usuario');
    },
  });
};

export const useAssignTenantToUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: AssignTenantDTO }) =>
      tenantUsersApi.assignTenant(userId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.tenantUsers });
      toast.success(data.message);
    },
    onError: () => {
      toast.error('Error al asignar empresa al usuario');
    },
  });
};

export const useRemoveTenantFromUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, tenantId }: { userId: number; tenantId: number }) =>
      tenantUsersApi.removeTenant(userId, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGlobalKeys.tenantUsers });
      toast.success('Acceso removido correctamente');
    },
    onError: () => {
      toast.error('Error al remover acceso');
    },
  });
};
