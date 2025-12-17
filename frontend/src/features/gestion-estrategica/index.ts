/**
 * Index principal del módulo Dirección Estratégica
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Arquitectura: Cada tab tiene su propia página (sin redundancia de tabs)
 * - ConfiguracionPage: Módulos, Branding, Consecutivos
 * - OrganizacionPage: Estructura, Cargos, Roles, Permisos
 * - IdentidadPage: Misión, Visión, Valores, Política
 * - PlaneacionPage: Plan Estratégico, Objetivos BSC
 */

// Páginas individuales por tab (cada tab = ruta separada)
export { ConfiguracionPage } from './pages/ConfiguracionPage';
export { OrganizacionPage } from './pages/OrganizacionPage';
export { IdentidadPage } from './pages/IdentidadPage';
export { PlaneacionPage } from './pages/PlaneacionPage';

// Componentes
export * from './components';

// Hooks
export * from './hooks';

// API
export * from './api';

// Types
export * from './types';
