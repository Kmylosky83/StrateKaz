/**
 * React Query Hooks para el módulo de Dirección Estratégica
 * Sistema de Gestión StrateKaz
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import {
  identityApi,
  valuesApi,
  plansApi,
  objectivesApi,
  modulesApi,
  brandingApi,
  statsApi,
  sedesApi,
  integracionesApi,
  alcancesApi,
  normasISOApi,
  currentTenantApi,
} from '../api/strategicApi';
import type { CurrentTenantData } from '../api/strategicApi';
import type {
  CreateCorporateIdentityDTO,
  UpdateCorporateIdentityDTO,
  CreateCorporateValueDTO,
  UpdateCorporateValueDTO,
  CorporateValue,
  CreateStrategicPlanDTO,
  UpdateStrategicPlanDTO,
  CreateStrategicObjectiveDTO,
  UpdateStrategicObjectiveDTO,
  UpdateProgressDTO,
  CreateSystemModuleDTO,
  UpdateSystemModuleDTO,
  ToggleModuleDTO,
  CreateBrandingConfigDTO,
  UpdateBrandingConfigDTO,
  ObjectiveFilters,
  ModuleFilters,
  CreateSedeEmpresaDTO,
  UpdateSedeEmpresaDTO,
  SedeFilters,
  CreateIntegracionDTO,
  UpdateIntegracionDTO,
  UpdateCredencialesDTO,
  IntegracionFilters,
  IntegracionLogsFilters,
  CreateAlcanceSistemaDTO,
  UpdateAlcanceSistemaDTO,
  AlcanceSistemaFilters,
  PaginatedResponse,
} from '../types/strategic.types';

// ==================== QUERY KEYS ====================

export const strategicKeys = {
  // Identity
  identities: ['identities'] as const,
  identity: (id: number) => ['identity', id] as const,
  activeIdentity: ['identity', 'active'] as const,

  // Values
  values: (identityId?: number) => ['values', identityId] as const,
  value: (id: number) => ['value', id] as const,

  // Plans
  plans: ['plans'] as const,
  plan: (id: number) => ['plan', id] as const,
  activePlan: ['plan', 'active'] as const,
  bscPerspectives: ['bsc-perspectives'] as const,
  isoStandards: ['iso-standards'] as const,
  periodTypes: ['period-types'] as const,

  // Objectives
  objectives: (filters?: ObjectiveFilters) => ['objectives', filters] as const,
  objective: (id: number) => ['objective', id] as const,
  objectiveStatuses: ['objective-statuses'] as const,

  // Modules
  modules: (filters?: ModuleFilters) => ['modules', filters] as const,
  module: (id: number) => ['module', id] as const,
  enabledModules: ['modules', 'enabled'] as const,
  moduleCategories: ['module-categories'] as const,

  // Branding
  brandings: ['brandings'] as const,
  branding: (id: number) => ['branding', id] as const,
  activeBranding: ['branding', 'active'] as const,

  // Stats
  stats: ['strategic-stats'] as const,
  configStats: (section: string) => ['config-stats', section] as const,

  // Sedes
  sedes: (filters?: SedeFilters) => ['sedes', filters] as const,
  sede: (id: number) => ['sede', id] as const,
  sedePrincipal: ['sede', 'principal'] as const,
  sedeChoices: ['sede-choices'] as const,

  // Integraciones
  integraciones: (filters?: IntegracionFilters) => ['integraciones', filters] as const,
  integracion: (id: number) => ['integracion', id] as const,
  integracionLogs: (id: number, filters?: IntegracionLogsFilters) =>
    ['integracion', id, 'logs', filters] as const,
  integracionChoices: ['integracion-choices'] as const,

  // Alcances del Sistema
  alcances: (filters?: AlcanceSistemaFilters) => ['alcances', filters] as const,
  alcance: (id: number) => ['alcance', id] as const,
  alcancesByStandard: (identityId: number) => ['alcances', 'by-standard', identityId] as const,
  alcancesCertifications: (identityId: number) =>
    ['alcances', 'certifications', identityId] as const,

  // Normas ISO (Dinámico)
  normasISO: ['normas_iso'] as const,
  normasISOChoices: ['normas_iso', 'choices'] as const,
  normasISOByCategory: ['normas_iso', 'by-category'] as const,
};

// ==================== CORPORATE IDENTITY HOOKS ====================

export const useIdentities = () => {
  return useQuery({
    queryKey: strategicKeys.identities,
    queryFn: identityApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos relativamente estáticos
    gcTime: 10 * 60 * 1000, // 10 minutos cache
  });
};

export const useActiveIdentity = () => {
  return useQuery({
    queryKey: strategicKeys.activeIdentity,
    queryFn: identityApi.getActive,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos - datos principales
  });
};

export const useIdentity = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.identity(id),
    queryFn: () => identityApi.getById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
};

export const useCreateIdentity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCorporateIdentityDTO) => identityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.identities });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      queryClient.invalidateQueries({ queryKey: strategicKeys.stats });
      toast.success('Identidad corporativa creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la identidad corporativa');
    },
  });
};

export const useUpdateIdentity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCorporateIdentityDTO }) =>
      identityApi.update(id, data),
    onSuccess: async (updatedIdentity, { id }) => {
      // Actualizar cache directamente con los datos retornados del servidor
      queryClient.setQueryData(strategicKeys.activeIdentity, updatedIdentity);
      queryClient.setQueryData(strategicKeys.identity(id), updatedIdentity);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: strategicKeys.identities });

      // Forzar refetch para garantizar consistencia
      await queryClient.refetchQueries({ queryKey: strategicKeys.activeIdentity });

      toast.success('Identidad corporativa actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la identidad corporativa');
    },
  });
};

export const useDeleteIdentity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => identityApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.identities });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      queryClient.invalidateQueries({ queryKey: strategicKeys.stats });
      toast.success('Identidad corporativa eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la identidad corporativa');
    },
  });
};

// ==================== CORPORATE VALUES HOOKS ====================

export const useValues = (identityId?: number) => {
  return useQuery({
    queryKey: strategicKeys.values(identityId),
    queryFn: () => valuesApi.getAll(identityId),
    staleTime: 3 * 60 * 1000, // 3 minutos - valores corporativos
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCorporateValueDTO & { identity: number }) => valuesApi.create(data),
    onSuccess: async (_, { identity }) => {
      // Forzar refetch inmediato para actualizar UI
      await Promise.all([
        queryClient.refetchQueries({ queryKey: strategicKeys.values(identity) }),
        queryClient.refetchQueries({ queryKey: strategicKeys.activeIdentity }),
      ]);
      toast.success('Valor corporativo creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el valor corporativo');
    },
  });
};

export const useUpdateValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCorporateValueDTO }) =>
      valuesApi.update(id, data),
    onSuccess: async () => {
      // Forzar refetch inmediato para actualizar UI
      await Promise.all([
        queryClient.refetchQueries({ queryKey: strategicKeys.values() }),
        queryClient.refetchQueries({ queryKey: strategicKeys.activeIdentity }),
      ]);
      toast.success('Valor corporativo actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el valor corporativo');
    },
  });
};

export const useDeleteValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => valuesApi.delete(id),
    onSuccess: async () => {
      // Forzar refetch inmediato para actualizar UI
      await Promise.all([
        queryClient.refetchQueries({ queryKey: strategicKeys.values() }),
        queryClient.refetchQueries({ queryKey: strategicKeys.activeIdentity }),
      ]);
      toast.success('Valor corporativo eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el valor corporativo');
    },
  });
};

// ==================== STRATEGIC PLANS HOOKS ====================

export const usePlans = () => {
  return useQuery({
    queryKey: strategicKeys.plans,
    queryFn: plansApi.getAll,
  });
};

export const useActivePlan = () => {
  return useQuery({
    queryKey: strategicKeys.activePlan,
    queryFn: plansApi.getActive,
    retry: false,
  });
};

export const usePlan = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.plan(id),
    queryFn: () => plansApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStrategicPlanDTO) => plansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.plans });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activePlan });
      queryClient.invalidateQueries({ queryKey: strategicKeys.stats });
      toast.success('Plan estratégico creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el plan estratégico');
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStrategicPlanDTO }) =>
      plansApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.plans });
      queryClient.invalidateQueries({ queryKey: strategicKeys.plan(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activePlan });
      toast.success('Plan estratégico actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el plan estratégico');
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.plans });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activePlan });
      queryClient.invalidateQueries({ queryKey: strategicKeys.stats });
      toast.success('Plan estratégico eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el plan estratégico');
    },
  });
};

export const useApprovePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plansApi.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.plan(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activePlan });
      toast.success('Plan estratégico aprobado exitosamente');
    },
    onError: () => {
      toast.error('Error al aprobar el plan estratégico');
    },
  });
};

export const useBSCPerspectives = () => {
  return useQuery({
    queryKey: strategicKeys.bscPerspectives,
    queryFn: plansApi.getBSCPerspectives,
    staleTime: Infinity,
  });
};

/**
 * Hook para obtener normas ISO activas para vincular a objetivos
 * Consulta el endpoint dinámico que lee de configuracion.NormaISO
 */
