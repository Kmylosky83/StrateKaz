/**
 * LiquidacionFormModal - Formulario para crear liquidación de nómina
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateLiquidacion } from '../../hooks/useNomina';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { LiquidacionNominaFormData } from '../../types';

interface LiquidacionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodoId: number | null;
}

export const LiquidacionFormModal = ({ isOpen, onClose, periodoId }: LiquidacionFormModalProps) => {
  const createMutation = useCreateLiquidacion();
  const { data: colaboradores } = useColaboradores({ estado: 'activo' });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LiquidacionNominaFormData>({
    defaultValues: {
      dias_trabajados: 15,
    },
  });

  useEffect(() => {
    if (isOpen && periodoId) {
      reset({
        periodo: periodoId,
        dias_trabajados: 15,
      });
    }
  }, [isOpen, periodoId, reset]);

  const selectedColaboradorId = watch('colaborador');
  const selectedColaborador = colaboradores?.find((c) => c.id === Number(selectedColaboradorId));

  const onSubmit = async (data: LiquidacionNominaFormData) => {
    try {
      await createMutation.mutateAsync(data);
      onClose();
      reset();
    } catch (error) {
      console.error('Error creating liquidacion:', error);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const colaboradoresOptions =
    colaboradores?.map((c) => ({
      value: c.id.toString(),
      label: `${c.usuario_nombre} - ${c.identificacion}`,
    })) || [];

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Nueva Liquidación" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Colaborador */}
        <div>
          <Select
            label="Colaborador"
            {...register('colaborador', { required: 'El colaborador es requerido' })}
            options={colaboradoresOptions}
            error={errors.colaborador?.message}
          />
          {selectedColaborador && (
            <Alert
              variant="info"
              message={`Cargo: ${selectedColaborador.cargo_nombre || 'N/A'}`}
              className="mt-2"
            />
          )}
        </div>

        {/* Salario y Días */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Salario Base"
            type="number"
            step="1"
            {...register('salario_base', { required: 'El salario base es requerido', min: 0 })}
            error={errors.salario_base?.message}
            placeholder="0"
          />
          <Input
            label="Días Trabajados"
            type="number"
            {...register('dias_trabajados', {
              required: 'Los días trabajados son requeridos',
              min: 1,
              max: 31,
            })}
            error={errors.dias_trabajados?.message}
          />
        </div>

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          {...register('observaciones')}
          rows={3}
          placeholder="Observaciones de la liquidación..."
        />

        {/* Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Los devengados y deducciones se calcularán automáticamente según la configuración de
            nómina y los conceptos configurados. Puedes agregar conceptos adicionales después de
            crear la liquidación.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Liquidación'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
