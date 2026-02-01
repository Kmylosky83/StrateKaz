/**
 * React Query Hooks para Logistics Fleet Management
 * Sistema de Gestion de Flota y Transporte
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logisticsFleetAPI } from '../api/logisticsFleetApi';
import type {
  // Vehiculos
  CreateVehiculoDTO,
  UpdateVehiculoDTO,
  VehiculoFilters,
  // Mantenimientos
  CreateMantenimientoDTO,
  MantenimientoFilters,
  // Rutas
  CreateRutaDTO,
  RutaFilters,
  // Conductores
  CreateConductorDTO,
  ConductorFilters,
  // Despachos
  CreateDespachoDTO,
  DespachoFilters,
} from '../types/logistics-fleet.types';

// ==================== CATALOGOS FLOTA ====================

/**
 * Hook para obtener tipos de vehiculos
 */
export function useTiposVehiculo() {
  return useQuery({
    queryKey: ['tipos-vehiculo'],
    queryFn: () => logisticsFleetAPI.getTiposVehiculo(),
    staleTime: Infinity, // No cambian frecuentemente
  });
}

/**
 * Hook para obtener estados de vehiculos
 */
export function useEstadosVehiculo() {
  return useQuery({
    queryKey: ['estados-vehiculo'],
    queryFn: () => logisticsFleetAPI.getEstadosVehiculo(),
    staleTime: Infinity, // No cambian frecuentemente
  });
}

// ==================== VEHICULOS ====================

/**
 * Hook para obtener lista de vehiculos
 */
export function useVehiculos(filters?: VehiculoFilters) {
  return useQuery({
    queryKey: ['vehiculos', filters],
    queryFn: () => logisticsFleetAPI.getVehiculos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un vehiculo especifico
 */
export function useVehiculo(id: number | null) {
  return useQuery({
    queryKey: ['vehiculo', id],
    queryFn: () => logisticsFleetAPI.getVehiculo(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para crear un vehiculo
 */
export function useCreateVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVehiculoDTO) => logisticsFleetAPI.createVehiculo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-flota'] });
    },
  });
}

/**
 * Hook para actualizar un vehiculo
 */
export function useUpdateVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVehiculoDTO }) =>
      logisticsFleetAPI.updateVehiculo(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
      queryClient.invalidateQueries({ queryKey: ['vehiculo', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-flota'] });
    },
  });
}

/**
 * Hook para eliminar un vehiculo
 */
export function useDeleteVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => logisticsFleetAPI.deleteVehiculo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-flota'] });
    },
  });
}

/**
 * Hook para obtener vehiculos con documentos vencidos
 */
export function useVehiculosVencidos() {
  return useQuery({
    queryKey: ['vehiculos-vencidos'],
    queryFn: () => logisticsFleetAPI.getVehiculosVencidos(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener dashboard de flota
 */
export function useDashboardFlota() {
  return useQuery({
    queryKey: ['dashboard-flota'],
    queryFn: () => logisticsFleetAPI.getDashboardFlota(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ==================== DOCUMENTOS ====================

/**
 * Hook para obtener documentos de un vehiculo
 */
export function useDocumentosVehiculo(vehiculoId: number | null) {
  return useQuery({
    queryKey: ['documentos-vehiculo', vehiculoId],
    queryFn: () => logisticsFleetAPI.getDocumentosVehiculo(vehiculoId!),
    enabled: vehiculoId !== null,
  });
}

/**
 * Hook para crear documento de vehiculo
 */
export function useCreateDocumentoVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => logisticsFleetAPI.createDocumentoVehiculo(data),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-vehiculo', newDoc.vehiculo] });
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
      queryClient.invalidateQueries({ queryKey: ['vehiculo', newDoc.vehiculo] });
    },
  });
}

/**
 * Hook para eliminar documento de vehiculo
 */
export function useDeleteDocumentoVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => logisticsFleetAPI.deleteDocumentoVehiculo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-vehiculo'] });
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
    },
  });
}

// ==================== HOJA DE VIDA ====================

/**
 * Hook para obtener hoja de vida de un vehiculo
 */
export function useHojaVidaVehiculo(vehiculoId: number | null) {
  return useQuery({
    queryKey: ['hoja-vida-vehiculo', vehiculoId],
    queryFn: () => logisticsFleetAPI.getHojaVidaVehiculo(vehiculoId!),
    enabled: vehiculoId !== null,
  });
}

/**
 * Hook para crear registro en hoja de vida
 */
export function useCreateHojaVidaVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => logisticsFleetAPI.createHojaVidaVehiculo(data),
    onSuccess: (newRecord) => {
      queryClient.invalidateQueries({ queryKey: ['hoja-vida-vehiculo', newRecord.vehiculo] });
    },
  });
}

// ==================== MANTENIMIENTOS ====================

/**
 * Hook para obtener lista de mantenimientos
 */
