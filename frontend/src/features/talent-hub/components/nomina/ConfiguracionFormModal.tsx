/**
 * ConfiguracionFormModal - Formulario para crear/editar configuración de nómina
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { useCreateConfiguracionNomina, useUpdateConfiguracionNomina } from '../../hooks/useNomina';
import type { ConfiguracionNominaFormData, ConfiguracionNominaList } from '../../types';

interface ConfiguracionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  configuracion?: ConfiguracionNominaList | null;
}

export const ConfiguracionFormModal = ({
  isOpen,
  onClose,
  configuracion,
}: ConfiguracionFormModalProps) => {
  const isEdit = !!configuracion;
  const createMutation = useCreateConfiguracionNomina();
  const updateMutation = useUpdateConfiguracionNomina();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfiguracionNominaFormData>({
    defaultValues: {
      porcentaje_salud_empleado: 4.0,
      porcentaje_pension_empleado: 4.0,
      porcentaje_salud_empresa: 8.5,
      porcentaje_pension_empresa: 12.0,
      porcentaje_arl: 0.522,
      porcentaje_caja_compensacion: 4.0,
      porcentaje_icbf: 3.0,
      porcentaje_sena: 2.0,
      dias_base_cesantias: 360,
      porcentaje_intereses_cesantias: 12.0,
      dias_base_prima: 360,
      dias_vacaciones_por_anio: 15,
      porcentaje_solidaridad_empleado: 1.0,
    },
  });

  useEffect(() => {
    if (isOpen && configuracion) {
      reset({
        anio: configuracion.anio,
        salario_minimo: configuracion.salario_minimo,
        auxilio_transporte: configuracion.auxilio_transporte,
        // Los demás campos no están en ConfiguracionNominaList, usar defaults
      });
    } else if (isOpen) {
      reset();
    }
  }, [isOpen, configuracion, reset]);

  const onSubmit = async (data: ConfiguracionNominaFormData) => {
    try {
      if (isEdit && configuracion) {
        await updateMutation.mutateAsync({ id: configuracion.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving configuracion:', error);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Editar Configuración' : 'Nueva Configuración'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Valores Básicos */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Valores Básicos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Año"
              type="number"
              {...register('anio', { required: 'El año es requerido', min: 2000, max: 2100 })}
              error={errors.anio?.message}
            />
            <Input
              label="Salario Mínimo"
              type="number"
              step="1"
              {...register('salario_minimo', {
                required: 'El salario mínimo es requerido',
                min: 0,
              })}
              error={errors.salario_minimo?.message}
            />
            <Input
              label="Auxilio de Transporte"
              type="number"
              step="1"
              {...register('auxilio_transporte', {
                required: 'El auxilio de transporte es requerido',
                min: 0,
              })}
              error={errors.auxilio_transporte?.message}
            />
          </div>
        </div>

        {/* Seguridad Social - Empleado */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Seguridad Social - Empleado
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="% Salud Empleado"
              type="number"
              step="0.01"
              {...register('porcentaje_salud_empleado', { min: 0, max: 100 })}
              error={errors.porcentaje_salud_empleado?.message}
            />
            <Input
              label="% Pensión Empleado"
              type="number"
              step="0.01"
              {...register('porcentaje_pension_empleado', { min: 0, max: 100 })}
              error={errors.porcentaje_pension_empleado?.message}
            />
          </div>
        </div>

        {/* Seguridad Social - Empresa */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Seguridad Social - Empresa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="% Salud Empresa"
              type="number"
              step="0.01"
              {...register('porcentaje_salud_empresa', { min: 0, max: 100 })}
              error={errors.porcentaje_salud_empresa?.message}
            />
            <Input
              label="% Pensión Empresa"
              type="number"
              step="0.01"
              {...register('porcentaje_pension_empresa', { min: 0, max: 100 })}
              error={errors.porcentaje_pension_empresa?.message}
            />
            <Input
              label="% ARL"
              type="number"
              step="0.001"
              {...register('porcentaje_arl', { min: 0, max: 100 })}
              error={errors.porcentaje_arl?.message}
            />
          </div>
        </div>

        {/* Parafiscales */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Parafiscales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="% Caja Compensación"
              type="number"
              step="0.01"
              {...register('porcentaje_caja_compensacion', { min: 0, max: 100 })}
              error={errors.porcentaje_caja_compensacion?.message}
            />
            <Input
              label="% ICBF"
              type="number"
              step="0.01"
              {...register('porcentaje_icbf', { min: 0, max: 100 })}
              error={errors.porcentaje_icbf?.message}
            />
            <Input
              label="% SENA"
              type="number"
              step="0.01"
              {...register('porcentaje_sena', { min: 0, max: 100 })}
              error={errors.porcentaje_sena?.message}
            />
          </div>
        </div>

        {/* Prestaciones */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Prestaciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Días Base Cesantías"
              type="number"
              {...register('dias_base_cesantias', { min: 1 })}
              error={errors.dias_base_cesantias?.message}
            />
            <Input
              label="% Intereses Cesantías"
              type="number"
              step="0.01"
              {...register('porcentaje_intereses_cesantias', { min: 0, max: 100 })}
              error={errors.porcentaje_intereses_cesantias?.message}
            />
            <Input
              label="Días Base Prima"
              type="number"
              {...register('dias_base_prima', { min: 1 })}
              error={errors.dias_base_prima?.message}
            />
            <Input
              label="Días Vacaciones/Año"
              type="number"
              {...register('dias_vacaciones_por_anio', { min: 1 })}
              error={errors.dias_vacaciones_por_anio?.message}
            />
          </div>
        </div>

        {/* Fondo Solidaridad */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Fondo Solidaridad Pensional
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Salario Base Solidaridad (SMLV)"
              type="number"
              step="0.01"
              {...register('salario_base_solidaridad', { min: 0 })}
              error={errors.salario_base_solidaridad?.message}
            />
            <Input
              label="% Solidaridad Empleado"
              type="number"
              step="0.01"
              {...register('porcentaje_solidaridad_empleado', { min: 0, max: 100 })}
              error={errors.porcentaje_solidaridad_empleado?.message}
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
            placeholder="Observaciones adicionales..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : isEdit
                ? 'Actualizar'
                : 'Crear'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
