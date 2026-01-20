/**
 * EditProfileModal - Modal para editar información personal del usuario
 *
 * Permite actualizar:
 * - Nombre y apellido
 * - Email
 * - Teléfono
 *
 * Campos NO editables (gestionados por admin):
 * - Documento
 * - Cargo
 * - Área
 * - Empresa
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Button } from '@/components/common/Button';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import type { User } from '@/types/auth.types';
import { User as UserIcon, Mail, Phone } from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Nombre requerido').max(50, 'Máximo 50 caracteres'),
  last_name: z.string().min(1, 'Apellido requerido').max(50, 'Máximo 50 caracteres'),
  email: z.string().email('Email inválido').max(100, 'Máximo 100 caracteres'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const EditProfileModal = ({ isOpen, onClose, user }: EditProfileModalProps) => {
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfile(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Perfil"
      description="Actualiza tu información personal"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre */}
        <Input
          label="Nombre"
          placeholder="Ingresa tu nombre"
          leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
          {...register('first_name')}
          error={errors.first_name?.message}
          disabled={isPending}
        />

        {/* Apellido */}
        <Input
          label="Apellido"
          placeholder="Ingresa tu apellido"
          leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
          {...register('last_name')}
          error={errors.last_name?.message}
          disabled={isPending}
        />

        {/* Email */}
        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="correo@empresa.com"
          leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
          {...register('email')}
          error={errors.email?.message}
          disabled={isPending}
        />

        {/* Teléfono */}
        <Input
          label="Teléfono"
          placeholder="+57 300 123 4567"
          leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
          {...register('phone')}
          error={errors.phone?.message}
          disabled={isPending}
        />

        {/* Footer con botones */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending} disabled={!isDirty || isPending}>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
