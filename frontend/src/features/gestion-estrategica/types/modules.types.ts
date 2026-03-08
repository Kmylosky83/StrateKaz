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
export type ModuleColor =
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'gray'
  | 'teal'
  | 'red'
  | 'yellow'
  | 'pink'
  | 'indigo';

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
  route?: string;
  orden: number;
  is_enabled: boolean;
  is_core: boolean;
  supported_actions?: string[];
}

export type TabSectionTree = TabSection;

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
  route?: string;
  orden: number;
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
  orden: number;
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

// ==================== LAYERS (AGRUPAMIENTO SIDEBAR/DASHBOARD) ====================

/**
 * Configuración de layer para agrupamiento visual
 * Viene del backend SIDEBAR_LAYERS
 */
export interface ModuleLayer {
  code: string;
  name: string;
  icon: string;
  color: string;
  module_codes: string[];
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
  layers: ModuleLayer[];
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

// ==================== DEPENDENCIAS (MM-003) ====================

/**
 * Información de dependencia de un módulo
 */
export interface ModuleDependencyInfo {
  id: number;
  name: string;
  code: string;
  is_enabled?: boolean;
}

/**
 * Respuesta del endpoint /dependents/
 * MM-003: Información de dependencias para feedback antes de desactivar
 */
export interface ModuleDependentsResponse {
  module_id: number;
  module_name: string;
  module_code: string;
  is_core: boolean;
  can_disable: boolean;
  dependents: {
    enabled: ModuleDependencyInfo[];
    all: ModuleDependencyInfo[];
  };
  children: {
    tabs: {
      total: number;
      enabled: number;
    };
    sections: {
      total: number;
      enabled: number;
    };
  };
  warning_message: string | null;
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
  STRATEGIC: 'Direccion Estrategica',
  COMPLIANCE: 'Motores del Sistema',
  INTEGRATED: 'Gestion Integral',
  OPERATIONAL: 'Gestion Misional',
  SUPPORT: 'Procesos de Apoyo',
  INTELLIGENCE: 'Inteligencia de Negocios',
};

/**
 * Mapeo de categorías a colores del Design System
 * NOTA: Debe coincidir con CATEGORY_DEFAULT_COLORS en backend/apps/core/models.py
 */
export const CATEGORY_COLORS: Record<ModuleCategory, ModuleColor> = {
  STRATEGIC: 'purple',
  COMPLIANCE: 'teal',
  INTEGRATED: 'orange',
  OPERATIONAL: 'blue',
  SUPPORT: 'green',
  INTELLIGENCE: 'purple',
};
