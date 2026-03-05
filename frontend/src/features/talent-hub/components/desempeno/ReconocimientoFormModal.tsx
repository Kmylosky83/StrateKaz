/**
 * ReconocimientoFormModal - Nominar reconocimiento
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Input } from '@/components/forms/Input';
import { Checkbox } from '@/components/forms/Checkbox';
import { useCreateReconocimiento, useTiposReconocimiento } from '../../hooks/useDesempeno';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { ReconocimientoFormData } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ReconocimientoFormModal = ({ isOpen, onClose }: Props) => {
  const createMutation = useCreateReconocimiento();
  const isPending = createMutation.isPending;
  const { data: tipos } = useTiposReconocimiento();
  const { data: colaboradoresData } = useColaboradores({ estado: 'activo' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReconocimientoFormData>({
    defaultValues: {
      colaborador: 0,
      tipo_reconocimiento: 0,
      fecha_reconocimiento: new Date().toISOString().split('T')[0],
      motivo: '',
      logro_especifico: '',
      es_publico: true,
      observaciones: '',
    },
  });

  const colaboradorOptions = [
    { value: '', label: 'Selecciona un colaborador...' },
    ...(colaboradoresData?.results || []).map(
      (c: {
        id: number;
        nombre_completo?: string;
        primer_nombre?: string;
        primer_apellido?: string;
      }) => ({
        value: String(c.id),
        label: c.nombre_completo || `${c.primer_nombre} ${c.primer_apellido}`,
      })
    ),
  ];

  const tipoOptions = [
    { value: '', label: 'Selecciona un tipo...' },
    ...(Array.isArray(tipos) ? tipos : []).map((t) => ({
      value: String(t.id),
      label: `${t.nombre} (${t.puntos_otorgados} pts)`,
    })),
  ];

  useEffect(() => {
    if (isOpen) {
      reset({
        colaborador: 0,
        tipo_reconocimiento: 0,
        fecha_reconocimiento: new Date().toISOString().split('T')[0],
        motivo: '',
        logro_especifico: '',
        es_publico: true,
        observaciones: '',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: ReconocimientoFormData) => {
    // Clean FK value 0 to avoid "Clave primaria '0' inválida"
    if (!data.colaborador) delete data.colaborador;
    if (!data.tipo_reconocimiento) delete data.tipo_reconocimiento;
    await createMutation.mutateAsync(data);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nominar Reconocimiento"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Nominando...' : 'Nominar'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Colaborador"
            options={colaboradorOptions}
            error={errors.colaborador?.message}
            {...register('colaborador', {
              valueAsNumber: true,
              required: 'Selecciona un colaborador',
            })}
          />
          <Select
            label="Tipo de Reconocimiento"
            options={tipoOptions}
            error={errors.tipo_reconocimiento?.message}
            {...register('tipo_reconocimiento', {
              valueAsNumber: true,
              required: 'Selecciona un tipo',
            })}
          />
        </div>

        <Input label="Fecha" type="date" {...register('fecha_reconocimiento')} />

        <Textarea
          label="Motivo"
          placeholder="Describe el motivo del reconocimiento..."
          rows={3}
          error={errors.motivo?.message}
          {...register('motivo', { required: 'El motivo es obligatorio' })}
        />

        <Textarea
          label="Logro Especifico"
          placeholder="Detalla el logro alcanzado..."
          rows={2}
          {...register('logro_especifico')}
        />

        <Checkbox label="Reconocimiento publico" {...register('es_publico')} />

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
