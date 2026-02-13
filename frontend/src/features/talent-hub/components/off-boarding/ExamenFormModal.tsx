/**
 * Examen Form Modal - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { useCreateExamenEgreso } from '../../hooks/useOffBoarding';
import type { ExamenEgresoFormData } from '../../types';
import { tipoExamenEgresoOptions } from '../../types';

interface ExamenFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  procesoId: number;
}

export function ExamenFormModal({ isOpen, onClose, procesoId }: ExamenFormModalProps) {
  const createMutation = useCreateExamenEgreso();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExamenEgresoFormData>({
    defaultValues: {
      proceso_retiro: procesoId,
    },
  });

  const onSubmit = (data: ExamenEgresoFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Programar Examen de Egreso" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('proceso_retiro')} value={procesoId} />

        <Select
          label="Tipo de Examen"
          error={errors.tipo_examen?.message}
          {...register('tipo_examen', {
            required: 'El tipo de examen es requerido',
          })}
          options={tipoExamenEgresoOptions}
        />

        <Input
          label="Fecha Programada"
          type="date"
          error={errors.fecha_programada?.message}
          {...register('fecha_programada', {
            required: 'La fecha programada es requerida',
          })}
        />

        <Input
          label="Entidad de Salud"
          type="text"
          error={errors.entidad_salud?.message}
          {...register('entidad_salud', {
            required: 'La entidad de salud es requerida',
          })}
          placeholder="Nombre de la IPS o entidad prestadora"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Programando...' : 'Programar Examen'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
