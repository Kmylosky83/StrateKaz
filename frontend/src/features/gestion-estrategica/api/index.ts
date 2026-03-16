/**
 * Index de API del módulo Dirección Estratégica
 */
export * from './strategicApi';

// Gestión de Proyectos PMI
export * from './proyectosApi';

// Revision por Direccion (ISO 9.3)
export * from './revisionDireccionApi';

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

// Partes Interesadas (REORG-B4: extraído de contextoApi, URL /organizacion/)
export * from './partesInteresadasApi';

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
