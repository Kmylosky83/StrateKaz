/**
 * UserMenu - Menu de usuario con dropdown
 *
 * Muestra avatar, nombre y cargo de forma clara.
 * Dropdown con opciones de perfil, configuracion y logout.
 *
 * Diseno:
 * - Avatar mas grande (40px)
 * - Nombre y cargo visibles en 2 lineas
 * - Dropdown con opciones al hacer click
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown, Shield, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import { cn } from '@/utils/cn';
import { USER_MENU_LABELS, ROUTES } from '@/constants';

export interface UserMenuProps {
  /** Mostrar solo avatar (modo compacto) */
  compact?: boolean;
  /** Clases adicionales */
  className?: string;
}

export const UserMenu = ({ compact = false, className }: UserMenuProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Badge de completitud del perfil.
  // Superadmins ahora tienen pesos simplificados (foto, firma, documento, nombre).
  // TODO: usar hasCargo para lógica condicional de perfil cuando se implemente
  const _hasCargo = !!user?.cargo;
  const isSuperAdmin = user?.is_superuser;
  const shouldFetchProfile = !!user;
  const { data: profileData } = useProfileCompleteness(shouldFetchProfile);
  const profilePercentage = profileData?.percentage ?? null;
  const showProfileBadge =
    shouldFetchProfile && profilePercentage !== null && profilePercentage < 100;

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  // Iniciales del usuario
  const initials =
    user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';

  // Nombre para mostrar (completo en 2 lineas si es necesario)
  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || user?.username || USER_MENU_LABELS.DEFAULT_USER;

  // Solo el primer nombre para el saludo compacto
  const _firstName = user?.first_name || user?.username || USER_MENU_LABELS.DEFAULT_USER;

  // Cargo y contexto organizacional
  const cargoName = isSuperAdmin
    ? 'Administrador del Sistema'
    : user?.cargo?.name || USER_MENU_LABELS.DEFAULT_CARGO;
  const areaName = user?.area_nombre || user?.cargo?.area_nombre;
  const empresaName = user?.empresa_nombre;

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 rounded-lg transition-all',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          compact ? 'p-1' : 'p-2 pr-3'
        )}
      >
        {/* Avatar con badge de completitud */}
        <div className="relative flex-shrink-0">
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt={displayName}
              className={cn(
                'rounded-full object-cover shadow-sm',
                compact ? 'h-8 w-8' : 'h-10 w-10'
              )}
            />
          ) : (
            <div
              className={cn(
                'flex items-center justify-center rounded-full',
                'bg-gradient-to-br from-primary-500 to-primary-600',
                'text-white font-semibold',
                'shadow-sm',
                compact ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'
              )}
            >
              {initials}
            </div>
          )}
          {/* Badge de porcentaje de completitud */}
          {showProfileBadge && profilePercentage !== null && (
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 flex items-center justify-center',
                'w-5 h-5 rounded-full text-[10px] font-bold text-white',
                'ring-2 ring-white dark:ring-gray-800',
                profilePercentage < 50
                  ? 'bg-amber-500'
                  : profilePercentage < 80
                    ? 'bg-blue-500'
                    : 'bg-emerald-500'
              )}
              title={`Perfil al ${profilePercentage}% completado`}
              aria-label={`Perfil al ${profilePercentage}% completado`}
            >
              {profilePercentage}
            </span>
          )}
        </div>

        {/* Info (solo en modo expandido) */}
        {!compact && (
          <>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{cargoName}</p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-400 transition-transform hidden sm:block',
                isOpen && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 z-50',
            'w-64 py-2',
            'bg-white dark:bg-gray-800',
            'rounded-xl shadow-xl',
            'border border-gray-200 dark:border-gray-700',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200'
          )}
        >
          {/* Header con info del usuario */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={displayName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    'h-12 w-12 rounded-full',
                    'bg-gradient-to-br from-primary-500 to-primary-600',
                    'flex items-center justify-center',
                    'text-white font-bold text-lg'
                  )}
                >
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cargoName}</p>
                {user?.email && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                )}
              </div>
            </div>
            {/* Info organizacional */}
            {(empresaName || areaName) && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
                {empresaName && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-600 dark:text-gray-300">Empresa:</span>
                    <span className="truncate">{empresaName}</span>
                  </div>
                )}
                {areaName && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-600 dark:text-gray-300">Área:</span>
                    <span className="truncate">{areaName}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <MenuItem
              icon={User}
              label={USER_MENU_LABELS.PROFILE}
              onClick={() => handleNavigate(ROUTES.PROFILE)}
            />
            {/* "Mi Empresa" eliminado del UserMenu del DashboardLayout:
                - Portal-only users tienen su propio PortalLayout con header dedicado
                - Profesionales colocados no deben navegar al portal de la firma */}
            <MenuItem
              icon={Bell}
              label={USER_MENU_LABELS.NOTIFICATIONS}
              onClick={() => handleNavigate(ROUTES.NOTIFICATIONS)}
            />
            <MenuItem
              icon={Shield}
              label={USER_MENU_LABELS.SECURITY}
              onClick={() => handleNavigate(ROUTES.PROFILE_SECURITY)}
            />
            <MenuItem
              icon={Settings}
              label={USER_MENU_LABELS.PREFERENCES}
              onClick={() => handleNavigate(ROUTES.PROFILE_PREFERENCES)}
            />
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <MenuItem
              icon={LogOut}
              label={USER_MENU_LABELS.LOGOUT}
              onClick={handleLogout}
              variant="danger"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * MenuItem interno del dropdown
 */
interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  /** Texto secundario debajo del label (ej: nombre del proveedor) */
  sublabel?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

const MenuItem = ({ icon: Icon, label, sublabel, onClick, variant = 'default' }: MenuItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5',
        'text-sm transition-colors text-left',
        variant === 'danger'
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 min-w-0">
        {label}
        {sublabel && (
          <span className="block text-xs text-gray-400 dark:text-gray-500 truncate max-w-[140px]">
            {sublabel}
          </span>
        )}
      </span>
    </button>
  );
};

export default UserMenu;
