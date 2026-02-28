/**
 * RegistroAsistenciaFormModal - Crear registro de asistencia
 * Alineado con backend: RegistroAsistencia model + RegistroAsistenciaFormData types
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateRegistroAsistencia } from '../../hooks/useControlTiempo';
import { useTurnos } from '../../hooks/useControlTiempo';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { RegistroAsistenciaFormData } from '../../types';
import { estadoAsistenciaOptions } from '../../types/controlTiempo.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistroAsistenciaFormModal = ({ isOpen, onClose }: Props) => {
  const createMutation = useCreateRegistroAsistencia();
  const isPending = createMutation.isPending;

  const { data: colaboradores } = useColaboradores();
  const { data: turnos } = useTurnos();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistroAsistenciaFormData>({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      estado: 'presente',
      observaciones: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        fecha: new Date().toISOString().split('T')[0],
        estado: 'presente',
        observaciones: '',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: RegistroAsistenciaFormData) => {
    await createMutation.mutateAsync(data);
    onClose();
  };

  const colaboradorOptions =
    colaboradores?.map((c) => ({
      value: c.id.toString(),
      label: c.usuario_nombre || `${c.id}`,
    })) || [];

  const turnoOptions = [
    { value: '', label: 'Sin turno asignado' },
    ...(turnos?.map((t) => ({
      value: t.id.toString(),
      label: `${t.nombre} (${t.hora_inicio?.slice(0, 5)} - ${t.hora_fin?.slice(0, 5)})`,
    })) || []),
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Registro de Asistencia"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Crear'}
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
            label="Estado"
            options={estadoAsistenciaOptions}
            error={errors.estado?.message}
            {...register('estado', { required: 'El estado es obligatorio' })}
          />
        </div>

        <Select
          label="Turno Asignado"
          options={turnoOptions}
          {...register('turno', {
            setValueAs: (v) => (v ? parseInt(v) : null),
          })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Hora Entrada" type="time" {...register('hora_entrada')} />
          <Input label="Hora Salida" type="time" {...register('hora_salida')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Entrada Almuerzo" type="time" {...register('hora_entrada_almuerzo')} />
          <Input label="Salida Almuerzo" type="time" {...register('hora_salida_almuerzo')} />
        </div>

        <Textarea
          label="Observaciones"
          placeholder="Notas adicionales sobre el registro..."
          rows={3}
          {...register('observaciones')}
        />
      </form>
    </BaseModal>
  );
};
