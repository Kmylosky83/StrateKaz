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
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
  Target,
  Heart,
  Layers,
  Leaf,
  Calendar,
  Factory,
  Wrench,
  FlaskConical,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
}

interface NavSubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  allowedRoles: string[];
  badge?: string;
  subItems?: NavSubItem[];
}

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['all'],
  },
  {
    name: 'Usuarios',
    href: '/usuarios',
    icon: UserCog,
    allowedRoles: ['superadmin', 'gerente', 'admin'],
  },
  {
    name: 'Proveedores',
    href: '/proveedores',
    icon: Users,
    allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_comercial', 'lider_compras', 'lider_com_econorte', 'comercial_econorte', 'lider_log_econorte'],
    subItems: [
      { name: 'Materia Prima', href: '/proveedores/materia-prima' },
      { name: 'Productos y Servicios', href: '/proveedores/productos-servicios' },
      { name: 'Ecoaliados', href: '/proveedores/ecoaliados' },
      { name: 'Pruebas de Acidez', href: '/proveedores/pruebas-acidez' },
    ],
  },
  {
    name: 'Programaciones',
    href: '/programaciones',
    icon: Calendar,
    allowedRoles: [
      'superadmin',
      'gerente',
      'lider_com_econorte',
      'comercial_econorte',
      'lider_log_econorte',
      'recolector_econorte',
    ],
  },
  {
    name: 'Recolecciones',
    href: '/recolecciones',
    icon: Truck,
    allowedRoles: [
      'superadmin',
      'gerente',
      'lider_com_econorte',
      'lider_log_econorte',
      'supervisor_planta',
      'recolector_econorte',
    ],
  },
  {
    name: 'Lotes de Planta',
    href: '/lotes',
    icon: Package,
    allowedRoles: ['superadmin', 'gerente', 'jefe_planta', 'lider_log_econorte', 'supervisor_planta'],
  },
  {
    name: 'Liquidaciones',
    href: '/liquidaciones',
    icon: DollarSign,
    allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_compras', 'lider_log_econorte'],
  },
  {
    name: 'Certificados',
    href: '/certificados',
    icon: FileText,
    allowedRoles: ['superadmin', 'gerente', 'lider_com_econorte', 'comercial_econorte'],
  },
  {
    name: 'Reportes',
    href: '/reportes',
    icon: BarChart3,
    allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_comercial', 'lider_compras', 'lider_com_econorte', 'lider_log_econorte'],
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
    allowedRoles: ['superadmin', 'gerente'],
  },
  {
    name: 'Dirección Estratégica',
    href: '/direccion-estrategica',
    icon: Target,
    allowedRoles: ['superadmin', 'gerente', 'admin'],
  },
  {
    name: 'Talento Humano',
    href: '/talento-humano',
    icon: Heart,
    allowedRoles: ['superadmin', 'gerente', 'admin', 'lider_talento_humano'],
  },
  {
    name: 'Gestión Integral',
    href: '/gestion-integral',
    icon: Layers,
    allowedRoles: ['superadmin', 'gerente', 'admin', 'profesional_sst'],
  },
];

export const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Proveedores']);

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

  const isItemActive = (item: NavItem) => {
    if (item.subItems) {
      return item.subItems.some((sub) => location.pathname.startsWith(sub.href));
    }
    return location.pathname === item.href || location.pathname.startsWith(item.href + '/');
  };

  const isSubItemActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
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
          {filteredNavigation.map((item) => {
            const isActive = isItemActive(item);
            const isExpanded = expandedItems.includes(item.name);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const Icon = item.icon;

            return (
              <div key={item.name}>
                {/* Item principal */}
                {hasSubItems ? (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group relative',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        isActive
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    />

                    {!isCollapsed && (
                      <>
                        <span className="ml-3 font-medium flex-1 text-left">{item.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center px-3 py-2.5 rounded-lg transition-colors group relative',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        isActive
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    />

                    {!isCollapsed && (
                      <>
                        <span className="ml-3 font-medium">{item.name}</span>

                        {item.badge && (
                          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                            {item.badge}
                          </span>
                        )}

                        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                      </>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </Link>
                )}

                {/* Sub-items */}
                {hasSubItems && isExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems!.map((subItem) => {
                      const subIsActive = isSubItemActive(subItem.href);
                      // Icon based on subitem
                      const SubIcon = subItem.href.includes('materia-prima')
                        ? Factory
                        : subItem.href.includes('ecoaliados')
                          ? Leaf
                          : subItem.href.includes('pruebas-acidez')
                            ? FlaskConical
                            : Wrench;

                      return (
                        <Link
                          key={subItem.href}
                          to={subItem.href}
                          className={cn(
                            'flex items-center px-3 py-2 rounded-lg transition-colors text-sm',
                            subIsActive
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                          )}
                        >
                          <SubIcon className="h-4 w-4 mr-2" />
                          {subItem.name}
                          {subIsActive && <ChevronRight className="ml-auto h-3 w-3" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
