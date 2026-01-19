/**
 * Sidebar Dinámico - Sistema de Gestión StrateKaz
 *
 * Características:
 * - Carga módulos, tabs y secciones desde la API (sin hardcoding)
 * - Iconos dinámicos desde Lucide React
 * - Colores por módulo/categoría (6 niveles: ESTRATEGICO, MOTOR, INTEGRAL, MISIONAL, APOYO, INTELIGENCIA)
 * - Control granular: desactivar módulo/tab en ConfiguracionTab → desaparece del sidebar
 */
import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useSidebarModules } from '@/features/gestion-estrategica/hooks/useModules';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import type { SidebarModule } from '@/features/gestion-estrategica/types/modules.types';
import { ChevronRight, ChevronDown, Circle, Loader2, LayoutDashboard } from 'lucide-react';
import { getIconComponent as getDynamicIcon } from '@/components/common/DynamicIcon';

interface SidebarProps {
  isCollapsed: boolean;
  /** Si estamos en viewport mobile */
  isMobile?: boolean;
  /** Si el drawer mobile está abierto */
  isMobileOpen?: boolean;
  /** Callback para cerrar el drawer mobile */
  onCloseMobile?: () => void;
}

// Colores por módulo - Sincronizado con backend CATEGORY_DEFAULT_COLORS
type ModuleColor =
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

/**
 * Mapea colores extendidos de Tailwind a los 10 colores soportados
 * Permite que la BD use cualquier color y el frontend lo convierta
 */
const colorMapping: Record<string, ModuleColor> = {
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

/** Obtiene el color mapeado o null si no hay color */
const getMappedColor = (color: string | undefined | null): ModuleColor | null => {
  if (!color) return null;
  return colorMapping[color] || null;
};

const moduleColors: Record<
  ModuleColor,
  {
    bg: string;
    bgHover: string;
    bgActive: string;
    text: string;
    textActive: string;
    icon: string;
    iconActive: string;
    border: string;
  }
> = {
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
  teal: {
    bg: 'bg-teal-50/50 dark:bg-teal-900/10',
    bgHover: 'hover:bg-teal-50 dark:hover:bg-teal-900/20',
    bgActive: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-600 dark:text-teal-400',
    textActive: 'text-teal-700 dark:text-teal-300',
    icon: 'text-teal-500 dark:text-teal-400',
    iconActive: 'text-teal-600 dark:text-teal-300',
    border: 'border-l-teal-500',
  },
  red: {
    bg: 'bg-red-50/50 dark:bg-red-900/10',
    bgHover: 'hover:bg-red-50 dark:hover:bg-red-900/20',
    bgActive: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    textActive: 'text-red-700 dark:text-red-300',
    icon: 'text-red-500 dark:text-red-400',
    iconActive: 'text-red-600 dark:text-red-300',
    border: 'border-l-red-500',
  },
  yellow: {
    bg: 'bg-yellow-50/50 dark:bg-yellow-900/10',
    bgHover: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
    bgActive: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    textActive: 'text-yellow-700 dark:text-yellow-300',
    icon: 'text-yellow-500 dark:text-yellow-400',
    iconActive: 'text-yellow-600 dark:text-yellow-300',
    border: 'border-l-yellow-500',
  },
  pink: {
    bg: 'bg-pink-50/50 dark:bg-pink-900/10',
    bgHover: 'hover:bg-pink-50 dark:hover:bg-pink-900/20',
    bgActive: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-600 dark:text-pink-400',
    textActive: 'text-pink-700 dark:text-pink-300',
    icon: 'text-pink-500 dark:text-pink-400',
    iconActive: 'text-pink-600 dark:text-pink-300',
    border: 'border-l-pink-500',
  },
  indigo: {
    bg: 'bg-indigo-50/50 dark:bg-indigo-900/10',
    bgHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    bgActive: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    textActive: 'text-indigo-700 dark:text-indigo-300',
    icon: 'text-indigo-500 dark:text-indigo-400',
    iconActive: 'text-indigo-600 dark:text-indigo-300',
    border: 'border-l-indigo-500',
  },
};

/**
 * Obtener el componente de icono de Lucide React por nombre
 * Usa DynamicIcon del design system para reutilizar la lógica centralizada
 * Si no existe, retorna Circle como fallback
 */
const getIconComponent = (iconName?: string | null): React.ElementType => {
  if (!iconName) return Circle;
  const icon = getDynamicIcon(iconName);
  return icon ?? Circle;
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
  // Mapear color extendido de Tailwind a los 10 soportados
  const mappedColor = getMappedColor(item.color);
  const colors = mappedColor ? moduleColors[mappedColor] : null;
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(item.code);

  // Verificar si este item o alguno de sus hijos está activo
  const isActive = useMemo(() => {
    // Match exacto o con subruta (evita falsos positivos)
    const matchesRoute = (route: string | undefined | null) => {
      if (!route) return false;
      return location.pathname === route || location.pathname.startsWith(route + '/');
    };

    if (item.route && matchesRoute(item.route)) {
      return true;
    }
    if (item.children) {
      return item.children.some((child) => matchesRoute(child.route));
    }
    return false;
  }, [item, location.pathname]);

  // Si es categoría, renderizar como grupo expandible con separador visual
  if (item.is_category) {
    // Detectar si es un nivel principal (NIVEL_1, NIVEL_2, etc.)
    const isMainLevel = item.code.startsWith('NIVEL_');

    return (
      <div className={cn(isMainLevel ? 'mt-6 first:mt-0' : 'mt-4 first:mt-0')}>
        {/* Separador visual para niveles principales */}
        {isMainLevel && depth === 0 && !isCollapsed && (
          <div className="mb-3">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
          </div>
        )}

        <button
          onClick={() => toggleExpanded(item.code)}
          className={cn(
            'w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group relative',
            isMainLevel && 'font-semibold uppercase text-xs tracking-wide',
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
              isMainLevel ? 'h-4 w-4' : 'h-5 w-5',
              'flex-shrink-0',
              colors
                ? isActive
                  ? colors.iconActive
                  : colors.icon
                : isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
            )}
          />
          {!isCollapsed && (
            <>
              <span
                className={cn(
                  'ml-3 flex-1 text-left',
                  isMainLevel ? 'text-xs font-bold' : 'text-sm font-medium'
                )}
              >
                {item.name}
              </span>
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
          <div
            className={cn(
              'mt-1 space-y-0.5',
              isMainLevel ? 'ml-0' : 'ml-3 border-l-2',
              !isMainLevel && (colors ? colors.border : 'border-l-gray-200 dark:border-l-gray-700')
            )}
          >
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
                ? isActive
                  ? colors.iconActive
                  : colors.icon
                : isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
            )}
          />
          {!isCollapsed && (
            <>
              <span
                className={cn(
                  'ml-3 font-medium flex-1 text-left',
                  depth > 0 ? 'text-sm' : 'text-sm'
                )}
              >
                {item.name}
              </span>
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
          <div
            className={cn(
              'mt-1 ml-3 space-y-0.5 border-l-2',
              colors ? colors.border : 'border-l-gray-200 dark:border-l-gray-700'
            )}
          >
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
  const isItemActive =
    item.route &&
    (location.pathname === item.route || location.pathname.startsWith(item.route + '/'));

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
            ? isItemActive
              ? colors.iconActive
              : colors.icon
            : isItemActive
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
        )}
      />
      {!isCollapsed && (
        <span className={cn(depth > 0 ? '' : 'ml-3 font-medium text-sm')}>{item.name}</span>
      )}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
          {item.name}
        </div>
      )}
    </Link>
  );
};

