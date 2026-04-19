/**
 * Constantes de módulos disponibles del sistema.
 *
 * Fuente de verdad única para módulos en PlanFormModal y TenantFormModal.
 * Las categorías reflejan los 12 grupos visuales del sidebar V2
 * (SIDEBAR_LAYERS en backend/apps/core/viewsets_config.py).
 *
 * DOCTRINA DE DESPLIEGUE (post-S6, 2026-04-19):
 *   Los módulos pasan a LIVE por feature-flag individual, NO por cascada lineal.
 *   `DEPLOYED_MODULES` es la lista canónica de códigos LIVE. El campo
 *   `deployLevel` se conserva solo como metadata informativa (orden relativo
 *   dentro del roadmap original), no como gate de activación.
 *
 *   Cuando un módulo pasa a LIVE:
 *     1. Se agrega su `code` a `DEPLOYED_MODULES` en este archivo
 *     2. Se actualiza `is_enabled: True` en `seed_estructura_final.py`
 *     3. Deploy VPS → módulo visible universalmente
 */

export interface SystemModule {
  code: string;
  name: string;
  category: ModuleCategory;
  /**
   * Nivel informativo del roadmap original (cascada V3). Metadata ordinal.
   * NO se usa como gate de activación — ver `DEPLOYED_MODULES`.
   */
  deployLevel?: number;
}

/**
 * Códigos de módulos LIVE (desplegados en producción).
 *
 * Un módulo en esta lista:
 *   - Tiene `is_enabled: True` en seed_estructura_final.py
 *   - Está descomentado en backend/config/settings/base.py TENANT_APPS
 *   - Es universalmente visible para todos los tenants (salvo override en Admin Global)
 *
 * Para agregar un módulo: actualizar este array + el seed + base.py.
 */
export const DEPLOYED_MODULES: readonly string[] = [
  // CT-layer y core (always-on)
  'fundacion',
  'gestion_documental',
  'catalogo_productos',
  'workflow_engine',
  'audit_system',
  'configuracion_plataforma',
  // L20 — Mi Equipo
  'mi_equipo',
  // L50 — Supply Chain (S6, 2026-04-19)
  'supply_chain',
];

/**
 * @deprecated Usar `DEPLOYED_MODULES.includes(code)` en vez de comparar deployLevel.
 * Se conserva solo por compatibilidad con componentes legacy.
 */
export const CURRENT_DEPLOY_LEVEL = 20;

/**
 * Verifica si un módulo está desplegado (LIVE).
 * Reemplaza la comparación `deployLevel <= CURRENT_DEPLOY_LEVEL`.
 */
export const isModuleDeployed = (code: string): boolean => DEPLOYED_MODULES.includes(code);

/**
 * Categorías alineadas con SIDEBAR_LAYERS V2 del backend.
 * NIVEL_FUNDACION      → Fundación (C1)
 * NIVEL_INFRAESTRUCTURA → Gestión Documental + Catálogo de Productos (CT-layer)
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
  { code: 'fundacion', name: 'Fundación', category: 'NIVEL_FUNDACION', deployLevel: 10 },

  // NIVEL_INFRAESTRUCTURA — CT-layer transversal (dato maestro + documentos)
  {
    code: 'gestion_documental',
    name: 'Gestión Documental',
    category: 'NIVEL_INFRAESTRUCTURA',
    deployLevel: 15,
  },
  {
    code: 'catalogo_productos',
    name: 'Catálogo de Productos',
    category: 'NIVEL_INFRAESTRUCTURA',
    deployLevel: 15,
  },

  // NIVEL_EQUIPO — Mi Equipo
  { code: 'mi_equipo', name: 'Mi Equipo', category: 'NIVEL_EQUIPO', deployLevel: 20 },

  // NIVEL_PLANIFICACION — Planificación
  {
    code: 'planificacion_operativa',
    name: 'Planificación Operativa',
    category: 'NIVEL_PLANIFICACION',
    deployLevel: 25,
  },
  {
    code: 'planeacion_estrategica',
    name: 'Planeación Estratégica',
    category: 'NIVEL_PLANIFICACION',
    deployLevel: 30,
  },

  // ── HACER ──

  // NIVEL_PROTECCION — Protección y Cumplimiento
  {
    code: 'proteccion_cumplimiento',
    name: 'Protección y Cumplimiento',
    category: 'NIVEL_PROTECCION',
    deployLevel: 35,
  },

  // NIVEL_HSEQ — Gestión Integral
  {
    code: 'gestion_integral',
    name: 'Gestión Integral HSEQ',
    category: 'NIVEL_HSEQ',
    deployLevel: 40,
  },

  // NIVEL_CADENA — Cadena de Valor
  { code: 'supply_chain', name: 'Cadena de Suministro', category: 'NIVEL_CADENA', deployLevel: 50 },
  {
    code: 'production_ops',
    name: 'Base de Operaciones',
    category: 'NIVEL_CADENA',
    deployLevel: 51,
  },
  { code: 'logistics_fleet', name: 'Logística y Flota', category: 'NIVEL_CADENA', deployLevel: 52 },
  { code: 'sales_crm', name: 'Ventas y CRM', category: 'NIVEL_CADENA', deployLevel: 53 },

  // NIVEL_TALENTO — Gestión Continua del Talento
  { code: 'talent_hub', name: 'Gestión del Talento', category: 'NIVEL_TALENTO', deployLevel: 60 },

  // NIVEL_SOPORTE — Soporte Administrativo
  { code: 'administracion', name: 'Administración', category: 'NIVEL_SOPORTE', deployLevel: 70 },
  { code: 'tesoreria', name: 'Tesorería', category: 'NIVEL_SOPORTE', deployLevel: 71 },
  { code: 'accounting', name: 'Contabilidad', category: 'NIVEL_SOPORTE', deployLevel: 72 },

  // ── VERIFICAR ──

  // NIVEL_INTELIGENCIA — Inteligencia
  {
    code: 'analytics',
    name: 'Inteligencia de Negocios',
    category: 'NIVEL_INTELIGENCIA',
    deployLevel: 80,
  },
  {
    code: 'revision_direccion',
    name: 'Revisión por la Dirección',
    category: 'NIVEL_INTELIGENCIA',
    deployLevel: 85,
  },

  // ── ACTUAR ──

  {
    code: 'acciones_mejora',
    name: 'Acciones de Mejora',
    category: 'NIVEL_INTELIGENCIA',
    deployLevel: 90,
  },
  {
    code: 'audit_system',
    name: 'Centro de Control',
    category: 'NIVEL_INTELIGENCIA',
    deployLevel: 12,
  },

  // ── TRANSVERSAL ──

  // NIVEL_WORKFLOWS — Motor de ejecución transversal
  {
    code: 'workflow_engine',
    name: 'Flujos de Trabajo',
    category: 'NIVEL_WORKFLOWS',
    deployLevel: 12,
  },

  // NIVEL_CONFIG — Configuración de Plataforma
  {
    code: 'configuracion_plataforma',
    name: 'Configuración',
    category: 'NIVEL_CONFIG',
    deployLevel: 0,
  },
];

/** Módulos habilitados por defecto para nuevos tenants */
export const DEFAULT_ENABLED_MODULES = [
  'fundacion',
  'gestion_documental',
  'planeacion_estrategica',
  'proteccion_cumplimiento',
  'gestion_integral',
];
