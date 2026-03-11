/**
 * Módulo HSEQ Management
 *
 * 7 tabs operativos:
 * - Medicina Laboral
 * - Seguridad Industrial
 * - Higiene Industrial
 * - Gestión de Comités
 * - Accidentalidad
 * - Emergencias
 * - Gestión Ambiental
 *
 * NOTA: Calidad y Mejora Continua fueron migrados a Sistema de Gestión (NIVEL_SGI)
 */

// Página Principal
export { default as HSEQPage } from './pages/HSEQPage';

// Páginas de Módulos
export { default as MedicinaLaboralPage } from './pages/MedicinaLaboralPage';
export { default as SeguridadIndustrialPage } from './pages/SeguridadIndustrialPage';
export { default as HigieneIndustrialPage } from './pages/HigieneIndustrialPage';
export { default as GestionComitesPage } from './pages/GestionComitesPage';
export { default as AccidentalidadPage } from './pages/AccidentalidadPage';
export { default as EmergenciasPage } from './pages/EmergenciasPage';
export { default as GestionAmbientalPage } from './pages/GestionAmbientalPage';

// API Clients
export * from './api';

// Types
export * from './types';

// Hooks
export * from './hooks';
