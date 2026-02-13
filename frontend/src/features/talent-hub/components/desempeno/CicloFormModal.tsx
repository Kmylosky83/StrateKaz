/**
 * CicloFormModal - Crear/Editar ciclo de evaluacion
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { useCreateCiclo } from '../../hooks/useDesempeno';
import type { CicloEvaluacion, CicloEvaluacionFormData } from '../../types';

const TIPO_OPTIONS = [
  { value: 'anual', label: 'Anual' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'especial', label: 'Especial' },
];

interface Props {
  ciclo: CicloEvaluacion | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CicloFormModal = ({ ciclo, isOpen, onClose }: Props) => {
  const isEditing = !!ciclo;
  const createMutation = useCreateCiclo();
  const isPending = createMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CicloEvaluacionFormData>({
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo_ciclo: 'anual',
      anio: new Date().getFullYear(),
      periodo: 1,
      fecha_inicio: '',
      fecha_fin: '',
      incluye_autoevaluacion: true,
      incluye_evaluacion_jefe: true,
      incluye_evaluacion_pares: false,
      incluye_evaluacion_subordinados: false,
      numero_pares_requeridos: 2,
      peso_autoevaluacion: 20,
      peso_evaluacion_jefe: 60,
      peso_evaluacion_pares: 15,
      peso_evaluacion_subordinados: 5,
    },
  });

  const incluyePares = watch('incluye_evaluacion_pares');
  const incluyeSubordinados = watch('incluye_evaluacion_subordinados');

  useEffect(() => {
    if (isOpen) {
      if (ciclo) {
        reset({
          codigo: ciclo.codigo,
          nombre: ciclo.nombre,
          descripcion: ciclo.descripcion || '',
          tipo_ciclo: ciclo.tipo_ciclo,
          anio: ciclo.anio,
          periodo: ciclo.periodo,
          fecha_inicio: ciclo.fecha_inicio,
          fecha_fin: ciclo.fecha_fin,
          incluye_autoevaluacion: ciclo.incluye_autoevaluacion,
          incluye_evaluacion_jefe: ciclo.incluye_evaluacion_jefe,
          incluye_evaluacion_pares: ciclo.incluye_evaluacion_pares,
          incluye_evaluacion_subordinados: ciclo.incluye_evaluacion_subordinados,
          numero_pares_requeridos: ciclo.numero_pares_requeridos,
          peso_autoevaluacion: ciclo.peso_autoevaluacion,
          peso_evaluacion_jefe: ciclo.peso_evaluacion_jefe,
          peso_evaluacion_pares: ciclo.peso_evaluacion_pares,
          peso_evaluacion_subordinados: ciclo.peso_evaluacion_subordinados,
        });
      } else {
        reset({
          codigo: '',
          nombre: '',
          descripcion: '',
          tipo_ciclo: 'anual',
          anio: new Date().getFullYear(),
          periodo: 1,
          fecha_inicio: '',
          fecha_fin: '',
          incluye_autoevaluacion: true,
          incluye_evaluacion_jefe: true,
          incluye_evaluacion_pares: false,
          incluye_evaluacion_subordinados: false,
          numero_pares_requeridos: 2,
          peso_autoevaluacion: 20,
          peso_evaluacion_jefe: 60,
          peso_evaluacion_pares: 15,
          peso_evaluacion_subordinados: 5,
        });
      }
    }
  }, [isOpen, ciclo, reset]);

  const onSubmit = async (data: CicloEvaluacionFormData) => {
    await createMutation.mutateAsync(data);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Ciclo' : 'Nuevo Ciclo de Evaluacion'}
      size="2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Ciclo'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Codigo"
            placeholder="EVAL-2026-01"
            error={errors.codigo?.message}
            {...register('codigo', { required: 'El codigo es obligatorio' })}
          />
          <Input
            label="Nombre"
            placeholder="Evaluacion Anual 2026"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es obligatorio' })}
          />
        </div>

        <Textarea
          label="Descripcion"
          placeholder="Descripcion del ciclo..."
          rows={2}
          {...register('descripcion')}
        />

        <div className="grid grid-cols-3 gap-4">
          <Select label="Tipo Ciclo" options={TIPO_OPTIONS} {...register('tipo_ciclo')} />
          <Input label="Anio" type="number" {...register('anio', { valueAsNumber: true })} />
          <Input
            label="Periodo"
            type="number"
            {...register('periodo', { valueAsNumber: true, min: 1 })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha Inicio"
            type="date"
            error={errors.fecha_inicio?.message}
            {...register('fecha_inicio', { required: 'La fecha de inicio es obligatoria' })}
          />
          <Input
            label="Fecha Fin"
            type="date"
            error={errors.fecha_fin?.message}
            {...register('fecha_fin', { required: 'La fecha de fin es obligatoria' })}
          />
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Evaluadores</p>
          <div className="flex flex-wrap gap-6">
            <Checkbox label="Autoevaluacion" {...register('incluye_autoevaluacion')} />
            <Checkbox label="Evaluacion del Jefe" {...register('incluye_evaluacion_jefe')} />
            <Checkbox label="Evaluacion de Pares" {...register('incluye_evaluacion_pares')} />
            <Checkbox
              label="Evaluacion de Subordinados"
              {...register('incluye_evaluacion_subordinados')}
            />
          </div>

          {incluyePares && (
            <Input
              label="Pares requeridos"
              type="number"
              className="w-32"
              {...register('numero_pares_requeridos', { valueAsNumber: true, min: 1 })}
            />
          )}
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pesos (%) - Deben sumar 100
          </p>
          <div className="grid grid-cols-4 gap-3">
            <Input
              label="Auto"
              type="number"
              {...register('peso_autoevaluacion', { valueAsNumber: true, min: 0, max: 100 })}
            />
            <Input
              label="Jefe"
              type="number"
              {...register('peso_evaluacion_jefe', { valueAsNumber: true, min: 0, max: 100 })}
            />
            {incluyePares && (
              <Input
                label="Pares"
                type="number"
                {...register('peso_evaluacion_pares', { valueAsNumber: true, min: 0, max: 100 })}
              />
            )}
            {incluyeSubordinados && (
              <Input
                label="Subordinados"
                type="number"
                {...register('peso_evaluacion_subordinados', {
                  valueAsNumber: true,
                  min: 0,
                  max: 100,
                })}
              />
            )}
          </div>
        </div>
      </form>
    </BaseModal>
  );
};
