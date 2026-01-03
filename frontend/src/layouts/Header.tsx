import { Link } from 'react-router-dom';
import { Menu, Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { companyName, companySlogan, getLogoForTheme } = useBrandingConfig();

  // Obtener logo según el tema actual
  const currentLogo = getLogoForTheme(theme);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>

          <Link to="/dashboard" className="flex items-center space-x-3">
            <img
              src={currentLogo}
              alt={companyName}
              className="h-10 w-auto object-contain"
            />
            <div className="hidden md:block">
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                {companyName}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {companySlogan}
              </p>
            </div>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-accent-500 dark:bg-accent-400 rounded-full ring-2 ring-white dark:ring-gray-800" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.first_name || user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.cargo?.name}
              </p>
            </div>

            <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
