/**
 * Hooks para Nómina - Talent Hub
 * Sistema de Gestión StrateKaz
 *
 * Alineado con backend: apps/talent_hub/nomina/views.py + urls.py
 * Router: configuraciones, conceptos, periodos, liquidaciones, detalles, prestaciones, pagos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type {
  ConfiguracionNomina,
  ConfiguracionNominaList,
  ConfiguracionNominaFormData,
  ConceptoNomina,
  ConceptoNominaFormData,
  ConceptoNominaFilter,
  PeriodoNomina,
  PeriodoNominaFormData,
  PeriodoNominaFilter,
  LiquidacionNomina,
  LiquidacionNominaFormData,
  LiquidacionNominaFilter,
  DetalleLiquidacion,
  DetalleLiquidacionFormData,
  Prestacion,
  PrestacionFormData,
  PrestacionFilter,
  PagoNomina,
  PagoNominaFormData,
  PagoNominaFilter,
} from '../types';

const BASE_URL = '/talent-hub/nomina';

// ============== QUERY KEYS ==============

export const nominaKeys = {
  all: ['nomina'] as const,
  configuraciones: {
    all: () => [...nominaKeys.all, 'configuraciones'] as const,
    list: () => [...nominaKeys.configuraciones.all(), 'list'] as const,
    detail: (id: number) => [...nominaKeys.configuraciones.all(), 'detail', id] as const,
  },
  conceptos: {
    all: () => [...nominaKeys.all, 'conceptos'] as const,
    list: (filters?: ConceptoNominaFilter) =>
      [...nominaKeys.conceptos.all(), 'list', filters] as const,
    detail: (id: number) => [...nominaKeys.conceptos.all(), 'detail', id] as const,
  },
  periodos: {
    all: () => [...nominaKeys.all, 'periodos'] as const,
    list: (filters?: PeriodoNominaFilter) =>
      [...nominaKeys.periodos.all(), 'list', filters] as const,
    detail: (id: number) => [...nominaKeys.periodos.all(), 'detail', id] as const,
    estadisticas: (id: number) => [...nominaKeys.periodos.all(), 'estadisticas', id] as const,
  },
  liquidaciones: {
    all: () => [...nominaKeys.all, 'liquidaciones'] as const,
    list: (filters?: LiquidacionNominaFilter) =>
      [...nominaKeys.liquidaciones.all(), 'list', filters] as const,
    detail: (id: number) => [...nominaKeys.liquidaciones.all(), 'detail', id] as const,
  },
  detalles: {
    all: () => [...nominaKeys.all, 'detalles'] as const,
    byLiquidacion: (liquidacionId: number) =>
      [...nominaKeys.detalles.all(), 'liquidacion', liquidacionId] as const,
  },
  prestaciones: {
    all: () => [...nominaKeys.all, 'prestaciones'] as const,
    list: (filters?: PrestacionFilter) =>
      [...nominaKeys.prestaciones.all(), 'list', filters] as const,
    detail: (id: number) => [...nominaKeys.prestaciones.all(), 'detail', id] as const,
  },
  pagos: {
    all: () => [...nominaKeys.all, 'pagos'] as const,
    list: (filters?: PagoNominaFilter) => [...nominaKeys.pagos.all(), 'list', filters] as const,
    detail: (id: number) => [...nominaKeys.pagos.all(), 'detail', id] as const,
  },
};

// ============== CONFIGURACION NOMINA ==============

/** GET /configuraciones/ — lista todas */
export const useConfiguracionesNomina = () => {
  return useQuery({
    queryKey: nominaKeys.configuraciones.list(),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/configuraciones/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ConfiguracionNominaList[];
    },
  });
};

/** GET /configuraciones/:id/ — detalle */
export const useConfiguracionNomina = (id: number, enabled = true) => {
  return useQuery({
    queryKey: nominaKeys.configuraciones.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ConfiguracionNomina>(`${BASE_URL}/configuraciones/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

/** POST /configuraciones/ */
export const useCreateConfiguracionNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ConfiguracionNominaFormData) => {
      const { data: response } = await api.post<ConfiguracionNomina>(
        `${BASE_URL}/configuraciones/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.configuraciones.all() });
      toast.success('Configuración de nómina creada exitosamente');
    },
    onError: () => toast.error('Error al crear la configuración de nómina'),
  });
};