export const Sidebar = ({
  isCollapsed,
  isMobile = false,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) => {
  const location = useLocation();
  const { data: sidebarModules, isLoading, error } = useSidebarModules();
  const { appVersion } = useBrandingConfig();

  // Cerrar drawer al navegar en mobile
  useEffect(() => {
    if (isMobile && isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
    // Solo ejecutar cuando cambia la ruta, no cuando cambia isMobileOpen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Estado para items expandidos - inicializar dinámicamente
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Expandir automáticamente el módulo activo al cargar
  useEffect(() => {
    if (sidebarModules && location.pathname) {
      const activeModules: string[] = [];

      const findActiveParents = (items: SidebarModule[], parents: string[] = []) => {
        for (const item of items) {
          const currentPath = [...parents, item.code];

          // Match exacto o con subruta (evita falsos positivos)
          if (
            item.route &&
            (location.pathname === item.route || location.pathname.startsWith(item.route + '/'))
          ) {
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
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Clases base del sidebar
  const sidebarBaseClasses = cn(
    'fixed top-16 bottom-0 z-40',
    'bg-white dark:bg-gray-800',
    'border-r border-gray-200 dark:border-gray-700',
    'transition-all duration-300 ease-in-out'
  );

  // Clases para mobile (drawer)
  const mobileClasses = isMobile
    ? cn('left-0 w-72', isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full')
    : cn('left-0', isCollapsed ? 'w-16' : 'w-64');

  // Loading state
  if (isLoading) {
    return (
      <aside className={cn(sidebarBaseClasses, mobileClasses)}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </aside>
    );
  }

  // Error state - mostrar sidebar vacío con mensaje
  if (error || !sidebarModules) {
    return (
      <aside className={cn(sidebarBaseClasses, mobileClasses)}>
        <div className="flex items-center justify-center h-full px-4 text-center">
          <p className="text-sm text-gray-500">Error al cargar menú</p>
        </div>
      </aside>
    );
  }

  // En mobile, el sidebar siempre está expandido (drawer)
  const effectiveCollapsed = isMobile ? false : isCollapsed;

  return (
    <aside className={cn(sidebarBaseClasses, mobileClasses)}>
      <nav className="h-full flex flex-col py-4">
        {/* Dashboard Link - Siempre visible al inicio */}
        <div className="px-2 mb-2">
          <Link
            to="/dashboard"
            className={cn(
              'flex items-center rounded-lg transition-colors px-3 py-2.5',
              location.pathname === '/dashboard'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            )}
          >
            <LayoutDashboard
              className={cn(
                'h-5 w-5 flex-shrink-0',
                location.pathname === '/dashboard'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            />
            {!effectiveCollapsed && <span className="ml-3 font-medium">Dashboard</span>}
          </Link>
        </div>

        {/* Separador */}
        <div className="px-4 mb-2">
          <div className="border-t border-gray-200 dark:border-gray-700" />
        </div>

        {/* Navigation Items - Dinámico desde API */}
        <div className="flex-1 px-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {sidebarModules.map((item) => (
            <NavItemComponent
              key={item.code}
              item={item}
              isCollapsed={effectiveCollapsed}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              location={location}
            />
          ))}
        </div>

        {/* Version Info (only when expanded) */}
        {!effectiveCollapsed && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Versión {appVersion}</p>
          </div>
        )}
      </nav>
    </aside>
  );
};
