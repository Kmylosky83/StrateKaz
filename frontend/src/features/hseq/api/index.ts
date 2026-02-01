/**
 * API Client Index - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Exporta todos los API clients del módulo HSEQ
 */

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
