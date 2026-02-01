/**
 * Modal para Gestionar Empresas de un Usuario
 *
 * Permite asignar/remover acceso de un TenantUser a diferentes Tenants.
 */
import { useState, useEffect } from 'react';
import { X, Building2, Plus, Trash2, Shield, User, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge } from '@/components/common';
import {
  useTenantsList,
  useAssignTenantToUser,
  useRemoveTenantFromUser,
} from '../hooks/useAdminGlobal';
import type { TenantUser, TenantRole } from '../types';

interface ManageUserTenantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: TenantUser | null;
}

const ROLE_OPTIONS: { value: TenantRole; label: string; icon: React.ReactNode }[] = [
  { value: 'admin', label: 'Administrador', icon: <Shield className="h-4 w-4" /> },
  { value: 'user', label: 'Usuario', icon: <User className="h-4 w-4" /> },
  { value: 'readonly', label: 'Solo lectura', icon: <Eye className="h-4 w-4" /> },
];

const ROLE_COLORS: Record<TenantRole, 'primary' | 'info' | 'gray'> = {
  admin: 'primary',
  user: 'info',
  readonly: 'gray',
};

export const ManageUserTenantsModal = ({ isOpen, onClose, user }: ManageUserTenantsModalProps) => {
  const [selectedTenant, setSelectedTenant] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<TenantRole>('user');

  const { data: allTenants } = useTenantsList({ is_active: true });
  const assignTenant = useAssignTenantToUser();
  const removeTenant = useRemoveTenantFromUser();

  // Tenants disponibles (no asignados al usuario)
  const availableTenants = allTenants?.filter(
    (t) => !user?.accesses.some((a) => a.tenant.id === t.id && a.is_active)
  );

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedTenant('');
      setSelectedRole('user');
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!user || !selectedTenant) return;

    await assignTenant.mutateAsync({
      userId: user.id,
      data: {
        tenant_id: selectedTenant as number,
        role: selectedRole,
      },
    });

    setSelectedTenant('');
    setSelectedRole('user');
  };

  const handleRemove = async (tenantId: number) => {
    if (!user) return;
    await removeTenant.mutateAsync({ userId: user.id, tenantId });
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Gestionar Empresas
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.first_name} {user.last_name} ({user.email})
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-6">
            {/* Superadmin notice */}
            {user.is_superadmin && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  Este usuario es <strong>Superadministrador</strong> y tiene acceso automático a todas las empresas.
                </p>
              </div>
            )}

            {/* Agregar empresa */}
            {!user.is_superadmin && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agregar acceso a empresa
                </h3>
                <div className="flex gap-3">
                  <select
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar empresa...</option>
                    {availableTenants?.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as TenantRole)}
                    className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    onClick={handleAssign}
                    disabled={!selectedTenant || assignTenant.isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de empresas asignadas */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Empresas asignadas ({user.accesses.filter((a) => a.is_active).length})
              </h3>

              {user.accesses.filter((a) => a.is_active).length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No tiene acceso a ninguna empresa</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {user.accesses
                    .filter((a) => a.is_active)
                    .map((access) => (
                      <div
                        key={access.tenant.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: access.tenant.primary_color || '#6366f1' }}
                          >
                            {access.tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {access.tenant.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {access.tenant.subdomain}.stratekaz.com
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={ROLE_COLORS[access.role]} size="sm">
                            {ROLE_OPTIONS.find((r) => r.value === access.role)?.label || access.role}
                          </Badge>
                          {!user.is_superadmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(access.tenant.id)}
                              disabled={removeTenant.isPending}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ManageUserTenantsModal;