export function useMantenimientos(filters?: MantenimientoFilters) {
  return useQuery({
    queryKey: ['mantenimientos', filters],
    queryFn: () => logisticsFleetAPI.getMantenimientos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un mantenimiento especifico
 */
export function useMantenimiento(id: number | null) {
  return useQuery({
    queryKey: ['mantenimiento', id],
    queryFn: () => logisticsFleetAPI.getMantenimiento(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para crear un mantenimiento
 */
export function useCreateMantenimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMantenimientoDTO) =>
      logisticsFleetAPI.createMantenimiento(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-flota'] });
    },
  });
}

/**
 * Hook para actualizar un mantenimiento
 */
export function useUpdateMantenimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMantenimientoDTO> }) =>
      logisticsFleetAPI.updateMantenimiento(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      queryClient.invalidateQueries({ queryKey: ['mantenimiento', variables.id] });
    },
  });
}

/**
 * Hook para completar un mantenimiento
 */
export function useCompletarMantenimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        fecha_ejecucion: string;
        costo_mano_obra?: number;
        costo_repuestos?: number;
        proveedor_nombre?: string;
        factura_numero?: string;
      };
    }) => logisticsFleetAPI.completarMantenimiento(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      queryClient.invalidateQueries({ queryKey: ['mantenimiento', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-flota'] });
    },
  });
}

// ==================== COSTOS OPERACION ====================

/**
 * Hook para obtener costos de operacion
 */
export function useCostosOperacion(filters?: {
  vehiculo?: number;
  tipo_costo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: ['costos-operacion', filters],
    queryFn: () => logisticsFleetAPI.getCostosOperacion(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para crear costo de operacion
 */
export function useCreateCostoOperacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => logisticsFleetAPI.createCostoOperacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costos-operacion'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-costos'] });
    },
  });
}

/**
 * Hook para obtener estadisticas de costos
 */
export function useEstadisticasCostos(filters?: {
  vehiculo?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}) {
  return useQuery({
    queryKey: ['estadisticas-costos', filters],
    queryFn: () => logisticsFleetAPI.getEstadisticasCostos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ==================== VERIFICACIONES PESV ====================

/**
 * Hook para obtener verificaciones
 */
export function useVerificaciones(filters?: {
  vehiculo?: number;
  tipo?: string;
  resultado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: ['verificaciones', filters],
    queryFn: () => logisticsFleetAPI.getVerificaciones(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para crear verificacion
 */
export function useCreateVerificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => logisticsFleetAPI.createVerificacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificaciones'] });
    },
  });
}

// ==================== CATALOGOS TRANSPORTE ====================

/**
 * Hook para obtener tipos de rutas
 */
export function useTiposRuta() {
  return useQuery({
    queryKey: ['tipos-ruta'],
    queryFn: () => logisticsFleetAPI.getTiposRuta(),
    staleTime: Infinity, // No cambian frecuentemente
  });
}

/**
 * Hook para obtener estados de despacho
 */
export function useEstadosDespacho() {
  return useQuery({
    queryKey: ['estados-despacho'],
    queryFn: () => logisticsFleetAPI.getEstadosDespacho(),
    staleTime: Infinity, // No cambian frecuentemente
  });
}

// ==================== RUTAS ====================

/**
 * Hook para obtener lista de rutas
 */
export function useRutas(filters?: RutaFilters) {
  return useQuery({
    queryKey: ['rutas', filters],
    queryFn: () => logisticsFleetAPI.getRutas(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener una ruta especifica
 */
export function useRuta(id: number | null) {
  return useQuery({
    queryKey: ['ruta', id],
    queryFn: () => logisticsFleetAPI.getRuta(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para crear una ruta
 */
export function useCreateRuta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRutaDTO) => logisticsFleetAPI.createRuta(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
    },
  });
}

/**
 * Hook para actualizar una ruta
 */
export function useUpdateRuta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateRutaDTO> }) =>
      logisticsFleetAPI.updateRuta(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      queryClient.invalidateQueries({ queryKey: ['ruta', variables.id] });
    },
  });
}

/**
 * Hook para eliminar una ruta
 */
export function useDeleteRuta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => logisticsFleetAPI.deleteRuta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
    },
  });
}

// ==================== CONDUCTORES ====================

/**
 * Hook para obtener lista de conductores
 */
export function useConductores(filters?: ConductorFilters) {
  return useQuery({
    queryKey: ['conductores', filters],
    queryFn: () => logisticsFleetAPI.getConductores(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un conductor especifico
 */
export function useConductor(id: number | null) {
  return useQuery({
    queryKey: ['conductor', id],
    queryFn: () => logisticsFleetAPI.getConductor(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para crear un conductor
 */
export function useCreateConductor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConductorDTO) => logisticsFleetAPI.createConductor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conductores'] });
    },
  });
}

/**
 * Hook para actualizar un conductor
 */
export function useUpdateConductor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateConductorDTO> }) =>
      logisticsFleetAPI.updateConductor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conductores'] });
      queryClient.invalidateQueries({ queryKey: ['conductor', variables.id] });
    },
  });
}

