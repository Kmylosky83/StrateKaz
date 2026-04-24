/**
 * EditEmergenciaModal — Editar contacto de emergencia del empleado.
 *
 * Sección: 🚨 Contacto de emergencia en /perfil
 * Endpoint: PUT /api/mi-portal/mi-perfil/
 *
 * Campos editables (todos en InfoPersonal):
 * - contacto_emergencia_nombre
 * - contacto_emergencia_parentesco
 * - contacto_emergencia_telefono
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Phone, User } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { useUpdateMiPerfil } from '@/features/mi-portal/api/miPortalApi';
import type { ColaboradorESS } from '@/features/mi-portal/types';

const phoneRegex = /^[+\d\s\-()]*$/;

const schema = z.object({
  contacto_emergencia_nombre: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
  contacto_emergencia_telefono: z
    .string()
    .max(15, 'Máximo 15 caracteres')
    .regex(phoneRegex, 'Solo números, +, -, espacios y paréntesis')
    .optional()
    .or(z.literal('')),
  contacto_emergencia_parentesco: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

const PARENTESCO_OPTIONS = [
  { value: '', label: 'Seleccionar…' },
  { value: 'padre', label: 'Padre / Madre' },
  { value: 'esposo', label: 'Esposo / Esposa' },
  { value: 'hijo', label: 'Hijo / Hija' },
  { value: 'hermano', label: 'Hermano / Hermana' },
  { value: 'abuelo', label: 'Abuelo / Abuela' },
  { value: 'tio', label: 'Tío / Tía' },
  { value: 'amigo', label: 'Amigo / Amiga' },
  { value: 'otro', label: 'Otro' },
];

interface EditEmergenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: ColaboradorESS | undefined;
}

export function EditEmergenciaModal({ isOpen, onClose, perfil }: EditEmergenciaModalProps) {
  const updateMutation = useUpdateMiPerfil();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
      contacto_emergencia_parentesco: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        contacto_emergencia_nombre: perfil?.contacto_emergencia_nombre ?? '',
        contacto_emergencia_telefono: perfil?.contacto_emergencia_telefono ?? '',
        contacto_emergencia_parentesco: perfil?.contacto_emergencia_parentesco ?? '',
      });
    }
  }, [isOpen, perfil, reset]);

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data, { onSuccess: () => onClose() });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isLoading = updateMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar contacto de emergencia"
      subtitle="Persona a contactar en caso de emergencia laboral"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            form="edit-emergencia-form"
            type="submit"
            isLoading={isLoading}
            disabled={!isDirty || isLoading}
          >
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="edit-emergencia-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
          <Heart className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Esta información solo se usa si ocurre una emergencia durante tu jornada laboral. Mantén
            el contacto actualizado.
          </p>
        </div>

        <Input
          label="Nombre completo"
          placeholder="Nombre y apellido de la persona a contactar"
          leftIcon={<User className="h-4 w-4 text-gray-400" />}
          {...register('contacto_emergencia_nombre')}
          error={errors.contacto_emergencia_nombre?.message}
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Parentesco"
            options={PARENTESCO_OPTIONS}
            {...register('contacto_emergencia_parentesco')}
            error={errors.contacto_emergencia_parentesco?.message}
            disabled={isLoading}
          />
          <Input
            label="Teléfono de contacto"
            placeholder="300 123 4567"
            leftIcon={<Phone className="h-4 w-4 text-gray-400" />}
            {...register('contacto_emergencia_telefono')}
            error={errors.contacto_emergencia_telefono?.message}
            disabled={isLoading}
          />
        </div>
      </form>
    </BaseModal>
  );
}
