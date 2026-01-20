/**
 * Index de componentes del módulo Dirección Estratégica
 */

// Tabs principales
export { IdentidadTab } from './IdentidadTab';
export { PlaneacionTab } from './PlaneacionTab';
export { OrganizacionTab } from './OrganizacionTab';
export { ConfiguracionTab } from './ConfiguracionTab';

// Gestión de Proyectos PMI
export { GestionProyectosTab } from './proyectos';

// Revisión por Dirección (ISO 9.3)
export { GeneradorActaModal } from './revision-direccion/GeneradorActaModal';
export {
  RevisionDireccionTab,
  CompromisosDashboard,
  ProgramacionTab,
  ActasTab,
} from './revision-direccion';

// Modales
export * from './modals';

// Integraciones Externas
export { IntegracionesSection } from './IntegracionesSection';
export { IntegracionFormModal } from './modals/IntegracionFormModal';
export { IntegracionStatusBadge, calculateHealthStatus } from './IntegracionStatusBadge';
export { TestConnectionButton } from './TestConnectionButton';
export { CredencialesEditor } from './CredencialesEditor';

// Normas ISO
export { NormasISOSection } from './NormasISOSection';
export { NormaISOFormModal } from './modals/NormaISOFormModal';

// Types
export type {
  IntegracionHealthStatus,
  IntegracionStatusBadgeProps,
} from './IntegracionStatusBadge';
export type { TestConnectionButtonProps } from './TestConnectionButton';
export type { MetodoAutenticacion, CredencialesData } from './CredencialesEditor';
