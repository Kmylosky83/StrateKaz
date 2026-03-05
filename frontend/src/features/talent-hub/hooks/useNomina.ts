/**
 * Hooks para Nomina - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Refactored to use createCrudHooks / createApiClient / thKeys factories.
 * Alineado con backend: apps/talent_hub/nomina/views.py + urls.py
 * Router: configuraciones, conceptos, periodos, liquidaciones, detalles, prestaciones, pagos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import {
  configuracionNominaApi,
  configuracionNominaListApi,
  conceptoNominaApi,
  periodoNominaApi,
  liquidacionNominaApi,
  prestacionApi,
  pagoNominaApi,
} from '../api/talentHubApi';
import { thKeys } from '../api/queryKeys';
import type {
  ConceptoNomina,
  ConceptoNominaFilter,
  PeriodoNomina,
  PeriodoNominaFilter,
  LiquidacionNomina,
  LiquidacionNominaFilter,
  DetalleLiquidacion,
  DetalleLiquidacionFormData,
  PrestacionFilter,
  PagoNominaFilter,
} from '../types';

const BASE_URL = '/talent-hub/nomina';

// ============== LEGACY QUERY KEYS (backward compat) ==============

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

// ============== CONFIGURACION NOMINA (factory CRUD) ==============

const configuracionHooks = createCrudHooks(
  configuracionNominaApi,
  thKeys.configuracionesNomina,
  'Configuracion de nomina',
  { isFeminine: true }
);

/** GET /configuraciones/ — lista todas (uses list type) */
export const useConfiguracionesNomina = () => {
  return useQuery({
    queryKey: thKeys.configuracionesNomina.list(),
    queryFn: async () => {
      const response = await configuracionNominaListApi.getAll();
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
  });
};

/** GET /configuraciones/:id/ — detalle (uses detail type) */
export const useConfiguracionNomina = configuracionHooks.useDetail;
export const useCreateConfiguracionNomina = configuracionHooks.useCreate;
export const useUpdateConfiguracionNomina = configuracionHooks.useUpdate;

// ============== CONCEPTOS NOMINA (factory CRUD + custom actions) ==============

const conceptoHooks = createCrudHooks(
  conceptoNominaApi,
  thKeys.conceptosNomina,
  'Concepto de nomina'
);

export const useConceptosNomina = conceptoHooks.useList;
export const useConceptoNomina = conceptoHooks.useDetail;
export const useCreateConceptoNomina = conceptoHooks.useCreate;
export const useUpdateConceptoNomina = conceptoHooks.useUpdate;
export const useDeleteConceptoNomina = conceptoHooks.useDelete;

/** GET /conceptos/devengados/ */
export const useConceptosDevengados = () => {
  return useQuery({
    queryKey: thKeys.conceptosNomina.custom('devengados'),
    queryFn: async () => {
      const response = await apiClient.get(`${BASE_URL}/conceptos/devengados/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ConceptoNomina[];
    },
  });
};

/** GET /conceptos/deducciones/ */
export const useConceptosDeducciones = () => {
  return useQuery({
    queryKey: thKeys.conceptosNomina.custom('deducciones'),
    queryFn: async () => {
      const response = await apiClient.get(`${BASE_URL}/conceptos/deducciones/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ConceptoNomina[];
    },
  });
};

// ============== PERIODOS NOMINA (factory CRUD + custom actions) ==============

const periodoHooks = createCrudHooks(periodoNominaApi, thKeys.periodosNomina, 'Periodo de nomina');

export const usePeriodosNomina = periodoHooks.useList;
export const usePeriodoNomina = periodoHooks.useDetail;
export const useCreatePeriodoNomina = periodoHooks.useCreate;
export const useUpdatePeriodoNomina = periodoHooks.useUpdate;

/** POST /periodos/:id/preliquidar/ */
export const usePreliquidarPeriodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<PeriodoNomina>(
        `${BASE_URL}/periodos/${id}/preliquidar/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.periodosNomina.lists() });
      toast.success('Periodo preliquidado exitosamente');
    },
    onError: () => toast.error('Error al preliquidar el periodo'),
  });
};

/** POST /periodos/:id/cerrar_periodo/ */
export const useCerrarPeriodoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<{ message: string; periodo: PeriodoNomina }>(
        `${BASE_URL}/periodos/${id}/cerrar_periodo/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.periodosNomina.lists() });
      toast.success('Periodo cerrado exitosamente');
    },
    onError: () => toast.error('Error al cerrar el periodo'),
  });
};

