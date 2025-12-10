import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Truck,
  Package,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
  Target,
  Heart,
  Layers,
  Leaf,
  Factory,
  Wrench,
  FlaskConical,
  Building2,
  Briefcase,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
}

// Colores por macroproceso
type MacroprocessColor = 'purple' | 'blue' | 'green' | 'orange';

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
};

// Interfaz recursiva para navegación multinivel
interface NavItem {
  name: string;
  href?: string;
  icon?: React.ElementType;
  allowedRoles: string[];
  badge?: string;
  isCategory?: boolean; // Para macroprocesos (solo título, no navegable)
  color?: MacroprocessColor; // Color del macroproceso
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  // Dashboard principal
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['all'],
  },

  // ═══════════════════════════════════════════════════════════════
  // DIRECCIÓN ESTRATÉGICA - Planeación y control organizacional
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Dirección Estratégica',
    icon: Target,
    isCategory: true,
    color: 'purple',
    allowedRoles: ['superadmin', 'gerente', 'admin'],
    children: [
      {
        name: 'Planeación Estratégica',
        href: '/direccion-estrategica/planeacion',
        icon: TrendingUp,
        allowedRoles: ['superadmin', 'gerente', 'admin'],
      },
      {
        name: 'Configuración',
        href: '/settings',
        icon: Settings,
        allowedRoles: ['superadmin', 'gerente'],
      },
      {
        name: 'Usuarios',
        href: '/usuarios',
        icon: UserCog,
        allowedRoles: ['superadmin', 'gerente', 'admin'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN MISIONAL - Core del negocio (recolección y procesamiento)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Gestión Misional',
    icon: Briefcase,
    isCategory: true,
    color: 'blue',
    allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_comercial', 'lider_compras', 'lider_com_econorte', 'comercial_econorte', 'lider_log_econorte', 'recolector_econorte', 'jefe_planta', 'supervisor_planta'],
    children: [
      // ─────────────────────────────────────────────────────────────
      // Proveedores - Gestión de proveedores (externos e internos)
      // ─────────────────────────────────────────────────────────────
      {
        name: 'Proveedores',
        icon: Users,
        allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_comercial', 'lider_compras', 'lider_com_econorte', 'comercial_econorte', 'lider_log_econorte', 'recolector_econorte'],
        children: [
          { name: 'Materia Prima', href: '/proveedores/materia-prima', icon: Factory, allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_comercial', 'lider_compras'] },
          { name: 'Productos y Servicios', href: '/proveedores/productos-servicios', icon: Wrench, allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_comercial', 'lider_compras'] },
          { name: 'Pruebas de Acidez', href: '/proveedores/pruebas-acidez', icon: FlaskConical, allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_comercial', 'lider_compras'] },
          { name: 'EcoNorte', href: '/proveedores/econorte', icon: Leaf, allowedRoles: ['superadmin', 'gerente', 'lider_com_econorte', 'comercial_econorte', 'lider_log_econorte', 'recolector_econorte'] },
        ],
      },
      // ─────────────────────────────────────────────────────────────
      // Planta - Operaciones de procesamiento
      // ─────────────────────────────────────────────────────────────
      {
        name: 'Planta',
        icon: Factory,
        allowedRoles: ['superadmin', 'gerente', 'jefe_planta', 'supervisor_planta', 'lider_log_econorte', 'operador_bascula'],
        children: [
          { name: 'Recepción MP', href: '/planta/recepciones', icon: Truck, allowedRoles: ['superadmin', 'gerente', 'jefe_planta', 'supervisor_planta', 'lider_log_econorte', 'operador_bascula'] },
          { name: 'Lotes', href: '/planta/lotes', icon: Package, allowedRoles: ['superadmin', 'gerente', 'jefe_planta', 'supervisor_planta'] },
        ],
      },
      {
        name: 'Reportes',
        href: '/reportes',
        icon: BarChart3,
        allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_comercial', 'lider_compras', 'lider_com_econorte', 'lider_log_econorte'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE APOYO - Recursos para el funcionamiento
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Gestión de Apoyo',
    icon: Building2,
    isCategory: true,
    color: 'green',
    allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_talento_humano'],
    children: [
      {
        name: 'Talento Humano',
        href: '/talento-humano',
        icon: Heart,
        allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_talento_humano'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN INTEGRAL - SST, Calidad, Ambiente, PESV
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Gestión Integral',
    icon: ShieldCheck,
    isCategory: true,
    color: 'orange',
    allowedRoles: ['superadmin', 'gerente', 'admin', 'profesional_sst', 'profesional_calidad', 'profesional_ambiental'],
    children: [
      {
        name: 'SG-SST',
        href: '/sst',
        icon: Layers,
        allowedRoles: ['superadmin', 'gerente', 'admin', 'profesional_sst'],
        badge: 'Nuevo',
      },
      {
        name: 'Calidad',
        href: '/calidad',
        icon: Target,
        allowedRoles: ['superadmin', 'gerente', 'admin', 'profesional_calidad'],
        badge: 'Nuevo',
      },
      {
        name: 'Ambiental',
        href: '/ambiental',
        icon: Leaf,
        allowedRoles: ['superadmin', 'gerente', 'admin', 'profesional_ambiental'],
        badge: 'Nuevo',
      },
    ],
  },
];

// Componente recursivo para renderizar items de navegación
interface NavItemComponentProps {
  item: NavItem;
  level: number;
  isCollapsed: boolean;
  expandedItems: string[];
  toggleExpanded: (name: string) => void;
  isPathActive: (href?: string) => boolean;
  isItemActiveRecursive: (item: NavItem) => boolean;
  userCargoCode?: string;
  parentColor?: MacroprocessColor; // Color heredado del macroproceso padre
}

const NavItemComponent = ({
  item,
  level,
  isCollapsed,
  expandedItems,
  toggleExpanded,
  isPathActive,
  isItemActiveRecursive,
  userCargoCode,
  parentColor,
}: NavItemComponentProps) => {
  // Filtrar hijos según rol del usuario
  const filteredChildren = item.children?.filter((child) => {
    if (child.allowedRoles.includes('all')) return true;
    return userCargoCode && child.allowedRoles.includes(userCargoCode);
  });

  const hasChildren = filteredChildren && filteredChildren.length > 0;
  const isExpanded = expandedItems.includes(item.name);
  const isActive = isItemActiveRecursive(item);
  const Icon = item.icon;

  // Determinar el color a usar (propio o heredado del padre)
  const colorKey = item.color || parentColor;
  const colors = colorKey ? macroprocessColors[colorKey] : null;

  // Estilos según nivel
  const paddingLeft = level === 0 ? 'px-3' : level === 1 ? 'pl-6 pr-3' : 'pl-9 pr-3';
  const fontSize = level === 0 ? 'text-sm' : 'text-sm';
  const iconSize = level === 0 ? 'h-5 w-5' : 'h-4 w-4';

  // Estilos para categorías (macroprocesos)
  if (item.isCategory) {
    return (
      <div className="mt-4 first:mt-0">
        {/* Header de categoría con color */}
        <button
          onClick={() => toggleExpanded(item.name)}
          className={cn(
            'w-full flex items-center px-3 py-2 rounded-lg transition-colors group relative',
            colors
              ? isActive
                ? colors.bg
                : colors.bgHover
              : isActive
                ? 'bg-primary-50/50 dark:bg-primary-900/10'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                'h-4 w-4 flex-shrink-0',
                colors
                  ? isActive
                    ? colors.iconActive
                    : colors.icon
                  : isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
              )}
            />
          )}
          {!isCollapsed && (
            <>
              <span
                className={cn(
                  'ml-2 text-xs font-semibold uppercase tracking-wider flex-1 text-left',
                  colors
                    ? isActive
                      ? colors.textActive
                      : colors.text
                    : isActive
                      ? 'text-primary-700 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {item.name}
              </span>
              {hasChildren && (
                isExpanded ? (
                  <ChevronDown className={cn('h-3 w-3', colors ? colors.icon : 'text-gray-400')} />
                ) : (
                  <ChevronRight className={cn('h-3 w-3', colors ? colors.icon : 'text-gray-400')} />
                )
              )}
            </>
          )}
          {isCollapsed && (
            <div className={cn(
              'absolute left-full ml-2 px-2 py-1 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50',
              colors ? `bg-${colorKey}-600` : 'bg-gray-900 dark:bg-gray-700'
            )}>
              {item.name}
            </div>
          )}
        </button>

        {/* Hijos de la categoría con borde de color */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className={cn(
            'mt-1 space-y-0.5 ml-2 border-l-2',
            colors ? colors.border : 'border-l-gray-200 dark:border-l-gray-700'
          )}>
            {filteredChildren!.map((child) => (
              <NavItemComponent
                key={child.name}
                item={child}
                level={1}
                isCollapsed={isCollapsed}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                isPathActive={isPathActive}
                isItemActiveRecursive={isItemActiveRecursive}
                userCargoCode={userCargoCode}
                parentColor={colorKey}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Item navegable con posibles hijos
  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => toggleExpanded(item.name)}
          className={cn(
            'w-full flex items-center py-2 rounded-lg transition-colors group relative',
            paddingLeft,
            fontSize,
            colors
              ? isActive
                ? cn(colors.bgActive, colors.textActive)
                : cn('text-gray-700 dark:text-gray-300', colors.bgHover)
              : isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                iconSize,
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
          )}
          {!isCollapsed && (
            <>
              <span className="ml-3 font-medium flex-1 text-left">{item.name}</span>
              {isExpanded ? (
                <ChevronDown className={cn('h-4 w-4', colors ? colors.icon : '')} />
              ) : (
                <ChevronRight className={cn('h-4 w-4', colors ? colors.icon : '')} />
              )}
            </>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              {item.name}
            </div>
          )}
        </button>

        {/* Hijos */}
        {isExpanded && !isCollapsed && (
          <div className="mt-0.5 space-y-0.5">
            {filteredChildren!.map((child) => (
              <NavItemComponent
                key={child.name}
                item={child}
                level={level + 1}
                isCollapsed={isCollapsed}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                isPathActive={isPathActive}
                isItemActiveRecursive={isItemActiveRecursive}
                userCargoCode={userCargoCode}
                parentColor={colorKey}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Item sin hijos (link directo)
  const isDirectlyActive = isPathActive(item.href);

  return (
    <Link
      to={item.href || '#'}
      className={cn(
        'flex items-center py-2 rounded-lg transition-colors group relative',
        paddingLeft,
        fontSize,
        colors
          ? isDirectlyActive
            ? cn(colors.bgActive, colors.textActive)
            : cn('text-gray-700 dark:text-gray-300', colors.bgHover)
          : isDirectlyActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            iconSize,
            'flex-shrink-0',
            colors
              ? isDirectlyActive
                ? colors.iconActive
                : colors.icon
              : isDirectlyActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
          )}
        />
      )}
      {!isCollapsed && (
        <>
          <span className="ml-3 font-medium">{item.name}</span>
          {item.badge && (
            <span className={cn(
              'ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              colors
                ? cn(colors.bg, colors.text)
                : 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
            )}>
              {item.badge}
            </span>
          )}
        </>
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

  // Iniciar con todos los menús colapsados - mejor UX
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Filtrar navegación según rol
  const filteredNavigation = navigationItems.filter((item) => {
    if (item.allowedRoles.includes('all')) return true;
    return user?.cargo_code && item.allowedRoles.includes(user.cargo_code);
  });

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  // Verificar si una ruta está activa
  const isPathActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Verificar recursivamente si algún hijo está activo
  const isItemActiveRecursive = (item: NavItem): boolean => {
    if (item.href && isPathActive(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => isItemActiveRecursive(child));
    }
    return false;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 z-30 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <nav className="h-full flex flex-col py-4">
        {/* Navigation Items */}
        <div className="flex-1 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredNavigation.map((item) => (
            <NavItemComponent
              key={item.name}
              item={item}
              level={0}
              isCollapsed={isCollapsed}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              isPathActive={isPathActive}
              isItemActiveRecursive={isItemActiveRecursive}
              userCargoCode={user?.cargo_code ?? undefined}
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