export const useISOStandards = () => {
  return useQuery({
    queryKey: strategicKeys.isoStandards,
    queryFn: objectivesApi.getNormasISOChoices,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos semi-estáticos
    gcTime: 10 * 60 * 1000, // 10 minutos cache
  });
};

export const usePeriodTypes = () => {
  return useQuery({
    queryKey: strategicKeys.periodTypes,
    queryFn: plansApi.getPeriodTypes,
    staleTime: Infinity,
  });
};

// ==================== STRATEGIC OBJECTIVES HOOKS ====================

export const useObjectives = (filters?: ObjectiveFilters) => {
  return useQuery({
    queryKey: strategicKeys.objectives(filters),
    queryFn: () => objectivesApi.getAll(filters),
  });
};

export const useObjective = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.objective(id),
    queryFn: () => objectivesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateObjective = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStrategicObjectiveDTO) => objectivesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.objectives() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activePlan });
      queryClient.invalidateQueries({ queryKey: strategicKeys.stats });
      toast.success('Objetivo estratégico creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el objetivo estratégico');
    },
  });
};

export const useUpdateObjective = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStrategicObjectiveDTO }) =>
      objectivesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.objectives() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.objective(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activePlan });
      toast.success('Objetivo estratégico actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el objetivo estratégico');
    },
  });
};

