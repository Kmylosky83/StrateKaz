/**
 * Paz y Salvo Form Modal - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 *
 * PazSalvo es por ÁREA organizacional (talento_humano, sistemas, etc.)
 * Sincronizado con backend: off_boarding/serializers.py PazSalvoCreateSerializer
 */

import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { useCreatePazSalvo } from '../../hooks/useOffBoarding';
import type { PazSalvoFormData } from '../../types';
import { areaPazSalvoOptions } from '../../types';

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
          label="Área *"
          error={errors.area?.message}
          {...register('area', {
            required: 'El área es requerida',
          })}
          options={areaPazSalvoOptions}
        />

        <Textarea
          label="Descripción del Área"
          {...register('descripcion_area')}
          rows={2}
          placeholder="Detalle de los elementos o responsabilidades a verificar..."
        />

        <Input
          label="Responsable"
          type="number"
          error={errors.responsable?.message}
          {...register('responsable', {
            valueAsNumber: true,
          })}
          placeholder="ID del responsable del área"
        />

        <Textarea
          label="Pendientes"
          {...register('pendientes')}
          rows={2}
          placeholder="Elementos pendientes por entregar o verificar..."
        />

        <Textarea
          label="Observaciones"
          {...register('observaciones')}
          rows={2}
          placeholder="Observaciones adicionales..."
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
