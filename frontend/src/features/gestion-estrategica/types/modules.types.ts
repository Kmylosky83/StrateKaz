/**
 * Tipos TypeScript para el Sistema Dinámico de Módulos
 * Sistema de Gestión StrateKaz
 *
 * Este archivo contiene los tipos específicos para la navegación dinámica,
 * tabs, secciones y árbol de módulos. Los tipos base de módulos están en strategic.types.ts
 */

import type { ModuleCategory } from './strategic.types';

// Re-export ModuleCategory para uso externo
export type { ModuleCategory };

// ==================== TIPOS BASE ====================

/**
 * Colores disponibles para módulos
 * Sincronizado con MODULE_COLORS del backend (apps/core/models.py)
 */
export type ModuleColor = 'purple' | 'blue' | 'green' | 'orange' | 'gray' | 'teal' | 'red' | 'yellow' | 'pink' | 'indigo';

// ==================== SECCIONES ====================

/**
 * Sección dentro de un Tab (SubNavigation)
 * Representa el nivel más granular de navegación
 */
export interface TabSection {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  is_enabled: boolean;
  is_core: boolean;
}

// ==================== TABS ====================

/**
 * Tab dentro de un Módulo
 * Contiene múltiples secciones y se muestra en la navegación secundaria
 */
export interface ModuleTab {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  is_enabled: boolean;
  is_core: boolean;
  sections: TabSection[];
  enabled_sections_count: number;
  total_sections_count: number;
}

// ==================== MODULO EXTENDIDO (para árbol) ====================

/**
 * Módulo del Sistema extendido con tabs y navegación
 * Representa un módulo completo con su estructura jerárquica
 */
export interface SystemModuleTree {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: ModuleColor;
  category: ModuleCategory;
  route?: string;
  order: number;
  is_enabled: boolean;
  is_core: boolean;
  requires_license: boolean;
  license_expires_at?: string;
  tabs: ModuleTab[];
  enabled_tabs_count: number;
  total_tabs_count: number;
  // Dependencias entre módulos
  dependencies?: number[];
  dependents?: number[];
}

// ==================== ÁRBOL DE MÓDULOS ====================

/**
 * Árbol completo de módulos del sistema
 * Respuesta del endpoint /tree/
 */
export interface ModulesTree {
  modules: SystemModuleTree[];
  total_modules: number;
  enabled_modules: number;
  categories: {
    code: ModuleCategory;
    name: string;
    modules_count: number;
  }[];
}

// ==================== DTOs DE TOGGLE ====================

/**
 * DTO para activar/desactivar un tab
 */
export interface ToggleTabDTO {
  is_enabled: boolean;
}

/**
 * DTO para activar/desactivar una sección
 */
export interface ToggleSectionDTO {
  is_enabled: boolean;
}

// ==================== RESPUESTAS DE TOGGLE ====================

/**
 * Respuesta de operación de toggle
 * Incluye información sobre elementos afectados por dependencias
 */
export interface ToggleResponse {
  success: boolean;
  message: string;
  affected_items?: {
    modules?: string[];
    tabs?: string[];
    sections?: string[];
  };
}

// ==================== SIDEBAR DINÁMICO ====================

/**
 * Módulo para renderizado en el Sidebar
 * Estructura simplificada para la navegación lateral
 */
export interface SidebarModule {
  code: string;
  name: string;
  icon: string;
  color?: ModuleColor;
  route?: string;
  is_category: boolean;
  children?: SidebarModule[];
}

// ==================== CONSTANTES ====================

/**
 * Mapeo de categorías a labels en español
 */
export const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  ESTRATEGICO: 'Dirección Estratégica',
  MOTOR: 'Motor de Operaciones',
  INTEGRAL: 'Gestión Integral',
  MISIONAL: 'Gestión Misional',
  APOYO: 'Procesos de Apoyo',
  INTELIGENCIA: 'Inteligencia de Negocios',
};

/**
 * Mapeo de categorías a colores del Design System
 * NOTA: Debe coincidir con CATEGORY_DEFAULT_COLORS en backend/apps/core/models.py
 */
export const CATEGORY_COLORS: Record<ModuleCategory, ModuleColor> = {
  ESTRATEGICO: 'purple',
  MOTOR: 'teal',
  INTEGRAL: 'orange',
  MISIONAL: 'blue',
  APOYO: 'green',
  INTELIGENCIA: 'purple',
};
