/**
 * HoraExtraFormModal - Solicitud de horas extras
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateHoraExtra } from '../../hooks/useControlTiempo';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { HoraExtraFormData } from '../../types';
import { tipoHoraExtraOptions } from '../../types/controlTiempo.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HoraExtraFormModal = ({ isOpen, onClose }: Props) => {
  const createMutation = useCreateHoraExtra();
  const isPending = createMutation.isPending;

  const { data: colaboradores } = useColaboradores();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HoraExtraFormData>({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'diurna',
      horas_solicitadas: 2,
      motivo: '',
      trabajo_realizado: '',
    },
  });

  const horaInicio = watch('hora_inicio');
  const horaFin = watch('hora_fin');

  useEffect(() => {
    if (horaInicio && horaFin) {
      const [h1, m1] = horaInicio.split(':').map(Number);
      const [h2, m2] = horaFin.split(':').map(Number);
      const minutos = h2 * 60 + m2 - (h1 * 60 + m1);
      const horas = minutos / 60;
      if (horas > 0) {
        setValue('horas_solicitadas', Math.round(horas * 10) / 10);
      }
    }
  }, [horaInicio, horaFin, setValue]);

  useEffect(() => {
    if (isOpen) {
      reset({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'diurna',
        hora_inicio: '17:00',
        hora_fin: '19:00',
        horas_solicitadas: 2,
        motivo: '',
        trabajo_realizado: '',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: HoraExtraFormData) => {
    await createMutation.mutateAsync(data);
    onClose();
  };

  const colaboradorOptions =
    colaboradores?.map((c) => ({
      value: c.id.toString(),
      label: c.usuario_nombre || `${c.id}`,
    })) || [];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Solicitud de Horas Extras"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Crear Solicitud'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Select
          label="Colaborador"
          options={colaboradorOptions}
          error={errors.colaborador?.message}
          {...register('colaborador', {
            required: 'El colaborador es obligatorio',
            setValueAs: (v) => parseInt(v),
          })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha"
            type="date"
            error={errors.fecha?.message}
            {...register('fecha', { required: 'La fecha es obligatoria' })}
          />
          <Select
            label="Tipo de Hora Extra"
            options={tipoHoraExtraOptions}
            error={errors.tipo?.message}
            {...register('tipo', { required: 'El tipo es obligatorio' })}
          />
        </div>

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
            label="Horas Solicitadas"
            type="number"
            step="0.5"
            error={errors.horas_solicitadas?.message}
            {...register('horas_solicitadas', {
              required: 'Las horas son obligatorias',
              valueAsNumber: true,
              min: { value: 0.5, message: 'Minimo 0.5 horas' },
              max: { value: 12, message: 'Maximo 12 horas' },
            })}
          />
        </div>

        <Textarea
          label="Motivo de la Solicitud"
          placeholder="Describe por que se requieren estas horas extras..."
          rows={2}
          error={errors.motivo?.message}
          {...register('motivo', { required: 'El motivo es obligatorio' })}
        />

        <Textarea
          label="Trabajo a Realizar"
          placeholder="Describe el trabajo que se realizara durante estas horas..."
          rows={3}
          {...register('trabajo_realizado')}
        />

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Ley 2466/2025:</strong> Los recargos se calculan automaticamente segun el tipo
            de hora extra: Diurna 25%, Nocturna 75%, Dominical/Festiva 75%, Dominical Nocturna 110%.
          </p>
        </div>
      </form>
    </BaseModal>
  );
};
