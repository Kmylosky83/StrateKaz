/**
 * Hooks Index - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Exporta todos los hooks del módulo HSEQ
 */

// Sistema Documental - MIGRADO a gestion-estrategica/gestion-documental
// import from '@/features/gestion-estrategica' instead

// Planificacion del Sistema - MIGRADO a gestion-estrategica/planificacion-sistema
// import from '@/features/gestion-estrategica' instead
// export * from './usePlanificacionSistema'; // DEPRECATED

// Planificación General
export * from './usePlanificacion';

// Calidad
export * from './useCalidad';

// Medicina Laboral
export * from './useMedicinaLaboral';

// Seguridad Industrial
export * from './useSeguridadIndustrial';

// Accidentalidad (ATEL)
export * from './useAccidentalidad';

// Emergencias
export * from './useEmergencias';

// Gestión Ambiental
export * from './useGestionAmbiental';

// Mejora Continua
export * from './useMejoraContinua';

// Gestión de Comités
export * from './useComites';
