/**
 * Constantes de módulos disponibles del sistema.
 *
 * Fuente de verdad única para módulos en PlanFormModal y TenantFormModal.
 * Las categorías reflejan exactamente los 6 grupos visuales del sidebar
 * (SIDEBAR_LAYERS en backend/apps/core/viewsets_config.py).
 */

export interface SystemModule {
  code: string;
  name: string;
  category: ModuleCategory;
}

/**
 * Categorías alineadas con SIDEBAR_LAYERS del backend.
 * NIVEL_C1  → Fundación
 * NIVEL_PE  → Planeación Estratégica
 * NIVEL_SGI → Sistema de Gestión (sistema_gestion + motor_cumplimiento + motor_riesgos)
 * NIVEL_OPS → Operaciones (hseq + supply_chain + production_ops + logistics + sales + workflow)
 * NIVEL_ORG → Organización (talent_hub + admin_finance + accounting)
 * NIVEL_C3  → Inteligencia (analytics + revision_direccion + audit_system)
 */
export type ModuleCategory =
  | 'NIVEL_C1'
  | 'NIVEL_PE'
  | 'NIVEL_SGI'
  | 'NIVEL_OPS'
  | 'NIVEL_ORG'
  | 'NIVEL_C3';

/**
 * Lista completa de módulos del sistema StrateKaz.
 * Usada en PlanFormModal y TenantFormModal.
 * Orden y agrupación espeja SIDEBAR_LAYERS.
 */
export const AVAILABLE_MODULES: SystemModule[] = [
  // NIVEL_C1 — Fundación (C1)
  { code: 'fundacion', name: 'Fundación', category: 'NIVEL_C1' },

  // NIVEL_PE — Planeación Estratégica (C2)
  { code: 'planeacion_estrategica', name: 'Planeación Estratégica', category: 'NIVEL_PE' },

  // NIVEL_SGI — Sistema de Gestión (C2)
  { code: 'sistema_gestion', name: 'Sistema de Gestión', category: 'NIVEL_SGI' },
  { code: 'motor_cumplimiento', name: 'Cumplimiento Normativo', category: 'NIVEL_SGI' },
  { code: 'motor_riesgos', name: 'Motor de Riesgos', category: 'NIVEL_SGI' },

  // NIVEL_OPS — Operaciones (C2)
  { code: 'hseq_management', name: 'Gestión Integral HSEQ', category: 'NIVEL_OPS' },
  { code: 'supply_chain', name: 'Cadena de Suministro', category: 'NIVEL_OPS' },
  { code: 'production_ops', name: 'Base de Operaciones', category: 'NIVEL_OPS' },
  { code: 'logistics_fleet', name: 'Logística y Flota', category: 'NIVEL_OPS' },
  { code: 'sales_crm', name: 'Ventas y CRM', category: 'NIVEL_OPS' },
  { code: 'workflow_engine', name: 'Flujos de Trabajo', category: 'NIVEL_OPS' },

  // NIVEL_ORG — Organización (C2)
  { code: 'talent_hub', name: 'Centro de Talento', category: 'NIVEL_ORG' },
  { code: 'admin_finance', name: 'Administración', category: 'NIVEL_ORG' },
  { code: 'accounting', name: 'Contabilidad', category: 'NIVEL_ORG' },

  // NIVEL_C3 — Inteligencia (C3)
  { code: 'analytics', name: 'Inteligencia de Negocios', category: 'NIVEL_C3' },
  { code: 'revision_direccion', name: 'Revisión por la Dirección', category: 'NIVEL_C3' },
  { code: 'audit_system', name: 'Centro de Control', category: 'NIVEL_C3' },
];

/** Módulos habilitados por defecto para nuevos tenants */
export const DEFAULT_ENABLED_MODULES = [
  'fundacion',
  'planeacion_estrategica',
  'sistema_gestion',
  'motor_cumplimiento',
  'hseq_management',
];
