/**
 * Hooks para Administración — Módulo V2 (Cascada)
 * Sub-módulos: Presupuesto, Activos Fijos, Servicios Generales
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
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

// ==================== PRESUPUESTO HOOKS ====================

export const useCentrosCosto = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'centros-costo', params],
    queryFn: () => centrosCostoApi.getAll(params).then((r) => r.data),
  });

export const useRubros = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'rubros', params],
    queryFn: () => rubrosApi.getAll(params).then((r) => r.data),
  });

export const usePresupuestos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'presupuestos', params],
    queryFn: () => presupuestosApi.getAll(params).then((r) => r.data),
  });

export const usePresupuesto = (id: number) =>
  useQuery({
    queryKey: ['administracion', 'presupuesto', id],
    queryFn: () => presupuestosApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useResumenEjecucion = (anio?: number) =>
  useQuery({
    queryKey: ['administracion', 'presupuestos', 'resumen-ejecucion', anio],
    queryFn: () =>
      presupuestosApi.getResumenEjecucion(anio ? { anio } : undefined).then((r) => r.data),
  });

export const useCreatePresupuesto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof presupuestosApi.create>[0]) =>
      presupuestosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administracion', 'presupuestos'] }),
  });
};

export const useAprobaciones = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'aprobaciones', params],
    queryFn: () => aprobacionesApi.getAll(params).then((r) => r.data),
  });

export const useAprobacionesPendientes = () =>
  useQuery({
    queryKey: ['administracion', 'aprobaciones', 'pendientes'],
    queryFn: () => aprobacionesApi.getPendientes().then((r) => r.data),
  });

export const useAprobarPresupuesto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: { observaciones?: string } }) =>
      aprobacionesApi.aprobar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['administracion', 'aprobaciones'] });
      qc.invalidateQueries({ queryKey: ['administracion', 'presupuestos'] });
    },
  });
};

export const useRechazarPresupuesto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: { observaciones?: string } }) =>
      aprobacionesApi.rechazar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['administracion', 'aprobaciones'] });
      qc.invalidateQueries({ queryKey: ['administracion', 'presupuestos'] });
    },
  });
};

export const useCreateCentroCosto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof centrosCostoApi.create>[0]) =>
      centrosCostoApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administracion', 'centros-costo'] }),
  });
};

export const useCreateRubro = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof rubrosApi.create>[0]) =>
      rubrosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administracion', 'rubros'] }),
  });
};

export const useEjecuciones = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'ejecuciones', params],
    queryFn: () => ejecucionesApi.getAll(params).then((r) => r.data),
  });

export const useCreateEjecucion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof ejecucionesApi.create>[0]) =>
      ejecucionesApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['administracion', 'ejecuciones'] });
      qc.invalidateQueries({ queryKey: ['administracion', 'presupuestos'] });
    },
  });
};

// ==================== ACTIVOS FIJOS HOOKS ====================

export const useCategoriasActivos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'categorias-activos', params],
    queryFn: () => categoriasActivosApi.getAll(params).then((r) => r.data),
  });

export const useActivosFijos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'activos-fijos', params],
    queryFn: () => activosFijosApi.getAll(params).then((r) => r.data),
  });

export const useActivoFijo = (id: number) =>
  useQuery({
    queryKey: ['administracion', 'activo-fijo', id],
    queryFn: () => activosFijosApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useActivosFijosEstadisticas = () =>
  useQuery({
    queryKey: ['administracion', 'activos-fijos', 'estadisticas'],
    queryFn: () => activosFijosApi.getEstadisticas().then((r) => r.data),
  });

export const useCreateActivoFijo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof activosFijosApi.create>[0]) =>
      activosFijosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administracion', 'activos-fijos'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administracion', 'activos-fijos'] }),
  });
};

export const useHojasVida = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'hojas-vida', params],
    queryFn: () => hojasVidaApi.getAll(params).then((r) => r.data),
  });

export const useCreateHojaVida = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof hojasVidaApi.create>[0]) =>
      hojasVidaApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administracion', 'hojas-vida'] }),
  });
};

export const useProgramasMantenimiento = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'programas-mantenimiento', params],
    queryFn: () => programasMantenimientoApi.getAll(params).then((r) => r.data),
  });

export const useCreateProgramaMantenimiento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof programasMantenimientoApi.create>[0]) =>
      programasMantenimientoApi.create(data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['administracion', 'programas-mantenimiento'] }),
  });
};

export const useProgramasMantenimientoProximos = () =>
  useQuery({
    queryKey: ['administracion', 'programas-mantenimiento', 'proximos'],
    queryFn: () => programasMantenimientoApi.getProximos().then((r) => r.data),
  });

export const useDepreciaciones = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'depreciaciones', params],
    queryFn: () => depreciacionesApi.getAll(params).then((r) => r.data),
  });

export const useBajas = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'bajas', params],
    queryFn: () => bajasApi.getAll(params).then((r) => r.data),
  });

// ==================== SERVICIOS GENERALES HOOKS ====================

export const useMantenimientosLocativos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'mantenimientos-locativos', params],
    queryFn: () => mantenimientosLocativosApi.getAll(params).then((r) => r.data),
  });

export const useMantenimientoLocativo = (id: number) =>
  useQuery({
    queryKey: ['administracion', 'mantenimiento-locativo', id],
    queryFn: () => mantenimientosLocativosApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useCreateMantenimientoLocativo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof mantenimientosLocativosApi.create>[0]) =>
      mantenimientosLocativosApi.create(data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['administracion', 'mantenimientos-locativos'] }),
  });
};

export const useServiciosPublicos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'servicios-publicos', params],
    queryFn: () => serviciosPublicosApi.getAll(params).then((r) => r.data),
  });

export const useCreateServicioPublico = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof serviciosPublicosApi.create>[0]) =>
      serviciosPublicosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administracion', 'servicios-publicos'] }),
  });
};

export const useServiciosPorVencer = () =>
  useQuery({
    queryKey: ['administracion', 'servicios-publicos', 'por-vencer'],
    queryFn: () => serviciosPublicosApi.getPorVencer().then((r) => r.data),
  });

export const useContratosServicios = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['administracion', 'contratos-servicios', params],
    queryFn: () => contratosServiciosApi.getAll(params).then((r) => r.data),
  });

export const useContratoServicio = (id: number) =>
  useQuery({
    queryKey: ['administracion', 'contrato-servicio', id],
    queryFn: () => contratosServiciosApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useContratosVigentes = () =>
  useQuery({
    queryKey: ['administracion', 'contratos-servicios', 'vigentes'],
    queryFn: () => contratosServiciosApi.getVigentes().then((r) => r.data),
  });

export const useContratosPorVencer = () =>
  useQuery({
    queryKey: ['administracion', 'contratos-servicios', 'por-vencer'],
    queryFn: () => contratosServiciosApi.getPorVencer().then((r) => r.data),
  });

export const useCreateContratoServicio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof contratosServiciosApi.create>[0]) =>
      contratosServiciosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administracion', 'contratos-servicios'] }),
  });
};

export const useTerminarContrato = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contratosServiciosApi.terminar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['administracion', 'contratos-servicios'] }),
  });
};
