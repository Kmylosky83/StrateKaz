/**
 * Valores por defecto centralizados para nuevos tenants.
 *
 * SINGLE SOURCE OF TRUTH — Todos los fallbacks de colores de branding
 * deben importarse desde aquí en vez de hardcodear hex inline.
 *
 * Estos NO son los colores de la marca StrateKaz (ver brand.ts),
 * sino los defaults para tenants que aún no configuran su branding.
 */

// ---------------------------------------------------------------------------
// Colores por defecto para tenants nuevos
// ---------------------------------------------------------------------------
export const DEFAULT_TENANT_COLORS = {
  /** Color primario por defecto (Indigo 500) */
  primary: '#6366F1',
  /** Color secundario por defecto (Emerald 500) */
  secondary: '#10B981',
  /** Color de acento por defecto (Amber 500) */
  accent: '#F59E0B',
  /** Color del sidebar por defecto (Slate 800) */
  sidebar: '#1E293B',
  /** Color de fondo por defecto */
  background: '#F5F5F5',
} as const;

export const DEFAULT_PWA_COLORS = {
  /** Tema PWA por defecto */
  theme: '#6366F1',
  /** Fondo PWA por defecto */
  background: '#FFFFFF',
} as const;

// ---------------------------------------------------------------------------
// Colores PHVA (Planear-Hacer-Verificar-Actuar)
// ---------------------------------------------------------------------------
export const PHVA_COLORS = {
  PLANEAR: '#3B82F6',
  HACER: '#10B981',
  VERIFICAR_ACTUAR: '#8B5CF6',
} as const;

// ---------------------------------------------------------------------------
// Colores por Layer del Sidebar (Cascada V3)
// ---------------------------------------------------------------------------
export const LAYER_COLORS: Record<string, string> = {
  NIVEL_C1: '#3B82F6',
  NIVEL_PE: '#6366F1',
  NIVEL_SGI: '#0EA5E9',
  NIVEL_OPS: '#10B981',
  NIVEL_ORG: '#F59E0B',
  NIVEL_C3: '#8B5CF6',
} as const;

// Type exports
export type TenantColors = typeof DEFAULT_TENANT_COLORS;
export type PHVAPhase = keyof typeof PHVA_COLORS;
