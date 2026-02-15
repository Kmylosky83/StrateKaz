/**
 * Index de API del módulo Dirección Estratégica
 */
export * from './strategicApi';

// Gestión de Proyectos PMI
export * from './proyectosApi';

// Revision por Direccion (ISO 9.3)
export * from './revisionDireccionApi';

// Gestion Documental (migrado de HSEQ a N1)
export {
  tipoDocumentoApi,
  plantillaDocumentoApi,
  documentoApi,
  versionDocumentoApi,
  campoFormularioApi,
  controlDocumentalApi,
  default as gestionDocumentalApi,
} from './gestionDocumentalApi';

// Planificacion del Sistema (migrado de HSEQ a N1)
export {
  planTrabajoApi,
  actividadPlanApi,
  objetivoSistemaApi,
  programaGestionApi,
  actividadProgramaApi,
  seguimientoCronogramaApi,
} from './planificacionSistemaApi';

// Contexto Organizacional (DOFA, PESTEL, Porter, TOWS)
export * from './contextoApi';
export * from './encuestasApi';
export * from './mapaEstrategicoApi';

// KPIs y Seguimiento
export * from './kpisApi';

// Gestión del Cambio
export * from './gestionCambioApi';

// Organización (Areas)
export * from './organizacionApi';

// Roles Adicionales
export * from './rolesAdicionalesApi';
