/**
 * Paz y Salvo Form Modal - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { useCreatePazSalvo } from '../../hooks/useOffBoarding';
import type { PazSalvoFormData } from '../../types';
import { tipoPazSalvoOptions } from '../../types';

interface PazSalvoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  procesoId: number;
}

export function PazSalvoFormModal({ isOpen, onClose, procesoId }: PazSalvoFormModalProps) {
  const createMutation = useCreatePazSalvo();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PazSalvoFormData>({
    defaultValues: {
      proceso_retiro: procesoId,
    },
  });

  const onSubmit = (data: PazSalvoFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Agregar Paz y Salvo" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('proceso_retiro')} value={procesoId} />

        <Select
          label="Tipo"
          error={errors.tipo?.message}
          {...register('tipo', {
            required: 'El tipo es requerido',
          })}
          options={tipoPazSalvoOptions}
        />

        <Textarea
          label="Descripción *"
          {...register('descripcion', {
            required: 'La descripción es requerida',
          })}
          rows={2}
          placeholder="Describa los elementos entregados..."
          error={errors.descripcion?.message}
        />

        <Input
          label="Cantidad Entregada"
          type="number"
          error={errors.cantidad_entregada?.message}
          {...register('cantidad_entregada', {
            required: 'La cantidad es requerida',
            valueAsNumber: true,
            min: { value: 0, message: 'La cantidad debe ser mayor o igual a 0' },
          })}
        />

        <Input
          label="Área Responsable"
          type="text"
          error={errors.area_responsable?.message}
          {...register('area_responsable')}
          placeholder="Ej: Sistemas, Mantenimiento, Seguridad"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Agregar Paz y Salvo'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
