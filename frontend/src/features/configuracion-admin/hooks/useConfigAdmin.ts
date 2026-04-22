/**
 * Hooks para Configuración de Plataforma
 *
 * Usa createApiClient + createCrudHooks para generar hooks CRUD tipados.
 * NO importa de features/gestion-estrategica para evitar dependencia cross-feature.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createApiClient } from '@/lib/api-factory';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import { createQueryKeys } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import type {
  SystemModuleItem,
  UnidadMedida,
  CreateUnidadMedidaDTO,
  UpdateUnidadMedidaDTO,
  TipoContrato,
  CreateTipoContratoDTO,
  UpdateTipoContratoDTO,
  IntegracionExterna,
  CreateIntegracionDTO,
  UpdateIntegracionDTO,
  TipoDocumentoIdentidad,
  CreateTipoDocumentoIdentidadDTO,
  UpdateTipoDocumentoIdentidadDTO,
  NormaISOConfig,
  CreateNormaISOConfigDTO,
  UpdateNormaISOConfigDTO,
  TipoEPP,
  CreateTipoEPPDTO,
  UpdateTipoEPPDTO,
  TipoExamen,
  CreateTipoExamenDTO,
  UpdateTipoExamenDTO,
  TipoInspeccion,
  CreateTipoInspeccionDTO,
  UpdateTipoInspeccionDTO,
  TipoResiduo,
  CreateTipoResiduoDTO,
  UpdateTipoResiduoDTO,
  FormaPago,
  CreateFormaPagoDTO,
  UpdateFormaPagoDTO,
  Departamento,
  CreateDepartamentoDTO,
  UpdateDepartamentoDTO,
  Ciudad,
  CreateCiudadDTO,
  UpdateCiudadDTO,
} from '../types/config-admin.types';

// ══════════════════════════════════════════════════════════════
// Query Keys
// ══════════════════════════════════════════════════════════════

const systemModulesKeys = createQueryKeys('system-modules');
const unidadesMedidaKeys = createQueryKeys('unidades-medida-config');
const tiposContratoKeys = createQueryKeys('tipos-contrato-config');
const integracionesKeys = createQueryKeys('integraciones-config');
const tiposDocumentoKeys = createQueryKeys('tipos-documento-config');
const normasISOKeys = createQueryKeys('normas-iso-config');
const tiposEPPKeys = createQueryKeys('tipos-epp-config');
const tiposExamenKeys = createQueryKeys('tipos-examen-config');
const tiposInspeccionKeys = createQueryKeys('tipos-inspeccion-config');
const tiposResiduoKeys = createQueryKeys('tipos-residuo-config');
const formasPagoKeys = createQueryKeys('formas-pago-config');
// Catálogos de Plataforma (C0) — geografía DIVIPOLA
const departamentosKeys = createQueryKeys('departamentos-config');
const ciudadesKeys = createQueryKeys('ciudades-config');

// ══════════════════════════════════════════════════════════════
// API Clients
// ══════════════════════════════════════════════════════════════

// Post-consolidacion S7: source-of-truth es catalogo_productos (CT-layer).
const unidadesMedidaApi = createApiClient<
  UnidadMedida,
  CreateUnidadMedidaDTO,
  UpdateUnidadMedidaDTO
>('/catalogo-productos', 'unidades-medida');

const tiposContratoApi = createApiClient<
  TipoContrato,
  CreateTipoContratoDTO,
  UpdateTipoContratoDTO
>('/gestion-estrategica/configuracion', 'contratos-tipo');

const integracionesApi = createApiClient<
  IntegracionExterna,
  CreateIntegracionDTO,
  UpdateIntegracionDTO
>('/gestion-estrategica/configuracion', 'integraciones-externas');

const tiposDocumentoApi = createApiClient<
  TipoDocumentoIdentidad,
  CreateTipoDocumentoIdentidadDTO,
  UpdateTipoDocumentoIdentidadDTO
>('/core', 'tipos-documento');

const normasISOApi = createApiClient<
  NormaISOConfig,
  CreateNormaISOConfigDTO,
  UpdateNormaISOConfigDTO
>('/gestion-estrategica/configuracion', 'normas-iso');

const tiposEPPApi = createApiClient<TipoEPP, CreateTipoEPPDTO, UpdateTipoEPPDTO>(
  '/hseq/seguridad',
  'tipos-epp'
);

const tiposExamenApi = createApiClient<TipoExamen, CreateTipoExamenDTO, UpdateTipoExamenDTO>(
  '/hseq/medicina',
  'tipos-examen'
);

const tiposInspeccionApi = createApiClient<
  TipoInspeccion,
  CreateTipoInspeccionDTO,
  UpdateTipoInspeccionDTO
>('/hseq/seguridad', 'tipos-inspeccion');

const tiposResiduoApi = createApiClient<TipoResiduo, CreateTipoResiduoDTO, UpdateTipoResiduoDTO>(
  '/hseq/ambiental',
  'tipos-residuos'
);

const formasPagoApi = createApiClient<FormaPago, CreateFormaPagoDTO, UpdateFormaPagoDTO>(
  '/supply-chain',
  'formas-pago'
);

// Catálogos de Plataforma (C0) — geografía DIVIPOLA canónica (apps.core).
const departamentosApi = createApiClient<
  Departamento,
  CreateDepartamentoDTO,
  UpdateDepartamentoDTO
>('/core', 'departamentos');
const ciudadesApi = createApiClient<Ciudad, CreateCiudadDTO, UpdateCiudadDTO>('/core', 'ciudades');

// ══════════════════════════════════════════════════════════════
// CRUD Hooks via Factory
// ══════════════════════════════════════════════════════════════

// consecutivosHooks eliminado 2026-04-22 — UI tenant removida. Códigos se
// autogeneran en cada modelo via apps/core/utils/consecutivos.py (Sistema A).
const unidadesMedidaHooks = createCrudHooks(
  unidadesMedidaApi,
  unidadesMedidaKeys,
  'Unidad de medida',
  { isFeminine: true }
);
const tiposContratoHooks = createCrudHooks(tiposContratoApi, tiposContratoKeys, 'Tipo de contrato');
const integracionesHooks = createCrudHooks(integracionesApi, integracionesKeys, 'Integración', {
  isFeminine: true,
});
const tiposDocumentoHooks = createCrudHooks(
  tiposDocumentoApi,
  tiposDocumentoKeys,
  'Tipo de documento'
);
const normasISOHooks = createCrudHooks(normasISOApi, normasISOKeys, 'Norma ISO', {
  isFeminine: true,
});
const tiposEPPHooks = createCrudHooks(tiposEPPApi, tiposEPPKeys, 'Tipo de EPP');
const tiposExamenHooks = createCrudHooks(tiposExamenApi, tiposExamenKeys, 'Tipo de examen');
const tiposInspeccionHooks = createCrudHooks(
  tiposInspeccionApi,
  tiposInspeccionKeys,
  'Tipo de inspección',
  { isFeminine: true }
);
const tiposResiduoHooks = createCrudHooks(tiposResiduoApi, tiposResiduoKeys, 'Tipo de residuo');
const formasPagoHooks = createCrudHooks(formasPagoApi, formasPagoKeys, 'Forma de pago', {
  isFeminine: true,
});
const departamentosHooks = createCrudHooks(departamentosApi, departamentosKeys, 'Departamento');
const ciudadesHooks = createCrudHooks(ciudadesApi, ciudadesKeys, 'Ciudad', { isFeminine: true });

// Exports de Consecutivos eliminados 2026-04-22 — ver nota arriba.

// ══════════════════════════════════════════════════════════════
// Exports: Unidades de Medida
// ══════════════════════════════════════════════════════════════

export const useUnidadesMedidaConfig = unidadesMedidaHooks.useList;
export const useUnidadMedidaConfig = unidadesMedidaHooks.useDetail;
export const useCreateUnidadMedida = unidadesMedidaHooks.useCreate;
export const useUpdateUnidadMedida = unidadesMedidaHooks.useUpdate;
export const useDeleteUnidadMedida = unidadesMedidaHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Tipos de Contrato
// ══════════════════════════════════════════════════════════════

export const useTiposContratoConfig = tiposContratoHooks.useList;
export const useTipoContratoConfig = tiposContratoHooks.useDetail;
export const useCreateTipoContrato = tiposContratoHooks.useCreate;
export const useUpdateTipoContrato = tiposContratoHooks.useUpdate;
export const useDeleteTipoContrato = tiposContratoHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Integraciones
// ══════════════════════════════════════════════════════════════

export const useIntegracionesConfig = integracionesHooks.useList;
export const useIntegracionConfig = integracionesHooks.useDetail;
export const useCreateIntegracion = integracionesHooks.useCreate;
export const useUpdateIntegracion = integracionesHooks.useUpdate;
export const useDeleteIntegracion = integracionesHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Tipos de Documento de Identidad
// ══════════════════════════════════════════════════════════════

export const useTiposDocumentoConfig = tiposDocumentoHooks.useList;
export const useTipoDocumentoConfig = tiposDocumentoHooks.useDetail;
export const useCreateTipoDocumento = tiposDocumentoHooks.useCreate;
export const useUpdateTipoDocumento = tiposDocumentoHooks.useUpdate;
export const useDeleteTipoDocumento = tiposDocumentoHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Normas ISO
// ══════════════════════════════════════════════════════════════

export const useNormasISOConfig = normasISOHooks.useList;
export const useNormaISOConfig = normasISOHooks.useDetail;
export const useCreateNormaISO = normasISOHooks.useCreate;
export const useUpdateNormaISO = normasISOHooks.useUpdate;
export const useDeleteNormaISO = normasISOHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Tipos de EPP
// ══════════════════════════════════════════════════════════════

export const useTiposEPPConfig = tiposEPPHooks.useList;
export const useTipoEPPConfig = tiposEPPHooks.useDetail;
export const useCreateTipoEPP = tiposEPPHooks.useCreate;
export const useUpdateTipoEPP = tiposEPPHooks.useUpdate;
export const useDeleteTipoEPP = tiposEPPHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Tipos de Examen Médico
// ══════════════════════════════════════════════════════════════

export const useTiposExamenConfig = tiposExamenHooks.useList;
export const useTipoExamenConfig = tiposExamenHooks.useDetail;
export const useCreateTipoExamen = tiposExamenHooks.useCreate;
export const useUpdateTipoExamen = tiposExamenHooks.useUpdate;
export const useDeleteTipoExamen = tiposExamenHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Tipos de Inspección
// ══════════════════════════════════════════════════════════════

export const useTiposInspeccionConfig = tiposInspeccionHooks.useList;
export const useTipoInspeccionConfig = tiposInspeccionHooks.useDetail;
export const useCreateTipoInspeccion = tiposInspeccionHooks.useCreate;
export const useUpdateTipoInspeccion = tiposInspeccionHooks.useUpdate;
export const useDeleteTipoInspeccion = tiposInspeccionHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Tipos de Residuo
// ══════════════════════════════════════════════════════════════

export const useTiposResiduoConfig = tiposResiduoHooks.useList;
export const useTipoResiduoConfig = tiposResiduoHooks.useDetail;
export const useCreateTipoResiduo = tiposResiduoHooks.useCreate;
export const useUpdateTipoResiduo = tiposResiduoHooks.useUpdate;
export const useDeleteTipoResiduo = tiposResiduoHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Formas de Pago
// ══════════════════════════════════════════════════════════════

export const useFormasPagoConfig = formasPagoHooks.useList;
export const useFormaPagoConfig = formasPagoHooks.useDetail;
export const useCreateFormaPago = formasPagoHooks.useCreate;
export const useUpdateFormaPago = formasPagoHooks.useUpdate;
export const useDeleteFormaPago = formasPagoHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Departamentos (Plataforma C0 — geografía DIVIPOLA)
// ══════════════════════════════════════════════════════════════

export const useDepartamentosConfig = departamentosHooks.useList;
export const useDepartamentoConfig = departamentosHooks.useDetail;
export const useCreateDepartamento = departamentosHooks.useCreate;
export const useUpdateDepartamento = departamentosHooks.useUpdate;
export const useDeleteDepartamento = departamentosHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// Exports: Ciudades (Plataforma C0 — geografía DIVIPOLA)
// ══════════════════════════════════════════════════════════════

export const useCiudadesConfig = ciudadesHooks.useList;
export const useCiudadConfig = ciudadesHooks.useDetail;
export const useCreateCiudad = ciudadesHooks.useCreate;
export const useUpdateCiudad = ciudadesHooks.useUpdate;
export const useDeleteCiudad = ciudadesHooks.useDelete;

// ══════════════════════════════════════════════════════════════
// System Modules — NOTA: useModulesTree, useToggleModule,
// useToggleTab, useToggleSection viven en @/hooks/useModules
// (fuente única). NO duplicar aquí.
// ══════════════════════════════════════════════════════════════

export function useSystemModules() {
  return useQuery<SystemModuleItem[]>({
    queryKey: systemModulesKeys.all,
    queryFn: async () => {
      const response = await apiClient.get('/core/system-modules/');
      const data = response.data;
      return Array.isArray(data) ? data : (data?.results ?? []);
    },
  });
}

// ══════════════════════════════════════════════════════════════
// Integraciones: Acciones custom
// ══════════════════════════════════════════════════════════════

export function useTestIntegrationConnection() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(
        `/gestion-estrategica/configuracion/integraciones-externas/${id}/test-connection/`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Conexión exitosa');
    },
    onError: () => {
      toast.error('Error al probar la conexión');
    },
  });
}

export function useToggleIntegrationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(
        `/gestion-estrategica/configuracion/integraciones-externas/${id}/toggle-status/`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Estado de integración actualizado');
      queryClient.invalidateQueries({ queryKey: integracionesKeys.all });
    },
    onError: () => {
      toast.error('Error al cambiar el estado de la integración');
    },
  });
}
