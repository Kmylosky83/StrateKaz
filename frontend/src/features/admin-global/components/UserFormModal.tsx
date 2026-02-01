/**
 * Modal para Crear/Editar Usuarios Globales
 *
 * Formulario para gestión de usuarios multi-tenant desde Admin Global.
 */
import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common';
import { useCreateTenantUser, useUpdateTenantUser } from '../hooks/useAdminGlobal';
import type { TenantUser, CreateTenantUserDTO, UpdateTenantUserDTO } from '../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: TenantUser | null;
}

export const UserFormModal = ({ isOpen, onClose, user }: UserFormModalProps) => {
  const isEditing = !!user;
  const createUser = useCreateTenantUser();
  const updateUser = useUpdateTenantUser();

  const [formData, setFormData] = useState<CreateTenantUserDTO>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    is_active: true,
    is_superadmin: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del usuario si es edición
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '', // No se carga el password
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
        is_active: user.is_active,
        is_superadmin: user.is_superadmin,
      });
    } else {
      // Reset form para nuevo usuario
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        is_active: true,
        is_superadmin: false,
      });
    }
    setErrors({});
    setShowPassword(false);
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
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
        // Para edición, excluir password si está vacío
        const updateData: UpdateTenantUserDTO = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || undefined,
          is_active: formData.is_active,
          is_superadmin: formData.is_superadmin,
        };
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
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
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
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                    text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500
                    ${errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Juan"
                />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                    text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500
                    ${errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Pérez"
                />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email *
                </div>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500
                  ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="usuario@empresa.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password - Solo para creación */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700
                      text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500
                      ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
            )}

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </div>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="+57 300 123 4567"
              />
            </div>

            {/* Estado y Permisos */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Usuario activo
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_superadmin"
                  checked={formData.is_superadmin}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary-500" />
                  Superadministrador (acceso a todas las empresas)
                </label>
              </div>
            </div>

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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserFormModal;
