/**
 * PortalLayout - Layout aislado para proveedores portal-only
 *
 * Diseño minimalista sin sidebar ni módulos:
 * - Header: logo tenant + nombre empresa + avatar/menú usuario + tema + logout
 * - Contenido: full-width centrado (max-w-5xl)
 * - Footer: inline mínimo (powered by StrateKaz)
 * - NO incluye: sidebar, búsqueda global, notificaciones, BottomNavigation
 *
 * Usado por usuarios con cargo PROVEEDOR_PORTAL (proveedores de materia prima,
 * productos, transportistas, contratistas, representantes de firma consultora).
 */
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Key, ChevronDown, Rocket } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { Avatar, Button } from '@/components/common';
import { ChangePasswordModal } from '@/components/common/auth';
import { ImpersonationBanner } from '@/components/common/ImpersonationBanner';
import { cn } from '@/utils/cn';
import { BRAND } from '@/constants/brand';

export const PortalLayout = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { companyName, getLogoForTheme } = useBrandingConfig();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isImpersonating = useAuthStore((s) => s.isImpersonating);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
          {/* Logo + Nombre empresa */}
          <div className="flex items-center gap-3">
            <img
              src={currentLogo}
              alt={companyName}
              className="h-9 w-auto object-contain flex-shrink-0"
            />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {companyName}
              </h1>
            </div>
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} {BRAND.copyright}
          </span>
          <a
            href={BRAND.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            {BRAND.name}
            <Rocket className="h-3 w-3 fill-current" />
          </a>
        </div>
      </footer>

      {/* Modal cambiar contrasena */}
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};
