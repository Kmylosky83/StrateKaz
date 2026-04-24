/**
 * EditIdentidadModal — Editar identidad del usuario (User model).
 *
 * Sección: 📇 Identidad en /perfil
 * Endpoint: PATCH /api/core/users/update_profile/
 *
 * Campos editables:
 * - first_name, last_name, email, phone (todos los usuarios)
 * - document_type, document_number (solo superadmin — reemplaza TEMP-xxx)
 *
 * Campos NO editables aquí (viven en otros modales o admin):
 * - Cargo, área, fecha ingreso (admin en Mi Equipo)
 * - Email personal, celular, dirección (EditContactoModal)
 * - Contacto emergencia (EditEmergenciaModal)
 *
 * Reemplaza EditProfileModal (nombre legacy ambiguo).
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Button } from '@/components/common/Button';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/auth.types';
import { User as UserIcon, Mail, Phone, IdCard } from 'lucide-react';

const DOCUMENT_TYPE_CHOICES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
] as const;

const identidadSchema = z.object({
  first_name: z.string().min(1, 'Nombre requerido').max(50, 'Máximo 50 caracteres'),
  last_name: z.string().min(1, 'Apellido requerido').max(50, 'Máximo 50 caracteres'),
  email: z.string().email('Email inválido').max(100, 'Máximo 100 caracteres'),
  phone: z.string().optional(),
  document_type: z.string().optional(),
  document_number: z.string().max(30, 'Máximo 30 caracteres').optional(),
});

type IdentidadFormData = z.infer<typeof identidadSchema>;

interface EditIdentidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const EditIdentidadModal = ({ isOpen, onClose, user }: EditIdentidadModalProps) => {
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const isSuperAdmin = useAuthStore((s) => s.user?.is_superuser);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<IdentidadFormData>({
    resolver: zodResolver(identidadSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      document_type: user.document_type || 'CC',
      document_number: user.document_number?.startsWith('TEMP-') ? '' : user.document_number || '',
    },
  });

  const onSubmit = (data: IdentidadFormData) => {
    if (!isSuperAdmin) {
      delete data.document_type;
      delete data.document_number;
    }
    updateProfile(data, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar identidad"
      description="Nombre, correo del sistema y teléfono de contacto"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre"
          placeholder="Ingresa tu nombre"
          leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
          {...register('first_name')}
          error={errors.first_name?.message}
          disabled={isPending}
        />

        <Input
          label="Apellido"
          placeholder="Ingresa tu apellido"
          leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
          {...register('last_name')}
          error={errors.last_name?.message}
          disabled={isPending}
        />

        <Input
          label="Correo del sistema"
          type="email"
          placeholder="correo@empresa.com"
          leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
          {...register('email')}
          error={errors.email?.message}
          disabled={isPending}
        />

        <Input
          label="Teléfono corporativo"
          placeholder="+57 300 123 4567"
          leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
          {...register('phone')}
          error={errors.phone?.message}
          disabled={isPending}
        />

        {isSuperAdmin && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Documento de identidad del administrador
            </p>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de documento
              </label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <select
                  {...register('document_type')}
                  disabled={isPending}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                >
                  {DOCUMENT_TYPE_CHOICES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Número de documento"
              placeholder="Ej: 1.234.567.890"
              leftIcon={<IdCard className="h-5 w-5 text-gray-400" />}
              {...register('document_number')}
              error={errors.document_number?.message}
              disabled={isPending}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending} disabled={!isDirty || isPending}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
