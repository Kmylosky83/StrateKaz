/**
 * TenantSwitcher - Selector de Empresa en el Header
 *
 * Permite a usuarios con múltiples empresas cambiar entre ellas.
 * Para superadmins, también permite acceder al Admin Global.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, ChevronDown, Check, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

export interface TenantSwitcherProps {
  /** Clases adicionales */
  className?: string;
}

export const TenantSwitcher = ({ className }: TenantSwitcherProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Estado del auth store
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const currentTenantId = useAuthStore((state) => state.currentTenantId);
  const accessibleTenants = useAuthStore((state) => state.accessibleTenants);
  const isSuperadmin = useAuthStore((state) => state.isSuperadmin);
  const selectTenant = useAuthStore((state) => state.selectTenant);
  const clearTenantContext = useAuthStore((state) => state.clearTenantContext);

  // Determinar si estamos en Admin Global
  const isInAdminGlobal = location.pathname.startsWith('/admin-global');

  // Solo mostrar si hay más de 1 tenant O si es superadmin
  const shouldShow = accessibleTenants.length > 1 || isSuperadmin;

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

  const handleSelectTenant = async (tenantId: number) => {
    try {
      await selectTenant(tenantId); // Invalida queries + notifica backend
    } catch (error) {
      console.error('Error switching tenant:', error);
    }
    setIsOpen(false);
    // Navegar a Mi Portal si estamos en admin-global
    if (isInAdminGlobal) {
      navigate('/mi-portal');
    }
  };

  const handleGoToAdminGlobal = () => {
    clearTenantContext();
    setIsOpen(false);
    navigate('/admin-global');
  };

  if (!shouldShow) {
    return null;
  }

  // Nombre para mostrar
  const displayName = isInAdminGlobal
    ? 'Admin Global'
    : currentTenant?.name || 'Seleccionar empresa';

  // Color del tenant actual
  const tenantColor = currentTenant?.primary_color || '#6366F1';

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          'border border-gray-200 dark:border-gray-600'
        )}
      >
        {/* Icono del tenant */}
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: isInAdminGlobal ? '#9333EA' : `${tenantColor}20`,
          }}
        >
          {isInAdminGlobal ? (
            <Shield className="w-3.5 h-3.5 text-white" />
          ) : (
            <Building2 className="w-3.5 h-3.5" style={{ color: tenantColor }} />
          )}
        </div>

        {/* Nombre */}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-32 truncate hidden sm:inline">
          {displayName}
        </span>

        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full mt-2 z-50',
            'w-72 py-2',
            'bg-white dark:bg-gray-800',
            'rounded-xl shadow-xl',
            'border border-gray-200 dark:border-gray-700',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200'
          )}
        >
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Cambiar de empresa
            </p>
          </div>

          {/* Admin Global (solo superadmin) */}
          {isSuperadmin && (
            <div className="py-1 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleGoToAdminGlobal}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left',
                  isInAdminGlobal
                    ? 'bg-purple-50 dark:bg-purple-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Administración Global
                  </p>
                  <p className="text-xs text-purple-500 dark:text-purple-400">
                    Gestionar plataforma
                  </p>
                </div>
                {isInAdminGlobal && <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />}
              </button>
            </div>
          )}

          {/* Lista de tenants (excluir schema 'public' que es administrativo) */}
          <div className="py-1 max-h-64 overflow-y-auto">
            {accessibleTenants
              .filter((access) => access.tenant.code !== 'public')
              .map((access) => {
                const { tenant, role } = access;
                const isSelected = tenant.id === currentTenantId && !isInAdminGlobal;

                return (
                  <button
                    key={tenant.id}
                    onClick={() => handleSelectTenant(tenant.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left',
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    {/* Logo o inicial */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor:
                          tenant.logo || tenant.logo_effective || tenant.logo_url
                            ? 'transparent'
                            : `${tenant.primary_color}20`,
                      }}
                    >
                      {tenant.logo || tenant.logo_effective || tenant.logo_url ? (
                        <img
                          src={tenant.logo || tenant.logo_effective || tenant.logo_url}
                          alt={tenant.name}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <span className="text-sm font-bold" style={{ color: tenant.primary_color }}>
                          {tenant.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {role === 'superadmin'
                          ? 'Superadmin'
                          : role === 'admin'
                            ? 'Administrador'
                            : 'Usuario'}
                      </p>
                    </div>

                    {/* Check si está seleccionado */}
                    {isSelected && <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />}
                  </button>
                );
              })}
          </div>

          {/* Footer con info (excluir public del conteo) */}
          {accessibleTenants.filter((a) => a.tenant.code !== 'public').length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {accessibleTenants.filter((a) => a.tenant.code !== 'public').length} empresa
                {accessibleTenants.filter((a) => a.tenant.code !== 'public').length !== 1
                  ? 's'
                  : ''}{' '}
                disponible
                {accessibleTenants.filter((a) => a.tenant.code !== 'public').length !== 1
                  ? 's'
                  : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantSwitcher;