export const useDeleteObjective = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => objectivesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.objectives() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activePlan });
      queryClient.invalidateQueries({ queryKey: strategicKeys.stats });
      toast.success('Objetivo estratégico eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el objetivo estratégico');
    },
  });
};

export const useUpdateObjectiveProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProgressDTO }) =>
      objectivesApi.updateProgress(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.objectives() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.objective(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activePlan });
      queryClient.invalidateQueries({ queryKey: strategicKeys.stats });
      toast.success('Progreso actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el progreso');
    },
  });
};

export const useObjectiveStatuses = () => {
  return useQuery({
    queryKey: strategicKeys.objectiveStatuses,
    queryFn: objectivesApi.getStatuses,
    staleTime: Infinity,
  });
};

// ==================== SYSTEM MODULES HOOKS ====================

export const useModules = (filters?: ModuleFilters) => {
  return useQuery({
    queryKey: strategicKeys.modules(filters),
    queryFn: () => modulesApi.getAll(filters),
  });
};

export const useEnabledModules = () => {
  return useQuery({
    queryKey: strategicKeys.enabledModules,
    queryFn: modulesApi.getEnabled,
  });
};

export const useModule = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.module(id),
    queryFn: () => modulesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSystemModuleDTO) => modulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.modules() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.stats });
      toast.success('Módulo creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el módulo');
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSystemModuleDTO }) =>
      modulesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.modules() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.module(id) });
      toast.success('Módulo actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el módulo');
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => modulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.modules() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.stats });
      toast.success('Módulo eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el módulo');
    },
  });
};

