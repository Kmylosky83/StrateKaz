/**
 * Proceso Form Modal - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { useCreateProcesoRetiro } from '../../hooks/useOffBoarding';
import { useColaboradores } from '../../hooks/useColaboradores';
import { useTiposRetiro } from '../../hooks/useOffBoarding';
import type { ProcesoRetiroFormData } from '../../types';

interface ProcesoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProcesoFormModal({ isOpen, onClose }: ProcesoFormModalProps) {
  const { data: colaboradoresData } = useColaboradores({ estado: 'activo' });
  const { data: tiposRetiro = [] } = useTiposRetiro();
  const createMutation = useCreateProcesoRetiro();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProcesoRetiroFormData>();

  const onSubmit = (data: ProcesoRetiroFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const colaboradores = colaboradoresData?.results || colaboradoresData || [];

  const colaboradorOptions = colaboradores.map((col: any) => ({
    value: col.id.toString(),
    label: `${col.nombres} ${col.apellidos} - ${col.numero_identificacion}`,
  }));

  const tipoRetiroOptions = tiposRetiro.map((tipo) => ({
    value: tipo.id.toString(),
    label: tipo.nombre,
  }));

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Nuevo Proceso de Retiro" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Colaborador"
          error={errors.colaborador?.message}
          {...register('colaborador', {
            required: 'El colaborador es requerido',
            valueAsNumber: true,
          })}
          options={colaboradorOptions}
        />

        <Select
          label="Tipo de Retiro"
          error={errors.tipo_retiro?.message}
          {...register('tipo_retiro', {
            required: 'El tipo de retiro es requerido',
            valueAsNumber: true,
          })}
          options={tipoRetiroOptions}
        />

        <Input
          label="Fecha de Notificación"
          type="date"
          error={errors.fecha_notificacion?.message}
          {...register('fecha_notificacion', {
            required: 'La fecha de notificación es requerida',
          })}
        />

        <Input
          label="Fecha Efectiva de Retiro"
          type="date"
          error={errors.fecha_efectiva_retiro?.message}
          {...register('fecha_efectiva_retiro', {
            required: 'La fecha efectiva de retiro es requerida',
          })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Motivo de Retiro
          </label>
          <textarea
            {...register('motivo_retiro', {
              required: 'El motivo de retiro es requerido',
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
            rows={4}
            placeholder="Describa el motivo del retiro..."
          />
          {errors.motivo_retiro && (
            <p className="mt-1 text-sm text-red-600">{errors.motivo_retiro.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Proceso'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
