/**
 * Exportación centralizada de hooks - Motor de Riesgos
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
  useResumenRiesgosViales,
  useRiesgosCriticos as useRiesgosVialesCriticos,
  useRiesgosAltos,
  useRiesgosSinControles,
  useRiesgosPorPilar,
  useCreateRiesgoVial,
  useUpdateRiesgoVial,
  useDeleteRiesgoVial,
  // Controles
  useControlesViales,
  useControlVial,
  useResumenControlesViales,
  useControlesAtrasados,
  useControlesIneficaces,
  useControlesPorRiesgo,
  useCreateControlVial,
  useUpdateControlVial,
  useDeleteControlVial,
  // Incidentes
  useIncidentesViales,
  useIncidenteVial,
  useResumenIncidentesViales,
  useIncidentesPendientesInvestigacion,
  useIncidentesGraves,
  useIncidentesPorRangoFechas,
  useCreateIncidenteVial,
  useUpdateIncidenteVial,
  useDeleteIncidenteVial,
  useIniciarInvestigacion,
  useCerrarInvestigacion,
  useReportarARL,
  // Inspecciones
  useInspeccionesVehiculo,
  useInspeccionVehiculo,
  useResumenInspeccionesVehiculo,
  useInspeccionesRechazadas,
  useInspeccionesPorPlaca,
  useUltimaInspeccion,
  usePuedeOperar,
  useCreateInspeccionVehiculo,
  useUpdateInspeccionVehiculo,
  useDeleteInspeccionVehiculo,
  // Estadisticas
  useEstadisticasPESV,
  useIndicadoresPESV,
  useTendenciasPESV,
  useDashboardPilares,
} from './useRiesgosViales';
