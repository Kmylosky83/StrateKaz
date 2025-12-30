/**
 * Hooks React Query para Production Ops
 * Sistema de Gestión Grasas y Huesos del Norte
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import productionOpsApi from '../api/productionOpsApi';
import type {
  // DTOs
  CreateRecepcionDTO,
  UpdateRecepcionDTO,
  CreateDetalleRecepcionDTO,
  CreateControlCalidadRecepcionDTO,
  CreateOrdenProduccionDTO,
  UpdateOrdenProduccionDTO,
  CreateLoteProduccionDTO,
  CreateConsumoMateriaPrimaDTO,
  CreateControlCalidadProcesoDTO,
  IniciarOrdenProduccionDTO,
  FinalizarOrdenProduccionDTO,
  CreateActivoProduccionDTO,
  UpdateActivoProduccionDTO,
  CreateEquipoMedicionDTO,
  CreatePlanMantenimientoDTO,
  CreateOrdenTrabajoDTO,
  UpdateOrdenTrabajoDTO,
  IniciarOrdenTrabajoDTO,
  CompletarOrdenTrabajoDTO,
  CreateCalibracionDTO,
  CreateParadaDTO,
  UpdateParadaDTO,
  CerrarParadaDTO,
  CreateProductoTerminadoDTO,
  CreateStockProductoDTO,
  UpdateStockProductoDTO,
  CreateLiberacionDTO,
  UpdateLiberacionDTO,
  AprobarLiberacionDTO,
  RechazarLiberacionDTO,
  CreateCertificadoCalidadDTO,
  ReservarCantidadDTO,
  LiberarReservaDTO,
  ConsumirCantidadDTO,
} from '../types/production-ops.types';

// ==================== QUERY KEYS ====================

export const productionOpsKeys = {
  all: ['production-ops'] as const,

  // Recepción
  tiposRecepcion: () => [...productionOpsKeys.all, 'tipos-recepcion'] as const,
  estadosRecepcion: () => [...productionOpsKeys.all, 'estados-recepcion'] as const,
  puntosRecepcion: () => [...productionOpsKeys.all, 'puntos-recepcion'] as const,
  recepciones: () => [...productionOpsKeys.all, 'recepciones'] as const,
  recepcionById: (id: number) => [...productionOpsKeys.recepciones(), id] as const,
  recepcionesFiltered: (filters: Record<string, any>) => [...productionOpsKeys.recepciones(), 'filtered', filters] as const,
  detallesRecepcion: (recepcionId: number) => [...productionOpsKeys.recepcionById(recepcionId), 'detalles'] as const,
  controlesCalidadRecepcion: (recepcionId: number) => [...productionOpsKeys.recepcionById(recepcionId), 'controles-calidad'] as const,

  // Procesamiento
  tiposProceso: () => [...productionOpsKeys.all, 'tipos-proceso'] as const,
  estadosProceso: () => [...productionOpsKeys.all, 'estados-proceso'] as const,
  lineasProduccion: () => [...productionOpsKeys.all, 'lineas-produccion'] as const,
  ordenesProduccion: () => [...productionOpsKeys.all, 'ordenes-produccion'] as const,
  ordenProduccionById: (id: number) => [...productionOpsKeys.ordenesProduccion(), id] as const,
  ordenesProduccionFiltered: (filters: Record<string, any>) => [...productionOpsKeys.ordenesProduccion(), 'filtered', filters] as const,
  lotesProduccion: () => [...productionOpsKeys.all, 'lotes-produccion'] as const,
  loteProduccionById: (id: number) => [...productionOpsKeys.lotesProduccion(), id] as const,
  lotesProduccionFiltered: (filters: Record<string, any>) => [...productionOpsKeys.lotesProduccion(), 'filtered', filters] as const,
  consumosMateriaPrima: (loteId: number) => [...productionOpsKeys.loteProduccionById(loteId), 'consumos'] as const,
  controlesCalidadProceso: (loteId: number) => [...productionOpsKeys.loteProduccionById(loteId), 'controles-calidad'] as const,

  // Mantenimiento
  tiposActivo: () => [...productionOpsKeys.all, 'tipos-activo'] as const,
  tiposMantenimiento: () => [...productionOpsKeys.all, 'tipos-mantenimiento'] as const,
  activosProduccion: () => [...productionOpsKeys.all, 'activos-produccion'] as const,
  activoProduccionById: (id: number) => [...productionOpsKeys.activosProduccion(), id] as const,
  activosProduccionFiltered: (filters: Record<string, any>) => [...productionOpsKeys.activosProduccion(), 'filtered', filters] as const,
  equiposMedicion: () => [...productionOpsKeys.all, 'equipos-medicion'] as const,
  equipoMedicionById: (id: number) => [...productionOpsKeys.equiposMedicion(), id] as const,
  planesMantenimiento: () => [...productionOpsKeys.all, 'planes-mantenimiento'] as const,
  planMantenimientoById: (id: number) => [...productionOpsKeys.planesMantenimiento(), id] as const,
  ordenesTrabajo: () => [...productionOpsKeys.all, 'ordenes-trabajo'] as const,
  ordenTrabajoById: (id: number) => [...productionOpsKeys.ordenesTrabajo(), id] as const,
  ordenesTrabajoFiltered: (filters: Record<string, any>) => [...productionOpsKeys.ordenesTrabajo(), 'filtered', filters] as const,
  calibraciones: () => [...productionOpsKeys.all, 'calibraciones'] as const,
  calibracionById: (id: number) => [...productionOpsKeys.calibraciones(), id] as const,
  paradas: () => [...productionOpsKeys.all, 'paradas'] as const,
  paradaById: (id: number) => [...productionOpsKeys.paradas(), id] as const,

  // Producto Terminado
  tiposProducto: () => [...productionOpsKeys.all, 'tipos-producto'] as const,
  estadosLote: () => [...productionOpsKeys.all, 'estados-lote'] as const,
  productosTerminados: () => [...productionOpsKeys.all, 'productos-terminados'] as const,
  productoTerminadoById: (id: number) => [...productionOpsKeys.productosTerminados(), id] as const,
  stocks: () => [...productionOpsKeys.all, 'stocks'] as const,
  stockById: (id: number) => [...productionOpsKeys.stocks(), id] as const,
  stocksFiltered: (filters: Record<string, any>) => [...productionOpsKeys.stocks(), 'filtered', filters] as const,
  liberaciones: () => [...productionOpsKeys.all, 'liberaciones'] as const,
  liberacionById: (id: number) => [...productionOpsKeys.liberaciones(), id] as const,
  certificados: () => [...productionOpsKeys.all, 'certificados'] as const,
  certificadoById: (id: number) => [...productionOpsKeys.certificados(), id] as const,
};

// ==================== RECEPCIÓN - CATÁLOGOS ====================

export function useTiposRecepcion(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.tiposRecepcion(),
    queryFn: () => productionOpsApi.tipoRecepcion.getAll(params),
  });
}

export function useTiposRecepcionActivos() {
  return useQuery({
    queryKey: [...productionOpsKeys.tiposRecepcion(), 'activos'],
    queryFn: () => productionOpsApi.tipoRecepcion.getActivos(),
  });
}

export function useEstadosRecepcion(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.estadosRecepcion(),
    queryFn: () => productionOpsApi.estadoRecepcion.getAll(params),
  });
}

export function useEstadosRecepcionActivos() {
  return useQuery({
    queryKey: [...productionOpsKeys.estadosRecepcion(), 'activos'],
    queryFn: () => productionOpsApi.estadoRecepcion.getActivos(),
  });
}

export function usePuntosRecepcion(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.puntosRecepcion(),
    queryFn: () => productionOpsApi.puntoRecepcion.getAll(params),
  });
}

// ==================== RECEPCIÓN - PRINCIPALES ====================

export function useRecepciones(params?: any) {
  return useQuery({
    queryKey: params ? productionOpsKeys.recepcionesFiltered(params) : productionOpsKeys.recepciones(),
    queryFn: () => productionOpsApi.recepcion.getAll(params),
  });
}

export function useRecepcionById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.recepcionById(id),
    queryFn: () => productionOpsApi.recepcion.getById(id),
    enabled: !!id,
  });
}

export function useCreateRecepcion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecepcionDTO) => productionOpsApi.recepcion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.recepciones() });
      toast.success('Recepción creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear recepción');
    },
  });
}

export function useUpdateRecepcion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRecepcionDTO }) =>
      productionOpsApi.recepcion.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.recepciones() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.recepcionById(id) });
      toast.success('Recepción actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar recepción');
    },
  });
}

export function useCambiarEstadoRecepcion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estadoId }: { id: number; estadoId: number }) =>
      productionOpsApi.recepcion.cambiarEstado(id, estadoId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.recepciones() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.recepcionById(id) });
      toast.success('Estado de recepción cambiado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cambiar estado');
    },
  });
}

// ==================== PROCESAMIENTO - CATÁLOGOS ====================

export function useTiposProceso(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.tiposProceso(),
    queryFn: () => productionOpsApi.tipoProceso.getAll(params),
  });
}

export function useTiposProcesoActivos() {
  return useQuery({
    queryKey: [...productionOpsKeys.tiposProceso(), 'activos'],
    queryFn: () => productionOpsApi.tipoProceso.getActivos(),
  });
}

export function useEstadosProceso(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.estadosProceso(),
    queryFn: () => productionOpsApi.estadoProceso.getAll(params),
  });
}

export function useEstadosProcesoActivos() {
  return useQuery({
    queryKey: [...productionOpsKeys.estadosProceso(), 'activos'],
    queryFn: () => productionOpsApi.estadoProceso.getActivos(),
  });
}

export function useLineasProduccion(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.lineasProduccion(),
    queryFn: () => productionOpsApi.lineaProduccion.getAll(params),
  });
}

// ==================== PROCESAMIENTO - PRINCIPALES ====================

export function useOrdenesProduccion(params?: any) {
  return useQuery({
    queryKey: params ? productionOpsKeys.ordenesProduccionFiltered(params) : productionOpsKeys.ordenesProduccion(),
    queryFn: () => productionOpsApi.ordenProduccion.getAll(params),
  });
}

export function useOrdenProduccionById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.ordenProduccionById(id),
    queryFn: () => productionOpsApi.ordenProduccion.getById(id),
    enabled: !!id,
  });
}

export function useCreateOrdenProduccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrdenProduccionDTO) => productionOpsApi.ordenProduccion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenesProduccion() });
      toast.success('Orden de producción creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear orden de producción');
    },
  });
}

export function useUpdateOrdenProduccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrdenProduccionDTO }) =>
      productionOpsApi.ordenProduccion.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenesProduccion() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenProduccionById(id) });
      toast.success('Orden de producción actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar orden de producción');
    },
  });
}

export function useIniciarOrdenProduccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: IniciarOrdenProduccionDTO }) =>
      productionOpsApi.ordenProduccion.iniciar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenesProduccion() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenProduccionById(id) });
      toast.success('Orden de producción iniciada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al iniciar orden de producción');
    },
  });
}

export function useFinalizarOrdenProduccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: FinalizarOrdenProduccionDTO }) =>
      productionOpsApi.ordenProduccion.finalizar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenesProduccion() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenProduccionById(id) });
      toast.success('Orden de producción finalizada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al finalizar orden de producción');
    },
  });
}

// Lotes de Producción

export function useLotesProduccion(params?: any) {
  return useQuery({
    queryKey: params ? productionOpsKeys.lotesProduccionFiltered(params) : productionOpsKeys.lotesProduccion(),
    queryFn: () => productionOpsApi.loteProduccion.getAll(params),
  });
}

export function useLoteProduccionById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.loteProduccionById(id),
    queryFn: () => productionOpsApi.loteProduccion.getById(id),
    enabled: !!id,
  });
}

export function useCreateLoteProduccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLoteProduccionDTO) => productionOpsApi.loteProduccion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.lotesProduccion() });
      toast.success('Lote de producción creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear lote de producción');
    },
  });
}

// ==================== MANTENIMIENTO - CATÁLOGOS ====================

export function useTiposActivo(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.tiposActivo(),
    queryFn: () => productionOpsApi.tipoActivo.getAll(params),
  });
}

export function useTiposActivoActivos() {
  return useQuery({
    queryKey: [...productionOpsKeys.tiposActivo(), 'activos'],
    queryFn: () => productionOpsApi.tipoActivo.getActivos(),
  });
}

export function useTiposMantenimiento(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.tiposMantenimiento(),
    queryFn: () => productionOpsApi.tipoMantenimiento.getAll(params),
  });
}

export function useTiposMantenimientoActivos() {
  return useQuery({
    queryKey: [...productionOpsKeys.tiposMantenimiento(), 'activos'],
    queryFn: () => productionOpsApi.tipoMantenimiento.getActivos(),
  });
}

// ==================== MANTENIMIENTO - PRINCIPALES ====================

export function useActivosProduccion(params?: any) {
  return useQuery({
    queryKey: params ? productionOpsKeys.activosProduccionFiltered(params) : productionOpsKeys.activosProduccion(),
    queryFn: () => productionOpsApi.activoProduccion.getAll(params),
  });
}

export function useActivoProduccionById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.activoProduccionById(id),
    queryFn: () => productionOpsApi.activoProduccion.getById(id),
    enabled: !!id,
  });
}

export function useCreateActivoProduccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivoProduccionDTO) => productionOpsApi.activoProduccion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.activosProduccion() });
      toast.success('Activo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear activo');
    },
  });
}

export function useUpdateActivoProduccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateActivoProduccionDTO }) =>
      productionOpsApi.activoProduccion.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.activosProduccion() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.activoProduccionById(id) });
      toast.success('Activo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar activo');
    },
  });
}

// Equipos de Medición

export function useEquiposMedicion(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.equiposMedicion(),
    queryFn: () => productionOpsApi.equipoMedicion.getAll(params),
  });
}

export function useEquipoMedicionById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.equipoMedicionById(id),
    queryFn: () => productionOpsApi.equipoMedicion.getById(id),
    enabled: !!id,
  });
}

export function useCreateEquipoMedicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEquipoMedicionDTO) => productionOpsApi.equipoMedicion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.equiposMedicion() });
      toast.success('Equipo de medición creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear equipo de medición');
    },
  });
}

// Planes de Mantenimiento

export function usePlanesMantenimiento(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.planesMantenimiento(),
    queryFn: () => productionOpsApi.planMantenimiento.getAll(params),
  });
}

export function usePlanMantenimientoById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.planMantenimientoById(id),
    queryFn: () => productionOpsApi.planMantenimiento.getById(id),
    enabled: !!id,
  });
}

export function useCreatePlanMantenimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanMantenimientoDTO) => productionOpsApi.planMantenimiento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.planesMantenimiento() });
      toast.success('Plan de mantenimiento creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear plan de mantenimiento');
    },
  });
}

// Órdenes de Trabajo

export function useOrdenesTrabajo(params?: any) {
  return useQuery({
    queryKey: params ? productionOpsKeys.ordenesTrabajoFiltered(params) : productionOpsKeys.ordenesTrabajo(),
    queryFn: () => productionOpsApi.ordenTrabajo.getAll(params),
  });
}

export function useOrdenTrabajoById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.ordenTrabajoById(id),
    queryFn: () => productionOpsApi.ordenTrabajo.getById(id),
    enabled: !!id,
  });
}

export function useCreateOrdenTrabajo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrdenTrabajoDTO) => productionOpsApi.ordenTrabajo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenesTrabajo() });
      toast.success('Orden de trabajo creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear orden de trabajo');
    },
  });
}

export function useUpdateOrdenTrabajo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrdenTrabajoDTO }) =>
      productionOpsApi.ordenTrabajo.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenesTrabajo() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenTrabajoById(id) });
      toast.success('Orden de trabajo actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar orden de trabajo');
    },
  });
}

export function useIniciarOrdenTrabajo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: IniciarOrdenTrabajoDTO }) =>
      productionOpsApi.ordenTrabajo.iniciar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenesTrabajo() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenTrabajoById(id) });
      toast.success('Orden de trabajo iniciada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al iniciar orden de trabajo');
    },
  });
}

export function useCompletarOrdenTrabajo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompletarOrdenTrabajoDTO }) =>
      productionOpsApi.ordenTrabajo.completar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenesTrabajo() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.ordenTrabajoById(id) });
      toast.success('Orden de trabajo completada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al completar orden de trabajo');
    },
  });
}

// Calibraciones

export function useCalibraciones(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.calibraciones(),
    queryFn: () => productionOpsApi.calibracion.getAll(params),
  });
}

export function useCalibracionById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.calibracionById(id),
    queryFn: () => productionOpsApi.calibracion.getById(id),
    enabled: !!id,
  });
}

export function useCreateCalibracion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCalibracionDTO) => productionOpsApi.calibracion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.calibraciones() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.equiposMedicion() });
      toast.success('Calibración registrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al registrar calibración');
    },
  });
}

// Paradas

export function useParadas(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.paradas(),
    queryFn: () => productionOpsApi.parada.getAll(params),
  });
}

export function useParadaById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.paradaById(id),
    queryFn: () => productionOpsApi.parada.getById(id),
    enabled: !!id,
  });
}

export function useCreateParada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateParadaDTO) => productionOpsApi.parada.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.paradas() });
      toast.success('Parada registrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al registrar parada');
    },
  });
}

export function useCerrarParada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: CerrarParadaDTO }) =>
      productionOpsApi.parada.cerrar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.paradas() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.paradaById(id) });
      toast.success('Parada cerrada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cerrar parada');
    },
  });
}

// ==================== PRODUCTO TERMINADO - CATÁLOGOS ====================

export function useTiposProducto(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.tiposProducto(),
    queryFn: () => productionOpsApi.tipoProducto.getAll(params),
  });
}

export function useTiposProductoActivos() {
  return useQuery({
    queryKey: [...productionOpsKeys.tiposProducto(), 'activos'],
    queryFn: () => productionOpsApi.tipoProducto.getActivos(),
  });
}

export function useEstadosLote(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.estadosLote(),
    queryFn: () => productionOpsApi.estadoLote.getAll(params),
  });
}

export function useEstadosLoteActivos() {
  return useQuery({
    queryKey: [...productionOpsKeys.estadosLote(), 'activos'],
    queryFn: () => productionOpsApi.estadoLote.getActivos(),
  });
}

// ==================== PRODUCTO TERMINADO - PRINCIPALES ====================

export function useProductosTerminados(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.productosTerminados(),
    queryFn: () => productionOpsApi.productoTerminado.getAll(params),
  });
}

export function useProductoTerminadoById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.productoTerminadoById(id),
    queryFn: () => productionOpsApi.productoTerminado.getById(id),
    enabled: !!id,
  });
}

export function useCreateProductoTerminado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductoTerminadoDTO) => productionOpsApi.productoTerminado.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.productosTerminados() });
      toast.success('Producto terminado creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear producto terminado');
    },
  });
}

// Stocks

export function useStocks(params?: any) {
  return useQuery({
    queryKey: params ? productionOpsKeys.stocksFiltered(params) : productionOpsKeys.stocks(),
    queryFn: () => productionOpsApi.stockProducto.getAll(params),
  });
}

export function useStockById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.stockById(id),
    queryFn: () => productionOpsApi.stockProducto.getById(id),
    enabled: !!id,
  });
}

export function useCreateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStockProductoDTO) => productionOpsApi.stockProducto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stocks() });
      toast.success('Stock creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear stock');
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStockProductoDTO }) =>
      productionOpsApi.stockProducto.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stocks() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stockById(id) });
      toast.success('Stock actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar stock');
    },
  });
}

export function useReservarCantidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReservarCantidadDTO }) =>
      productionOpsApi.stockProducto.reservar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stocks() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stockById(id) });
      toast.success('Cantidad reservada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al reservar cantidad');
    },
  });
}

export function useLiberarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LiberarReservaDTO }) =>
      productionOpsApi.stockProducto.liberarReserva(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stocks() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stockById(id) });
      toast.success('Reserva liberada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al liberar reserva');
    },
  });
}

export function useConsumirCantidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConsumirCantidadDTO }) =>
      productionOpsApi.stockProducto.consumir(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stocks() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stockById(id) });
      toast.success('Cantidad consumida exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al consumir cantidad');
    },
  });
}

// Liberaciones

export function useLiberaciones(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.liberaciones(),
    queryFn: () => productionOpsApi.liberacion.getAll(params),
  });
}

export function useLiberacionById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.liberacionById(id),
    queryFn: () => productionOpsApi.liberacion.getById(id),
    enabled: !!id,
  });
}

export function useCreateLiberacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLiberacionDTO) => productionOpsApi.liberacion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.liberaciones() });
      toast.success('Solicitud de liberación creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear liberación');
    },
  });
}

export function useAprobarLiberacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AprobarLiberacionDTO }) =>
      productionOpsApi.liberacion.aprobar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.liberaciones() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.liberacionById(id) });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stocks() });
      toast.success('Liberación aprobada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al aprobar liberación');
    },
  });
}

export function useRechazarLiberacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RechazarLiberacionDTO }) =>
      productionOpsApi.liberacion.rechazar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.liberaciones() });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.liberacionById(id) });
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.stocks() });
      toast.success('Liberación rechazada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al rechazar liberación');
    },
  });
}

// Certificados

export function useCertificados(params?: any) {
  return useQuery({
    queryKey: productionOpsKeys.certificados(),
    queryFn: () => productionOpsApi.certificadoCalidad.getAll(params),
  });
}

export function useCertificadoById(id: number) {
  return useQuery({
    queryKey: productionOpsKeys.certificadoById(id),
    queryFn: () => productionOpsApi.certificadoCalidad.getById(id),
    enabled: !!id,
  });
}

export function useCreateCertificado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCertificadoCalidadDTO) => productionOpsApi.certificadoCalidad.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOpsKeys.certificados() });
      toast.success('Certificado de calidad creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear certificado');
    },
  });
}