/** GET /periodos/:id/estadisticas/ */
export const useEstadisticasPeriodo = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.periodosNomina.custom('estadisticas', id),
    queryFn: async () => {
      const { data } = await apiClient.get(`${BASE_URL}/periodos/${id}/estadisticas/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

// ============== LIQUIDACIONES (factory list/detail + custom actions) ==============

const liquidacionHooks = createCrudHooks(
  liquidacionNominaApi,
  thKeys.liquidaciones,
  'Liquidacion',
  { isFeminine: true }
);

export const useLiquidacionesNomina = liquidacionHooks.useList;
export const useLiquidacionNomina = liquidacionHooks.useDetail;

/** POST /liquidaciones/ (with nested detalles) — custom to also invalidate periodos */
export const useCreateLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import('../types').LiquidacionNominaFormData) => {
      const response = await liquidacionNominaApi.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.liquidaciones.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.periodosNomina.lists() });
      toast.success('Liquidacion creada exitosamente');
    },
    onError: () => toast.error('Error al crear la liquidacion'),
  });
};

/** POST /liquidaciones/:id/aprobar/ */
export const useAprobarLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<{ message: string; liquidacion: LiquidacionNomina }>(
        `${BASE_URL}/liquidaciones/${id}/aprobar/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.liquidaciones.lists() });
      toast.success('Liquidacion aprobada exitosamente');
    },
    onError: () => toast.error('Error al aprobar la liquidacion'),
  });
};

/** POST /liquidaciones/:id/pagar/ */
export const usePagarLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<{ message: string; liquidacion: LiquidacionNomina }>(
        `${BASE_URL}/liquidaciones/${id}/pagar/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.liquidaciones.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.periodosNomina.lists() });
      toast.success('Liquidacion marcada como pagada');
    },
    onError: () => toast.error('Error al marcar la liquidacion como pagada'),
  });
};

/** POST /liquidaciones/:id/recalcular/ */
export const useRecalcularLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<{ message: string; liquidacion: LiquidacionNomina }>(
        `${BASE_URL}/liquidaciones/${id}/recalcular/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.liquidaciones.lists() });
      toast.success('Totales recalculados exitosamente');
    },
    onError: () => toast.error('Error al recalcular la liquidacion'),
  });
};

// ============== DETALLES DE LIQUIDACION (custom — nested resource) ==============

/** GET /detalles/?liquidacion=:id */
export const useDetallesLiquidacion = (liquidacionId: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.detallesLiquidacion.custom('by-liquidacion', liquidacionId),
    queryFn: async () => {
      const response = await apiClient.get(`${BASE_URL}/detalles/`, {
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
      const { data: response } = await apiClient.post<DetalleLiquidacion>(`${BASE_URL}/detalles/`, {
        ...data,
        liquidacion: liquidacionId,
      });
      return response;
    },
    onSuccess: (_, { liquidacionId }) => {
      queryClient.invalidateQueries({
        queryKey: thKeys.detallesLiquidacion.custom('by-liquidacion', liquidacionId),
      });
      queryClient.invalidateQueries({ queryKey: thKeys.liquidaciones.lists() });
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
      await apiClient.delete(`${BASE_URL}/detalles/${id}/`);
      return liquidacionId;
    },
    onSuccess: (liquidacionId) => {
      queryClient.invalidateQueries({
        queryKey: thKeys.detallesLiquidacion.custom('by-liquidacion', liquidacionId),
      });
      queryClient.invalidateQueries({ queryKey: thKeys.liquidaciones.lists() });
      toast.success('Detalle eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el detalle'),
  });
};

// ============== PRESTACIONES (factory CRUD) ==============

const prestacionHooks = createCrudHooks(prestacionApi, thKeys.prestaciones, 'Prestacion', {
  isFeminine: true,
});

export const usePrestaciones = prestacionHooks.useList;
export const usePrestacion = prestacionHooks.useDetail;
export const useCreatePrestacion = prestacionHooks.useCreate;
export const useUpdatePrestacion = prestacionHooks.useUpdate;
export const useDeletePrestacion = prestacionHooks.useDelete;

// ============== PAGOS NOMINA (factory CRUD + custom invalidation) ==============

const pagoHooks = createCrudHooks(pagoNominaApi, thKeys.pagosNomina, 'Pago');

export const usePagosNomina = pagoHooks.useList;
export const usePagoNomina = pagoHooks.useDetail;
export const useDeletePagoNomina = pagoHooks.useDelete;

/** POST /pagos/ — custom to also invalidate liquidaciones */
export const useCreatePagoNomina = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import('../types').PagoNominaFormData) => {
      const response = await pagoNominaApi.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.pagosNomina.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.liquidaciones.lists() });
      toast.success('Pago registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar el pago'),
  });
};
