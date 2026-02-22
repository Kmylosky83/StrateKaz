/**
 * Hooks para Admin Finance - Alineados con backend real
 * Usan DRF paginated responses: Array.isArray(data) ? data : (data?.results ?? [])
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bancosApi,
  cuentasPorPagarApi,
  cuentasPorCobrarApi,
  flujoCajaApi,
  pagosApi,
  recaudosApi,
  centrosCostoApi,
  rubrosApi,
  presupuestosApi,
  aprobacionesApi,
  ejecucionesApi,
  categoriasActivosApi,
  activosFijosApi,
  hojasVidaApi,
  programasMantenimientoApi,
  depreciacionesApi,
  bajasApi,
  mantenimientosLocativosApi,
  serviciosPublicosApi,
  contratosServiciosApi,
} from '../api';

// ==================== TESORERIA HOOKS ====================

export const useBancos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'bancos', params],
    queryFn: () => bancosApi.getAll(params).then((r) => r.data),
  });

export const useBanco = (id: number) =>
  useQuery({
    queryKey: ['admin-finance', 'banco', id],
    queryFn: () => bancosApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useBancoSaldos = () =>
  useQuery({
    queryKey: ['admin-finance', 'bancos', 'saldos'],
    queryFn: () => bancosApi.getSaldos().then((r) => r.data),
  });

export const useCreateBanco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof bancosApi.create>[0]) =>
      bancosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-finance', 'bancos'] }),
  });
};

export const useUpdateBanco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof bancosApi.update>[1] }) =>
      bancosApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-finance', 'bancos'] }),
  });
};

export const useDeleteBanco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bancosApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-finance', 'bancos'] }),
  });
};

// Cuentas por Pagar
export const useCuentasPorPagar = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'cuentas-por-pagar', params],
    queryFn: () => cuentasPorPagarApi.getAll(params).then((r) => r.data),
  });

export const useCuentaPorPagar = (id: number) =>
  useQuery({
    queryKey: ['admin-finance', 'cuenta-por-pagar', id],
    queryFn: () => cuentasPorPagarApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useCuentasPorPagarEstadisticas = () =>
  useQuery({
    queryKey: ['admin-finance', 'cuentas-por-pagar', 'estadisticas'],
    queryFn: () => cuentasPorPagarApi.getEstadisticas().then((r) => r.data),
  });

export const useCuentasPorPagarPorVencer = () =>
  useQuery({
    queryKey: ['admin-finance', 'cuentas-por-pagar', 'por-vencer'],
    queryFn: () => cuentasPorPagarApi.getPorVencer().then((r) => r.data),
  });

export const useCreateCuentaPorPagar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof cuentasPorPagarApi.create>[0]) =>
      cuentasPorPagarApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-finance', 'cuentas-por-pagar'] }),
  });
};

// Cuentas por Cobrar
export const useCuentasPorCobrar = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'cuentas-por-cobrar', params],
    queryFn: () => cuentasPorCobrarApi.getAll(params).then((r) => r.data),
  });

export const useCuentasPorCobrarEstadisticas = () =>
  useQuery({
    queryKey: ['admin-finance', 'cuentas-por-cobrar', 'estadisticas'],
    queryFn: () => cuentasPorCobrarApi.getEstadisticas().then((r) => r.data),
  });

// Flujo de Caja
export const useFlujoCaja = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'flujo-caja', params],
    queryFn: () => flujoCajaApi.getAll(params).then((r) => r.data),
  });

export const useFlujoCajaResumen = (fechaInicio: string, fechaFin: string) =>
  useQuery({
    queryKey: ['admin-finance', 'flujo-caja', 'resumen', fechaInicio, fechaFin],
    queryFn: () =>
      flujoCajaApi
        .getResumenPeriodo({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
        .then((r) => r.data),
    enabled: !!fechaInicio && !!fechaFin,
  });

// Pagos
export const usePagos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'pagos', params],
    queryFn: () => pagosApi.getAll(params).then((r) => r.data),
  });

export const useCreatePago = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof pagosApi.create>[0]) =>
      pagosApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-finance', 'pagos'] });
      qc.invalidateQueries({ queryKey: ['admin-finance', 'cuentas-por-pagar'] });
      qc.invalidateQueries({ queryKey: ['admin-finance', 'bancos'] });
    },
  });
};

// Recaudos
export const useRecaudos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'recaudos', params],
    queryFn: () => recaudosApi.getAll(params).then((r) => r.data),
  });

export const useCreateRecaudo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof recaudosApi.create>[0]) =>
      recaudosApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-finance', 'recaudos'] });
      qc.invalidateQueries({ queryKey: ['admin-finance', 'cuentas-por-cobrar'] });
      qc.invalidateQueries({ queryKey: ['admin-finance', 'bancos'] });
    },
  });
};

// ==================== PRESUPUESTO HOOKS ====================

export const useCentrosCosto = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'centros-costo', params],
    queryFn: () => centrosCostoApi.getAll(params).then((r) => r.data),
  });

export const useRubros = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'rubros', params],
    queryFn: () => rubrosApi.getAll(params).then((r) => r.data),
  });

export const usePresupuestos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'presupuestos', params],
    queryFn: () => presupuestosApi.getAll(params).then((r) => r.data),
  });

export const usePresupuesto = (id: number) =>
  useQuery({
    queryKey: ['admin-finance', 'presupuesto', id],
    queryFn: () => presupuestosApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useResumenEjecucion = (anio?: number) =>
  useQuery({
    queryKey: ['admin-finance', 'presupuestos', 'resumen-ejecucion', anio],
    queryFn: () =>
      presupuestosApi.getResumenEjecucion(anio ? { anio } : undefined).then((r) => r.data),
  });

export const useCreatePresupuesto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof presupuestosApi.create>[0]) =>
      presupuestosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-finance', 'presupuestos'] }),
  });
};

export const useAprobaciones = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'aprobaciones', params],
    queryFn: () => aprobacionesApi.getAll(params).then((r) => r.data),
  });

export const useAprobacionesPendientes = () =>
  useQuery({
    queryKey: ['admin-finance', 'aprobaciones', 'pendientes'],
    queryFn: () => aprobacionesApi.getPendientes().then((r) => r.data),
  });

export const useAprobarPresupuesto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: { observaciones?: string } }) =>
      aprobacionesApi.aprobar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-finance', 'aprobaciones'] });
      qc.invalidateQueries({ queryKey: ['admin-finance', 'presupuestos'] });
    },
  });
};

export const useRechazarPresupuesto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: { observaciones?: string } }) =>
      aprobacionesApi.rechazar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-finance', 'aprobaciones'] });
      qc.invalidateQueries({ queryKey: ['admin-finance', 'presupuestos'] });
    },
  });
};

export const useEjecuciones = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'ejecuciones', params],
    queryFn: () => ejecucionesApi.getAll(params).then((r) => r.data),
  });

export const useCreateEjecucion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof ejecucionesApi.create>[0]) =>
      ejecucionesApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-finance', 'ejecuciones'] });
      qc.invalidateQueries({ queryKey: ['admin-finance', 'presupuestos'] });
    },
  });
};

// ==================== ACTIVOS FIJOS HOOKS ====================

export const useCategoriasActivos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'categorias-activos', params],
    queryFn: () => categoriasActivosApi.getAll(params).then((r) => r.data),
  });

export const useActivosFijos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'activos-fijos', params],
    queryFn: () => activosFijosApi.getAll(params).then((r) => r.data),
  });

export const useActivoFijo = (id: number) =>
  useQuery({
    queryKey: ['admin-finance', 'activo-fijo', id],
    queryFn: () => activosFijosApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useActivosFijosEstadisticas = () =>
  useQuery({
    queryKey: ['admin-finance', 'activos-fijos', 'estadisticas'],
    queryFn: () => activosFijosApi.getEstadisticas().then((r) => r.data),
  });

export const useCreateActivoFijo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof activosFijosApi.create>[0]) =>
      activosFijosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-finance', 'activos-fijos'] }),
  });
};

export const useUpdateActivoFijo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof activosFijosApi.update>[1];
    }) => activosFijosApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-finance', 'activos-fijos'] }),
  });
};

export const useHojasVida = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'hojas-vida', params],
    queryFn: () => hojasVidaApi.getAll(params).then((r) => r.data),
  });

export const useProgramasMantenimiento = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'programas-mantenimiento', params],
    queryFn: () => programasMantenimientoApi.getAll(params).then((r) => r.data),
  });

export const useProgramasMantenimientoProximos = () =>
  useQuery({
    queryKey: ['admin-finance', 'programas-mantenimiento', 'proximos'],
    queryFn: () => programasMantenimientoApi.getProximos().then((r) => r.data),
  });

export const useDepreciaciones = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'depreciaciones', params],
    queryFn: () => depreciacionesApi.getAll(params).then((r) => r.data),
  });

export const useBajas = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'bajas', params],
    queryFn: () => bajasApi.getAll(params).then((r) => r.data),
  });

// ==================== SERVICIOS GENERALES HOOKS ====================

export const useMantenimientosLocativos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'mantenimientos-locativos', params],
    queryFn: () => mantenimientosLocativosApi.getAll(params).then((r) => r.data),
  });

export const useMantenimientoLocativo = (id: number) =>
  useQuery({
    queryKey: ['admin-finance', 'mantenimiento-locativo', id],
    queryFn: () => mantenimientosLocativosApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useCreateMantenimientoLocativo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof mantenimientosLocativosApi.create>[0]) =>
      mantenimientosLocativosApi.create(data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['admin-finance', 'mantenimientos-locativos'] }),
  });
};

export const useServiciosPublicos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'servicios-publicos', params],
    queryFn: () => serviciosPublicosApi.getAll(params).then((r) => r.data),
  });

export const useServiciosPorVencer = () =>
  useQuery({
    queryKey: ['admin-finance', 'servicios-publicos', 'por-vencer'],
    queryFn: () => serviciosPublicosApi.getPorVencer().then((r) => r.data),
  });

export const useContratosServicios = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-finance', 'contratos-servicios', params],
    queryFn: () => contratosServiciosApi.getAll(params).then((r) => r.data),
  });

export const useContratoServicio = (id: number) =>
  useQuery({
    queryKey: ['admin-finance', 'contrato-servicio', id],
    queryFn: () => contratosServiciosApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useContratosVigentes = () =>
  useQuery({
    queryKey: ['admin-finance', 'contratos-servicios', 'vigentes'],
    queryFn: () => contratosServiciosApi.getVigentes().then((r) => r.data),
  });

export const useContratosPorVencer = () =>
  useQuery({
    queryKey: ['admin-finance', 'contratos-servicios', 'por-vencer'],
    queryFn: () => contratosServiciosApi.getPorVencer().then((r) => r.data),
  });

export const useCreateContratoServicio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof contratosServiciosApi.create>[0]) =>
      contratosServiciosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-finance', 'contratos-servicios'] }),
  });
};

export const useTerminarContrato = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contratosServiciosApi.terminar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-finance', 'contratos-servicios'] }),
  });
};
