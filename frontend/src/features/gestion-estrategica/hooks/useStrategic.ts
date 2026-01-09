/**
 * React Query Hooks para el módulo de Dirección Estratégica
 * Sistema de Gestión StrateKaz
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
} from '../api/strategicApi';
import type {
  CreateCorporateIdentityDTO,
  UpdateCorporateIdentityDTO,
  CreateCorporateValueDTO,
  UpdateCorporateValueDTO,
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
  alcancesCertifications: (identityId: number) => ['alcances', 'certifications', identityId] as const,

  // Normas ISO (Dinámico)
  normasISO: ['normas-iso'] as const,
  normasISOChoices: ['normas-iso', 'choices'] as const,
  normasISOByCategory: ['normas-iso', 'by-category'] as const,
};

// ==================== CORPORATE IDENTITY HOOKS ====================

export const useIdentities = () => {
  return useQuery({
    queryKey: strategicKeys.identities,
    queryFn: identityApi.getAll,
  });
};

export const useActiveIdentity = () => {
  return useQuery({
    queryKey: strategicKeys.activeIdentity,
    queryFn: identityApi.getActive,
    retry: false,
  });
};

export const useIdentity = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.identity(id),
    queryFn: () => identityApi.getById(id),
    enabled: !!id,
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.identities });
      queryClient.invalidateQueries({ queryKey: strategicKeys.identity(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
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

export const useSignPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => identityApi.signPolicy(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.identity(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      toast.success('Política integral firmada exitosamente');
    },
    onError: () => {
      toast.error('Error al firmar la política integral');
    },
  });
};

// ==================== CORPORATE VALUES HOOKS ====================

export const useValues = (identityId?: number) => {
  return useQuery({
    queryKey: strategicKeys.values(identityId),
    queryFn: () => valuesApi.getAll(identityId),
  });
};

export const useCreateValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCorporateValueDTO & { identity: number }) => valuesApi.create(data),
    onSuccess: (_, { identity }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.values(identity) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.values() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.values() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
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

export const useISOStandards = () => {
  return useQuery({
    queryKey: strategicKeys.isoStandards,
    queryFn: plansApi.getISOStandards,
    staleTime: Infinity,
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
    mutationFn: ({ id, data }: { id: number; data: ToggleModuleDTO }) => modulesApi.toggle(id, data),
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

export const useBrandingConfigs = () => {
  return useQuery({
    queryKey: strategicKeys.brandings,
    queryFn: brandingApi.getAll,
  });
};

export const useActiveBranding = () => {
  // Este endpoint es público (AllowAny) - se usa en login para mostrar branding dinámico
  return useQuery({
    queryKey: strategicKeys.activeBranding,
    queryFn: brandingApi.getActive,
    retry: 1, // Un reintento en caso de error temporal
    staleTime: 5 * 60 * 1000, // 5 minutos - evitar refetch excesivo
  });
};

export const useBranding = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.branding(id),
    queryFn: () => brandingApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBrandingConfigDTO | FormData) => brandingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.brandings });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeBranding });
      toast.success('Configuración de marca creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la configuración de marca');
    },
  });
};

export const useUpdateBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBrandingConfigDTO | FormData }) =>
      brandingApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.brandings });
      queryClient.invalidateQueries({ queryKey: strategicKeys.branding(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeBranding });
      toast.success('Configuración de marca actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la configuración de marca');
    },
  });
};

export const useDeleteBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => brandingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.brandings });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeBranding });
      toast.success('Configuración de marca eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la configuración de marca');
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

export const useConfiguracionStats = (section: string) => {
  return useQuery({
    queryKey: strategicKeys.configStats(section),
    queryFn: () => statsApi.getConfigStats(section),
    enabled: !!section && section !== 'branding', // branding no tiene stats
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

// ==================== POLÍTICAS INTEGRALES HOOKS ====================

import {
  politicasIntegralesApi,
  politicasEspecificasApi,
} from '../api/strategicApi';
import type {
  CreatePoliticaIntegralDTO,
  UpdatePoliticaIntegralDTO,
  PoliticaIntegralFilters,
  CreatePoliticaEspecificaDTO,
  UpdatePoliticaEspecificaDTO,
  PoliticaEspecificaFilters,
} from '../types/strategic.types';

// Extend strategic keys for políticas
export const politicasKeys = {
  // Políticas Integrales
  integrales: (filters?: PoliticaIntegralFilters) => ['politicas-integrales', filters] as const,
  integral: (id: number) => ['politica-integral', id] as const,
  integralCurrent: (identityId: number) => ['politica-integral', 'current', identityId] as const,
  integralVersions: (identityId: number) => ['politica-integral', 'versions', identityId] as const,

  // Políticas Específicas
  especificas: (filters?: PoliticaEspecificaFilters) => ['politicas-especificas', filters] as const,
  especifica: (id: number) => ['politica-especifica', id] as const,
  especificasByStandard: ['politicas-especificas', 'by-standard'] as const,
  especificasPendingReview: ['politicas-especificas', 'pending-review'] as const,
  especificasStats: ['politicas-especificas', 'stats'] as const,
};

// --- Políticas Integrales ---

export const usePoliticasIntegrales = (filters?: PoliticaIntegralFilters) => {
  return useQuery({
    queryKey: politicasKeys.integrales(filters),
    queryFn: () => politicasIntegralesApi.getAll(filters),
  });
};

export const usePoliticaIntegral = (id: number) => {
  return useQuery({
    queryKey: politicasKeys.integral(id),
    queryFn: () => politicasIntegralesApi.getById(id),
    enabled: !!id,
  });
};

export const usePoliticaIntegralCurrent = (identityId: number) => {
  return useQuery({
    queryKey: politicasKeys.integralCurrent(identityId),
    queryFn: () => politicasIntegralesApi.getCurrent(identityId),
    enabled: !!identityId,
    retry: false,
  });
};

export const usePoliticaIntegralVersions = (identityId: number) => {
  return useQuery({
    queryKey: politicasKeys.integralVersions(identityId),
    queryFn: () => politicasIntegralesApi.getVersions(identityId),
    enabled: !!identityId,
  });
};

export const useCreatePoliticaIntegral = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePoliticaIntegralDTO) => politicasIntegralesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['politicas-integrales'] });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      toast.success('Política integral creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la política integral');
    },
  });
};

export const useUpdatePoliticaIntegral = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePoliticaIntegralDTO }) =>
      politicasIntegralesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['politicas-integrales'] });
      queryClient.invalidateQueries({ queryKey: politicasKeys.integral(id) });
      toast.success('Política integral actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la política integral');
    },
  });
};

export const useDeletePoliticaIntegral = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => politicasIntegralesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['politicas-integrales'] });
      toast.success('Política integral eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la política integral');
    },
  });
};

export const useSignPoliticaIntegral = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => politicasIntegralesApi.sign(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['politicas-integrales'] });
      queryClient.invalidateQueries({ queryKey: politicasKeys.integral(id) });
      toast.success('Política integral firmada exitosamente');
    },
    onError: () => {
      toast.error('Error al firmar la política integral');
    },
  });
};

export const usePublishPoliticaIntegral = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => politicasIntegralesApi.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['politicas-integrales'] });
      queryClient.invalidateQueries({ queryKey: politicasKeys.integral(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      toast.success('Política integral publicada exitosamente');
    },
    onError: () => {
      toast.error('Error al publicar la política integral');
    },
  });
};

// --- Políticas Específicas ---

export const usePoliticasEspecificas = (filters?: PoliticaEspecificaFilters) => {
  return useQuery({
    queryKey: politicasKeys.especificas(filters),
    queryFn: () => politicasEspecificasApi.getAll(filters),
  });
};

export const usePoliticaEspecifica = (id: number) => {
  return useQuery({
    queryKey: politicasKeys.especifica(id),
    queryFn: () => politicasEspecificasApi.getById(id),
    enabled: !!id,
  });
};

export const usePoliticasByStandard = () => {
  return useQuery({
    queryKey: politicasKeys.especificasByStandard,
    queryFn: () => politicasEspecificasApi.getByStandard(),
  });
};

export const usePoliticasPendingReview = () => {
  return useQuery({
    queryKey: politicasKeys.especificasPendingReview,
    queryFn: () => politicasEspecificasApi.getPendingReview(),
  });
};

export const usePoliticasStats = () => {
  return useQuery({
    queryKey: politicasKeys.especificasStats,
    queryFn: () => politicasEspecificasApi.getStats(),
  });
};

export const useCreatePoliticaEspecifica = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePoliticaEspecificaDTO) => politicasEspecificasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['politicas-especificas'] });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      toast.success('Política específica creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la política específica');
    },
  });
};

export const useUpdatePoliticaEspecifica = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePoliticaEspecificaDTO }) =>
      politicasEspecificasApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['politicas-especificas'] });
      queryClient.invalidateQueries({ queryKey: politicasKeys.especifica(id) });
      toast.success('Política específica actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la política específica');
    },
  });
};

export const useDeletePoliticaEspecifica = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => politicasEspecificasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['politicas-especificas'] });
      toast.success('Política específica eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la política específica');
    },
  });
};

export const useApprovePoliticaEspecifica = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => politicasEspecificasApi.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['politicas-especificas'] });
      queryClient.invalidateQueries({ queryKey: politicasKeys.especifica(id) });
      toast.success('Política específica aprobada exitosamente');
    },
    onError: () => {
      toast.error('Error al aprobar la política específica');
    },
  });
};

// --- Reorder Values (for Drag & Drop) ---

export const useReorderValues = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newOrder: { id: number; orden: number }[]) => {
      // Update each value's order
      await Promise.all(
        newOrder.map(({ id, orden }) =>
          valuesApi.update(id, { orden })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.values() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      toast.success('Orden de valores actualizado');
    },
    onError: () => {
      toast.error('Error al reordenar los valores');
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
