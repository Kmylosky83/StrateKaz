/**
 * Hooks para Admin Finance
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cuentasBancariasApi,
  movimientosBancariosApi,
  flujoCajaApi,
  programacionPagosApi,
  cajasChicasApi,
  presupuestosApi,
  rubrosApi,
  ejecucionesApi,
  cdpCrpApi,
  trasladosApi,
  activosFijosApi,
  categoriasActivosApi,
  ubicacionesActivosApi,
  depreciacionesApi,
  mantenimientosActivosApi,
  contratosServiciosApi,
  gastosOperativosApi,
  consumosServiciosApi,
} from '../api';

// ==================== TESORERÍA HOOKS ====================

export const useCuentasBancarias = () => {
  return useQuery({
    queryKey: ['cuentas-bancarias'],
    queryFn: () => cuentasBancariasApi.getAll(),
  });
};

export const useCuentaBancaria = (id: number) => {
  return useQuery({
    queryKey: ['cuenta-bancaria', id],
    queryFn: () => cuentasBancariasApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCuentaBancaria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cuentasBancariasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-bancarias'] });
    },
  });
};

export const useMovimientosBancarios = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['movimientos-bancarios', params],
    queryFn: () => movimientosBancariosApi.getAll(params),
  });
};

export const useFlujoCaja = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['flujo-caja', params],
    queryFn: () => flujoCajaApi.getAll(params),
  });
};

export const useProgramacionPagos = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['programacion-pagos', params],
    queryFn: () => programacionPagosApi.getAll(params),
  });
};

export const useCajasChicas = () => {
  return useQuery({
    queryKey: ['cajas-chicas'],
    queryFn: () => cajasChicasApi.getAll(),
  });
};

// ==================== PRESUPUESTO HOOKS ====================

export const usePresupuestos = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['presupuestos', params],
    queryFn: () => presupuestosApi.getAll(params),
  });
};

export const usePresupuesto = (id: number) => {
  return useQuery({
    queryKey: ['presupuesto', id],
    queryFn: () => presupuestosApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePresupuesto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: presupuestosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
    },
  });
};

export const useRubros = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['rubros', params],
    queryFn: () => rubrosApi.getAll(params),
  });
};

export const useEjecuciones = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['ejecuciones', params],
    queryFn: () => ejecucionesApi.getAll(params),
  });
};

export const useCdpCrp = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['cdp-crp', params],
    queryFn: () => cdpCrpApi.getAll(params),
  });
};

export const useTraslados = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['traslados', params],
    queryFn: () => trasladosApi.getAll(params),
  });
};

// ==================== ACTIVOS FIJOS HOOKS ====================

export const useActivosFijos = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['activos-fijos', params],
    queryFn: () => activosFijosApi.getAll(params),
  });
};

export const useActivoFijo = (id: number) => {
  return useQuery({
    queryKey: ['activo-fijo', id],
    queryFn: () => activosFijosApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateActivoFijo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activosFijosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos-fijos'] });
    },
  });
};

export const useCategoriasActivos = () => {
  return useQuery({
    queryKey: ['categorias-activos'],
    queryFn: () => categoriasActivosApi.getAll(),
  });
};

export const useUbicacionesActivos = () => {
  return useQuery({
    queryKey: ['ubicaciones-activos'],
    queryFn: () => ubicacionesActivosApi.getAll(),
  });
};

export const useDepreciaciones = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['depreciaciones', params],
    queryFn: () => depreciacionesApi.getAll(params),
  });
};

export const useMantenimientosActivos = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['mantenimientos-activos', params],
    queryFn: () => mantenimientosActivosApi.getAll(params),
  });
};

// ==================== SERVICIOS GENERALES HOOKS ====================

export const useContratosServicios = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['contratos-servicios', params],
    queryFn: () => contratosServiciosApi.getAll(params),
  });
};

export const useContratoServicio = (id: number) => {
  return useQuery({
    queryKey: ['contrato-servicio', id],
    queryFn: () => contratosServiciosApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateContratoServicio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contratosServiciosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos-servicios'] });
    },
  });
};

export const useGastosOperativos = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['gastos-operativos', params],
    queryFn: () => gastosOperativosApi.getAll(params),
  });
};

export const useConsumosServicios = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['consumos-servicios', params],
    queryFn: () => consumosServiciosApi.getAll(params),
  });
};
