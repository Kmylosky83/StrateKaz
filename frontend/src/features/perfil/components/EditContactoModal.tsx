/**
 * EditContactoModal — Editar contacto personal del empleado.
 *
 * Sección: 📞 Contacto personal en /perfil
 * Endpoint: PUT /api/mi-portal/mi-perfil/
 *
 * Campos editables:
 * - celular (Colaborador.telefono_movil)
 * - email_personal (Colaborador.email_personal)
 * - telefono (InfoPersonal.telefono_fijo)
 * - direccion (InfoPersonal.direccion)
 * - ciudad (InfoPersonal.ciudad)
 *
 * El backend solo actualiza los campos enviados en el body — el resto de
 * campos del ESS (contacto emergencia) quedan intactos.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Mail, MapPin, Smartphone } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { useUpdateMiPerfil } from '@/features/mi-portal/api/miPortalApi';
import type { ColaboradorESS } from '@/features/mi-portal/types';

const phoneRegex = /^[+\d\s\-()]*$/;

const schema = z.object({
  celular: z
    .string()
    .max(15, 'Máximo 15 caracteres')
    .regex(phoneRegex, 'Solo números, +, -, espacios y paréntesis')
    .optional()
    .or(z.literal('')),
  email_personal: z
    .string()
    .email('Ingresa un email válido')
    .max(254, 'Máximo 254 caracteres')
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .max(15, 'Máximo 15 caracteres')
    .regex(phoneRegex, 'Solo números, +, -, espacios y paréntesis')
    .optional()
    .or(z.literal('')),
  direccion: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
  ciudad: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface EditContactoModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: ColaboradorESS | undefined;
}

export function EditContactoModal({ isOpen, onClose, perfil }: EditContactoModalProps) {
  const updateMutation = useUpdateMiPerfil();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      celular: '',
      email_personal: '',
      telefono: '',
      direccion: '',
      ciudad: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        celular: perfil?.celular ?? '',
        email_personal: perfil?.email_personal ?? '',
        telefono: perfil?.telefono ?? '',
        direccion: perfil?.direccion ?? '',
        ciudad: perfil?.ciudad ?? '',
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
      title="Editar contacto personal"
      subtitle="Teléfono, email personal, dirección y ciudad de residencia"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            form="edit-contacto-form"
            type="submit"
            isLoading={isLoading}
            disabled={!isDirty || isLoading}
          >
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="edit-contacto-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Celular"
            placeholder="300 123 4567"
            leftIcon={<Smartphone className="h-4 w-4 text-gray-400" />}
            {...register('celular')}
            error={errors.celular?.message}
            disabled={isLoading}
          />
          <Input
            label="Teléfono fijo"
            placeholder="601 234 5678"
            leftIcon={<Phone className="h-4 w-4 text-gray-400" />}
            {...register('telefono')}
            error={errors.telefono?.message}
            disabled={isLoading}
          />
        </div>

        <Input
          label="Email personal"
          type="email"
          placeholder="tu@correo.com"
          leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
          {...register('email_personal')}
          error={errors.email_personal?.message}
          disabled={isLoading}
          helperText="Email alterno al corporativo. Usado para notificaciones personales."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Dirección"
              placeholder="Calle 123 #45-67"
              leftIcon={<MapPin className="h-4 w-4 text-gray-400" />}
              {...register('direccion')}
              error={errors.direccion?.message}
              disabled={isLoading}
            />
          </div>
          <Input
            label="Ciudad"
            placeholder="Bogotá"
            leftIcon={<MapPin className="h-4 w-4 text-gray-400" />}
            {...register('ciudad')}
            error={errors.ciudad?.message}
            disabled={isLoading}
          />
        </div>
      </form>
    </BaseModal>
  );
}
