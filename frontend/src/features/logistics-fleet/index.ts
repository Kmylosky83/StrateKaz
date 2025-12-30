/**
 * Logistics Fleet Management Module - Exports
 * Sistema de Gestion de Flota y Transporte
 */

// Pages
export { default as LogisticsFleetPage } from './pages/LogisticsFleetPage';

// Components
export { GestionFlotaTab } from './components/GestionFlotaTab';
export { GestionTransporteTab } from './components/GestionTransporteTab';

// API
export { logisticsFleetAPI } from './api/logisticsFleetApi';

// Hooks - Flota
export {
  useTiposVehiculo,
  useEstadosVehiculo,
  useVehiculos,
  useVehiculo,
  useCreateVehiculo,
  useUpdateVehiculo,
  useDeleteVehiculo,
  useVehiculosVencidos,
  useDashboardFlota,
  useDocumentosVehiculo,
  useCreateDocumentoVehiculo,
  useDeleteDocumentoVehiculo,
  useHojaVidaVehiculo,
  useCreateHojaVidaVehiculo,
  useMantenimientos,
  useMantenimiento,
  useCreateMantenimiento,
  useUpdateMantenimiento,
  useCompletarMantenimiento,
  useCostosOperacion,
  useCreateCostoOperacion,
  useEstadisticasCostos,
  useVerificaciones,
  useCreateVerificacion,
} from './hooks/useLogisticsFleet';

// Hooks - Transporte
export {
  useTiposRuta,
  useEstadosDespacho,
  useRutas,
  useRuta,
  useCreateRuta,
  useUpdateRuta,
  useDeleteRuta,
  useConductores,
  useConductor,
  useCreateConductor,
  useUpdateConductor,
  useDeleteConductor,
  useConductoresLicenciaVencida,
  useProgramaciones,
  useProgramacion,
  useCreateProgramacion,
  useUpdateProgramacion,
  useIniciarViaje,
  useFinalizarViaje,
  useDespachos,
  useDespacho,
  useCreateDespacho,
  useUpdateDespacho,
  useDetallesDespacho,
  useAddDetalleDespacho,
  useManifiestos,
  useManifiesto,
  useCreateManifiesto,
  useGenerarPDFManifiesto,
} from './hooks/useLogisticsFleet';

// Types - Catalogos Flota
export type {
  CategoriaLicencia,
  TipoVehiculo,
  EstadoVehiculo,
} from './types/logistics-fleet.types';

// Types - Vehiculos
export type {
  Vehiculo,
  VehiculoList,
  CreateVehiculoDTO,
  UpdateVehiculoDTO,
  VehiculoFilters,
  PaginatedVehiculosResponse,
} from './types/logistics-fleet.types';

// Types - Documentos
export type {
  TipoDocumentoVehiculo,
  DocumentoVehiculo,
} from './types/logistics-fleet.types';

// Types - Hoja de Vida
export type {
  TipoEventoVehiculo,
  HojaVidaVehiculo,
} from './types/logistics-fleet.types';

// Types - Mantenimientos
export type {
  TipoMantenimiento,
  EstadoMantenimiento,
  MantenimientoVehiculo,
  CreateMantenimientoDTO,
  MantenimientoFilters,
  PaginatedMantenimientosResponse,
} from './types/logistics-fleet.types';

// Types - Costos
export type {
  TipoCostoOperacion,
  CostoOperacion,
  PaginatedCostosResponse,
} from './types/logistics-fleet.types';

// Types - Verificaciones PESV
export type {
  TipoVerificacion,
  ResultadoVerificacion,
  ChecklistItem,
  VerificacionTercero,
  PaginatedVerificacionesResponse,
} from './types/logistics-fleet.types';

// Types - Catalogos Transporte
export type {
  TipoRuta,
  EstadoDespacho,
} from './types/logistics-fleet.types';

// Types - Rutas
export type {
  PuntoIntermedio,
  Ruta,
  CreateRutaDTO,
  RutaFilters,
  PaginatedRutasResponse,
} from './types/logistics-fleet.types';

// Types - Conductores
export type {
  TipoDocumentoConductor,
  CategoriaLicenciaConductor,
  Conductor,
  CreateConductorDTO,
  ConductorFilters,
  PaginatedConductoresResponse,
} from './types/logistics-fleet.types';

// Types - Programaciones
export type {
  EstadoProgramacion,
  ProgramacionRuta,
  PaginatedProgramacionesResponse,
} from './types/logistics-fleet.types';

// Types - Despachos
export type {
  Despacho,
  CreateDespachoDTO,
  DespachoFilters,
  PaginatedDespachosResponse,
  DetalleDespacho,
} from './types/logistics-fleet.types';

// Types - Manifiestos
export type {
  Manifiesto,
  PaginatedManifiestosResponse,
} from './types/logistics-fleet.types';

// Types - Common
export type {
  PaginatedResponse,
  SelectOption,
} from './types/logistics-fleet.types';

// Constants & Labels
export {
  TipoMantenimientoLabels,
  EstadoMantenimientoLabels,
  EstadoProgramacionLabels,
  EstadoProgramacionColors,
} from './types/logistics-fleet.types';
