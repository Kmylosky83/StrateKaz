/**
 * API Client Index - HSEQ Management
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Exporta todos los API clients del módulo HSEQ
 */

// Sistema Documental
export * from './sistemaDocumentalApi';

// Planificación
export * from './planificacionApi';

// Calidad
export * from './calidadApi';

// Medicina Laboral
export * from './medicinaLaboralApi';

// Seguridad Industrial
export * from './seguridadIndustrialApi';

// Accidentalidad (ATEL)
export * from './accidentalidadApi';

// Emergencias
export { default as emergenciasApi } from './emergenciasApi';

// Gestión Ambiental
export { default as gestionAmbientalApi } from './gestionAmbientalApi';

// Mejora Continua
export { default as mejoraContinuaApi } from './mejoraContinuaApi';

// Gestión de Comités
export { default as comitesApi } from './comitesApi';
