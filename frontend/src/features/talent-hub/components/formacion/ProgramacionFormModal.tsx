/**
 * ProgramacionFormModal - Programar nueva sesion de capacitacion
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { useCapacitaciones, useCreateProgramacion } from '../../hooks/useFormacionReinduccion';
import type { ProgramacionFormData } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProgramacionFormModal = ({ isOpen, onClose }: Props) => {
  const createMutation = useCreateProgramacion();
  const { data: capacitaciones } = useCapacitaciones();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgramacionFormData>({
    defaultValues: {
      capacitacion: 0,
      numero_sesion: 1,
      titulo_sesion: '',
      fecha: '',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      lugar: '',
      enlace_virtual: '',
      instructor_externo: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        capacitacion: 0,
        numero_sesion: 1,
        titulo_sesion: '',
        fecha: '',
        hora_inicio: '08:00',
        hora_fin: '10:00',
        lugar: '',
        enlace_virtual: '',
        instructor_externo: '',
      });
    }
  }, [isOpen, reset]);

  const capOptions = [
    { value: '', label: 'Selecciona capacitacion...' },
    ...(capacitaciones || [])
      .filter((c) => c.estado !== 'cancelada' && c.estado !== 'finalizada')
      .map((c) => ({
        value: String(c.id),
        label: `${c.codigo} - ${c.nombre}`,
      })),
  ];

  const onSubmit = async (data: ProgramacionFormData) => {
    await createMutation.mutateAsync({
      ...data,
      capacitacion: Number(data.capacitacion),
    });
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Programar Sesion"
      size="2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Programando...' : 'Programar'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Select
          label="Capacitacion"
          options={capOptions}
          error={errors.capacitacion?.message}
          {...register('capacitacion', {
            required: 'Selecciona una capacitacion',
            validate: (v) => Number(v) > 0 || 'Selecciona una capacitacion',
          })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="No. Sesion"
            type="number"
            {...register('numero_sesion', { valueAsNumber: true, min: 1 })}
          />
          <Input
            label="Titulo de la Sesion"
            placeholder="Tema de la sesion..."
            {...register('titulo_sesion')}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Fecha"
            type="date"
            error={errors.fecha?.message}
            {...register('fecha', { required: 'La fecha es obligatoria' })}
          />
          <Input label="Hora Inicio" type="time" {...register('hora_inicio')} />
          <Input label="Hora Fin" type="time" {...register('hora_fin')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Lugar" placeholder="Salon de capacitaciones..." {...register('lugar')} />
          <Input
            label="Enlace Virtual"
            placeholder="https://meet.google.com/..."
            {...register('enlace_virtual')}
          />
        </div>

        <Input
          label="Instructor Externo"
          placeholder="Nombre del instructor (si aplica)"
          {...register('instructor_externo')}
        />
      </form>
    </BaseModal>
  );
};
