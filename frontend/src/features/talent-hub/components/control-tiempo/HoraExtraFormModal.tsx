/**
 * HoraExtraFormModal - Solicitud de horas extras
 * Alineado con backend: HoraExtra model + HoraExtraFormData types
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
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
    formState: { errors },
  } = useForm<HoraExtraFormData>({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'diurna',
      hora_inicio: '17:00',
      hora_fin: '19:00',
      justificacion: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'diurna',
        hora_inicio: '17:00',
        hora_fin: '19:00',
        justificacion: '',
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

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <Textarea
          label="Justificación"
          placeholder="Describe la justificación para estas horas extras..."
          rows={3}
          error={errors.justificacion?.message}
          {...register('justificacion', { required: 'La justificación es obligatoria' })}
        />

        <Alert
          variant="info"
          title="Ley 2466/2025"
          message="Los recargos se calculan automáticamente según el tipo de hora extra: Diurna 25%, Nocturna 75%, Dominical/Festiva 75%, Dominical Nocturna 110%. Las horas trabajadas se auto-calculan desde hora inicio/fin."
        />
      </form>
    </BaseModal>
  );
};
