/**
 * PortalLayout - Layout aislado para proveedores portal-only
 *
 * Diseño con header enriquecido, notificaciones y footer profesional:
 * - Header: logo tenant + nombre empresa + slogan + notificaciones + tema + usuario
 * - Contenido: full-width centrado (max-w-5xl)
 * - Footer: copyright + soporte + powered by
 *
 * Usado por usuarios con cargo PROVEEDOR_PORTAL (proveedores de materia prima,
 * productos, transportistas, contratistas, representantes de firma consultora).
 */
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut, Key, ChevronDown, Rocket, Bell } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useNotificacionesNoLeidas } from '@/features/audit-system/hooks/useNotificaciones';
import { Avatar } from '@/components/common';
import { TenantSwitcher } from '@/components/common/TenantSwitcher';
import { ChangePasswordModal } from '@/components/common/auth';
import { ImpersonationBanner } from '@/components/common/ImpersonationBanner';
import { cn } from '@/utils/cn';
import { BRAND } from '@/constants/brand';

export const PortalLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { companyName, companySlogan, getLogoForTheme } = useBrandingConfig();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isImpersonating = useAuthStore((s) => s.isImpersonating);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Notificaciones no leídas
  const { data: notificacionesNoLeidas } = useNotificacionesNoLeidas();
  const unreadCount = notificacionesNoLeidas?.length ?? 0;

  const currentLogo = getLogoForTheme(theme);
  const displayName = user?.first_name || user?.username || 'Usuario';
  const cargoName = user?.cargo?.name || 'Proveedor';
  const fullName = user?.full_name || `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Impersonation Banner (superadmin visitando como proveedor) */}
      <ImpersonationBanner />

      {/* ================================================================
          HEADER MINIMALISTA
          ================================================================ */}
      <header
        className={cn(
          'sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
          isImpersonating && 'top-10'
        )}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo + Nombre empresa + Slogan */}
          <div className="flex items-center gap-3">
            <img
              src={currentLogo}
              alt={companyName}
              className="h-10 w-auto object-contain flex-shrink-0"
            />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {companyName}
              </h1>
              {companySlogan && (
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block leading-tight">
                  {companySlogan}
                </p>
              )}
            </div>

            {/* MB-TENANT: Selector de empresa para usuarios multi-tenant */}
            <TenantSwitcher className="ml-1" />
          </div>

          {/* Acciones: tema + usuario */}
          <div className="flex items-center gap-2">
            {/* Toggle tema */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-gray-400 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {/* Notificaciones */}
            <button
              onClick={() => {
                const basePath = location.pathname.startsWith('/cliente-portal')
                  ? '/cliente-portal'
                  : '/proveedor-portal';
                navigate(`${basePath}?tab=notificaciones`);
              }}
              className="relative p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              title={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Notificaciones'}
            >
              <Bell className="h-5 w-5 text-gray-500 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Separador */}
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Menu usuario */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <Avatar
                  src={user?.photo_url || undefined}
                  name={fullName}
                  size="sm"
                  status="external"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight truncate max-w-[140px]">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                    {cargoName}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-gray-400 transition-transform duration-200',
                    menuOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Info usuario */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {user?.email}
                      </p>
                      {user?.proveedor_nombre && (
                        <p className="text-xs text-primary-600 dark:text-primary-400 truncate mt-1 font-medium">
                          {user.proveedor_nombre}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setShowPasswordModal(true);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <Key className="h-4 w-4 text-gray-400" />
                        Cambiar Contrasena
                      </button>
                    </div>

                    {/* Cerrar sesion */}
                    <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================
          CONTENIDO PRINCIPAL
          ================================================================ */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>

      {/* ================================================================
          FOOTER MINIMO
          ================================================================ */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            {/* Izquierda: copyright + soporte */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                &copy; {new Date().getFullYear()} {BRAND.copyright}. Todos los derechos reservados.
              </span>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                {BRAND.supportEmail}
              </a>
            </div>
            {/* Derecha: powered by */}
            <a
              href={BRAND.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            >
              Powered by {BRAND.name}
              <Rocket className="h-3 w-3 fill-current" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modal cambiar contrasena */}
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};
