/**
 * Hook para detectar el color del macroproceso actual según la ruta
 *
 * Mapea las rutas de la aplicación a los colores de macroproceso definidos
 * en el sistema de navegación del Sidebar.
 */
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export type MacroprocessColor = 'purple' | 'blue' | 'green' | 'orange';

/**
 * Configuración de colores por macroproceso
 * Exportada para uso en otros componentes
 */
export const macroprocessColors: Record<MacroprocessColor, {
  bg: string;
  bgHover: string;
  bgActive: string;
  text: string;
  textActive: string;
  icon: string;
  iconActive: string;
  border: string;
  // Colores para hover en cards (StatsGrid, etc.)
  hoverShadow: string;
  hoverBorder: string;
}> = {
  purple: {
    bg: 'bg-purple-50/50 dark:bg-purple-900/10',
    bgHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
    bgActive: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    textActive: 'text-purple-700 dark:text-purple-300',
    icon: 'text-purple-500 dark:text-purple-400',
    iconActive: 'text-purple-600 dark:text-purple-300',
    border: 'border-l-purple-500',
    hoverShadow: 'hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
  },
  blue: {
    bg: 'bg-blue-50/50 dark:bg-blue-900/10',
    bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    bgActive: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    textActive: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-500 dark:text-blue-400',
    iconActive: 'text-blue-600 dark:text-blue-300',
    border: 'border-l-blue-500',
    hoverShadow: 'hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  green: {
    bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
    bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    bgActive: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    textActive: 'text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-500 dark:text-emerald-400',
    iconActive: 'text-emerald-600 dark:text-emerald-300',
    border: 'border-l-emerald-500',
    hoverShadow: 'hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  },
  orange: {
    bg: 'bg-orange-50/50 dark:bg-orange-900/10',
    bgHover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
    bgActive: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    textActive: 'text-orange-700 dark:text-orange-300',
    icon: 'text-orange-500 dark:text-orange-400',
    iconActive: 'text-orange-600 dark:text-orange-300',
    border: 'border-l-orange-500',
    hoverShadow: 'hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30',
    hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-700',
  },
};

/**
 * Mapeo de rutas a macroprocesos
 * Basado en la estructura de navegación del Sidebar
 */
const routeToMacroprocess: Record<string, MacroprocessColor> = {
  // Dirección Estratégica - Purple
  '/direccion-estrategica': 'purple',
  '/settings': 'purple',
  '/usuarios': 'purple',

  // Gestión Misional - Blue
  '/proveedores': 'blue',
  '/lotes': 'blue',
  '/reportes': 'blue',
  '/dashboard': 'blue',

  // Gestión de Apoyo - Green
  '/talento-humano': 'green',

  // Gestión Integral - Orange
  '/gestion-integral': 'orange',
};

/**
 * Hook que retorna el color del macroproceso actual según la ruta
 *
 * @returns {MacroprocessColor | null} Color del macroproceso o null si no hay match
 */
export function useMacroprocessColor(): MacroprocessColor | null {
  const location = useLocation();

  return useMemo(() => {
    const pathname = location.pathname;

    // Buscar coincidencia por prefijo de ruta (más específico primero)
    const sortedRoutes = Object.keys(routeToMacroprocess).sort((a, b) => b.length - a.length);

    for (const route of sortedRoutes) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        return routeToMacroprocess[route];
      }
    }

    // Default a blue (Gestión Misional) si no hay match
    return 'blue';
  }, [location.pathname]);
}

/**
 * Hook que retorna la configuración completa de colores del macroproceso actual
 *
 * @returns Objeto con todas las clases de color del macroproceso
 */
export function useMacroprocessColorConfig() {
  const color = useMacroprocessColor();

  return useMemo(() => {
    if (!color) return null;
    return macroprocessColors[color];
  }, [color]);
}
