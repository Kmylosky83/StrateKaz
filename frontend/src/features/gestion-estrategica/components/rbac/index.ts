/**
 * Exportaciones del módulo RBAC (Roles y Permisos)
 *
 * IMPORTANTE: Este archivo resuelve los imports cross-feature.
 * CargosTab proviene de configuracion/ (legacy) pero se re-exporta aquí
 * para que OrganizacionTab.tsx pueda importarlo sin dependencias cross-feature.
 *
 * RESOLUCIÓN DE DUPLICADOS:
 * - RolesTab → RolesPermisosWrapper: Renombrado para evitar conflicto con
 *   configuracion/RolesTab.tsx (componente legacy de 832 líneas que no se usa)
 * - Se exporta como RolesTab para mantener compatibilidad con OrganizacionTab
 */

// Re-export de CargosTab desde configuracion (legacy)
export { CargosTab } from '@/features/configuracion/components/CargosTab';

// RolesPermisosWrapper (renombrado) - exportado como RolesTab para compatibilidad
export { RolesPermisosWrapper as RolesTab } from './RolesPermisosWrapper';

// SubTabs internos
export { PermisosCargoSubTab } from './PermisosCargoSubTab';
export { RolesAdicionalesSubTab } from './RolesAdicionalesSubTab';
export { TodosPermisosSubTab } from './TodosPermisosSubTab';
