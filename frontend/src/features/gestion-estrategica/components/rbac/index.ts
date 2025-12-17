/**
 * Exportaciones del módulo RBAC (Roles y Permisos)
 *
 * IMPORTANTE: Este archivo resuelve los imports cross-feature.
 * CargosTab proviene de configuracion/ (legacy) pero se re-exporta aquí
 * para que OrganizacionTab.tsx pueda importarlo sin dependencias cross-feature.
 */

// Re-export de CargosTab desde configuracion (legacy)
export { CargosTab } from '@/features/configuracion/components/CargosTab';

// RolesTab local (wrapper con subtabs) - usado en OrganizacionTab
export { RolesTab } from './RolesTab';

// SubTabs internos
export { PermisosCargoSubTab } from './PermisosCargoSubTab';
export { RolesAdicionalesSubTab } from './RolesAdicionalesSubTab';
export { TodosPermisosSubTab } from './TodosPermisosSubTab';
