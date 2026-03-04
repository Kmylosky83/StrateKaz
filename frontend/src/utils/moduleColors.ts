/**
 * Design System - Colores de Módulos (FUENTE ÚNICA)
 *
 * Archivo centralizado para colores de módulos del sistema.
 * TODOS los componentes que necesiten colores de módulo deben importar de aquí:
 * - colorMapping: mapea colores extendidos de Tailwind a los 10 soportados
 * - getMappedColor(): aplica el mapping con fallback
 * - getModuleColorClasses(): clases de color para tabs/secciones
 *
 * Consumidores:
 * - Sidebar.tsx (nav colors)
 * - ModuleCard.tsx (dashboard cards)
 * - useModuleColor.ts (hook reutilizable)
 * - PageTabs, SectionGuard, etc.
 */
import type { ModuleColor } from '@/hooks/useModules';

// ============================================================================
// MAPPING CENTRALIZADO (antes duplicado en Sidebar, ModuleCard, useModuleColor)
// ============================================================================

/**
 * Mapea colores extendidos de Tailwind a los 10 colores soportados.
 * Sincronizado con backend COLOR_CHOICES en SystemModule.
 */
export const colorMapping: Record<string, ModuleColor> = {
  // Colores directos (ya soportados)
  purple: 'purple',
  blue: 'blue',
  green: 'green',
  orange: 'orange',
  gray: 'gray',
  teal: 'teal',
  red: 'red',
  yellow: 'yellow',
  pink: 'pink',
  indigo: 'indigo',
  // Colores extendidos → mapeados al más cercano
  amber: 'orange',
  cyan: 'teal',
  rose: 'pink',
  violet: 'purple',
  emerald: 'green',
  lime: 'green',
  slate: 'gray',
  stone: 'gray',
  zinc: 'gray',
  neutral: 'gray',
  fuchsia: 'pink',
  sky: 'blue',
};

/**
 * Aplica el mapping de color con fallback.
 * @returns Color mapeado o null si no hay color de entrada.
 */
export const getMappedColor = (color: string | undefined | null): ModuleColor | null => {
  if (!color) return null;
  return colorMapping[color] || null;
};

/**
 * Aplica el mapping de color con fallback garantizado (nunca null).
 * @returns Color mapeado, o fallback ('blue' por defecto).
 */
export const getMappedColorSafe = (
  color: string | undefined | null,
  fallback: ModuleColor = 'blue'
): ModuleColor => {
  if (!color) return fallback;
  return colorMapping[color] || fallback;
};

// ============================================================================
// CLASES DE COLOR PARA TABS/SECCIONES
// ============================================================================

/**
 * Clases de color para contenedores de secciones/tabs
 */
export interface ModuleColorClasses {
  /** Contenedor principal (fondo sutil + borde) */
  container: string;
  /** Tab/botón activo */
  active: string;
  /** Tab/botón inactivo */
  inactive: string;
  /** Borde inferior (para variante underline) */
  border: string;
  /** Badge/indicador */
  badge: string;
  /** Texto del color del módulo */
  text: string;
  /** Icono del color del módulo */
  icon: string;
}

/**
 * Mapeo centralizado de colores de módulo a clases de Tailwind
 * Sincronizado con el Design System de StrateKaz
 */
const moduleColorClasses: Record<ModuleColor, ModuleColorClasses> = {
  purple: {
    container:
      'bg-purple-50/50 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-800/50',
    active: 'bg-purple-100 text-purple-700 dark:bg-purple-800/60 dark:text-purple-200',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    border: 'border-purple-500 text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-500 dark:text-purple-400',
  },
  blue: {
    container: 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50',
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-800/60 dark:text-blue-200',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    border: 'border-blue-500 text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500 dark:text-blue-400',
  },
  green: {
    container:
      'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50',
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/60 dark:text-emerald-200',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    border: 'border-emerald-500 text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-500 dark:text-emerald-400',
  },
  orange: {
    container:
      'bg-orange-50/50 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-800/50',
    active: 'bg-orange-100 text-orange-700 dark:bg-orange-800/60 dark:text-orange-200',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/20',
    border: 'border-orange-500 text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    text: 'text-orange-600 dark:text-orange-400',
    icon: 'text-orange-500 dark:text-orange-400',
    progress: 'bg-orange-600 dark:bg-orange-500',
  },
  gray: {
    container: 'bg-gray-100/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50',
    active: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
    border: 'border-gray-500 text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    text: 'text-gray-600 dark:text-gray-400',
    icon: 'text-gray-500 dark:text-gray-400',
    progress: 'bg-gray-600 dark:bg-gray-500',
  },
  teal: {
    container: 'bg-teal-50/50 dark:bg-teal-900/20 border-teal-200/50 dark:border-teal-800/50',
    active: 'bg-teal-100 text-teal-700 dark:bg-teal-800/60 dark:text-teal-200',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-teal-50 dark:hover:bg-teal-900/20',
    border: 'border-teal-500 text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    text: 'text-teal-600 dark:text-teal-400',
    icon: 'text-teal-500 dark:text-teal-400',
    progress: 'bg-teal-600 dark:bg-teal-500',
  },
  red: {
    container: 'bg-red-50/50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50',
    active: 'bg-red-100 text-red-700 dark:bg-red-800/60 dark:text-red-200',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    border: 'border-red-500 text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    text: 'text-red-600 dark:text-red-400',
    icon: 'text-red-500 dark:text-red-400',
    progress: 'bg-red-600 dark:bg-red-500',
  },
  yellow: {
    container: 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50',
    active: 'bg-amber-100 text-amber-700 dark:bg-amber-800/60 dark:text-amber-200',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
    border: 'border-amber-500 text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500 dark:text-amber-400',
    progress: 'bg-amber-600 dark:bg-amber-500',
  },
  pink: {
    container: 'bg-pink-50/50 dark:bg-pink-900/20 border-pink-200/50 dark:border-pink-800/50',
    active: 'bg-pink-100 text-pink-700 dark:bg-pink-800/60 dark:text-pink-200',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/20',
    border: 'border-pink-500 text-pink-600 dark:text-pink-400',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    text: 'text-pink-600 dark:text-pink-400',
    icon: 'text-pink-500 dark:text-pink-400',
    progress: 'bg-pink-600 dark:bg-pink-500',
  },
  indigo: {
    container:
      'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200/50 dark:border-indigo-800/50',
    active: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800/60 dark:text-indigo-200',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    border: 'border-indigo-500 text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    text: 'text-indigo-600 dark:text-indigo-400',
    icon: 'text-indigo-500 dark:text-indigo-400',
  },
};

/**
 * Obtiene las clases de color para un módulo
 *
 * @param color - Color del módulo (purple, blue, green, etc.)
 * @returns Objeto con todas las clases de color
 *
 * @example
 * ```tsx
 * const colors = getModuleColorClasses('purple');
 * <nav className={cn('rounded-lg border', colors.container)}>
 *   <button className={isActive ? colors.active : colors.inactive}>
 *     Tab 1
 *   </button>
 * </nav>
 * ```
 */
export const getModuleColorClasses = (color: ModuleColor = 'purple'): ModuleColorClasses => {
  return moduleColorClasses[color] || moduleColorClasses.purple;
};

/**
 * Re-export de ModuleColor para conveniencia
 */
export type { ModuleColor };
