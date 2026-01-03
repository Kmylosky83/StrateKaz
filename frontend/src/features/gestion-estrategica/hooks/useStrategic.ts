/**
 * React Query Hooks para el módulo de Dirección Estratégica
 * Sistema de Gestión StrateKaz
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  identityApi,
  valuesApi,
  plansApi,
  objectivesApi,
  modulesApi,
  brandingApi,
  categoriasDocumentoApi,
  tiposDocumentoApi,
  consecutivosApi,
  statsApi,
  sedesApi,
  integracionesApi,
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
  CreateCategoriaDocumentoDTO,
  UpdateCategoriaDocumentoDTO,
  CategoriaDocumentoFilters,
  CreateTipoDocumentoDTO,
  UpdateTipoDocumentoDTO,
  TipoDocumentoFilters,
  CreateConsecutivoConfigDTO,
  UpdateConsecutivoConfigDTO,
  GenerateConsecutivoDTO,
  ObjectiveFilters,
  ModuleFilters,
  ConsecutivoFilters,
  CreateSedeEmpresaDTO,
  UpdateSedeEmpresaDTO,
  SedeFilters,
  CreateIntegracionDTO,
  UpdateIntegracionDTO,
  UpdateCredencialesDTO,
  IntegracionFilters,
  IntegracionLogsFilters,
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

  // Categorías de Documento
  categoriasDocumento: ['categorias-documento'] as const,
  categoriaDocumento: (id: number) => ['categoria-documento', id] as const,
  categoriaDocumentoChoices: ['categoria-documento-choices'] as const,

  // Tipos de Documento
  tiposDocumento: (filters?: TipoDocumentoFilters) => ['tipos-documento', filters] as const,
  tipoDocumento: (id: number) => ['tipo-documento', id] as const,
  tiposSistema: ['tipos-documento', 'sistema'] as const,
  tiposCustom: ['tipos-documento', 'custom'] as const,
  tipoDocumentoChoices: ['tipo-documento-choices'] as const,

  // Consecutivos
  consecutivos: (filters?: ConsecutivoFilters) => ['consecutivos', filters] as const,
  consecutivo: (id: number) => ['consecutivo', id] as const,
  consecutivoChoices: ['consecutivo-choices'] as const,

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

// ==================== CATEGORIAS DE DOCUMENTO HOOKS ====================

export const useCategorias = (filters?: CategoriaDocumentoFilters) => {
  return useQuery({
    queryKey: strategicKeys.categoriasDocumento,
    queryFn: () => categoriasDocumentoApi.getAll(filters),
  });
};

export const useCategoria = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.categoriaDocumento(id),
    queryFn: () => categoriasDocumentoApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCategoria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoriaDocumentoDTO) => categoriasDocumentoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.categoriasDocumento });
      queryClient.invalidateQueries({ queryKey: strategicKeys.categoriaDocumentoChoices });
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivoChoices });
      toast.success('Categoría creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la categoría');
    },
  });
};

export const useUpdateCategoria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoriaDocumentoDTO }) =>
      categoriasDocumentoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.categoriasDocumento });
      queryClient.invalidateQueries({ queryKey: strategicKeys.categoriaDocumento(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.categoriaDocumentoChoices });
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivoChoices });
      toast.success('Categoría actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la categoría');
    },
  });
};

export const useDeleteCategoria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriasDocumentoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.categoriasDocumento });
      queryClient.invalidateQueries({ queryKey: strategicKeys.categoriaDocumentoChoices });
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivoChoices });
      toast.success('Categoría eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la categoría');
    },
  });
};

export const useCategoriasChoices = () => {
  return useQuery({
    queryKey: strategicKeys.categoriaDocumentoChoices,
    queryFn: categoriasDocumentoApi.getChoices,
    staleTime: Infinity,
  });
};

// ==================== TIPOS DE DOCUMENTO HOOKS ====================

export const useTiposDocumento = (filters?: TipoDocumentoFilters) => {
  return useQuery({
    queryKey: strategicKeys.tiposDocumento(filters),
    queryFn: () => tiposDocumentoApi.getAll(filters),
  });
};

export const useTipoDocumento = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.tipoDocumento(id),
    queryFn: () => tiposDocumentoApi.getById(id),
    enabled: !!id,
  });
};

export const useTiposSistema = () => {
  return useQuery({
    queryKey: strategicKeys.tiposSistema,
    queryFn: tiposDocumentoApi.getSistema,
  });
};

export const useTiposCustom = () => {
  return useQuery({
    queryKey: strategicKeys.tiposCustom,
    queryFn: tiposDocumentoApi.getCustom,
  });
};

export const useCreateTipoDocumento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTipoDocumentoDTO) => tiposDocumentoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.tiposDocumento() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.tiposCustom });
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivoChoices });
      toast.success('Tipo de documento creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el tipo de documento');
    },
  });
};

export const useUpdateTipoDocumento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoDocumentoDTO }) =>
      tiposDocumentoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.tiposDocumento() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.tipoDocumento(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.tiposCustom });
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivoChoices });
      toast.success('Tipo de documento actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el tipo de documento');
    },
  });
};

export const useDeleteTipoDocumento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tiposDocumentoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.tiposDocumento() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.tiposCustom });
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivoChoices });
      toast.success('Tipo de documento eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el tipo de documento');
    },
  });
};

export const useTipoDocumentoChoices = () => {
  return useQuery({
    queryKey: strategicKeys.tipoDocumentoChoices,
    queryFn: tiposDocumentoApi.getChoices,
    staleTime: Infinity,
  });
};

// ==================== CONSECUTIVOS CONFIG HOOKS ====================

export const useConsecutivos = (filters?: ConsecutivoFilters) => {
  return useQuery({
    queryKey: strategicKeys.consecutivos(filters),
    queryFn: () => consecutivosApi.getAll(filters),
  });
};

export const useConsecutivo = (id: number) => {
  return useQuery({
    queryKey: strategicKeys.consecutivo(id),
    queryFn: () => consecutivosApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateConsecutivo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConsecutivoConfigDTO) => consecutivosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivos() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.tiposDocumento() });
      toast.success('Consecutivo configurado exitosamente');
    },
    onError: () => {
      toast.error('Error al configurar el consecutivo');
    },
  });
};

export const useUpdateConsecutivo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateConsecutivoConfigDTO }) =>
      consecutivosApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivos() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivo(id) });
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
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivos() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.tiposDocumento() });
      toast.success('Consecutivo eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el consecutivo');
    },
  });
};

export const useGenerateConsecutivo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateConsecutivoDTO) => consecutivosApi.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.consecutivos() });
    },
    onError: () => {
      toast.error('Error al generar el consecutivo');
    },
  });
};

/**
 * Hook unificado para obtener todas las opciones de consecutivos
 * Retorna: tipos_documento, separators (sin areas)
 */
export const useConsecutivoChoices = () => {
  return useQuery({
    queryKey: strategicKeys.consecutivoChoices,
    queryFn: consecutivosApi.getChoices,
    staleTime: Infinity,
  });
};

/**
 * Hook para tipos de documento (extrae de choices)
 */
export const useDocumentTypes = () => {
  const { data: choices, ...rest } = useConsecutivoChoices();
  return {
    ...rest,
    data: choices?.tipos_documento,
  };
};

/**
 * Hook para separadores (extrae de choices)
 */
export const useSeparators = () => {
  const { data: choices, ...rest } = useConsecutivoChoices();
  return {
    ...rest,
    data: choices?.separators,
  };
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
