/**
 * PeriodoFormModal - Formulario para crear período de nómina
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { useCreatePeriodoNomina } from '../../hooks/useNomina';
import type { PeriodoNominaFormData } from '../../types';
import { tipoPeriodoNominaOptions } from '../../types';

interface PeriodoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mesesOptions = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export const PeriodoFormModal = ({ isOpen, onClose }: PeriodoFormModalProps) => {
  const createMutation = useCreatePeriodoNomina();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PeriodoNominaFormData>();

  useEffect(() => {
    if (isOpen) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      reset({
        anio: currentYear,
        mes: currentMonth,
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: PeriodoNominaFormData) => {
    try {
      await createMutation.mutateAsync(data);
      onClose();
      reset();
    } catch (error) {
      console.error('Error creating periodo:', error);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Nuevo Período de Nómina" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Período */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Período</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Año"
              type="number"
              {...register('anio', { required: 'El año es requerido', min: 2000, max: 2100 })}
              error={errors.anio?.message}
            />
            <Select
              label="Mes"
              {...register('mes', { required: 'El mes es requerido' })}
              options={mesesOptions}
              error={errors.mes?.message}
            />
            <Select
              label="Tipo"
              {...register('tipo', { required: 'El tipo es requerido' })}
              options={tipoPeriodoNominaOptions}
              error={errors.tipo?.message}
            />
          </div>
        </div>

        {/* Fechas */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Fechas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fecha Inicio"
              type="date"
              {...register('fecha_inicio', { required: 'La fecha de inicio es requerida' })}
              error={errors.fecha_inicio?.message}
            />
            <Input
              label="Fecha Fin"
              type="date"
              {...register('fecha_fin', { required: 'La fecha de fin es requerida' })}
              error={errors.fecha_fin?.message}
            />
            <Input
              label="Fecha Pago"
              type="date"
              {...register('fecha_pago', { required: 'La fecha de pago es requerida' })}
              error={errors.fecha_pago?.message}
            />
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Observaciones
          </label>
          <textarea
            {...register('observaciones')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Observaciones del período..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Período'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
