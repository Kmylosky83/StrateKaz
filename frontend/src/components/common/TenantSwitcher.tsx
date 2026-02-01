/**
 * TenantSwitcher - Cambio rápido de empresa desde el Header
 *
 * Permite a usuarios con múltiples empresas cambiar de tenant
 * sin necesidad de hacer logout.
 *
 * Características:
 * - Muestra empresa actual con su logo/inicial
 * - Dropdown con lista de empresas disponibles
 * - Indicador de rol en cada empresa
 * - Opción "Admin Global" para superusuarios
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ChevronDown,
  Check,
  Shield,
  User,
  Eye,
  Settings2,
  Loader2,
} from 'lucide-react';
import { useTenants } from '@/hooks/useTenants';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import type { TenantUserAccess, TenantInfo } from '@/types/tenant.types';

// Configuración de roles usando design system
const ROLE_CONFIG = {
  admin: {
    icon: Shield,
    label: 'Admin',
    className: 'text-primary-600 bg-primary-100 dark:text-primary-400 dark:bg-primary-900/30',
  },
  user: {
    icon: User,
    label: 'Usuario',
    className: 'text-info-600 bg-info-100 dark:text-info-400 dark:bg-info-900/30',
  },
  readonly: {
    icon: Eye,
    label: 'Lectura',
    className: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700/50',
  },
} as const;

interface TenantSwitcherProps {
  /** Clase CSS adicional para el contenedor */
  className?: string;
}

export const TenantSwitcher = ({ className }: TenantSwitcherProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Store y hooks
  const { currentTenantId, clearTenantContext } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const { tenants, lastTenantId, isLoading, fetchTenants, selectTenant } = useTenants();

  // Cargar tenants al montar
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Calcular posición del menú
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = Math.min(tenants.length * 64 + 100, 400);
      setMenuPosition(spaceBelow < menuHeight ? 'top' : 'bottom');
    }
  }, [isOpen, tenants.length]);

  // Tenant actual
  const currentTenant = tenants.find((t) => t.tenant.id === currentTenantId);
  const isSuperuser = user?.is_superuser || user?.is_staff;

  // Si solo tiene una empresa y no es superuser, no mostrar
  if (tenants.length <= 1 && !isSuperuser) {
    return null;
  }

  const handleTenantSelect = async (tenantId: number) => {
    if (tenantId === currentTenantId) {
      setIsOpen(false);
      return;
    }

    const redirectUrl = await selectTenant(tenantId);
    if (redirectUrl) {
      // En desarrollo, simplemente recargar. En producción, redirigir al subdominio
      if (import.meta.env.DEV) {
        window.location.href = `/auth-callback?tenant_id=${tenantId}`;
      } else {
        window.location.href = redirectUrl;
      }
    }
    setIsOpen(false);
  };

  const handleAdminGlobalSelect = () => {
    clearTenantContext();
    navigate('/admin-global');
    setIsOpen(false);
  };

  // Ordenar: actual primero, luego último visitado, luego alfabético
  const sortedTenants = [...tenants].sort((a, b) => {
    if (a.tenant.id === currentTenantId) return -1;
    if (b.tenant.id === currentTenantId) return 1;
    if (a.tenant.id === lastTenantId) return -1;
    if (b.tenant.id === lastTenantId) return 1;
    return a.tenant.name.localeCompare(b.tenant.name);
  });

  return (
    <div className={cn('relative', className)}>
      {/* Botón trigger */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          isOpen && 'bg-gray-100 dark:bg-gray-700'
        )}
        title="Cambiar empresa"
      >
        {/* Logo/Inicial de empresa actual */}
        {currentTenant ? (
          <TenantAvatar tenant={currentTenant.tenant} size="sm" />
        ) : (
          <div className="w-7 h-7 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        )}

        {/* Nombre (solo en desktop) */}
        <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
          {currentTenant?.tenant.name || 'Seleccionar'}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: menuPosition === 'bottom' ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: menuPosition === 'bottom' ? -10 : 10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-[101] w-72 py-2 rounded-lg shadow-lg',
              'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
              menuPosition === 'bottom' ? 'top-full mt-2 right-0' : 'bottom-full mb-2 right-0'
            )}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cambiar empresa
              </p>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              </div>
            )}

            {/* Lista de tenants */}
            {!isLoading && (
              <div className="max-h-64 overflow-y-auto">
                {sortedTenants.map((access) => (
                  <TenantMenuItem
                    key={access.tenant.id}
                    access={access}
                    isSelected={access.tenant.id === currentTenantId}
                    onClick={() => handleTenantSelect(access.tenant.id)}
                  />
                ))}
              </div>
            )}

            {/* Opción Admin Global para superusuarios */}
            {isSuperuser && (
              <>
                <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                <button
                  onClick={handleAdminGlobalSelect}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    'hover:bg-primary-50 dark:hover:bg-primary-900/20',
                    !currentTenantId && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Admin Global
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Gestión de plataforma
                    </p>
                  </div>
                  {!currentTenantId && (
                    <Check className="w-4 h-4 text-primary-500" />
                  )}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay invisible para cerrar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// =============================================================================
// SUBCOMPONENTES
// =============================================================================

interface TenantAvatarProps {
  tenant: TenantInfo;
  size?: 'sm' | 'md';
}

const TenantAvatar = ({ tenant, size = 'md' }: TenantAvatarProps) => {
  const sizeClasses = size === 'sm' ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base';

  if (tenant.logo_url) {
    return (
      <img
        src={tenant.logo_url}
        alt={tenant.name}
        className={cn(sizeClasses, 'rounded-md object-contain')}
      />
    );
  }

  return (
    <div
      className={cn(sizeClasses, 'rounded-md flex items-center justify-center font-bold')}
      style={{
        backgroundColor: `${tenant.primary_color}20`,
        color: tenant.primary_color,
      }}
    >
      {tenant.name.charAt(0).toUpperCase()}
    </div>
  );
};

interface TenantMenuItemProps {
  access: TenantUserAccess;
  isSelected: boolean;
  onClick: () => void;
}

const TenantMenuItem = ({ access, isSelected, onClick }: TenantMenuItemProps) => {
  const { tenant, role } = access;
  const roleConfig = ROLE_CONFIG[role];
  const RoleIcon = roleConfig.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
        isSelected && 'bg-primary-50 dark:bg-primary-900/20'
      )}
    >
      {/* Avatar */}
      <TenantAvatar tenant={tenant} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {tenant.name}
        </p>
        <div className="flex items-center gap-1.5">
          <span className={cn('text-xs px-1.5 py-0.5 rounded inline-flex items-center gap-1', roleConfig.className)}>
            <RoleIcon className="w-3 h-3" />
            {roleConfig.label}
          </span>
        </div>
      </div>

      {/* Check si está seleccionado */}
      {isSelected && (
        <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
      )}
    </button>
  );
};

export default TenantSwitcher;
