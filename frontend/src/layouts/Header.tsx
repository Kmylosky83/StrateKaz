/**
 * Header - Enterprise Level Simplificado
 *
 * Diseno optimizado:
 * - ZONA A: Menu toggle + Logo/Marca (sin limite de ancho)
 * - Espacio flexible
 * - ZONA B: Busqueda + Notificaciones + Tema + Usuario (fijo)
 *
 * NOTA: Los tabs de secciones ahora van en el PageHeader de cada pagina,
 * no en el Header principal. Esto da mas espacio y mejor UX.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, Moon, Sun, Search } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useNotificacionesNoLeidas } from '@/features/audit-system/hooks/useNotificaciones';
import { UserMenu, SearchModal, useSearchModal } from '@/components/common';
import { cn } from '@/utils/cn';
import { HEADER_LABELS, ROUTES } from '@/constants';

interface HeaderProps {
  onToggleSidebar: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header = ({ onToggleSidebar, isMobileMenuOpen = false }: HeaderProps) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { companyName, companySlogan, getLogoForTheme } = useBrandingConfig();

  // Estado de busqueda global
  const searchModal = useSearchModal();
  const [searchQuery, setSearchQuery] = useState('');

  // Notificaciones no leidas
  const { data: notificacionesNoLeidas } = useNotificacionesNoLeidas();
  const unreadCount = notificacionesNoLeidas?.length ?? 0;

  // Logo segun tema
  const currentLogo = getLogoForTheme(theme);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
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
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ZONA B: Busqueda + Notificaciones + Tema + Usuario */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
            <button
              onClick={() => navigate(ROUTES.NOTIFICATIONS)}
              className={cn(
                'relative p-2 rounded-lg transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
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
          </div>
        </div>
      </header>

      {/* Modal de Busqueda Global */}
      <SearchModal
        isOpen={searchModal.isOpen}
        onClose={searchModal.close}
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar en todo el sistema..."
      />
    </>
  );
};
