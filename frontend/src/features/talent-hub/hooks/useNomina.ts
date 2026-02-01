/**
 * Hooks para Nómina - Talent Hub
 * Sistema de Gestión StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api-client';
import type {
  ConfiguracionNomina,
  ConfiguracionNominaFormData,
  ConceptoNomina,
  ConceptoNominaFormData,
  ConceptoNominaFilter,
  PeriodoNomina,
  PeriodoNominaFormData,
  PeriodoNominaFilter,
  LiquidacionNomina,
  LiquidacionNominaFilter,
  CalcularLiquidacionData,
  DetalleLiquidacion,
  DetalleLiquidacionFormData,
  Prestacion,
  PrestacionFormData,
  PrestacionFilter,
  PagarPrestacionData,
  PagoNomina,
  PagoNominaFormData,
  PagoNominaFilter,
  ProcesarPagoData,
} from '../types';

const BASE_URL = '/api/v1/talent-hub/nomina';

// ============== QUERY KEYS ==============

export const nominaKeys = {
  all: ['nomina'] as const,
  configuracion: {
    all: () => [...nominaKeys.all, 'configuracion'] as const,
    current: () => [...nominaKeys.configuracion.all(), 'current'] as const,
    detail: (id: number) => [...nominaKeys.configuracion.all(), 'detail', id] as const,
  },
  conceptos: {
    all: () => [...nominaKeys.all, 'conceptos'] as const,
    list: (filters?: ConceptoNominaFilter) => [...nominaKeys.conceptos.all(), 'list', filters] as const,
    detail: (id: number) => [...nominaKeys.conceptos.all(), 'detail', id] as const,
  },
  periodos: {
    all: () => [...nominaKeys.all, 'periodos'] as const,
    list: (filters?: PeriodoNominaFilter) => [...nominaKeys.periodos.all(), 'list', filters] as const,
    detail: (id: number) => [...nominaKeys.periodos.all(), 'detail', id] as const,
  },
  liquidaciones: {
    all: () => [...nominaKeys.all, 'liquidaciones'] as const,
    list: (filters?: LiquidacionNominaFilter) => [...nominaKeys.liquidaciones.all(), 'list', filters] as const,
    detail: (id: number) => [...nominaKeys.liquidaciones.all(), 'detail', id] as const,
    detalles: (liquidacionId: number) => [...nominaKeys.liquidaciones.all(), 'detalles', liquidacionId] as const,
  },
  prestaciones: {
    all: () => [...nominaKeys.all, 'prestaciones'] as const,
    list: (filters?: PrestacionFilter) => [...nominaKeys.prestaciones.all(), 'list', filters] as const,
    detail: (id: number) => [...nominaKeys.prestaciones.all(), 'detail', id] as const,
  },
  pagos: {
    all: () => [...nominaKeys.all, 'pagos'] as const,
    list: (filters?: PagoNominaFilter) => [...nominaKeys.pagos.all(), 'list', filters] as const,
    detail: (id: number) => [...nominaKeys.pagos.all(), 'detail', id] as const,
  },
};

// ============== CONFIGURACION NOMINA ==============

export const useConfiguracionNomina = () => {
  return useQuery({
    queryKey: nominaKeys.configuracion.current(),
    queryFn: async () => {
      const { data } = await api.get<ConfiguracionNomina>(`${BASE_URL}/configuracion/vigente/`);
      return data;
    },
  });
};

export const useConfiguracionNominaDetalle = (id: number, enabled = true) => {
  return useQuery({
    queryKey: nominaKeys.configuracion.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ConfiguracionNomina>(`${BASE_URL}/configuracion/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateConfiguracionNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ConfiguracionNominaFormData) => {
      const { data: response } = await api.post<ConfiguracionNomina>(`${BASE_URL}/configuracion/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.configuracion.all() });
      toast.success('Configuración de nómina creada exitosamente');
    },
    onError: () => toast.error('Error al crear la configuración de nómina'),
  });
};

export const useUpdateConfiguracionNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ConfiguracionNominaFormData> }) => {
      const { data: response } = await api.patch<ConfiguracionNomina>(`${BASE_URL}/configuracion/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.configuracion.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.configuracion.detail(id) });
      toast.success('Configuración de nómina actualizada exitosamente');
    },
    onError: () => toast.error('Error al actualizar la configuración de nómina'),
  });
};

// ============== CONCEPTOS NOMINA ==============

export const useConceptosNomina = (filters?: ConceptoNominaFilter) => {
  return useQuery({
    queryKey: nominaKeys.conceptos.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ConceptoNomina[]>(`${BASE_URL}/conceptos/`, { params: filters });
      return data;
    },
  });
};

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

export const useUpdateConceptoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ConceptoNominaFormData> }) => {
      const { data: response } = await api.patch<ConceptoNomina>(`${BASE_URL}/conceptos/${id}/`, data);
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

// ============== PERIODOS NOMINA ==============

export const usePeriodosNomina = (filters?: PeriodoNominaFilter) => {
  return useQuery({
    queryKey: nominaKeys.periodos.list(filters),
    queryFn: async () => {
      const { data } = await api.get<PeriodoNomina[]>(`${BASE_URL}/periodos/`, { params: filters });
      return data;
    },
  });
};

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

export const useUpdatePeriodoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PeriodoNominaFormData> }) => {
      const { data: response } = await api.patch<PeriodoNomina>(`${BASE_URL}/periodos/${id}/`, data);
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

export const useCerrarPeriodoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<PeriodoNomina>(`${BASE_URL}/periodos/${id}/cerrar/`);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.detail(id) });
      toast.success('Período cerrado exitosamente');
    },
    onError: () => toast.error('Error al cerrar el período'),
  });
};

// ============== LIQUIDACIONES ==============

export const useLiquidacionesNomina = (filters?: LiquidacionNominaFilter) => {
  return useQuery({
    queryKey: nominaKeys.liquidaciones.list(filters),
    queryFn: async () => {
      const { data } = await api.get<LiquidacionNomina[]>(`${BASE_URL}/liquidaciones/`, { params: filters });
      return data;
    },
  });
};

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

export const useDetallesLiquidacion = (liquidacionId: number, enabled = true) => {
  return useQuery({
    queryKey: nominaKeys.liquidaciones.detalles(liquidacionId),
    queryFn: async () => {
      const { data } = await api.get<DetalleLiquidacion[]>(`${BASE_URL}/detalles-liquidacion/`, {
        params: { liquidacion: liquidacionId },
      });
      return data;
    },
    enabled: enabled && !!liquidacionId,
  });
};

export const useCalcularLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CalcularLiquidacionData) => {
      const { data: response } = await api.post<LiquidacionNomina[]>(`${BASE_URL}/liquidaciones/calcular/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.all() });
      toast.success('Liquidaciones calculadas exitosamente');
    },
    onError: () => toast.error('Error al calcular las liquidaciones'),
  });
};

export const useAprobarLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<LiquidacionNomina>(`${BASE_URL}/liquidaciones/${id}/aprobar/`);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.detail(id) });
      toast.success('Liquidación aprobada exitosamente');
    },
    onError: () => toast.error('Error al aprobar la liquidación'),
  });
};

export const useCreateDetalleLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DetalleLiquidacionFormData) => {
      const { data: response } = await api.post<DetalleLiquidacion>(`${BASE_URL}/detalles-liquidacion/`, data);
      return response;
    },
    onSuccess: (_, { liquidacion }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.detalles(liquidacion) });
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      toast.success('Detalle agregado exitosamente');
    },
    onError: () => toast.error('Error al agregar el detalle'),
  });
};

export const useDeleteDetalleLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, liquidacionId }: { id: number; liquidacionId: number }) => {
      await api.delete(`${BASE_URL}/detalles-liquidacion/${id}/`);
      return liquidacionId;
    },
    onSuccess: (liquidacionId) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.detalles(liquidacionId) });
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      toast.success('Detalle eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el detalle'),
  });
};

// ============== PRESTACIONES ==============

export const usePrestaciones = (filters?: PrestacionFilter) => {
  return useQuery({
    queryKey: nominaKeys.prestaciones.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Prestacion[]>(`${BASE_URL}/prestaciones/`, { params: filters });
      return data;
    },
  });
};

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

export const useUpdatePrestacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PrestacionFormData> }) => {
      const { data: response } = await api.patch<Prestacion>(`${BASE_URL}/prestaciones/${id}/`, data);
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

export const usePagarPrestacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PagarPrestacionData }) => {
      const { data: response } = await api.post<Prestacion>(`${BASE_URL}/prestaciones/${id}/pagar/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.prestaciones.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.prestaciones.detail(id) });
      toast.success('Prestación pagada exitosamente');
    },
    onError: () => toast.error('Error al pagar la prestación'),
  });
};

export const useConsignarPrestacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { entidad_consignacion: string; numero_radicado: string } }) => {
      const { data: response } = await api.post<Prestacion>(`${BASE_URL}/prestaciones/${id}/consignar/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.prestaciones.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.prestaciones.detail(id) });
      toast.success('Prestación consignada exitosamente');
    },
    onError: () => toast.error('Error al consignar la prestación'),
  });
};

// ============== PAGOS NOMINA ==============

export const usePagosNomina = (filters?: PagoNominaFilter) => {
  return useQuery({
    queryKey: nominaKeys.pagos.list(filters),
    queryFn: async () => {
      const { data } = await api.get<PagoNomina[]>(`${BASE_URL}/pagos/`, { params: filters });
      return data;
    },
  });
};

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

export const useCreatePagoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PagoNominaFormData) => {
      const { data: response } = await api.post<PagoNomina>(`${BASE_URL}/pagos/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.pagos.all() });
      toast.success('Pago de nómina creado exitosamente');
    },
    onError: () => toast.error('Error al crear el pago de nómina'),
  });
};

export const useUpdatePagoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PagoNominaFormData> }) => {
      const { data: response } = await api.patch<PagoNomina>(`${BASE_URL}/pagos/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.pagos.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.pagos.detail(id) });
      toast.success('Pago de nómina actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el pago de nómina'),
  });
};

export const useProcesarPagoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: ProcesarPagoData }) => {
      const { data: response } = await api.post<PagoNomina>(`${BASE_URL}/pagos/${id}/procesar/`, data || {});
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.pagos.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.pagos.detail(id) });
      queryClient.invalidateQueries({ queryKey: nominaKeys.periodos.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.liquidaciones.all() });
      toast.success('Pago procesado exitosamente');
    },
    onError: () => toast.error('Error al procesar el pago'),
  });
};

export const useAnularPagoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      const { data: response } = await api.post<PagoNomina>(`${BASE_URL}/pagos/${id}/anular/`, { observaciones: motivo });
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: nominaKeys.pagos.all() });
      queryClient.invalidateQueries({ queryKey: nominaKeys.pagos.detail(id) });
      toast.success('Pago anulado exitosamente');
    },
    onError: () => toast.error('Error al anular el pago'),
  });
};

export const useGenerarArchivoPlano = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.get(`${BASE_URL}/pagos/${id}/archivo_plano/`, {
        responseType: 'blob',
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Archivo plano generado exitosamente');
    },
    onError: () => toast.error('Error al generar el archivo plano'),
  });
};