export const useToggleModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ToggleModuleDTO }) =>
      modulesApi.toggle(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.modules() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.module(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.enabledModules });
      toast.success('Estado del módulo actualizado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cambiar estado del módulo');
    },
  });
};

export const useModuleCategories = () => {
  return useQuery({
    queryKey: strategicKeys.moduleCategories,
    queryFn: modulesApi.getCategories,
    staleTime: Infinity,
  });
};

// ==================== BRANDING CONFIG HOOKS ====================
// NOTA: El branding ahora se gestiona en el modelo Tenant.
// useBrandingConfigs eliminado - no hay lista de brandings, es por tenant.
// useDeleteBranding eliminado - no se puede eliminar branding, solo actualizar.

export const useActiveBranding = () => {
  // Incluir tenantId en query key para separar cache por tenant
  // Esto evita mostrar branding del tenant anterior al cambiar
  const currentTenantId = useAuthStore((state) => state.currentTenantId);

  // Intentar leer branding cacheado en localStorage para evitar flash al recargar
  const cachedBranding = (() => {
    try {
      const cached = localStorage.getItem('last_branding');
      if (!cached) return undefined;
      const parsed = JSON.parse(cached);
      // Solo usar cache si corresponde al tenant actual
      if (parsed._tenantId && parsed._tenantId !== currentTenantId) return undefined;
      return parsed;
    } catch {
      return undefined;
    }
  })();

  // Obtiene el branding del tenant actual (localStorage) o por dominio
  return useQuery({
    queryKey: [...strategicKeys.activeBranding, currentTenantId],
    queryFn: async () => {
      const data = await brandingApi.getActive();
      // Persistir en localStorage con tenantId para validar en próxima carga
      try {
        localStorage.setItem(
          'last_branding',
          JSON.stringify({ ...data, _tenantId: currentTenantId })
        );
      } catch {
        // Ignorar errores de localStorage (quota, etc.)
      }
      return data;
    },
    retry: 1, // Un reintento en caso de error temporal
    staleTime: 5 * 60 * 1000, // 5 minutos - evitar refetch excesivo
    initialData: cachedBranding, // Usa cache localStorage mientras carga (solo si mismo tenant)
  });
};

export const useBranding = (tenantId: number) => {
  // Obtiene el branding de un tenant específico por su ID
  return useQuery({
    queryKey: strategicKeys.branding(tenantId),
    queryFn: () => brandingApi.getById(tenantId),
    enabled: !!tenantId,
  });
};

export const useUpdateBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBrandingConfigDTO | FormData }) =>
      brandingApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.branding(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeBranding });
      toast.success('Configuración de marca actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la configuración de marca');
    },
  });
};

// ==================== STRATEGIC STATS HOOK ====================

export const useStrategicStats = () => {
  return useQuery({
    queryKey: strategicKeys.stats,
    queryFn: statsApi.getStats,
  });
};

// Secciones de configuración que no tienen StatsGrid
const SECTIONS_WITHOUT_STATS = ['normas_iso', 'modulos'];

export const useConfiguracionStats = (section: string) => {
  return useQuery({
    queryKey: strategicKeys.configStats(section),
    queryFn: () => statsApi.getConfigStats(section),
    enabled: !!section && !SECTIONS_WITHOUT_STATS.includes(section),
  });
};

// ==================== SEDE EMPRESA HOOKS ====================

export const useSedes = (filters?: SedeFilters) => {
  return useQuery({
    queryKey: strategicKeys.sedes(filters),
    queryFn: () => sedesApi.getAll(filters),
  });
};

export const useSede = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.sede(id),
    queryFn: () => sedesApi.getById(id),
    enabled: !!id,
  });
};