/** PATCH /configuraciones/:id/ */
export const useUpdateConfiguracionNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<ConfiguracionNominaFormData>;
    }) => {
      const { data: response } = await api.patch<ConfiguracionNomina>(
        `${BASE_URL}/configuraciones/${id}/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.configuraciones.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.configuraciones.detail(id) });
      toast.success('Configuración de nómina actualizada exitosamente');
    },
    onError: () => toast.error('Error al actualizar la configuración de nómina'),
  });
};

// ============== CONCEPTOS NOMINA ==============

/** GET /conceptos/ */
export const useConceptosNomina = (filters?: ConceptoNominaFilter) => {
  return useQuery({
    queryKey: nominaKeys.conceptos.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/conceptos/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ConceptoNomina[];
    },
  });
};

/** GET /conceptos/:id/ */
export const useConceptoNomina = (id: number, enabled = true) => {
  return useQuery({
    queryKey: nominaKeys.conceptos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ConceptoNomina>(`${BASE_URL}/conceptos/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

/** POST /conceptos/ */
export const useCreateConceptoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ConceptoNominaFormData) => {
      const { data: response } = await api.post<ConceptoNomina>(`${BASE_URL}/conceptos/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.conceptos.all() });
      toast.success('Concepto de nómina creado exitosamente');
    },
    onError: () => toast.error('Error al crear el concepto de nómina'),
  });
};

/** PATCH /conceptos/:id/ */
export const useUpdateConceptoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ConceptoNominaFormData> }) => {
      const { data: response } = await api.patch<ConceptoNomina>(
        `${BASE_URL}/conceptos/${id}/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.conceptos.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.conceptos.detail(id) });
      toast.success('Concepto de nómina actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el concepto de nómina'),
  });
};

/** DELETE /conceptos/:id/ */
export const useDeleteConceptoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/conceptos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.conceptos.all() });
      toast.success('Concepto de nómina eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el concepto de nómina'),
  });
};

/** GET /conceptos/devengados/ */
export const useConceptosDevengados = () => {
  return useQuery({
    queryKey: [...nominaKeys.conceptos.all(), 'devengados'] as const,
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/conceptos/devengados/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ConceptoNomina[];
    },
  });
};

/** GET /conceptos/deducciones/ */
export const useConceptosDeducciones = () => {
  return useQuery({
    queryKey: [...nominaKeys.conceptos.all(), 'deducciones'] as const,
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/conceptos/deducciones/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ConceptoNomina[];
    },
  });
};

// ============== PERIODOS NOMINA ==============

/** GET /periodos/ */
export const usePeriodosNomina = (filters?: PeriodoNominaFilter) => {
  return useQuery({
    queryKey: nominaKeys.periodos.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/periodos/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as PeriodoNomina[];
    },
  });
};

/** GET /periodos/:id/ */
export const usePeriodoNomina = (id: number, enabled = true) => {
  return useQuery({
    queryKey: nominaKeys.periodos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<PeriodoNomina>(`${BASE_URL}/periodos/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

/** POST /periodos/ */
export const useCreatePeriodoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PeriodoNominaFormData) => {
      const { data: response } = await api.post<PeriodoNomina>(`${BASE_URL}/periodos/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.all() });
      toast.success('Período de nómina creado exitosamente');
    },
    onError: () => toast.error('Error al crear el período de nómina'),
  });
};

/** PATCH /periodos/:id/ */
export const useUpdatePeriodoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PeriodoNominaFormData> }) => {
      const { data: response } = await api.patch<PeriodoNomina>(
        `${BASE_URL}/periodos/${id}/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.detail(id) });
      toast.success('Período de nómina actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el período de nómina'),
  });
};

/** POST /periodos/:id/preliquidar/ */
export const usePreliquidarPeriodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<PeriodoNomina>(`${BASE_URL}/periodos/${id}/preliquidar/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.detail(id) });
      toast.success('Período preliquidado exitosamente');
    },
    onError: () => toast.error('Error al preliquidar el período'),
  });
};

/** POST /periodos/:id/cerrar_periodo/ */
export const useCerrarPeriodoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<{ message: string; periodo: PeriodoNomina }>(
        `${BASE_URL}/periodos/${id}/cerrar_periodo/`
      );
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.detail(id) });
      toast.success('Período cerrado exitosamente');
    },
    onError: () => toast.error('Error al cerrar el período'),
  });
};

