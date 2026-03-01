/**
 * PrestacionFormModal - Formulario para crear/editar prestaciones sociales
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreatePrestacion, useUpdatePrestacion } from '../../hooks/useNomina';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { PrestacionFormData, Prestacion } from '../../types';
import { tipoPrestacionOptions, estadoPrestacionOptions } from '../../types';

interface PrestacionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  prestacion?: Prestacion | null;
}

export const PrestacionFormModal = ({ isOpen, onClose, prestacion }: PrestacionFormModalProps) => {
  const isEdit = !!prestacion;
  const createMutation = useCreatePrestacion();
  const updateMutation = useUpdatePrestacion();
  const { data: colaboradores } = useColaboradores({ estado: 'activo' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrestacionFormData>({
    defaultValues: {
      valor_pagado: 0,
      estado: 'en_provision',
    },
  });

  useEffect(() => {
    if (isOpen && prestacion) {
      reset({
        colaborador: prestacion.colaborador,
        anio: prestacion.anio,
        tipo: prestacion.tipo,
        valor_base: prestacion.valor_base || 0,
        dias_causados: prestacion.dias_causados || 0,
        valor_provisionado: prestacion.valor_provisionado,
        valor_pagado: prestacion.valor_pagado,
        estado: prestacion.estado,
        fecha_inicio: prestacion.fecha_inicio || undefined,
        fecha_fin: prestacion.fecha_fin || undefined,
        fecha_pago: prestacion.fecha_pago || undefined,
        observaciones: prestacion.observaciones || '',
      });
    } else if (isOpen) {
      const currentYear = new Date().getFullYear();
      reset({
        anio: currentYear,
        valor_pagado: 0,
        estado: 'en_provision',
      });
    }
  }, [isOpen, prestacion, reset]);

  const onSubmit = async (data: PrestacionFormData) => {
    try {
      if (isEdit && prestacion) {
        await updateMutation.mutateAsync({ id: prestacion.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving prestacion:', error);
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
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Editar Prestación' : 'Nueva Prestación'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Colaborador"
              {...register('colaborador', { required: 'El colaborador es requerido' })}
              options={colaboradoresOptions}
              error={errors.colaborador?.message}
            />
            <Input
              label="Año"
              type="number"
              {...register('anio', { required: 'El año es requerido', min: 2000, max: 2100 })}
              error={errors.anio?.message}
            />
            <Select
              label="Tipo"
              {...register('tipo', { required: 'El tipo es requerido' })}
              options={tipoPrestacionOptions}
              error={errors.tipo?.message}
            />
          </div>
        </div>

        {/* Valores */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Valores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Valor Base"
              type="number"
              step="1"
              {...register('valor_base', { required: 'El valor base es requerido', min: 0 })}
              error={errors.valor_base?.message}
              placeholder="0"
            />
            <Input
              label="Días Causados"
              type="number"
              {...register('dias_causados', {
                required: 'Los días causados son requeridos',
                min: 0,
              })}
              error={errors.dias_causados?.message}
              placeholder="0"
            />
            <Input
              label="Valor Provisionado"
              type="number"
              step="1"
              {...register('valor_provisionado', {
                required: 'El valor provisionado es requerido',
                min: 0,
              })}
              error={errors.valor_provisionado?.message}
              placeholder="0"
            />
            <Input
              label="Valor Pagado"
              type="number"
              step="1"
              {...register('valor_pagado', { min: 0 })}
              error={errors.valor_pagado?.message}
              placeholder="0"
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <Select
            label="Estado"
            {...register('estado', { required: 'El estado es requerido' })}
            options={estadoPrestacionOptions}
            error={errors.estado?.message}
          />
        </div>

        {/* Fechas */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Fechas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fecha Inicio"
              type="date"
              {...register('fecha_inicio')}
              error={errors.fecha_inicio?.message}
            />
            <Input
              label="Fecha Fin"
              type="date"
              {...register('fecha_fin')}
              error={errors.fecha_fin?.message}
            />
            <Input
              label="Fecha Pago"
              type="date"
              {...register('fecha_pago')}
              error={errors.fecha_pago?.message}
            />
          </div>
        </div>

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          {...register('observaciones')}
          rows={3}
          placeholder="Observaciones adicionales..."
        />

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