export const useSedePrincipal = () => {
  return useQuery({
    queryKey: strategicKeys.sedePrincipal,
    queryFn: sedesApi.getPrincipal,
    retry: false,
  });
};

export const useSedeChoices = () => {
  return useQuery({
    queryKey: strategicKeys.sedeChoices,
    queryFn: sedesApi.getChoices,
    staleTime: Infinity,
  });
};

export const useCreateSede = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSedeEmpresaDTO) => sedesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.sedes() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.sedePrincipal });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('sedes') });
      toast.success('Sede creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la sede');
    },
  });
};

export const useUpdateSede = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSedeEmpresaDTO }) =>
      sedesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.sedes() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.sede(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.sedePrincipal });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('sedes') });
      toast.success('Sede actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la sede');
    },
  });
};

export const useDeleteSede = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sedesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.sedes() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.sedePrincipal });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('sedes') });
      toast.success('Sede eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la sede');
    },
  });
};

export const useRestoreSede = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sedesApi.restore(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.sedes() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.sede(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('sedes') });
      toast.success('Sede restaurada exitosamente');
    },
    onError: () => {
      toast.error('Error al restaurar la sede');
    },
  });
};

export const useSetSedePrincipal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sedesApi.setPrincipal(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.sedes() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.sede(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.sedePrincipal });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('sedes') });
      toast.success('Sede principal actualizada');
    },
    onError: () => {
      toast.error('Error al establecer la sede principal');
    },
  });
};

// ==================== INTEGRACIONES EXTERNAS HOOKS ====================

export const useIntegraciones = (filters?: IntegracionFilters) => {
  return useQuery({
    queryKey: strategicKeys.integraciones(filters),
    queryFn: () => integracionesApi.getAll(filters),
  });
};

export const useIntegracion = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.integracion(id),
    queryFn: () => integracionesApi.getById(id),
    enabled: !!id,
  });
};

export const useIntegracionChoices = () => {
  return useQuery({
    queryKey: strategicKeys.integracionChoices,
    queryFn: integracionesApi.getChoices,
    staleTime: Infinity,
  });
};

export const useCreateIntegracion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIntegracionDTO) => integracionesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.integraciones() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('integraciones') });
      toast.success('Integración creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la integración');
    },
  });
};

export const useUpdateIntegracion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateIntegracionDTO }) =>
      integracionesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.integraciones() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.integracion(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('integraciones') });
      toast.success('Integración actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la integración');
    },
  });
};

export const useDeleteIntegracion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => integracionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.integraciones() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('integraciones') });
      toast.success('Integración eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la integración');
    },
  });
};

