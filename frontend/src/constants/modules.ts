/**
 * Constantes de módulos disponibles del sistema.
 *
 * Fuente de verdad única para módulos en PlanFormModal y TenantFormModal.
 */

export interface SystemModule {
  code: string;
  name: string;
  category: ModuleCategory;
}

export type ModuleCategory =
  | 'STRATEGIC'
  | 'COMPLIANCE'
  | 'INTEGRATED'
  | 'OPERATIONAL'
  | 'SUPPORT'
  | 'INTELLIGENCE';

/**
 * Lista completa de módulos del sistema StrateKaz.
 * Usada en PlanFormModal y TenantFormModal.
 */
export const AVAILABLE_MODULES: SystemModule[] = [
  // C1 — Fundación
  { code: 'fundacion', name: 'Fundación', category: 'STRATEGIC' },
  // C2 — Módulos de Negocio
  { code: 'planeacion_estrategica', name: 'Planeación Estratégica', category: 'STRATEGIC' },
  { code: 'sistema_gestion', name: 'Sistema de Gestión', category: 'STRATEGIC' },
  { code: 'motor_cumplimiento', name: 'Cumplimiento Normativo', category: 'COMPLIANCE' },
  { code: 'motor_riesgos', name: 'Motor de Riesgos', category: 'COMPLIANCE' },
  { code: 'workflow_engine', name: 'Flujos de Trabajo', category: 'COMPLIANCE' },
  { code: 'hseq_management', name: 'Gestión Integral HSEQ', category: 'INTEGRATED' },
  { code: 'supply_chain', name: 'Cadena de Suministro', category: 'OPERATIONAL' },
  { code: 'production_ops', name: 'Base de Operaciones', category: 'OPERATIONAL' },
  { code: 'logistics_fleet', name: 'Logística y Flota', category: 'OPERATIONAL' },
  { code: 'sales_crm', name: 'Ventas y CRM', category: 'OPERATIONAL' },
  { code: 'talent_hub', name: 'Centro de Talento', category: 'SUPPORT' },
  { code: 'admin_finance', name: 'Administración', category: 'SUPPORT' },
  { code: 'accounting', name: 'Contabilidad', category: 'SUPPORT' },
  // C3 — Inteligencia
  { code: 'analytics', name: 'Inteligencia de Negocios', category: 'INTELLIGENCE' },
  { code: 'revision_direccion', name: 'Revisión por la Dirección', category: 'INTELLIGENCE' },
  { code: 'audit_system', name: 'Centro de Control', category: 'INTELLIGENCE' },
];

/** Módulos habilitados por defecto para nuevos tenants */
export const DEFAULT_ENABLED_MODULES = [
  'fundacion',
  'planeacion_estrategica',
  'sistema_gestion',
  'motor_cumplimiento',
  'hseq_management',
];
