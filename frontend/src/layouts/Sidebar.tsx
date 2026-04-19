/**
 * Sidebar Dinámico - Sistema de Gestión StrateKaz
 *
 * Diseño profesional neutro:
 * - Carga módulos, tabs y secciones desde la API (sin hardcoding)
 * - Iconos dinámicos desde Lucide React
 * - Colores neutros base con acento sutil en estado activo
 * - Control granular: desactivar módulo/tab en Config → desaparece del sidebar
 */
import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { DEFAULT_TENANT_COLORS } from '@/constants/defaults';
import { useSidebarModules } from '@/hooks/useModules';
import type { SidebarModule } from '@/hooks/useModules';
import {
  ChevronRight,
  ChevronDown,
  Circle,
  Loader2,
  LayoutDashboard,
  Shield,
  UserCircle,
  Building2,
  Check,
} from 'lucide-react';

import { getIconComponent as getDynamicIcon } from '@/components/common/DynamicIcon';
import { APP_VERSION } from '@/constants/brand';
import { useAuthStore } from '@/store/authStore';
import { useShallow } from 'zustand/react/shallow';

interface SidebarProps {
  isCollapsed: boolean;
  /** Si estamos en viewport mobile */
  isMobile?: boolean;
  /** Si el drawer mobile está abierto */
  isMobileOpen?: boolean;
  /** Callback para cerrar el drawer mobile */
  onCloseMobile?: () => void;
  /** Cuando el banner de impersonacion esta activo, desplazar sidebar hacia abajo */
  impersonationOffset?: boolean;
}

// Sidebar profesional: colores neutros uniformes con acento primary en estado activo.
// Los colores por módulo se reservan para las páginas de contenido, no para navegación.

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
 * Componente recursivo para renderizar items de navegación.
 * Diseño profesional: colores neutros, acento primary en activo.
 */
interface NavItemComponentProps {
  item: SidebarModule;
  isCollapsed: boolean;
  expandedItems: string[];
  toggleExpanded: (code: string) => void;
  location: ReturnType<typeof useLocation>;
  depth?: number;
}

const CollapsedTooltip = ({ name }: { name: string }) => (
  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
    {name}
  </div>
);

