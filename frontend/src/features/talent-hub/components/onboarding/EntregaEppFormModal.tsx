/**
 * EntregaEppFormModal - Registrar entrega de EPP
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateEntregaEpp } from '../../hooks/useOnboardingInduccion';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { EntregaEPPFormData } from '../../types';

const TIPO_EPP_OPTIONS = [
  { value: 'casco', label: 'Casco de Seguridad' },
  { value: 'gafas', label: 'Gafas de Proteccion' },
  { value: 'guantes', label: 'Guantes' },
  { value: 'botas', label: 'Botas de Seguridad' },
  { value: 'overol', label: 'Overol' },
  { value: 'protector_auditivo', label: 'Protector Auditivo' },
  { value: 'mascarilla', label: 'Mascarilla/Respirador' },
  { value: 'arnes', label: 'Arnes de Seguridad' },
  { value: 'chaleco', label: 'Chaleco Reflectivo' },
  { value: 'otro', label: 'Otro' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EntregaEppFormModal = ({ isOpen, onClose }: Props) => {
  const createMutation = useCreateEntregaEpp();
  const { data: colaboradoresData } = useColaboradores({ estado: 'activo' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EntregaEPPFormData>({
    defaultValues: {
      cantidad: 1,
      fecha_entrega: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        colaborador: 0,
        tipo_epp: 'casco',
        descripcion: '',
        marca: '',
        referencia: '',
        talla: '',
        cantidad: 1,
        fecha_entrega: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        observaciones: '',
      });
    }
  }, [isOpen, reset]);

  const colaboradorOptions = [
    { value: '', label: 'Selecciona...' },
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

  const onSubmit = async (data: EntregaEPPFormData) => {
    await createMutation.mutateAsync({
      ...data,
      colaborador: Number(data.colaborador),
    });
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Entrega de EPP"
      size="xl"
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
            {createMutation.isPending ? 'Registrando...' : 'Registrar Entrega'}
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
            required: 'Selecciona un colaborador',
            validate: (v) => Number(v) > 0 || 'Selecciona un colaborador',
          })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de EPP"
            options={TIPO_EPP_OPTIONS}
            {...register('tipo_epp', { required: 'Selecciona el tipo' })}
          />
          <Input
            label="Descripcion"
            placeholder="Descripcion del EPP..."
            error={errors.descripcion?.message}
            {...register('descripcion', { required: 'La descripcion es obligatoria' })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="Marca" placeholder="Marca" {...register('marca')} />
          <Input label="Referencia" placeholder="Modelo/Ref" {...register('referencia')} />
          <Input label="Talla" placeholder="M, L, 42..." {...register('talla')} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Cantidad"
            type="number"
            {...register('cantidad', { valueAsNumber: true, min: 1 })}
          />
          <Input
            label="Fecha Entrega"
            type="date"
            {...register('fecha_entrega', { required: 'La fecha es obligatoria' })}
          />
          <Input label="Fecha Vencimiento" type="date" {...register('fecha_vencimiento')} />
        </div>

        <Textarea
          label="Observaciones"
          rows={2}
          placeholder="Observaciones adicionales..."
          {...register('observaciones')}
        />
      </form>
    </BaseModal>
  );
};
