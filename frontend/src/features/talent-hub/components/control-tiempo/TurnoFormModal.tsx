/**
 * TurnoFormModal - Crear/Editar turno
 * Alineado con backend: Turno model + TurnoFormData types
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
import type { Turno, TurnoFormData, DiaSemana } from '../../types';
import { tipoJornadaOptions, diasSemanaOptions } from '../../types/controlTiempo.types';

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
      tipo_jornada: 'ordinaria',
      hora_inicio: '08:00',
      hora_fin: '17:00',
      duracion_jornada: 8,
      aplica_recargo_nocturno: false,
      dias_semana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      horas_semanales_maximas: 48,
      descripcion: '',
    },
  });

  const aplicaRecargo = watch('aplica_recargo_nocturno');
  const diasSeleccionados = watch('dias_semana') || [];

  useEffect(() => {
    if (isOpen) {
      if (turno) {
        reset({
          codigo: turno.codigo,
          nombre: turno.nombre,
          tipo_jornada: turno.tipo_jornada,
          hora_inicio: turno.hora_inicio?.slice(0, 5),
          hora_fin: turno.hora_fin?.slice(0, 5),
          duracion_jornada: parseFloat(turno.duracion_jornada) || 8,
          aplica_recargo_nocturno: turno.aplica_recargo_nocturno,
          dias_semana: turno.dias_semana,
          horas_semanales_maximas: parseFloat(turno.horas_semanales_maximas) || 48,
          descripcion: turno.descripcion || '',
        });
      } else {
        reset({
          codigo: '',
          nombre: '',
          tipo_jornada: 'ordinaria',
          hora_inicio: '08:00',
          hora_fin: '17:00',
          duracion_jornada: 8,
          aplica_recargo_nocturno: false,
          dias_semana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
          horas_semanales_maximas: 48,
          descripcion: '',
        });
      }
    }
  }, [isOpen, turno, reset]);

  const toggleDia = (dia: string) => {
    const current = diasSeleccionados || [];
    if (current.includes(dia as DiaSemana)) {
      setValue(
        'dias_semana',
        current.filter((d) => d !== dia)
      );
    } else {
      setValue('dias_semana', [...current, dia as DiaSemana]);
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
            placeholder="Turno Mañana"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es obligatorio' })}
          />
        </div>

        <Select
          label="Tipo de Jornada"
          options={tipoJornadaOptions}
          error={errors.tipo_jornada?.message}
          {...register('tipo_jornada', { required: 'Selecciona el tipo de jornada' })}
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
            label="Duración (horas)"
            type="number"
            step="0.5"
            error={errors.duracion_jornada?.message}
            {...register('duracion_jornada', {
              required: 'La duración es obligatoria',
              valueAsNumber: true,
              min: { value: 1, message: 'Mínimo 1 hora' },
              max: { value: 12, message: 'Máximo 12 horas' },
            })}
          />
        </div>

        <Input
          label="Horas Semanales Máximas"
          type="number"
          step="1"
          {...register('horas_semanales_maximas', {
            valueAsNumber: true,
            min: { value: 1, message: 'Mínimo 1 hora' },
            max: { value: 72, message: 'Máximo 72 horas' },
          })}
        />

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Días de la Semana
          </label>
          <div className="grid grid-cols-4 gap-3">
            {diasSemanaOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
              >
                <input
                  type="checkbox"
                  checked={diasSeleccionados.includes(option.value as DiaSemana)}
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
            <p className="text-xs text-amber-700 dark:text-amber-300">
              El recargo nocturno se calculará automáticamente según la franja horaria del turno y
              la configuración de recargos del sistema.
            </p>
          )}
        </div>

        <Textarea
          label="Descripción"
          placeholder="Descripción del turno..."
          rows={2}
          {...register('descripcion')}
        />
      </form>
    </BaseModal>
  );
};