const NavItemComponent = ({
  item,
  isCollapsed,
  expandedItems,
  toggleExpanded,
  location,
  depth = 0,
}: NavItemComponentProps) => {
  const Icon = getIconComponent(item.icon);
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(item.code);

  const isActive = useMemo(() => {
    const matchesRoute = (route: string | undefined | null) => {
      if (!route) return false;
      return location.pathname === route || location.pathname.startsWith(route + '/');
    };
    if (item.route && matchesRoute(item.route)) return true;
    if (item.children) return item.children.some((child) => matchesRoute(child.route));
    return false;
  }, [item, location.pathname]);

  // ── Categoría (grupo de módulos) — TIER 0: label estructural ──
  // Patrón: Material Design / Atlassian / Fluent UI
  // UPPERCASE pequeño, muted, colapsable, sin background hover.
  if (item.is_category) {
    return (
      <div className="mt-5 first:mt-2">
        <button
          onClick={() => toggleExpanded(item.code)}
          className={cn(
            'w-full flex items-center px-3 py-1.5 rounded-md transition-colors group relative',
            'text-gray-400 dark:text-gray-500',
            'hover:text-gray-600 dark:hover:text-gray-300'
          )}
        >
          {isCollapsed ? (
            <Icon className="h-4 w-4 flex-shrink-0 mx-auto opacity-60" />
          ) : (
            <>
              <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
              <span className="ml-2.5 flex-1 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em]">
                {item.name}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 opacity-50" />
              ) : (
                <ChevronRight className="h-3 w-3 opacity-50" />
              )}
            </>
          )}
          {isCollapsed && <CollapsedTooltip name={item.name} />}
        </button>

        {isExpanded && !isCollapsed && hasChildren && (
          <div className="mt-1 space-y-0.5">
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

  // ── Módulo con tabs (expandible) ──
  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => toggleExpanded(item.code)}
          className={cn(
            'w-full flex items-center rounded-lg transition-colors group relative',
            depth > 0 ? 'pl-4 pr-3 py-2' : 'px-3 py-2.5',
            isActive
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
          )}
        >
          <Icon
            className={cn(
              depth > 0 ? 'h-4 w-4' : 'h-5 w-5',
              'flex-shrink-0',
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-500'
            )}
          />
          {!isCollapsed && (
            <>
              <span className="ml-3 font-medium flex-1 text-left text-sm">{item.name}</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 opacity-40" />
              ) : (
                <ChevronRight className="h-4 w-4 opacity-40" />
              )}
            </>
          )}
          {isCollapsed && <CollapsedTooltip name={item.name} />}
        </button>

        {isExpanded && !isCollapsed && (
          <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700">
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

  // ── Item simple (hoja) — Link navegable ──
  const isItemActive =
    item.route &&
    (location.pathname === item.route || location.pathname.startsWith(item.route + '/'));

  return (
    <Link
      to={item.route || '#'}
      className={cn(
        'flex items-center rounded-lg transition-colors group relative',
        depth > 0 ? 'pl-4 pr-3 py-2 text-sm' : 'px-3 py-2.5',
        isItemActive
          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 font-medium'
          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
      )}
    >
      <Icon
        className={cn(
          depth > 0 ? 'h-4 w-4 mr-2' : 'h-5 w-5',
          isItemActive
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-gray-400 dark:text-gray-500'
        )}
      />
      {!isCollapsed && <span className={cn(depth > 0 ? '' : 'ml-3 text-sm')}>{item.name}</span>}
      {isCollapsed && <CollapsedTooltip name={item.name} />}
    </Link>
  );
};

export const Sidebar = ({
  isCollapsed,
  isMobile = false,
  isMobileOpen = false,
  onCloseMobile,
  impersonationOffset = false,
}: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Consolidado en 2 suscripciones (en vez de 8) para reducir useSyncExternalStore subscribers
  const { user, currentTenantId, currentTenant, accessibleTenants, isSuperadmin } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      currentTenantId: state.currentTenantId,
      currentTenant: state.currentTenant,
      accessibleTenants: state.accessibleTenants,
      isSuperadmin: state.isSuperadmin,
    }))
  );
  const { selectTenant, startImpersonation, clearTenantContext } = useAuthStore(
    useShallow((state) => ({
      selectTenant: state.selectTenant,
      startImpersonation: state.startImpersonation,
      clearTenantContext: state.clearTenantContext,
    }))
  );
  // is_superuser viene del User (tenant), isSuperadmin viene del TenantUser (global)
  const isSuperuser = user?.is_superuser ?? isSuperadmin ?? false;

  // Estado para el tenant switcher móvil
  const [tenantSwitcherOpen, setTenantSwitcherOpen] = useState(false);
  const showMobileTenantSwitcher = isMobile && (accessibleTenants.length > 1 || isSuperadmin);

  // Admin Global solo visible si es superusuario Y NO está en contexto de empresa
  // O si está en la ruta de admin-global (para poder navegar de vuelta)
  const showAdminGlobal =
    isSuperuser && (!currentTenantId || location.pathname.startsWith('/admin-global'));

  // Determinar si estamos en modo Admin Global (sin contexto de tenant)
  const isAdminGlobalMode = !currentTenantId || location.pathname.startsWith('/admin-global');

  // Sidebar siempre usa colores neutros estaticos para garantizar contraste y legibilidad.
  // Los colores de branding del tenant se aplican en Header y acentos, no en la navegacion.

  // Solo cargar módulos del sidebar si hay un tenant seleccionado
  // En Admin Global no hay tenant, así que no se cargan módulos
  const { data: sidebarModules, isLoading, error } = useSidebarModules();

  // Si estamos en Admin Global, no necesitamos los módulos del tenant
  const shouldShowTenantModules = currentTenantId && !location.pathname.startsWith('/admin-global');

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

  // Sidebar siempre neutro: blanco en light, gris oscuro en dark
  const sidebarBaseClasses = cn(
    'fixed bottom-0 z-40',
    impersonationOffset ? 'top-[104px]' : 'top-16',
    'bg-white dark:bg-gray-800',
    'border-r border-gray-200 dark:border-gray-700',
    'transition-all duration-300 ease-in-out'
  );

  // Clases para mobile (drawer)
  const mobileClasses = isMobile
    ? cn('left-0 w-72', isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full')
    : cn('left-0', isCollapsed ? 'w-16' : 'w-64');

  // Sin estilo inline - sidebar siempre neutro
  const sidebarStyle = undefined;

  // Loading state - solo si estamos cargando módulos de tenant
  if (isLoading && shouldShowTenantModules) {
    return (
      <aside className={cn(sidebarBaseClasses, mobileClasses)} style={sidebarStyle}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
        </div>
      </aside>
    );
  }

  // Error state - solo mostrar si hay error Y deberíamos mostrar módulos de tenant
  // En Admin Global (sin tenant), no es un error que no haya módulos
  if (error && shouldShowTenantModules) {
    return (
      <aside className={cn(sidebarBaseClasses, mobileClasses)} style={sidebarStyle}>
        <div className="flex items-center justify-center h-full px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Error al cargar menú</p>
        </div>
      </aside>
    );
  }

  // En mobile, el sidebar siempre está expandido (drawer)
  const effectiveCollapsed = isMobile ? false : isCollapsed;

  return (
    <aside className={cn(sidebarBaseClasses, mobileClasses)} style={sidebarStyle}>
      <nav className="h-full flex flex-col py-4">
        {/* ═══ Tenant Switcher Móvil ═══ */}
        {showMobileTenantSwitcher && (
          <div className="px-2 mb-2">
            {/* Botón para expandir/colapsar */}
            <button
              type="button"
              onClick={() => setTenantSwitcherOpen((prev) => !prev)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: currentTenant?.primary_color || DEFAULT_TENANT_COLORS.primary,
                }}
              >
                {currentTenant?.name?.charAt(0)?.toUpperCase() || <Building2 className="w-4 h-4" />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {currentTenant?.name || 'Seleccionar empresa'}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  {currentTenant?.primary_domain || currentTenant?.code || ''}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
                  tenantSwitcherOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Lista de tenants */}
            {tenantSwitcherOpen && (
              <div className="mt-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
                {accessibleTenants.map(({ tenant, role }) => {
                  const isActive = tenant.id === currentTenantId;
                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={async () => {
                        if (!isActive) {
                          // Superadmins usan startImpersonation (muestra banner amber)
                          // Usuarios normales multi-tenant usan selectTenant
                          if (isSuperadmin) {
                            await startImpersonation(tenant.id);
                          } else {
                            await selectTenant(tenant.id);
                          }
                          navigate('/dashboard');
                        }
                        setTenantSwitcherOpen(false);
                        onCloseMobile?.();
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{
                          backgroundColor: tenant.primary_color || DEFAULT_TENANT_COLORS.primary,
                        }}
                      >
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {tenant.name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{role}</p>
                      </div>
                      {isActive && (
                        <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
                {/* Admin Global - solo superadmins */}
                {isSuperadmin && (
                  <button
                    type="button"
                    onClick={() => {
                      clearTenantContext();
                      navigate('/admin-global');
                      setTenantSwitcherOpen(false);
                      onCloseMobile?.();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors border-t border-gray-200 dark:border-gray-600',
                      isAdminGlobalMode
                        ? 'bg-purple-50 dark:bg-purple-900/20'
                        : 'hover:bg-purple-50 dark:hover:bg-purple-900/10'
                    )}
                  >
                    <Shield className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Admin Global
                    </span>
                    {isAdminGlobalMode && (
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Separador */}
            <div className="mt-2 border-t border-gray-200 dark:border-gray-700" />
          </div>
        )}

        {/* Dashboard Link - Solo visible cuando HAY tenant seleccionado (no en Admin Global) */}
        {!isAdminGlobalMode && (
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
        )}

        {/* Mi Portal - Visible para todos los usuarios con tenant */}
        {!isAdminGlobalMode && (
          <div className="px-2 mb-1">
            <Link
              to="/mi-portal"
              className={cn(
                'flex items-center rounded-lg transition-colors px-3 py-2.5 group relative',
                location.pathname === '/mi-portal' || location.pathname.startsWith('/mi-portal/')
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20'
              )}
            >
              <UserCircle
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  location.pathname === '/mi-portal' || location.pathname.startsWith('/mi-portal/')
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              />
              {!effectiveCollapsed && <span className="ml-3 font-medium">Mi Portal</span>}
              {effectiveCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  Mi Portal
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Mi Equipo (jefe) ELIMINADO del sidebar — ahora es sección en Mi Portal.
            JefePortalSection se muestra dentro de Mi Portal cuando cargo.is_jefatura=true.
            El módulo RRHH "Gestión de Personas" sigue en el sidebar dinámico. */}

        {/* Portal Proveedor ELIMINADO del sidebar:
            - Portal-only users usan PortalLayout (sin sidebar)
            - Profesionales colocados NO necesitan link al portal de la firma */}

        {/* Admin Global - Solo visible para superusuarios cuando NO están en contexto de empresa */}
        {showAdminGlobal && (
          <div className="px-2 mb-2">
            <Link
              to="/admin-global"
              className={cn(
                'flex items-center rounded-lg transition-colors px-3 py-2.5 group relative',
                location.pathname === '/admin-global' ||
                  location.pathname.startsWith('/admin-global/')
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              )}
            >
              <Shield
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  location.pathname === '/admin-global' ||
                    location.pathname.startsWith('/admin-global/')
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-purple-500 dark:text-purple-400'
                )}
              />
              {!effectiveCollapsed && <span className="ml-3 font-medium">Admin Global</span>}
              {effectiveCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  Admin Global
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Separador - solo si hay contenido después */}
        {shouldShowTenantModules && sidebarModules && sidebarModules.length > 0 && (
          <div className="px-4 mb-2">
            <div className="border-t border-gray-200 dark:border-gray-700" />
          </div>
        )}

        {/* Navigation Items - Dinámico desde API (solo si hay tenant) */}
        <div className="flex-1 px-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {shouldShowTenantModules &&
            sidebarModules &&
            sidebarModules.map((item) => (
              <NavItemComponent
                key={item.code}
                item={item}
                isCollapsed={effectiveCollapsed}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                location={location}
              />
            ))}

          {/* Mensaje cuando no hay módulos en Admin Global */}
          {isAdminGlobalMode && !effectiveCollapsed && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">Modo Administración Global</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Selecciona una empresa para ver sus módulos
              </p>
            </div>
          )}
        </div>

        {/* Version Info (only when expanded) - FIJO StrateKaz */}
        {!effectiveCollapsed && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Versión {APP_VERSION}</p>
          </div>
        )}
      </nav>
    </aside>
  );
};
