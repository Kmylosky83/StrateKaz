/**
 * Exportaciones del modulo RBAC (Roles y Permisos) v3.3.0
 *
 * Este archivo resuelve los imports cross-feature.
 * CargosTab proviene de configuracion/ pero se re-exporta aqui
 * para que OrganizacionTab.tsx pueda importarlo sin dependencias cross-feature.
 *
 * RolesPermisosWrapper se exporta como RolesTab para compatibilidad con OrganizacionTab.
 */

// Re-export de CargosTab desde configuracion (legacy)
export { CargosTab } from '@/features/configuracion/components/CargosTab';

// RolesPermisosWrapper (renombrado) - exportado como RolesTab para compatibilidad
export { RolesPermisosWrapper as RolesTab } from './RolesPermisosWrapper';

// SubTabs internos
export { PermisosCargoSubTab } from './PermisosCargoSubTab';
export { RolesAdicionalesSubTab } from './RolesAdicionalesSubTab';
export { TodosPermisosSubTab } from './TodosPermisosSubTab';
