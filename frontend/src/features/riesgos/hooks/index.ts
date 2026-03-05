/**
 * Exportacion centralizada de hooks - Motor de Riesgos
 */
export * from './useContexto';
export * from './useRiesgos';
export * from './useIPEVR';

// Aspectos Ambientales (ISO 14001)
export * from './useAspectosAmbientales';

// Riesgos Viales PESV (Resolucion 40595/2022)
// Exportar con namespace para evitar conflicto con useRiesgosCriticos de useRiesgos
export {
  // Query Keys
  riesgosVialesKeys,
  // Factores
  useFactoresRiesgoVial,
  useFactorRiesgoVial,
  useFactoresPorPilar,
  useCreateFactorRiesgoVial,
  useUpdateFactorRiesgoVial,
  useDeleteFactorRiesgoVial,
  // Riesgos Viales
  useRiesgosViales,
  useRiesgoVial,
  useEstadisticasRiesgosViales,
  useRiesgosCriticos as useRiesgosVialesCriticos,
  useRiesgosPorPilar,
  useCreateRiesgoVial,
  useUpdateRiesgoVial,
  useDeleteRiesgoVial,
  // Controles
  useControlesViales,
  useControlVial,
  useControlesAtrasados,
  useControlesPorRiesgo,
  useCreateControlVial,
  useUpdateControlVial,
  useDeleteControlVial,
  // Incidentes
  useIncidentesViales,
  useIncidenteVial,
  useEstadisticasIncidentesViales,
  useIncidentesGraves,
  useCreateIncidenteVial,
  useUpdateIncidenteVial,
  useDeleteIncidenteVial,
  useIniciarInvestigacion,
  // Inspecciones
  useInspeccionesVehiculo,
  useInspeccionVehiculo,
  useInspeccionesPorPlaca,
  useUltimaInspeccion,
  useCreateInspeccionVehiculo,
  useUpdateInspeccionVehiculo,
  useDeleteInspeccionVehiculo,
} from './useRiesgosViales';
