/**
 * Index de componentes del módulo Dirección Estratégica
 */

// Tabs principales
export { IdentidadTab } from './IdentidadTab';
export { PlaneacionTab } from './PlaneacionTab';
export { OrganizacionTab } from './OrganizacionTab';
export { ConfiguracionTab } from './ConfiguracionTab';

// Modales
export * from './modals';

// Integraciones Externas
export { IntegracionesSection } from './IntegracionesSection';
export { IntegracionFormModal } from './modals/IntegracionFormModal';
export { IntegracionStatusBadge, calculateHealthStatus } from './IntegracionStatusBadge';
export { TestConnectionButton } from './TestConnectionButton';
export { CredencialesEditor } from './CredencialesEditor';

// Types
export type {
  IntegracionHealthStatus,
  IntegracionStatusBadgeProps,
} from './IntegracionStatusBadge';
export type { TestConnectionButtonProps } from './TestConnectionButton';
export type { MetodoAutenticacion, CredencialesData } from './CredencialesEditor';
