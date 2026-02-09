/**
 * MiPerfilEditForm - Modal para editar datos personales
 */

import { useForm } from 'react-hook-form';
import { Modal, Button } from '@/components/common';
import { Input } from '@/components/forms';
import { useUpdateMiPerfil } from '../api/miPortalApi';
import type { InfoPersonalUpdateData, ColaboradorESS } from '../types';

interface MiPerfilEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: ColaboradorESS | undefined;
}

export function MiPerfilEditForm({ isOpen, onClose, perfil }: MiPerfilEditFormProps) {
  const updateMutation = useUpdateMiPerfil();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InfoPersonalUpdateData>({
    defaultValues: {
      telefono: perfil?.telefono || '',
      celular: perfil?.celular || '',
      direccion: perfil?.direccion || '',
      email_personal: perfil?.email_personal || '',
      contacto_emergencia_nombre: perfil?.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: perfil?.contacto_emergencia_telefono || '',
      contacto_emergencia_parentesco: perfil?.contacto_emergencia_parentesco || '',
    },
  });

  const onSubmit = (data: InfoPersonalUpdateData) => {
    updateMutation.mutate(data, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar datos personales">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Telefono fijo"
            {...register('telefono')}
            error={errors.telefono?.message}
          />
          <Input
            label="Celular"
            {...register('celular')}
            error={errors.celular?.message}
          />
        </div>

        <Input
          label="Direccion"
          {...register('direccion')}
          error={errors.direccion?.message}
        />

        <Input
          label="Email personal"
          type="email"
          {...register('email_personal')}
          error={errors.email_personal?.message}
        />

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Contacto de emergencia
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nombre"
              {...register('contacto_emergencia_nombre')}
              error={errors.contacto_emergencia_nombre?.message}
            />
            <Input
              label="Telefono"
              {...register('contacto_emergencia_telefono')}
              error={errors.contacto_emergencia_telefono?.message}
            />
            <Input
              label="Parentesco"
              {...register('contacto_emergencia_parentesco')}
              error={errors.contacto_emergencia_parentesco?.message}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
