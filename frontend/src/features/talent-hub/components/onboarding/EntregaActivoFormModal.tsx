/**
 * EntregaActivoFormModal - Registrar entrega de activo
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateEntregaActivo } from '../../hooks/useOnboardingInduccion';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { EntregaActivoFormData } from '../../types';

const TIPO_ACTIVO_OPTIONS = [
  { value: 'computador', label: 'Computador' },
  { value: 'celular', label: 'Celular Corporativo' },
  { value: 'radio', label: 'Radio de Comunicacion' },
  { value: 'vehiculo', label: 'Vehiculo' },
  { value: 'herramienta', label: 'Herramienta' },
  { value: 'uniforme', label: 'Uniforme' },
  { value: 'carnet', label: 'Carnet/Credencial' },
  { value: 'llaves', label: 'Llaves' },
  { value: 'tarjeta_acceso', label: 'Tarjeta de Acceso' },
  { value: 'otro', label: 'Otro' },
];

const ESTADO_ENTREGA_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'buen_estado', label: 'Buen Estado' },
  { value: 'uso_normal', label: 'Uso Normal' },
  { value: 'desgastado', label: 'Desgastado' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EntregaActivoFormModal = ({ isOpen, onClose }: Props) => {
  const createMutation = useCreateEntregaActivo();
  const { data: colaboradoresData } = useColaboradores({ estado: 'activo' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EntregaActivoFormData>({
    defaultValues: {
      estado_entrega: 'nuevo',
      fecha_entrega: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        colaborador: 0,
        tipo_activo: 'computador',
        descripcion: '',
        codigo_activo: '',
        serial: '',
        marca: '',
        modelo: '',
        fecha_entrega: new Date().toISOString().split('T')[0],
        estado_entrega: 'nuevo',
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

  const onSubmit = async (data: EntregaActivoFormData) => {
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
      title="Registrar Entrega de Activo"
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
            label="Tipo de Activo"
            options={TIPO_ACTIVO_OPTIONS}
            {...register('tipo_activo', { required: 'Selecciona el tipo' })}
          />
          <Input
            label="Descripcion"
            placeholder="Descripcion del activo..."
            error={errors.descripcion?.message}
            {...register('descripcion', { required: 'La descripcion es obligatoria' })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="Codigo Activo" placeholder="INV-001" {...register('codigo_activo')} />
          <Input label="Serial" placeholder="S/N" {...register('serial')} />
          <Select label="Estado" options={ESTADO_ENTREGA_OPTIONS} {...register('estado_entrega')} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="Marca" placeholder="Marca" {...register('marca')} />
          <Input label="Modelo" placeholder="Modelo" {...register('modelo')} />
          <Input
            label="Fecha Entrega"
            type="date"
            {...register('fecha_entrega', { required: 'La fecha es obligatoria' })}
          />
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
