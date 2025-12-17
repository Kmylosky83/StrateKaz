/**
 * Sidebar Dinámico - Sistema de Gestión Grasas y Huesos del Norte
 *
 * Características:
 * - Carga módulos, tabs y secciones desde la API (sin hardcoding)
 * - Iconos dinámicos desde Lucide React
 * - Colores por macroproceso
 * - Control granular: desactivar módulo/tab en ConfiguracionTab → desaparece del sidebar
 */
import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import { useSidebarModules } from '@/features/gestion-estrategica/hooks/useModules';
import type { SidebarModule } from '@/features/gestion-estrategica/types/modules.types';
import * as LucideIcons from 'lucide-react';
import { ChevronRight, ChevronDown, Circle, Loader2 } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
}

// Colores por macroproceso
type MacroprocessColor = 'purple' | 'blue' | 'green' | 'orange' | 'gray';

const macroprocessColors: Record<MacroprocessColor, {
  bg: string;
  bgHover: string;
  bgActive: string;
  text: string;
  textActive: string;
  icon: string;
  iconActive: string;
  border: string;
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
  },
  gray: {
    bg: 'bg-gray-50/50 dark:bg-gray-900/10',
    bgHover: 'hover:bg-gray-50 dark:hover:bg-gray-900/20',
    bgActive: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-600 dark:text-gray-400',
    textActive: 'text-gray-700 dark:text-gray-300',
    icon: 'text-gray-500 dark:text-gray-400',
    iconActive: 'text-gray-600 dark:text-gray-300',
    border: 'border-l-gray-500',
  },
};

/**
 * Obtener el componente de icono de Lucide React por nombre
 * Si no existe, retorna Circle como fallback
 */
const getIconComponent = (iconName?: string | null): React.ElementType => {
  if (!iconName) return Circle;
  const icon = LucideIcons[iconName as keyof typeof LucideIcons];
  // Los iconos de Lucide React son objetos (ForwardRefExoticComponent), no funciones puras
  if (icon && typeof icon === 'object' && '$$typeof' in icon) {
    return icon as React.ElementType;
  }
  return Circle;
};

/**
 * Componente recursivo para renderizar items de navegación
 */
interface NavItemComponentProps {
  item: SidebarModule;
  isCollapsed: boolean;
  expandedItems: string[];
  toggleExpanded: (code: string) => void;
  location: ReturnType<typeof useLocation>;
  depth?: number;
}

