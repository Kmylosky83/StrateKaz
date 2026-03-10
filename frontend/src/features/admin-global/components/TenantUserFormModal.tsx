/**
 * Modal para Crear/Editar Usuarios Globales
 *
 * Formulario para gestión de TenantUsers desde Admin Global.
 * Usa createPortal para renderizar fuera del stacking context de Framer Motion.
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Mail, Shield, Building2 } from 'lucide-react';
import { Button, Badge } from '@/components/common';
import { Input } from '@/components/forms/Input';
import { Checkbox } from '@/components/forms/Checkbox';
import { useCreateTenantUser, useUpdateTenantUser, useTenantsList } from '../hooks/useAdminGlobal';
import type { TenantUser, CreateTenantUserDTO } from '../types';

interface TenantUserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: TenantUser | null;
}

export const TenantUserFormModal = ({ isOpen, onClose, user }: TenantUserFormModalProps) => {
  const isEditing = !!user;
  const createUser = useCreateTenantUser();
  const updateUser = useUpdateTenantUser();
  const { data: tenants } = useTenantsList({ is_active: true });

  // NOTA: role ya no se usa - los permisos se manejan via User.cargo en el tenant
  const [formData, setFormData] = useState<CreateTenantUserDTO>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    is_active: true,
    is_superadmin: false,
    tenant_assignments: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del usuario si es edición
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '', // No se muestra la contraseña
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        is_superadmin: user.is_superadmin,
        // Solo necesitamos el tenant_id, los permisos se manejan en el tenant
        tenant_assignments:
          user.accesses?.map((a) => ({
            tenant_id: a.tenant.id,
          })) || [],
      });
    } else {
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        is_active: true,
        is_superadmin: false,
        tenant_assignments: [],
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleTenantToggle = (tenantId: number) => {
    setFormData((prev) => {
      const exists = prev.tenant_assignments.find((a) => a.tenant_id === tenantId);
      if (exists) {
        return {
          ...prev,
          tenant_assignments: prev.tenant_assignments.filter((a) => a.tenant_id !== tenantId),
        };
      }
      return {
        ...prev,
        // Solo se guarda el tenant_id - los permisos granulares se configuran
        // dentro del tenant via User.cargo (sistema RBAC)
        tenant_assignments: [...prev.tenant_assignments, { tenant_id: tenantId }],
      };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email no válido';
    }

    if (!isEditing && !formData.password?.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (!isEditing && formData.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    }

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditing && user) {
        // En edición, no enviar password si está vacío
        const updateData = { ...formData };
        if (!updateData.password) {
          delete (updateData as { password?: string }).password;
        }
        await updateUser.mutateAsync({ id: user.id, data: updateData });
      } else {
        await createUser.mutateAsync(formData);
      }
      onClose();
    } catch {
      // Error manejado por el hook
    }
  };

  const isLoading = createUser.isPending || updateUser.isPending;

  if (!isOpen) return null;

  // Renderizar en portal para escapar del stacking context de Framer Motion
  // en AdminGlobalPage (motion.div con transform crea nuevo stacking context)
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <UserPlus className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? 'Actualiza los datos del usuario' : 'Crea un nuevo usuario global'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Datos personales */}
          <>
            {/* Email */}
            <Input
              label="Email *"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isEditing}
              error={errors.email}
              placeholder="usuario@ejemplo.com"
              leftIcon={<Mail className="h-4 w-4" />}
            />

            {/* Contraseña */}
            <Input
              label={`Contraseña${!isEditing ? ' *' : ''}`}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
            />

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
                placeholder="Juan"
              />

              <Input
                label="Apellido *"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
                placeholder="Pérez"
              />
            </div>

            {/* Opciones */}
            <div className="flex gap-6">
              <Checkbox
                label="Activo"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <Checkbox
                label="Super Admin"
                name="is_superadmin"
                checked={formData.is_superadmin}
                onChange={handleChange}
              />
            </div>
          </>

          {/* Asignación de Tenants (si no es superadmin) */}
          {!formData.is_superadmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building2 className="inline h-4 w-4 mr-1" /> Asignar a Empresas
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                {tenants?.map((tenant) => {
                  const isSelected = formData.tenant_assignments.some(
                    (a) => a.tenant_id === tenant.id
                  );

                  return (
                    <div
                      key={tenant.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors
                        ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      onClick={() => handleTenantToggle(tenant.id)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTenantToggle(tenant.id)}
                          className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {tenant.name}
                        </span>
                      </div>

                      {isSelected && (
                        <Badge variant="primary" size="sm">
                          Acceso habilitado
                        </Badge>
                      )}
                    </div>
                  );
                })}
                {(!tenants || tenants.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No hay empresas disponibles
                  </p>
                )}
              </div>
              {formData.tenant_assignments.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.tenant_assignments.length} empresa(s) seleccionada(s)
                </p>
              )}
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-2">
                Los permisos específicos se configuran dentro de cada empresa mediante cargos
                (RBAC).
              </p>
            </div>
          )}

          {formData.is_superadmin && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Los Super Admins tienen acceso a todas las empresas automáticamente.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default TenantUserFormModal;
