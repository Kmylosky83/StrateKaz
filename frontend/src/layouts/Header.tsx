/**
 * Header - Enterprise Level Simplificado
 *
 * Diseno optimizado:
 * - ZONA A: Menu toggle + Logo/Marca (sin limite de ancho)
 * - Espacio flexible
 * - ZONA B: Contextual segun modo
 *   - Admin Global: Tema + Nombre admin + Logout
 *   - Tenant: Busqueda + Notificaciones + Tema + UserMenu completo
 */
import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, Moon, Sun, Search, LogOut } from 'lucide-react';
import NotificationPanel from '@/features/audit-system/components/NotificationPanel';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useNotificacionesNoLeidas } from '@/features/audit-system/hooks/useNotificaciones';
import {
  UserMenu,
  SearchModal,
  useSearchModal,
  TenantSwitcher,
  AIAssistantButton,
} from '@/components/common';
import { cn } from '@/utils/cn';
import { HEADER_LABELS, ROUTES } from '@/constants';

interface HeaderProps {
  onToggleSidebar: () => void;
  isMobileMenuOpen?: boolean;
  /** Cuando el banner de impersonacion esta activo, desplazar header hacia abajo */
  impersonationOffset?: boolean;
}

export const Header = ({
  onToggleSidebar,
  isMobileMenuOpen = false,
  impersonationOffset = false,
}: HeaderProps) => {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { companyName, companySlogan, getLogoForTheme } = useBrandingConfig();

  // Auth context
  const tenantUser = useAuthStore((state) => state.tenantUser);
  const currentTenantId = useAuthStore((state) => state.currentTenantId);
  const logout = useAuthStore((state) => state.logout);

  // Detectar modo Admin Global (mismo patron que Sidebar)
  const isAdminGlobalMode = !currentTenantId || location.pathname.startsWith('/admin-global');

  // Estado de busqueda global (solo aplica en modo tenant)
  const searchModal = useSearchModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const toggleNotifPanel = useCallback(() => setIsNotifPanelOpen((prev) => !prev), []);

  // Notificaciones no leidas (hook ya tiene enabled: !!user?.id, no fetcha sin tenant)
  const { data: notificacionesNoLeidas } = useNotificacionesNoLeidas();
  const unreadCount = notificacionesNoLeidas?.length ?? 0;

  // Logo segun tema
  const currentLogo = getLogoForTheme(theme);

  // Nombre del admin para modo Admin Global
  const adminDisplayName = tenantUser?.first_name || tenantUser?.email?.split('@')[0] || 'Admin';

  return (
    <>
      <header
        className={cn(
          'fixed left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16',
          impersonationOffset ? 'top-10' : 'top-0'
        )}
      >
        <div className="h-full px-2 sm:px-4 flex items-center justify-between">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ZONA A: Menu + Logo/Marca (sin limite de ancho) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Menu Toggle */}
            <button
              onClick={onToggleSidebar}
              className={cn(
                'p-2 rounded-lg transition-all duration-200',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'active:scale-95'
              )}
              aria-label={isMobileMenuOpen ? HEADER_LABELS.CLOSE_MENU : HEADER_LABELS.OPEN_MENU}
            >
              <div className="relative h-5 w-5">
                <Menu
                  className={cn(
                    'absolute inset-0 h-5 w-5 text-gray-600 dark:text-gray-300 transition-all duration-200',
                    isMobileMenuOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100'
                  )}
                />
                <X
                  className={cn(
                    'absolute inset-0 h-5 w-5 text-gray-600 dark:text-gray-300 transition-all duration-200',
                    isMobileMenuOpen ? 'opacity-100' : 'opacity-0 -rotate-90 scale-0'
                  )}
                />
              </div>
            </button>

            {/* Logo + Nombre (sin limite de ancho) */}
            <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
              <img
                src={currentLogo}
                alt={companyName}
                className="h-9 w-auto object-contain flex-shrink-0"
              />
              <div className="hidden lg:flex flex-col justify-center">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {companyName}
                </h1>
                {companySlogan && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden xl:block">
                    {companySlogan}
                  </p>
                )}
              </div>
            </Link>

            {/* Separador antes del TenantSwitcher */}
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block" />

            {/* Selector de Empresa (para multi-tenant y superadmins) */}
            <TenantSwitcher className="hidden md:flex" />
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ZONA B: Contextual segun modo */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {isAdminGlobalMode ? (
              /* ─── Admin Global: Tema + Nombre + Logout ─── */
              <>
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500'
                  )}
                  title={theme === 'dark' ? HEADER_LABELS.LIGHT_MODE : HEADER_LABELS.DARK_MODE}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>

                {/* Separador */}
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

                {/* Admin name + Logout */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                    {adminDisplayName}
                  </span>
                  <button
                    onClick={logout}
                    title="Cerrar sesion"
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      'text-gray-600 dark:text-gray-300',
                      'hover:bg-red-50 dark:hover:bg-red-900/20',
                      'hover:text-red-600 dark:hover:text-red-400',
                      'focus:outline-none focus:ring-2 focus:ring-red-500'
                    )}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              /* ─── Tenant Mode: Busqueda + Notificaciones + Tema + UserMenu ─── */
              <>
                {/* Busqueda Global */}
                <button
                  onClick={searchModal.open}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500'
                  )}
                  title={HEADER_LABELS.SEARCH_SHORTCUT}
                >
                  <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>

                {/* Notificaciones */}
                <div className="relative">
                  <button
                    onClick={toggleNotifPanel}
                    className={cn(
                      'relative p-2 rounded-lg transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500',
                      isNotifPanelOpen && 'bg-gray-100 dark:bg-gray-700'
                    )}
                    title={
                      unreadCount > 0
                        ? `${unreadCount} ${HEADER_LABELS.NOTIFICATIONS}`
                        : HEADER_LABELS.NOTIFICATIONS
                    }
                  >
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span
                        className={cn(
                          'absolute -top-0.5 -right-0.5',
                          'flex items-center justify-center',
                          'min-w-[18px] h-[18px] px-1',
                          'text-[10px] font-bold text-white',
                          'bg-red-500 rounded-full',
                          'ring-2 ring-white dark:ring-gray-800'
                        )}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationPanel
                    isOpen={isNotifPanelOpen}
                    onClose={() => setIsNotifPanelOpen(false)}
                  />
                </div>

                {/* Asistente IA */}
                <AIAssistantButton />

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500'
                  )}
                  title={theme === 'dark' ? HEADER_LABELS.LIGHT_MODE : HEADER_LABELS.DARK_MODE}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>

                {/* Separador vertical */}
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

                {/* User Menu (muestra nombre + cargo) */}
                <UserMenu />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Busqueda Global (solo renderiza si no es Admin Global) */}
      {!isAdminGlobalMode && (
        <SearchModal
          isOpen={searchModal.isOpen}
          onClose={searchModal.close}
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar en todo el sistema..."
        />
      )}
    </>
  );
};
