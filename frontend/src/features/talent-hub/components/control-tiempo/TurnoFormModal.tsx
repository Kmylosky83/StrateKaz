/**
 * TurnoFormModal - Crear/Editar turno
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { useCreateTurno, useUpdateTurno } from '../../hooks/useControlTiempo';
import type { Turno, TurnoFormData } from '../../types';
import { tipoTurnoOptions, diasSemanaOptions } from '../../types/controlTiempo.types';

interface Props {
  turno: Turno | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TurnoFormModal = ({ turno, isOpen, onClose }: Props) => {
  const isEditing = !!turno;
  const createMutation = useCreateTurno();
  const updateMutation = useUpdateTurno();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TurnoFormData>({
    defaultValues: {
      codigo: '',
      nombre: '',
      tipo: 'diurno',
      hora_inicio: '08:00',
      hora_fin: '17:00',
      duracion_jornada: 8,
      tiempo_descanso: 60,
      aplica_recargo_nocturno: false,
      hora_inicio_nocturno: '18:00',
      hora_fin_nocturno: '06:00',
      dias_laborales: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      observaciones: '',
    },
  });

  const aplicaRecargo = watch('aplica_recargo_nocturno');
  const diasSeleccionados = watch('dias_laborales') || [];

  useEffect(() => {
    if (isOpen) {
      if (turno) {
        reset({
          codigo: turno.codigo,
          nombre: turno.nombre,
          tipo: turno.tipo,
          hora_inicio: turno.hora_inicio,
          hora_fin: turno.hora_fin,
          duracion_jornada: turno.duracion_jornada,
          tiempo_descanso: turno.tiempo_descanso,
          aplica_recargo_nocturno: turno.aplica_recargo_nocturno,
          hora_inicio_nocturno: turno.hora_inicio_nocturno || '18:00',
          hora_fin_nocturno: turno.hora_fin_nocturno || '06:00',
          dias_laborales: turno.dias_laborales,
          observaciones: turno.observaciones || '',
        });
      } else {
        reset({
          codigo: '',
          nombre: '',
          tipo: 'diurno',
          hora_inicio: '08:00',
          hora_fin: '17:00',
          duracion_jornada: 8,
          tiempo_descanso: 60,
          aplica_recargo_nocturno: false,
          hora_inicio_nocturno: '18:00',
          hora_fin_nocturno: '06:00',
          dias_laborales: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
          observaciones: '',
        });
      }
    }
  }, [isOpen, turno, reset]);

  const toggleDia = (dia: string) => {
    const current = diasSeleccionados || [];
    if (current.includes(dia)) {
      setValue(
        'dias_laborales',
        current.filter((d) => d !== dia)
      );
    } else {
      setValue('dias_laborales', [...current, dia]);
    }
  };

  const onSubmit = async (data: TurnoFormData) => {
    if (isEditing && turno) {
      await updateMutation.mutateAsync({ id: turno.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Turno' : 'Nuevo Turno'}
      size="2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Código"
            placeholder="Se genera automáticamente"
            error={errors.codigo?.message}
            {...register('codigo')}
          />
          <Input
            label="Nombre"
            placeholder="Turno Diurno"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es obligatorio' })}
          />
        </div>

        <Select
          label="Tipo de Turno"
          options={tipoTurnoOptions}
          error={errors.tipo?.message}
          {...register('tipo', { required: 'Selecciona el tipo' })}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Hora Inicio"
            type="time"
            error={errors.hora_inicio?.message}
            {...register('hora_inicio', { required: 'La hora de inicio es obligatoria' })}
          />
          <Input
            label="Hora Fin"
            type="time"
            error={errors.hora_fin?.message}
            {...register('hora_fin', { required: 'La hora de fin es obligatoria' })}
          />
          <Input
            label="Duracion (horas)"
            type="number"
            step="0.5"
            error={errors.duracion_jornada?.message}
            {...register('duracion_jornada', {
              required: 'La duracion es obligatoria',
              valueAsNumber: true,
              min: { value: 1, message: 'Minimo 1 hora' },
              max: { value: 12, message: 'Maximo 12 horas' },
            })}
          />
        </div>

        <Input
          label="Tiempo de Descanso (minutos)"
          type="number"
          {...register('tiempo_descanso', { valueAsNumber: true, min: 0 })}
        />

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Dias Laborales
          </label>
          <div className="grid grid-cols-4 gap-3">
            {diasSemanaOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
              >
                <input
                  type="checkbox"
                  checked={diasSeleccionados.includes(option.value)}
                  onChange={() => toggleDia(option.value)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <Checkbox
            label="Aplica Recargo Nocturno (Ley 2466/2025)"
            {...register('aplica_recargo_nocturno')}
          />
          {aplicaRecargo && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Input
                label="Hora Inicio Nocturno"
                type="time"
                {...register('hora_inicio_nocturno')}
              />
              <Input label="Hora Fin Nocturno" type="time" {...register('hora_fin_nocturno')} />
            </div>
          )}
        </div>

        <Textarea
          label="Observaciones"
          placeholder="Observaciones adicionales..."
          rows={2}
          {...register('observaciones')}
        />
      </form>
    </BaseModal>
  );
};
