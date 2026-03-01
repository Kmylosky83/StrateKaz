/**
 * Checklist Item Form Modal - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/common/Button';
import { useCreateChecklistItem } from '../../hooks/useOffBoarding';
import type { ChecklistRetiroFormData } from '../../types';

interface ChecklistItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  procesoId: number;
}

export function ChecklistItemFormModal({
  isOpen,
  onClose,
  procesoId,
}: ChecklistItemFormModalProps) {
  const createMutation = useCreateChecklistItem();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChecklistRetiroFormData>({
    defaultValues: {
      proceso_retiro: procesoId,
    },
  });

  const onSubmit = (data: ChecklistRetiroFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Agregar Item al Checklist" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('proceso_retiro')} value={procesoId} />

        <Input
          label="Orden"
          type="number"
          error={errors.orden?.message}
          {...register('orden', {
            required: 'El orden es requerido',
            valueAsNumber: true,
            min: { value: 1, message: 'El orden debe ser mayor a 0' },
          })}
        />

        <Textarea
          label="Descripción *"
          {...register('descripcion', {
            required: 'La descripción es requerida',
          })}
          rows={3}
          placeholder="Describa la tarea a realizar..."
          error={errors.descripcion?.message}
        />

        <Input
          label="Área Responsable"
          type="text"
          error={errors.area_responsable?.message}
          {...register('area_responsable')}
          placeholder="Ej: Recursos Humanos, IT, Administración"
        />

        <Input
          label="Fecha Límite"
          type="date"
          error={errors.fecha_limite?.message}
          {...register('fecha_limite')}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Agregar Item'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
