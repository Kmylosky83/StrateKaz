/**
 * Barrel export para tipos de Dirección Estratégica
 *
 * Organizado por submódulo para facilitar imports selectivos.
 *
 * NOTA: Los módulos específicos (kpi.types, gestion-cambio.types, revision-direccion.types)
 * tienen definiciones más completas que las legacy en strategic.types.ts.
 * Se recomienda importar directamente de los archivos específicos cuando sea necesario.
 */

// Core estratégico (tipos base: planes, objetivos, identidad, sedes, integraciones)
export * from './strategic.types';

// Módulos del sistema
export * from './modules.types';

// Organización (Normas ISO, Unidades, Consecutivos)
export * from './organizacion.types';

// Gestión de Proyectos PMI
export * from './proyectos.types';

// Encuestas Colaborativas DOFA
export * from './encuestas.types';

// Contexto Organizacional (DOFA, PESTEL, Porter, TOWS)
export * from './contexto.types';

// Mapa Estratégico
export * from './mapa-estrategico.types';

// Políticas
export * from './policies.types';

// Organigrama
export * from './organigrama.types';

// RBAC
export * from './rbac.types';

// Planificación del Sistema
export * from './planificacion-sistema.types';

// ==============================================================================
// MÓDULOS CON TIPOS ESPECÍFICOS (importar directamente para evitar conflictos)
// ==============================================================================

// KPIs y Analytics - Export selectivo (evitar conflicto con strategic.types)
export type {
  FrequencyKPI,
  ChartType,
  ChartEngine,
  CreateMedicionKPIDTO,
  UpdateMedicionKPIDTO,
} from './kpi.types';
export {
  CHART_ENGINE_CONFIG,
  CHART_TYPE_CONFIG,
  CHART_COLOR_SCHEMES,
  SEMAFORO_COLORS,
  BSC_COLORS,
  FREQUENCY_CONFIG,
  TREND_TYPE_CONFIG,
  SEMAFORO_CONFIG,
  UNIT_OPTIONS,
  calculateProgress,
  getProgressColor,
  getBSCColor,
  formatValue,
  calculateDelta,
  isDeltaPositive,
} from './kpi.types';

// Gestión del Cambio - Export selectivo (evitar conflicto con strategic.types)
export type { GestionCambioStats } from './gestion-cambio.types';
export { PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG } from './gestion-cambio.types';

// Revisión por Dirección - Export selectivo (evitar conflicto con strategic.types)
export type {
  FrecuenciaRevision,
  EstadoProgramacion,
  EstadoActa,
  AsistenciaEstado,
  TipoDecision,
  EntradaCategoria,
  ProgramacionRevision,
  ParticipanteConvocado,
  ActaRevision,
  ParticipanteActa,
  ElementoEntrada,
  DecisionResultado,
  CompromisoAccion,
  AnexoActa,
  CreateProgramacionRevisionDTO,
  UpdateProgramacionRevisionDTO,
  CreateParticipanteConvocadoDTO,
  CreateActaRevisionDTO,
  UpdateActaRevisionDTO,
  CreateParticipanteActaDTO,
  CreateElementoEntradaDTO,
  CreateDecisionResultadoDTO,
  CreateCompromisoAccionDTO,
  UpdateCompromisoDTO as UpdateCompromisoRevisionDTO,
  AprobarActaDTO,
  ProgramacionFilters,
  ActaFilters,
  CompromisoFilters as CompromisoRevisionFilters,
  RevisionDireccionStats,
  DashboardRevision,
} from './revision-direccion.types';

// Gestión Documental
export type {
  NivelDocumento,
  TipoPlantilla,
  EstadoPlantilla,
  EstadoDocumento,
  ClasificacionDocumento,
  TipoCambioVersion,
  TipoCampoFormulario,
  TipoControl,
  MedioDistribucion,
  TipoDocumento,
  PlantillaDocumento,
  Documento,
  VersionDocumento,
  CampoFormulario,
  ControlDocumental,
  ColumnaTabla,
  CondicionVisibilidad,
  ConfirmacionRecepcion,
  CreateTipoDocumentoDTO,
  CreatePlantillaDocumentoDTO,
  CreateDocumentoDTO,
  CreateCampoFormularioDTO,
  CreateControlDocumentalDTO,
  UpdateTipoDocumentoDTO,
  UpdatePlantillaDocumentoDTO,
  UpdateDocumentoDTO,
  UpdateCampoFormularioDTO,
  UpdateControlDocumentalDTO,
  TipoDocumentoFilters,
  PlantillaDocumentoFilters,
  DocumentoFilters,
  ControlDocumentalFilters,
  AprobarDocumentoDTO,
  PublicarDocumentoDTO,
  ConfirmarRecepcionDTO,
  EstadisticasDocumentales,
} from './gestion-documental.types';