/** GET /periodos/:id/estadisticas/ */
export const useEstadisticasPeriodo = (id: number, enabled = true) => {
  return useQuery({
    queryKey: nominaKeys.periodos.estadisticas(id),
    queryFn: async () => {
      const { data } = await api.get(`${BASE_URL}/periodos/${id}/estadisticas/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

// ============== LIQUIDACIONES ==============

/** GET /liquidaciones/ */
export const useLiquidacionesNomina = (filters?: LiquidacionNominaFilter) => {
  return useQuery({
    queryKey: nominaKeys.liquidaciones.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/liquidaciones/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as LiquidacionNomina[];
    },
  });
};

/** GET /liquidaciones/:id/ (detail with nested detalles) */
export const useLiquidacionNomina = (id: number, enabled = true) => {
  return useQuery({
    queryKey: nominaKeys.liquidaciones.detail(id),
    queryFn: async () => {
      const { data } = await api.get<LiquidacionNomina>(`${BASE_URL}/liquidaciones/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

/** POST /liquidaciones/ (with nested detalles) */
export const useCreateLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LiquidacionNominaFormData) => {
      const { data: response } = await api.post<LiquidacionNomina>(
        `${BASE_URL}/liquidaciones/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.all() });
      toast.success('Liquidación creada exitosamente');
    },
    onError: () => toast.error('Error al crear la liquidación'),
  });
};

/** POST /liquidaciones/:id/aprobar/ */
export const useAprobarLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<{ message: string; liquidacion: LiquidacionNomina }>(
        `${BASE_URL}/liquidaciones/${id}/aprobar/`
      );
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.detail(id) });
      toast.success('Liquidación aprobada exitosamente');
    },
    onError: () => toast.error('Error al aprobar la liquidación'),
  });
};

/** POST /liquidaciones/:id/pagar/ */
export const usePagarLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<{ message: string; liquidacion: LiquidacionNomina }>(
        `${BASE_URL}/liquidaciones/${id}/pagar/`
      );
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.detail(id) });
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.all() });
      toast.success('Liquidación marcada como pagada');
    },
    onError: () => toast.error('Error al marcar la liquidación como pagada'),
  });
};

/** POST /liquidaciones/:id/recalcular/ */
export const useRecalcularLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<{ message: string; liquidacion: LiquidacionNomina }>(
        `${BASE_URL}/liquidaciones/${id}/recalcular/`
      );
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.detail(id) });
      toast.success('Totales recalculados exitosamente');
    },
    onError: () => toast.error('Error al recalcular la liquidación'),
  });
};

// ============== DETALLES DE LIQUIDACION ==============

/** GET /detalles/?liquidacion=:id */
export const useDetallesLiquidacion = (liquidacionId: number, enabled = true) => {
  return useQuery({
    queryKey: nominaKeys.detalles.byLiquidacion(liquidacionId),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/detalles/`, {
        params: { liquidacion: liquidacionId },
      });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as DetalleLiquidacion[];
    },
    enabled: enabled && !!liquidacionId,
  });
};

/** POST /detalles/ (for adding a line to a liquidacion) */
export const useCreateDetalleLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      liquidacionId,
      data,
    }: {
      liquidacionId: number;
      data: DetalleLiquidacionFormData;
    }) => {
      // Backend expects: concepto, cantidad, valor_unitario, observaciones
      // liquidacion FK is set via URL or form field — we post to /detalles/ endpoint
      const { data: response } = await api.post<DetalleLiquidacion>(`${BASE_URL}/detalles/`, {
        ...data,
        liquidacion: liquidacionId,
      });
      return response;
    },
    onSuccess: (_, { liquidacionId }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.detalles.byLiquidacion(liquidacionId) });
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      toast.success('Detalle agregado exitosamente');
    },
    onError: () => toast.error('Error al agregar el detalle'),
  });
};

/** DELETE /detalles/:id/ */
export const useDeleteDetalleLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, liquidacionId }: { id: number; liquidacionId: number }) => {
      await api.delete(`${BASE_URL}/detalles/${id}/`);
      return liquidacionId;
    },
    onSuccess: (liquidacionId) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.detalles.byLiquidacion(liquidacionId) });
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      toast.success('Detalle eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el detalle'),
  });
};

// ============== PRESTACIONES ==============

/** GET /prestaciones/ */
export const usePrestaciones = (filters?: PrestacionFilter) => {
  return useQuery({
    queryKey: nominaKeys.prestaciones.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/prestaciones/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Prestacion[];
    },
  });
};

/** GET /prestaciones/:id/ */
export const usePrestacion = (id: number, enabled = true) => {
  return useQuery({
    queryKey: nominaKeys.prestaciones.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Prestacion>(`${BASE_URL}/prestaciones/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

/** POST /prestaciones/ */
export const useCreatePrestacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PrestacionFormData) => {
      const { data: response } = await api.post<Prestacion>(`${BASE_URL}/prestaciones/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.prestaciones.all() });
      toast.success('Prestación creada exitosamente');
    },
    onError: () => toast.error('Error al crear la prestación'),
  });
};

/** PATCH /prestaciones/:id/ */
export const useUpdatePrestacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PrestacionFormData> }) => {
      const { data: response } = await api.patch<Prestacion>(
        `${BASE_URL}/prestaciones/${id}/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.prestaciones.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.prestaciones.detail(id) });
      toast.success('Prestación actualizada exitosamente');
    },
    onError: () => toast.error('Error al actualizar la prestación'),
  });
};

/** DELETE /prestaciones/:id/ */
export const useDeletePrestacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/prestaciones/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.prestaciones.all() });
      toast.success('Prestación eliminada exitosamente');
    },
    onError: () => toast.error('Error al eliminar la prestación'),
  });
};

// ============== PAGOS NOMINA ==============

/** GET /pagos/ */
export const usePagosNomina = (filters?: PagoNominaFilter) => {
  return useQuery({
    queryKey: nominaKeys.pagos.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/pagos/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as PagoNomina[];
    },
  });
};

/** GET /pagos/:id/ */
export const usePagoNomina = (id: number, enabled = true) => {
  return useQuery({
    queryKey: nominaKeys.pagos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<PagoNomina>(`${BASE_URL}/pagos/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

/** POST /pagos/ */
export const useCreatePagoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PagoNominaFormData) => {
      const { data: response } = await api.post<PagoNomina>(`${BASE_URL}/pagos/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.pagos.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      toast.success('Pago registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar el pago'),
  });
};

/** DELETE /pagos/:id/ */
export const useDeletePagoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/pagos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.pagos.all() });
      toast.success('Pago eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el pago'),
  });
};