export const useTestConnection = () => {
  return useMutation({
    mutationFn: (id: number) => integracionesApi.testConnection(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Conexión exitosa: ${result.message}`);
      } else {
        toast.error(`Fallo en la conexión: ${result.message}`);
      }
    },
    onError: () => {
      toast.error('Error al probar la conexión');
    },
  });
};

export const useToggleIntegracionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => integracionesApi.toggleStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.integraciones() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.integracion(id) });
      toast.success('Estado de la integración actualizado');
    },
    onError: () => {
      toast.error('Error al cambiar el estado de la integración');
    },
  });
};

export const useUpdateCredentials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCredencialesDTO }) =>
      integracionesApi.updateCredentials(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.integracion(id) });
      toast.success('Credenciales actualizadas exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar las credenciales');
    },
  });
};

export const useIntegracionLogs = (id: number, filters?: IntegracionLogsFilters) => {
  return useQuery({
    queryKey: strategicKeys.integracionLogs(id, filters),
    queryFn: () => integracionesApi.getLogs(id, filters),
    enabled: !!id,
  });
};

// NOTA v4.0: Políticas eliminadas de Identidad. Se gestionan desde Gestión Documental.

// --- Reorder Values (for Drag & Drop) ---

export const useReorderValues = (identityId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newOrder: { id: number; orden: number }[]) => {
      // Update each value's order
      await Promise.all(newOrder.map(({ id, orden }) => valuesApi.update(id, { orden })));
      return newOrder;
    },
    onMutate: async (newOrder) => {
      // Cancel outgoing refetches - use specific identityId query key
      const queryKey = strategicKeys.values(identityId);
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous values
      const previousData = queryClient.getQueryData<PaginatedResponse<CorporateValue>>(queryKey);

      // Optimistically update the cache
      if (previousData?.results) {
        const updatedResults = previousData.results.map((value) => {
          const newOrderItem = newOrder.find((item) => item.id === value.id);
          if (newOrderItem) {
            return { ...value, orden: newOrderItem.orden };
          }
          return value;
        });
        // Sort by new order
        updatedResults.sort((a, b) => a.orden - b.orden);
        queryClient.setQueryData(queryKey, { ...previousData, results: updatedResults });
      }

      return { previousData, queryKey };
    },
    onError: (_err, _newOrder, context) => {
      // Rollback on error
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error('Error al reordenar los valores');
    },
    onSuccess: () => {
      toast.success('Orden de valores actualizado');
    },
    onSettled: () => {
      // Refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: strategicKeys.values(identityId) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
    },
  });
};

// ==================== ALCANCES DEL SISTEMA HOOKS ====================

export const useAlcances = (filters?: AlcanceSistemaFilters) => {
  return useQuery({
    queryKey: strategicKeys.alcances(filters),
    queryFn: () => alcancesApi.getAll(filters),
    enabled: filters?.identity !== undefined,
  });
};

export const useAlcance = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.alcance(id),
    queryFn: () => alcancesApi.getById(id),
    enabled: !!id,
  });
};

export const useAlcancesByStandard = (identityId: number) => {
  return useQuery({
    queryKey: strategicKeys.alcancesByStandard(identityId),
    queryFn: () => alcancesApi.getByStandard(identityId),
    enabled: !!identityId,
  });
};

export const useAlcancesCertifications = (identityId: number) => {
  return useQuery({
    queryKey: strategicKeys.alcancesCertifications(identityId),
    queryFn: () => alcancesApi.getCertifications(identityId),
    enabled: !!identityId,
  });
};

export const useCreateAlcance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlcanceSistemaDTO) => alcancesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alcances'] });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('alcances') });
      toast.success('Alcance del sistema creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el alcance del sistema');
    },
  });
};

export const useUpdateAlcance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAlcanceSistemaDTO }) =>
      alcancesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['alcances'] });
      queryClient.invalidateQueries({ queryKey: strategicKeys.alcance(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('alcances') });
      toast.success('Alcance del sistema actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el alcance del sistema');
    },
  });
};

export const useDeleteAlcance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alcancesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alcances'] });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('alcances') });
      toast.success('Alcance del sistema eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el alcance del sistema');
    },
  });
};

// ==================== NORMAS ISO HOOKS (Dinámico) ====================

export const useNormasISO = () => {
  return useQuery({
    queryKey: strategicKeys.normasISO,
    queryFn: normasISOApi.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutos - datos relativamente estáticos
  });
};

export const useNormasISOChoices = () => {
  return useQuery({
    queryKey: strategicKeys.normasISOChoices,
    queryFn: normasISOApi.getChoices,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useNormasISOByCategory = () => {
  return useQuery({
    queryKey: strategicKeys.normasISOByCategory,
    queryFn: normasISOApi.getByCategory,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// ==================== UNIDADES DE MEDIDA HOOKS (MC-001) ====================

import {
  unidadesMedidaApi,
  type UnidadMedidaFilters,
  type CreateUnidadMedidaDTO,
  type UpdateUnidadMedidaDTO,
} from '../api/strategicApi';

// Query Keys para Unidades de Medida
export const unidadesMedidaKeys = {
  all: ['unidades-medida'] as const,
  lists: () => [...unidadesMedidaKeys.all, 'list'] as const,
  list: (filters?: UnidadMedidaFilters) => [...unidadesMedidaKeys.lists(), filters] as const,
  details: () => [...unidadesMedidaKeys.all, 'detail'] as const,
  detail: (id: number) => [...unidadesMedidaKeys.details(), id] as const,
  choices: () => [...unidadesMedidaKeys.all, 'choices'] as const,
  byCategoria: () => [...unidadesMedidaKeys.all, 'by-categoria'] as const,
};

export const useUnidadesMedida = (filters?: UnidadMedidaFilters) => {
  return useQuery({
    queryKey: unidadesMedidaKeys.list(filters),
    queryFn: () => unidadesMedidaApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos - catálogo relativamente estático
  });
};

export const useUnidadMedida = (id: number) => {
  return useQuery({
    queryKey: unidadesMedidaKeys.detail(id),
    queryFn: () => unidadesMedidaApi.getById(id),
    enabled: !!id,
  });
};

export const useUnidadesMedidaChoices = () => {
  return useQuery({
    queryKey: unidadesMedidaKeys.choices(),
    queryFn: unidadesMedidaApi.getChoices,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useUnidadesMedidaByCategoria = () => {
  return useQuery({
    queryKey: unidadesMedidaKeys.byCategoria(),
    queryFn: unidadesMedidaApi.getByCategoria,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCreateUnidadMedida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUnidadMedidaDTO) => unidadesMedidaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unidadesMedidaKeys.all });
      toast.success('Unidad de medida creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la unidad de medida');
    },
  });
};

export const useUpdateUnidadMedida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUnidadMedidaDTO }) =>
      unidadesMedidaApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: unidadesMedidaKeys.all });
      queryClient.invalidateQueries({ queryKey: unidadesMedidaKeys.detail(id) });
      toast.success('Unidad de medida actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la unidad de medida');
    },
  });
};

export const useDeleteUnidadMedida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unidadesMedidaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unidadesMedidaKeys.all });
      toast.success('Unidad de medida eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la unidad de medida');
    },
  });
};

export const useRestoreUnidadMedida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unidadesMedidaApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unidadesMedidaKeys.all });
      toast.success('Unidad de medida restaurada exitosamente');
    },
    onError: () => {
      toast.error('Error al restaurar la unidad de medida');
    },
  });
};

export const useCargarUnidadesSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unidadesMedidaApi.cargarSistema(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: unidadesMedidaKeys.all });
      toast.success(`${result.message} (${result.unidades_creadas} nuevas)`);
    },
    onError: () => {
      toast.error('Error al cargar las unidades del sistema');
    },
  });
};

export const useConvertirUnidad = () => {
  return useMutation({
    mutationFn: ({
      valor,
      unidadOrigen,
      unidadDestino,
    }: {
      valor: number;
      unidadOrigen: string;
      unidadDestino: string;
    }) => unidadesMedidaApi.convertir(valor, unidadOrigen, unidadDestino),
    onError: () => {
      toast.error('Error al convertir la unidad');
    },
  });
};

export const useFormatearUnidad = () => {
  return useMutation({
    mutationFn: ({
      valor,
      unidad,
      incluirSimbolo = true,
    }: {
      valor: number;
      unidad: string;
      incluirSimbolo?: boolean;
    }) => unidadesMedidaApi.formatear(valor, unidad, incluirSimbolo),
    onError: () => {
      toast.error('Error al formatear el valor');
    },
  });
};

// ==============================================================================
// MC-002: CONSECUTIVOS CONFIG HOOKS
// ==============================================================================

import {
  consecutivosApi,
  type ConsecutivoFilters,
  type CreateConsecutivoDTO,
  type UpdateConsecutivoDTO,
  type PreviewConsecutivoParams,
} from '../api/strategicApi';

export const consecutivosKeys = {
  all: ['consecutivos'] as const,
  lists: () => [...consecutivosKeys.all, 'list'] as const,
  list: (filters?: ConsecutivoFilters) => [...consecutivosKeys.lists(), filters] as const,
  details: () => [...consecutivosKeys.all, 'detail'] as const,
  detail: (id: number) => [...consecutivosKeys.details(), id] as const,
  choices: () => [...consecutivosKeys.all, 'choices'] as const,
  byCategoria: () => [...consecutivosKeys.all, 'by-categoria'] as const,
};

export const useConsecutivos = (filters?: ConsecutivoFilters) => {
  return useQuery({
    queryKey: consecutivosKeys.list(filters),
    queryFn: () => consecutivosApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useConsecutivo = (id: number) => {
  return useQuery({
    queryKey: consecutivosKeys.detail(id),
    queryFn: () => consecutivosApi.getById(id),
    enabled: id > 0,
  });
};

export const useConsecutivosChoices = () => {
  return useQuery({
    queryKey: consecutivosKeys.choices(),
    queryFn: () => consecutivosApi.getChoices(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useConsecutivosByCategoria = () => {
  return useQuery({
    queryKey: consecutivosKeys.byCategoria(),
    queryFn: () => consecutivosApi.getByCategoria(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateConsecutivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConsecutivoDTO) => consecutivosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consecutivosKeys.all });
      toast.success('Consecutivo creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el consecutivo');
    },
  });
};

export const useUpdateConsecutivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateConsecutivoDTO }) =>
      consecutivosApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: consecutivosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: consecutivosKeys.detail(variables.id) });
      toast.success('Consecutivo actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el consecutivo');
    },
  });
};

export const useDeleteConsecutivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => consecutivosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consecutivosKeys.lists() });
      toast.success('Consecutivo eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el consecutivo');
    },
  });
};

export const useRestoreConsecutivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => consecutivosApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consecutivosKeys.all });
      toast.success('Consecutivo restaurado exitosamente');
    },
    onError: () => {
      toast.error('Error al restaurar el consecutivo');
    },
  });
};

export const useGenerarConsecutivo = () => {
  return useMutation({
    mutationFn: (codigo: string) => consecutivosApi.generar(codigo),
    onError: () => {
      toast.error('Error al generar el consecutivo');
    },
  });
};

export const usePreviewConsecutivo = () => {
  return useMutation({
    mutationFn: (params: PreviewConsecutivoParams) => consecutivosApi.preview(params),
  });
};

export const useReiniciarConsecutivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, confirmar }: { id: number; confirmar: boolean }) =>
      consecutivosApi.reiniciar(id, confirmar),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: consecutivosKeys.all });
      toast.success(result.message);
    },
    onError: () => {
      toast.error('Error al reiniciar el consecutivo');
    },
  });
};

export const useCargarConsecutivosSistema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => consecutivosApi.cargarSistema(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: consecutivosKeys.all });
      toast.success(
        `${result.message} (${result.creados} nuevos, ${result.actualizados} actualizados)`
      );
    },
    onError: () => {
      toast.error('Error al cargar los consecutivos del sistema');
    },
  });
};

// ==================== CURRENT TENANT (Admin Tenant Self-Edit) ====================

const currentTenantKeys = {
  all: ['current-tenant'] as const,
  detail: () => ['current-tenant', 'detail'] as const,
};

export const useCurrentTenant = () => {
  return useQuery<CurrentTenantData>({
    queryKey: currentTenantKeys.detail(),
    queryFn: currentTenantApi.get,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateCurrentTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData | Partial<CurrentTenantData>) => currentTenantApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentTenantKeys.all });
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      // Invalidar stats de empresa para que la card "Estado" se actualice
      queryClient.invalidateQueries({ queryKey: strategicKeys.configStats('empresa') });
      toast.success('Datos de la empresa actualizados correctamente');
    },
    onError: (error: { response?: { data?: { detail?: string } }; message?: string }) => {
      toast.error(error.response?.data?.detail || error.message || 'Error al actualizar los datos');
    },
  });
};
