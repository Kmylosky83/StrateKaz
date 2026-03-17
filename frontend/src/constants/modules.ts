/**
 * Constantes de módulos disponibles del sistema.
 *
 * Fuente de verdad única para módulos en PlanFormModal y TenantFormModal.
 * Las categorías reflejan los 10 grupos visuales del sidebar V2
 * (SIDEBAR_LAYERS en backend/apps/core/viewsets_config.py).
 *
 * Arquitectura Cascada V2.1 — 20 módulos organizados por ciclo PHVA + Transversal.
 */

export interface SystemModule {
  code: string;
  name: string;
  category: ModuleCategory;
}

/**
 * Categorías alineadas con SIDEBAR_LAYERS V2 del backend.
 * NIVEL_FUNDACION      → Fundación (C1)
 * NIVEL_INFRAESTRUCTURA → Gestión Documental
 * NIVEL_EQUIPO         → Mi Equipo
 * NIVEL_PLANIFICACION  → Planificación Operativa + Planeación Estratégica
 * NIVEL_PROTECCION     → Protección y Cumplimiento
 * NIVEL_HSEQ           → Gestión Integral HSEQ
 * NIVEL_CADENA         → Supply Chain + Production + Logistics + Sales CRM
 * NIVEL_TALENTO        → Talent Hub
 * NIVEL_SOPORTE        → Administración + Tesorería + Contabilidad
 * NIVEL_INTELIGENCIA   → Analytics + Revisión Dirección + Acciones Mejora + Audit System
 * NIVEL_WORKFLOWS      → Flujos de Trabajo (motor de ejecución transversal)
 * NIVEL_CONFIG         → Configuración de Plataforma
 */
export type ModuleCategory =
  | 'NIVEL_FUNDACION'
  | 'NIVEL_INFRAESTRUCTURA'
  | 'NIVEL_EQUIPO'
  | 'NIVEL_PLANIFICACION'
  | 'NIVEL_PROTECCION'
  | 'NIVEL_HSEQ'
  | 'NIVEL_CADENA'
  | 'NIVEL_TALENTO'
  | 'NIVEL_SOPORTE'
  | 'NIVEL_INTELIGENCIA'
  | 'NIVEL_WORKFLOWS'
  | 'NIVEL_CONFIG';

/**
 * Lista completa de módulos del sistema StrateKaz V2.
 * Usada en PlanFormModal y TenantFormModal.
 * Orden y agrupación espeja SIDEBAR_LAYERS V2.
 */
export const AVAILABLE_MODULES: SystemModule[] = [
  // ── PLANEAR ──

  // NIVEL_FUNDACION — Fundación (C1)
  { code: 'fundacion', name: 'Fundación', category: 'NIVEL_FUNDACION' },

  // NIVEL_INFRAESTRUCTURA — Documentos
  { code: 'gestion_documental', name: 'Gestión Documental', category: 'NIVEL_INFRAESTRUCTURA' },

  // NIVEL_EQUIPO — Mi Equipo
  { code: 'mi_equipo', name: 'Mi Equipo', category: 'NIVEL_EQUIPO' },

  // NIVEL_PLANIFICACION — Planificación
  {
    code: 'planificacion_operativa',
    name: 'Planificación Operativa',
    category: 'NIVEL_PLANIFICACION',
  },
  {
    code: 'planeacion_estrategica',
    name: 'Planeación Estratégica',
    category: 'NIVEL_PLANIFICACION',
  },

  // ── HACER ──

  // NIVEL_PROTECCION — Protección y Cumplimiento
  {
    code: 'proteccion_cumplimiento',
    name: 'Protección y Cumplimiento',
    category: 'NIVEL_PROTECCION',
  },

  // NIVEL_HSEQ — Gestión Integral
  { code: 'gestion_integral', name: 'Gestión Integral HSEQ', category: 'NIVEL_HSEQ' },

  // NIVEL_CADENA — Cadena de Valor
  { code: 'supply_chain', name: 'Cadena de Suministro', category: 'NIVEL_CADENA' },
  { code: 'production_ops', name: 'Base de Operaciones', category: 'NIVEL_CADENA' },
  { code: 'logistics_fleet', name: 'Logística y Flota', category: 'NIVEL_CADENA' },
  { code: 'sales_crm', name: 'Ventas y CRM', category: 'NIVEL_CADENA' },

  // NIVEL_TALENTO — Talent Hub
  { code: 'talent_hub', name: 'Centro de Talento', category: 'NIVEL_TALENTO' },

  // NIVEL_SOPORTE — Soporte Administrativo
  { code: 'administracion', name: 'Administración', category: 'NIVEL_SOPORTE' },
  { code: 'tesoreria', name: 'Tesorería', category: 'NIVEL_SOPORTE' },
  { code: 'accounting', name: 'Contabilidad', category: 'NIVEL_SOPORTE' },

  // ── VERIFICAR + ACTUAR ──

  // NIVEL_INTELIGENCIA — Inteligencia y Mejora
  { code: 'analytics', name: 'Inteligencia de Negocios', category: 'NIVEL_INTELIGENCIA' },
  { code: 'revision_direccion', name: 'Revisión por la Dirección', category: 'NIVEL_INTELIGENCIA' },
  { code: 'acciones_mejora', name: 'Acciones de Mejora', category: 'NIVEL_INTELIGENCIA' },
  { code: 'audit_system', name: 'Centro de Control', category: 'NIVEL_INTELIGENCIA' },

  // ── TRANSVERSAL ──

  // NIVEL_WORKFLOWS — Motor de ejecución transversal
  { code: 'workflow_engine', name: 'Flujos de Trabajo', category: 'NIVEL_WORKFLOWS' },

  // NIVEL_CONFIG — Configuración de Plataforma
  { code: 'configuracion_plataforma', name: 'Configuración', category: 'NIVEL_CONFIG' },
];

/** Módulos habilitados por defecto para nuevos tenants */
export const DEFAULT_ENABLED_MODULES = [
  'fundacion',
  'gestion_documental',
  'planeacion_estrategica',
  'proteccion_cumplimiento',
  'gestion_integral',
];