/**
 * Hook para eliminar un conductor
 */
export function useDeleteConductor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => logisticsFleetAPI.deleteConductor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conductores'] });
    },
  });
}

/**
 * Hook para obtener conductores con licencia vencida
 */
export function useConductoresLicenciaVencida() {
  return useQuery({
    queryKey: ['conductores-licencia-vencida'],
    queryFn: () => logisticsFleetAPI.getConductoresLicenciaVencida(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ==================== PROGRAMACIONES ====================

/**
 * Hook para obtener lista de programaciones
 */
export function useProgramaciones(filters?: {
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;
  vehiculo?: number;
  conductor?: number;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: ['programaciones', filters],
    queryFn: () => logisticsFleetAPI.getProgramaciones(filters),
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para obtener una programacion especifica
 */
export function useProgramacion(id: number | null) {
  return useQuery({
    queryKey: ['programacion', id],
    queryFn: () => logisticsFleetAPI.getProgramacion(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para crear una programacion
 */
export function useCreateProgramacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => logisticsFleetAPI.createProgramacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] });
    },
  });
}

/**
 * Hook para actualizar una programacion
 */
export function useUpdateProgramacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      logisticsFleetAPI.updateProgramacion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] });
      queryClient.invalidateQueries({ queryKey: ['programacion', variables.id] });
    },
  });
}

/**
 * Hook para iniciar viaje
 */
export function useIniciarViaje() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, km_inicial }: { id: number; km_inicial: number }) =>
      logisticsFleetAPI.iniciarViaje(id, { km_inicial }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] });
      queryClient.invalidateQueries({ queryKey: ['programacion', variables.id] });
    },
  });
}

/**
 * Hook para finalizar viaje
 */
export function useFinalizarViaje() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      km_final,
      observaciones,
    }: {
      id: number;
      km_final: number;
      observaciones?: string;
    }) => logisticsFleetAPI.finalizarViaje(id, { km_final, observaciones }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] });
      queryClient.invalidateQueries({ queryKey: ['programacion', variables.id] });
    },
  });
}

// ==================== DESPACHOS ====================

/**
 * Hook para obtener lista de despachos
 */
export function useDespachos(filters?: DespachoFilters) {
  return useQuery({
    queryKey: ['despachos', filters],
    queryFn: () => logisticsFleetAPI.getDespachos(filters),
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para obtener un despacho especifico
 */
export function useDespacho(id: number | null) {
  return useQuery({
    queryKey: ['despacho', id],
    queryFn: () => logisticsFleetAPI.getDespacho(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para crear un despacho
 */
export function useCreateDespacho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDespachoDTO) => logisticsFleetAPI.createDespacho(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] });
    },
  });
}

/**
 * Hook para actualizar un despacho
 */
export function useUpdateDespacho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateDespachoDTO> }) =>
      logisticsFleetAPI.updateDespacho(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['despachos'] });
      queryClient.invalidateQueries({ queryKey: ['despacho', variables.id] });
    },
  });
}

/**
 * Hook para obtener detalles de un despacho
 */
export function useDetallesDespacho(despachoId: number | null) {
  return useQuery({
    queryKey: ['detalles-despacho', despachoId],
    queryFn: () => logisticsFleetAPI.getDetallesDespacho(despachoId!),
    enabled: despachoId !== null,
  });
}

/**
 * Hook para agregar detalle a despacho
 */
export function useAddDetalleDespacho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => logisticsFleetAPI.addDetalleDespacho(data),
    onSuccess: (newDetalle) => {
      queryClient.invalidateQueries({ queryKey: ['detalles-despacho', newDetalle.despacho] });
      queryClient.invalidateQueries({ queryKey: ['despacho', newDetalle.despacho] });
    },
  });
}

// ==================== MANIFIESTOS ====================

/**
 * Hook para obtener lista de manifiestos
 */
export function useManifiestos(filters?: {
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: ['manifiestos', filters],
    queryFn: () => logisticsFleetAPI.getManifiestos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un manifiesto especifico
 */
export function useManifiesto(id: number | null) {
  return useQuery({
    queryKey: ['manifiesto', id],
    queryFn: () => logisticsFleetAPI.getManifiesto(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para crear un manifiesto
 */
export function useCreateManifiesto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => logisticsFleetAPI.createManifiesto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manifiestos'] });
    },
  });
}

/**
 * Hook para generar PDF del manifiesto
 */
export function useGenerarPDFManifiesto() {
  return useMutation({
    mutationFn: (id: number) => logisticsFleetAPI.generarPDFManifiesto(id),
  });
}
