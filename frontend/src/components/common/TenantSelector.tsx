/**
 * TenantSelector - Selector de Empresa Multi-Tenant
 *
 * Muestra una lista de empresas a las que el usuario tiene acceso
 * y permite seleccionar una para redirigir al subdominio correspondiente.
 *
 * Para superusuarios, muestra una opción adicional "Admin Global"
 * que permite acceder al panel de administración sin seleccionar tenant.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Shield, User, Eye, Settings2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import type { TenantAccess } from '@/types/auth.types';

interface TenantSelectorProps {
  tenants: TenantAccess[];
  lastTenantId: number | null;
  onSelect: (tenantId: number) => void;
  onBack?: () => void;
  isLoading?: boolean;
  /** Si el usuario es superadmin, muestra opción Admin Global */
  isSuperuser?: boolean;
}

const roleIcons: Record<string, typeof Shield> = {
  admin: Shield,
  user: User,
  readonly: Eye,
  superadmin: Shield,
};

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  user: 'Usuario',
  readonly: 'Solo lectura',
  superadmin: 'Superadmin',
};

const roleColors: Record<string, string> = {
  admin: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
  user: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  readonly: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700/50',
  superadmin: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
};

export const TenantSelector = ({
  tenants,
  lastTenantId,
  onSelect,
  onBack,
  isLoading = false,
  isSuperuser = false,
}: TenantSelectorProps) => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adminSelected, setAdminSelected] = useState(false);

  // Ordenar: último tenant primero, luego por nombre
  const sortedTenants = [...tenants].sort((a, b) => {
    if (a.tenant.id === lastTenantId) return -1;
    if (b.tenant.id === lastTenantId) return 1;
    return a.tenant.name.localeCompare(b.tenant.name);
  });

  const handleSelect = (tenantId: number) => {
    setSelectedId(tenantId);
    setAdminSelected(false);
    onSelect(tenantId);
  };

  const clearTenantContext = useAuthStore((state) => state.clearTenantContext);

  const handleAdminGlobalSelect = () => {
    setAdminSelected(true);
    setSelectedId(null);
    // Limpiar el tenant actual para entrar en modo Admin Global
    clearTenantContext();
    // Navegar directamente al Admin Global
    navigate('/admin-global');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <Building2 className="mx-auto h-12 w-12 text-primary-500 mb-3" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isSuperuser ? '¿Qué deseas hacer?' : 'Selecciona una empresa'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isSuperuser
            ? 'Administra la plataforma o entra a una empresa'
            : `Tienes acceso a ${tenants.length} empresa${tenants.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Opción Admin Global para Superusuarios */}
      {isSuperuser && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          onClick={handleAdminGlobalSelect}
          disabled={isLoading}
          className={`
            w-full p-4 rounded-lg border-2 transition-all duration-200
            flex items-center gap-4 text-left
            ${
              adminSelected
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10'
            }
            ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          `}
        >
          {/* Icono */}
          <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600">
            <Settings2 className="w-6 h-6 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-900 dark:text-purple-100">
                Panel de Administración
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                Superadmin
              </span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Gestionar tenants, planes, usuarios globales y módulos
            </p>
          </div>

          {/* Arrow */}
          <ArrowRight
            className={`w-5 h-5 flex-shrink-0 transition-transform ${
              adminSelected ? 'text-purple-500 translate-x-1' : 'text-purple-400'
            }`}
          />
        </motion.button>
      )}

      {/* Separador si hay opción admin y tenants */}
      {isSuperuser && tenants.length > 0 && (
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              o entra como usuario a
            </span>
          </div>
        </div>
      )}

      {/* Lista de tenants */}
      {tenants.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {sortedTenants.map((access, index) => {
            const { tenant, role } = access;
            const RoleIcon = roleIcons[role] || User;
            const roleLabel = roleLabels[role] || role;
            const roleColor = roleColors[role] || roleColors['user'];
            const isLast = tenant.id === lastTenantId;
            const isSelected = selectedId === tenant.id;

            return (
              <motion.button
                key={tenant.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (isSuperuser ? 0.1 : 0) + index * 0.05 }}
                onClick={() => handleSelect(tenant.id)}
                disabled={isLoading}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all duration-200
                  flex items-center gap-4 text-left
                  ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }
                  ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                `}
              >
                {/* Logo o inicial */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
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
                    <span className="text-xl font-bold" style={{ color: tenant.primary_color }}>
                      {tenant.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {tenant.name}
                    </span>
                    {isLast && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Reciente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${roleColor}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {roleLabel}
                    </span>
                    <span className="text-xs text-gray-400">{tenant.primary_domain}</span>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    isSelected ? 'text-primary-500 translate-x-1' : 'text-gray-400'
                  }`}
                />
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Botón volver */}
      {onBack && (
        <Button variant="outline" className="w-full mt-4" onClick={onBack} disabled={isLoading}>
          Volver al login
        </Button>
      )}
    </div>
  );
};
