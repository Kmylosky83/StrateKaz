/**
 * React Query Hooks para el módulo de Dirección Estratégica
 * Sistema de Gestión StrateKaz
 *
 * REFACTORIZADO (Sprint 18): Usa createCrudHooks factory para reducir boilerplate
 * Antes: ~1400 líneas de hooks manuales | Después: ~500 líneas con factory
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createQueryKeys } from '@/lib/query-keys';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
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
  unidadesMedidaApi,
  consecutivosApi,
} from '../api/strategicApi';
import type {
  CorporateIdentity,
  CreateCorporateIdentityDTO,
  UpdateCorporateIdentityDTO,
  CorporateValue,
  CreateCorporateValueDTO,
  UpdateCorporateValueDTO,
  StrategicPlan,
  CreateStrategicPlanDTO,
  UpdateStrategicPlanDTO,
  StrategicObjective,
  CreateStrategicObjectiveDTO,
  UpdateStrategicObjectiveDTO,
  UpdateProgressDTO,
  SystemModule,
  CreateSystemModuleDTO,
  UpdateSystemModuleDTO,
  ToggleModuleDTO,
  CreateBrandingConfigDTO,
  UpdateBrandingConfigDTO,
  ObjectiveFilters,
  ModuleFilters,
  SedeEmpresa,
  CreateSedeEmpresaDTO,
  UpdateSedeEmpresaDTO,
  SedeFilters,
  IntegracionExterna,
  CreateIntegracionDTO,
  UpdateIntegracionDTO,
  UpdateCredencialesDTO,
  IntegracionFilters,
  IntegracionLogsFilters,
  AlcanceSistema,
  CreateAlcanceSistemaDTO,
  UpdateAlcanceSistemaDTO,
  AlcanceSistemaFilters,
} from '../types/strategic.types';
import type { NormaISO, CreateNormaISODTO, UpdateNormaISODTO } from '../api/strategicApi';
import type {
  UnidadMedida,
  CreateUnidadMedidaDTO,
  UpdateUnidadMedidaDTO,
  UnidadMedidaFilters,
  ConsecutivoConfig,
  CreateConsecutivoDTO,
  UpdateConsecutivoDTO,
  ConsecutivoFilters,
} from '../api/strategicApi';
import type { CurrentTenantData } from '../api/strategicApi';

// ==================== QUERY KEYS (usando createQueryKeys) ====================

const identityKeys = createQueryKeys('identities');
const valueKeys = createQueryKeys('values');
const planKeys = createQueryKeys('plans');
const objectiveKeys = createQueryKeys('objectives');
const moduleKeys = createQueryKeys('modules');
const brandingKeys = createQueryKeys('branding');
const sedeKeys = createQueryKeys('sedes');
const integracionKeys = createQueryKeys('integraciones');
const alcanceKeys = createQueryKeys('alcances');
const normaISOKeys = createQueryKeys('normas-iso');
const unidadMedidaKeys = createQueryKeys('unidades-medida');
const consecutivoKeys = createQueryKeys('consecutivos');

// Legacy keys para hooks custom que usan patrones específicos
export const strategicKeys = {
  // Identity
  identities: identityKeys.all,
  identity: (id: number) => identityKeys.detail(id),
  activeIdentity: identityKeys.custom(['active']),

  // Values
  values: (identityId?: number) => valueKeys.list({ identity: identityId }),
  value: (id: number) => valueKeys.detail(id),

  // Plans
  plans: planKeys.all,
  plan: (id: number) => planKeys.detail(id),
  activePlan: planKeys.custom(['active']),
  bscPerspectives: planKeys.custom(['bsc-perspectives']),
  isoStandards: planKeys.custom(['iso-standards']),
  periodTypes: planKeys.custom(['period-types']),

  // Objectives
  objectives: (filters?: ObjectiveFilters) => objectiveKeys.list(filters),
  objective: (id: number) => objectiveKeys.detail(id),
  objectiveStatuses: objectiveKeys.custom(['statuses']),
  normasISOChoices: objectiveKeys.custom(['normas-iso-choices']),

  // Modules
  modules: (filters?: ModuleFilters) => moduleKeys.list(filters),
  module: (id: number) => moduleKeys.detail(id),
  enabledModules: moduleKeys.custom(['enabled']),
  moduleCategories: moduleKeys.custom(['categories']),

  // Branding
  brandings: brandingKeys.all,
  branding: (id: number) => brandingKeys.detail(id),
  activeBranding: brandingKeys.custom(['active']),

  // Stats
  stats: ['strategic-stats'] as const,
  configStats: (section: string) => ['config-stats', section] as const,

  // Sedes
  sedes: (filters?: SedeFilters) => sedeKeys.list(filters),
  sede: (id: number) => sedeKeys.detail(id),
  sedePrincipal: sedeKeys.custom(['principal']),
  sedeChoices: sedeKeys.custom(['choices']),

  // Integraciones
  integraciones: (filters?: IntegracionFilters) => integracionKeys.list(filters),
  integracion: (id: number) => integracionKeys.detail(id),
  integracionLogs: (id: number, filters?: IntegracionLogsFilters) =>
    integracionKeys.custom(['logs', id, filters]),
  integracionChoices: integracionKeys.custom(['choices']),

  // Alcances del Sistema
  alcances: (filters?: AlcanceSistemaFilters) => alcanceKeys.list(filters),
  alcance: (id: number) => alcanceKeys.detail(id),
  alcancesByStandard: (identityId: number) => alcanceKeys.custom(['by-standard', identityId]),
  alcancesCertifications: (identityId: number) =>
    alcanceKeys.custom(['certifications', identityId]),

  // Normas ISO
  normasISO: normaISOKeys.all,
  normasISOByCategory: normaISOKeys.custom(['by-category']),

  // Unidades de Medida
  unidadesMedida: (filters?: UnidadMedidaFilters) => unidadMedidaKeys.list(filters),
  unidadMedida: (id: number) => unidadMedidaKeys.detail(id),
  unidadesMedidaChoices: unidadMedidaKeys.custom(['choices']),
  unidadesMedidaByCategoria: unidadMedidaKeys.custom(['by-categoria']),

  // Consecutivos
  consecutivos: (filters?: ConsecutivoFilters) => consecutivoKeys.list(filters),
  consecutivo: (id: number) => consecutivoKeys.detail(id),
  consecutivosChoices: consecutivoKeys.custom(['choices']),
  consecutivosByCategoria: consecutivoKeys.custom(['by-categoria']),
};

// ==================== CORPORATE IDENTITY (via factory) ====================

const identityHooks = createCrudHooks<
  CorporateIdentity,
  CreateCorporateIdentityDTO,
  UpdateCorporateIdentityDTO
>(identityApi, identityKeys, 'Identidad corporativa', { isFeminine: true });

export const useIdentities = identityHooks.useList;
export const useIdentity = identityHooks.useDetail;
export const useCreateIdentity = identityHooks.useCreate;
export const useDeleteIdentity = identityHooks.useDelete;

// useUpdateIdentity con lógica custom (refetch activeIdentity)
export const useUpdateIdentity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCorporateIdentityDTO }) =>
      identityApi.update(id, data),
    onSuccess: async (updatedIdentity, { id }) => {
      // Actualizar cache directamente
      queryClient.setQueryData(strategicKeys.activeIdentity, updatedIdentity);
      queryClient.setQueryData(strategicKeys.identity(id), updatedIdentity);
      queryClient.invalidateQueries({ queryKey: identityKeys.lists() });

      // Forzar refetch para garantizar consistencia
      await queryClient.refetchQueries({ queryKey: strategicKeys.activeIdentity });

      toast.success('Identidad corporativa actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la identidad corporativa');
    },
  });
};

// Custom hook: useActiveIdentity
export const useActiveIdentity = () => {
  return useQuery({
    queryKey: strategicKeys.activeIdentity,
    queryFn: identityApi.getActive,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  });
};

// ==================== CORPORATE VALUES (via factory) ====================

const valueHooks = createCrudHooks<
  CorporateValue,
  CreateCorporateValueDTO,
  UpdateCorporateValueDTO
>(valuesApi, valueKeys, 'Valor corporativo');

export const useCreateValue = valueHooks.useCreate;
export const useUpdateValue = valueHooks.useUpdate;
export const useDeleteValue = valueHooks.useDelete;

// useValues con filtro de identityId
export const useValues = (identityId?: number) => {
  return useQuery({
    queryKey: strategicKeys.values(identityId),
    queryFn: async () => {
      const response = await valuesApi.getAll(identityId ? { identity: identityId } : {});
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
  });
};

// Reorder hook (custom)
export const useReorderValues = (identityId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newOrder: CorporateValue[]) => {
      // Actualizar orden de cada valor
      await Promise.all(
        newOrder.map((value, index) =>
          valuesApi.update(value.id, { display_order: index } as UpdateCorporateValueDTO)
        )
      );
      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.values(identityId) });
      toast.success('Orden de valores actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al reordenar valores');
    },
  });
};

// ==================== STRATEGIC PLANS (via factory) ====================

const planHooks = createCrudHooks<StrategicPlan, CreateStrategicPlanDTO, UpdateStrategicPlanDTO>(
  plansApi,
  planKeys,
  'Plan estratégico'
);

export const usePlans = planHooks.useList;
export const usePlan = planHooks.useDetail;
export const useUpdatePlan = planHooks.useUpdate;
export const useDeletePlan = planHooks.useDelete;

// useCreatePlan con invalidación custom (refetch activePlan tras crear)
export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStrategicPlanDTO) => plansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activePlan });
      toast.success('Plan estratégico creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el plan estratégico');
    },
  });
};

// Custom hooks
export const useActivePlan = () => {
  return useQuery({
    queryKey: strategicKeys.activePlan,
    queryFn: plansApi.getActive,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useApprovePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plansApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
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
    staleTime: 15 * 60 * 1000, // 15 minutos - datos estáticos
  });
};

export const useISOStandards = () => {
  return useQuery({
    queryKey: strategicKeys.isoStandards,
    queryFn: plansApi.getISOStandards,
    staleTime: 15 * 60 * 1000,
  });
};

export const usePeriodTypes = () => {
  return useQuery({
    queryKey: strategicKeys.periodTypes,
    queryFn: plansApi.getPeriodTypes,
    staleTime: 15 * 60 * 1000,
  });
};

// ==================== STRATEGIC OBJECTIVES (via factory) ====================

const objectiveHooks = createCrudHooks<
  StrategicObjective,
  CreateStrategicObjectiveDTO,
  UpdateStrategicObjectiveDTO
>(objectivesApi, objectiveKeys, 'Objetivo estratégico');

export const useObjectives = objectiveHooks.useList;
export const useObjective = objectiveHooks.useDetail;
export const useCreateObjective = objectiveHooks.useCreate;
export const useUpdateObjective = objectiveHooks.useUpdate;
export const useDeleteObjective = objectiveHooks.useDelete;

// Custom hooks
export const useUpdateObjectiveProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProgressDTO }) =>
      objectivesApi.updateProgress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.lists() });
      toast.success('Progreso actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar progreso');
    },
  });
};

export const useObjectiveStatuses = () => {
  return useQuery({
    queryKey: strategicKeys.objectiveStatuses,
    queryFn: objectivesApi.getStatuses,
    staleTime: 15 * 60 * 1000,
  });
};

export const useNormasISOChoices = () => {
  return useQuery({
    queryKey: strategicKeys.normasISOChoices,
    queryFn: objectivesApi.getNormasISOChoices,
    staleTime: 15 * 60 * 1000,
  });
};

// ==================== SYSTEM MODULES (via factory) ====================

const moduleHooks = createCrudHooks<SystemModule, CreateSystemModuleDTO, UpdateSystemModuleDTO>(
  modulesApi,
  moduleKeys,
  'Módulo del sistema'
);

export const useModules = moduleHooks.useList;
export const useModule = moduleHooks.useDetail;
export const useCreateModule = moduleHooks.useCreate;
export const useUpdateModule = moduleHooks.useUpdate;
export const useDeleteModule = moduleHooks.useDelete;

// Custom hooks
export const useEnabledModules = () => {
  return useQuery({
    queryKey: strategicKeys.enabledModules,
    queryFn: modulesApi.getEnabled,
    staleTime: 10 * 60 * 1000,
  });
};

export const useToggleModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
      modulesApi.toggle(id, { is_enabled: isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.enabledModules });
      toast.success('Módulo actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar módulo');
    },
  });
};

export const useModuleCategories = () => {
  return useQuery({
    queryKey: strategicKeys.moduleCategories,
    queryFn: modulesApi.getCategories,
    staleTime: 15 * 60 * 1000,
  });
};

// ==================== BRANDING CONFIG ====================

export const useActiveBranding = () => {
  return useQuery({
    queryKey: strategicKeys.activeBranding,
    queryFn: brandingApi.getActive,
    retry: (failureCount, error) => {
      // No reintentar si es 404 (sin branding configurado) o 401/403 (sin auth)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        const status = axiosError.response?.status;
        if (status === 404 || status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 2;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos - dato crítico del UI
  });
};

export const useBranding = (tenantId: number) => {
  return useQuery({
    queryKey: strategicKeys.branding(tenantId),
    queryFn: () => brandingApi.getById(tenantId),
    enabled: !!tenantId,
  });
};

export const useUpdateBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: number;
      data: UpdateBrandingConfigDTO | FormData;
    }) => brandingApi.update(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandingKeys.all });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeBranding });
      toast.success('Branding actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar branding');
    },
  });
};

// ==================== STATS ====================

export const useStrategicStats = () => {
  return useQuery({
    queryKey: strategicKeys.stats,
    queryFn: statsApi.getStats,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const useConfiguracionStats = (section: string) => {
  return useQuery({
    queryKey: strategicKeys.configStats(section),
    queryFn: () => statsApi.getConfigStats(section),
    enabled: !!section,
    staleTime: 2 * 60 * 1000,
  });
};

// ==================== SEDES EMPRESA (via factory) ====================

const sedeHooks = createCrudHooks<SedeEmpresa, CreateSedeEmpresaDTO, UpdateSedeEmpresaDTO>(
  sedesApi,
  sedeKeys,
  'Sede',
  { isFeminine: true }
);

export const useSedes = sedeHooks.useList;
export const useSede = sedeHooks.useDetail;
export const useCreateSede = sedeHooks.useCreate;
export const useUpdateSede = sedeHooks.useUpdate;
export const useDeleteSede = sedeHooks.useDelete;

// Custom hooks
export const useSedePrincipal = () => {
  return useQuery({
    queryKey: strategicKeys.sedePrincipal,
    queryFn: sedesApi.getPrincipal,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSedeChoices = () => {
  return useQuery({
    queryKey: strategicKeys.sedeChoices,
    queryFn: sedesApi.getChoices,
    staleTime: 10 * 60 * 1000,
  });
};

export const useRestoreSede = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sedesApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sedeKeys.lists() });
      toast.success('Sede restaurada exitosamente');
    },
    onError: () => {
      toast.error('Error al restaurar sede');
    },
  });
};

export const useSetSedePrincipal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sedesApi.setPrincipal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sedeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.sedePrincipal });
      toast.success('Sede principal actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar sede principal');
    },
  });
};

// ==================== INTEGRACIONES EXTERNAS (via factory) ====================

const integracionHooks = createCrudHooks<
  IntegracionExterna,
  CreateIntegracionDTO,
  UpdateIntegracionDTO
>(integracionesApi, integracionKeys, 'Integración', { isFeminine: true });

export const useIntegraciones = integracionHooks.useList;
export const useIntegracion = integracionHooks.useDetail;
export const useCreateIntegracion = integracionHooks.useCreate;
export const useUpdateIntegracion = integracionHooks.useUpdate;
export const useDeleteIntegracion = integracionHooks.useDelete;

// Custom hooks
export const useTestConnection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => integracionesApi.testConnection(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: integracionKeys.lists() });
      if (result.success) {
        toast.success(`Conexión exitosa (${result.response_time_ms ?? 0}ms)`);
      } else {
        toast.error(`Error de conexión: ${result.error || 'Desconocido'}`);
      }
    },
    onError: (error: unknown) => {
      const axiosErr = error as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error || 'Error al probar conexión';
      toast.error(msg);
    },
  });
};

export const useToggleIntegracionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => integracionesApi.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integracionKeys.lists() });
      toast.success('Estado actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
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

export const useUpdateCredentials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCredencialesDTO }) =>
      integracionesApi.updateCredentials(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integracionKeys.lists() });
      toast.success('Credenciales actualizadas exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar credenciales');
    },
  });
};

export const useIntegracionChoices = () => {
  return useQuery({
    queryKey: strategicKeys.integracionChoices,
    queryFn: integracionesApi.getChoices,
    staleTime: 10 * 60 * 1000,
  });
};

// ==================== ALCANCES DEL SISTEMA (via factory) ====================

const alcanceHooks = createCrudHooks<
  AlcanceSistema,
  CreateAlcanceSistemaDTO,
  UpdateAlcanceSistemaDTO
>(alcancesApi, alcanceKeys, 'Alcance del sistema');

export const useAlcances = alcanceHooks.useList;
export const useAlcance = alcanceHooks.useDetail;
export const useCreateAlcance = alcanceHooks.useCreate;
export const useUpdateAlcance = alcanceHooks.useUpdate;
export const useDeleteAlcance = alcanceHooks.useDelete;

// Custom hooks
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

// ==================== NORMAS ISO (via factory) ====================

const normaISOHooks = createCrudHooks<NormaISO, CreateNormaISODTO, UpdateNormaISODTO>(
  normasISOApi,
  normaISOKeys,
  'Norma ISO',
  { isFeminine: true }
);

export const useNormasISO = normaISOHooks.useList;
export const useNormaISO = normaISOHooks.useDetail;
export const useCreateNormaISO = normaISOHooks.useCreate;
export const useUpdateNormaISO = normaISOHooks.useUpdate;
export const useDeleteNormaISO = normaISOHooks.useDelete;

// Custom hooks
export const useNormasISOByCategory = () => {
  return useQuery({
    queryKey: strategicKeys.normasISOByCategory,
    queryFn: normasISOApi.getByCategory,
    staleTime: 10 * 60 * 1000,
  });
};

// ==================== UNIDADES DE MEDIDA (via factory) ====================

const unidadMedidaHooks = createCrudHooks<
  UnidadMedida,
  CreateUnidadMedidaDTO,
  UpdateUnidadMedidaDTO
>(unidadesMedidaApi, unidadMedidaKeys, 'Unidad de medida', { isFeminine: true });

export const useUnidadesMedida = unidadMedidaHooks.useList;
export const useUnidadMedida = unidadMedidaHooks.useDetail;
export const useCreateUnidadMedida = unidadMedidaHooks.useCreate;
export const useUpdateUnidadMedida = unidadMedidaHooks.useUpdate;
export const useDeleteUnidadMedida = unidadMedidaHooks.useDelete;

// Custom hooks
export const useRestoreUnidadMedida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unidadesMedidaApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unidadMedidaKeys.lists() });
      toast.success('Unidad de medida restaurada exitosamente');
    },
    onError: () => {
      toast.error('Error al restaurar unidad de medida');
    },
  });
};

export const useUnidadesMedidaChoices = () => {
  return useQuery({
    queryKey: strategicKeys.unidadesMedidaChoices,
    queryFn: unidadesMedidaApi.getChoices,
    staleTime: 15 * 60 * 1000,
  });
};

export const useUnidadesMedidaByCategoria = () => {
  return useQuery({
    queryKey: strategicKeys.unidadesMedidaByCategoria,
    queryFn: unidadesMedidaApi.getByCategoria,
    staleTime: 10 * 60 * 1000,
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
  });
};

export const useCargarUnidadesSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unidadesMedidaApi.cargarSistema,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: unidadMedidaKeys.all });
      toast.success(result.message);
    },
    onError: () => {
      toast.error('Error al cargar unidades del sistema');
    },
  });
};

// ==================== CONSECUTIVOS (via factory) ====================

const consecutivoHooks = createCrudHooks<
  ConsecutivoConfig,
  CreateConsecutivoDTO,
  UpdateConsecutivoDTO
>(consecutivosApi, consecutivoKeys, 'Consecutivo');

export const useConsecutivos = consecutivoHooks.useList;
export const useConsecutivo = consecutivoHooks.useDetail;
export const useCreateConsecutivo = consecutivoHooks.useCreate;
export const useUpdateConsecutivo = consecutivoHooks.useUpdate;
export const useDeleteConsecutivo = consecutivoHooks.useDelete;

// Custom hooks
export const useRestoreConsecutivo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => consecutivosApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consecutivoKeys.lists() });
      toast.success('Consecutivo restaurado exitosamente');
    },
    onError: () => {
      toast.error('Error al restaurar consecutivo');
    },
  });
};

export const useConsecutivosChoices = () => {
  return useQuery({
    queryKey: strategicKeys.consecutivosChoices,
    queryFn: consecutivosApi.getChoices,
    staleTime: 15 * 60 * 1000,
  });
};

export const useConsecutivosByCategoria = () => {
  return useQuery({
    queryKey: strategicKeys.consecutivosByCategoria,
    queryFn: consecutivosApi.getByCategoria,
    staleTime: 10 * 60 * 1000,
  });
};

export const useGenerarConsecutivo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (codigo: string) => consecutivosApi.generar(codigo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consecutivoKeys.lists() });
    },
    onError: () => {
      toast.error('Error al generar consecutivo');
    },
  });
};

export const useGenerarConsecutivoPorId = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (consecutivoId: number) => consecutivosApi.generarPorId(consecutivoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consecutivoKeys.lists() });
    },
    onError: () => {
      toast.error('Error al generar consecutivo');
    },
  });
};

export const usePreviewConsecutivo = () => {
  return useMutation({
    mutationFn: consecutivosApi.preview,
  });
};

export const useReiniciarConsecutivo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmar = false }: { id: number; confirmar?: boolean }) =>
      consecutivosApi.reiniciar(id, confirmar),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: consecutivoKeys.lists() });
      toast.success(result.message);
    },
    onError: () => {
      toast.error('Error al reiniciar consecutivo');
    },
  });
};

export const useCargarConsecutivosSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: consecutivosApi.cargarSistema,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: consecutivoKeys.lists() });
      toast.success(result.message);
    },
    onError: () => {
      toast.error('Error al cargar consecutivos del sistema');
    },
  });
};

// ==================== CURRENT TENANT ====================

export const useCurrentTenant = () => {
  return useQuery({
    queryKey: ['current-tenant'] as const,
    queryFn: currentTenantApi.get,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateCurrentTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData | Partial<CurrentTenantData>) => currentTenantApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-tenant'] });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeBranding });
      toast.success('Información de la empresa actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar información de la empresa');
    },
  });
};