const NavItemComponent = ({
  item,
  isCollapsed,
  expandedItems,
  toggleExpanded,
  location,
  depth = 0,
}: NavItemComponentProps) => {
  const Icon = getIconComponent(item.icon);
  const colors = item.color ? macroprocessColors[item.color as MacroprocessColor] : null;
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(item.code);

  // Verificar si este item o alguno de sus hijos está activo
  const isActive = useMemo(() => {
    if (item.route && location.pathname.startsWith(item.route)) {
      return true;
    }
    if (item.children) {
      return item.children.some(
        (child) => child.route && location.pathname.startsWith(child.route)
      );
    }
    return false;
  }, [item, location.pathname]);

  // Si es categoría (macroproceso), renderizar como grupo expandible
  if (item.is_category) {
    return (
      <div className="mt-4 first:mt-0">
        <button
          onClick={() => toggleExpanded(item.code)}
          className={cn(
            'w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group relative',
            colors
              ? isActive
                ? cn(colors.bgActive, colors.textActive)
                : cn('text-gray-700 dark:text-gray-300', colors.bgHover)
              : isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5 flex-shrink-0',
              colors
                ? isActive ? colors.iconActive : colors.icon
                : isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
            )}
          />
          {!isCollapsed && (
            <>
              <span className="ml-3 font-medium flex-1 text-left text-sm">{item.name}</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              {item.name}
            </div>
          )}
        </button>

        {/* Hijos de la categoría */}
        {isExpanded && !isCollapsed && hasChildren && (
          <div className={cn(
            'mt-1 ml-3 space-y-0.5 border-l-2',
            colors ? colors.border : 'border-l-gray-200 dark:border-l-gray-700'
          )}>
            {item.children!.map((child) => (
              <NavItemComponent
                key={child.code}
                item={child}
                isCollapsed={isCollapsed}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                location={location}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Si tiene hijos (módulo con tabs), renderizar como grupo expandible
  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => toggleExpanded(item.code)}
          className={cn(
            'w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group relative',
            depth > 0 ? 'pl-4 pr-3 py-2' : '',
            colors
              ? isActive
                ? cn(colors.bgActive, colors.textActive)
                : cn('text-gray-700 dark:text-gray-300', colors.bgHover)
              : isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          <Icon
            className={cn(
              depth > 0 ? 'h-4 w-4' : 'h-5 w-5',
              'flex-shrink-0',
              colors
                ? isActive ? colors.iconActive : colors.icon
                : isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
            )}
          />
          {!isCollapsed && (
            <>
              <span className={cn(
                'ml-3 font-medium flex-1 text-left',
                depth > 0 ? 'text-sm' : 'text-sm'
              )}>{item.name}</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              {item.name}
            </div>
          )}
        </button>

        {/* Tabs del módulo */}
        {isExpanded && !isCollapsed && (
          <div className={cn(
            'mt-1 ml-3 space-y-0.5 border-l-2',
            colors ? colors.border : 'border-l-gray-200 dark:border-l-gray-700'
          )}>
            {item.children!.map((child) => (
              <NavItemComponent
                key={child.code}
                item={child}
                isCollapsed={isCollapsed}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                location={location}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Item simple (hoja) - Link navegable
  const isItemActive = item.route && location.pathname.startsWith(item.route);

  return (
    <Link
      to={item.route || '#'}
      className={cn(
        'flex items-center rounded-lg transition-colors group relative',
        depth > 0 ? 'pl-4 pr-3 py-2 rounded-r-lg text-sm' : 'px-3 py-2.5',
        colors
          ? isItemActive
            ? cn(colors.bgActive, colors.textActive)
            : cn('text-gray-600 dark:text-gray-400', colors.bgHover)
          : isItemActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
      )}
    >
      <Icon
        className={cn(
          depth > 0 ? 'h-4 w-4 mr-2' : 'h-5 w-5',
          colors
            ? isItemActive ? colors.iconActive : colors.icon
            : isItemActive
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
        )}
      />
      {!isCollapsed && (
        <span className={cn(
          depth > 0 ? '' : 'ml-3 font-medium text-sm'
        )}>{item.name}</span>
      )}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
          {item.name}
        </div>
      )}
    </Link>
  );
};

export const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { data: sidebarModules, isLoading, error } = useSidebarModules();

  // Estado para items expandidos - inicializar dinámicamente
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Expandir automáticamente el módulo activo al cargar
  useEffect(() => {
    if (sidebarModules && location.pathname) {
      const activeModules: string[] = [];

      const findActiveParents = (items: SidebarModule[], parents: string[] = []) => {
        for (const item of items) {
          const currentPath = [...parents, item.code];

          if (item.route && location.pathname.startsWith(item.route)) {
            activeModules.push(...parents);
          }

          if (item.children) {
            findActiveParents(item.children, currentPath);
          }
        }
      };

      findActiveParents(sidebarModules);
      if (activeModules.length > 0) {
        setExpandedItems((prev) => [...new Set([...prev, ...activeModules])]);
      }
    }
  }, [sidebarModules, location.pathname]);

  const toggleExpanded = (code: string) => {
    setExpandedItems((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 z-30 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </aside>
    );
  }

  // Error state - mostrar sidebar vacío con mensaje
  if (error || !sidebarModules) {
    return (
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 z-30 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex items-center justify-center h-full px-4 text-center">
          <p className="text-sm text-gray-500">Error al cargar menú</p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 z-30 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <nav className="h-full flex flex-col py-4">
        {/* Navigation Items - Dinámico desde API */}
        <div className="flex-1 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {sidebarModules.map((item) => (
            <NavItemComponent
              key={item.code}
              item={item}
              isCollapsed={isCollapsed}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              location={location}
            />
          ))}
        </div>

        {/* Version Info (only when expanded) */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Versión 1.0.0
            </p>
          </div>
        )}
      </nav>
    </aside>
  );
};
