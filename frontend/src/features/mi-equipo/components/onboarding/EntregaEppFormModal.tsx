/**
 * EntregaEppFormModal - Registrar entrega de EPP vía HSEQ
 *
 * Usa catálogo TipoEPP de HSEQ Seguridad Industrial.
 * POST va a /api/hseq/seguridad/entregas-epp/ (fuente única).
 */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { useSelectTiposEPP } from '@/hooks/useSelectLists';
import { useSelectUsers } from '@/hooks/useSelectLists';
import { useCreateEntregaEpp } from '@/features/talent-hub/hooks/useOnboardingInduccion';
import { useAuthStore } from '@/store/authStore';
import type { CreateEntregaEPPDTO } from '@/features/hseq/types/seguridad-industrial.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** User.id del colaborador (NO Colaborador.id) */
  usuarioId?: number;
}

export const EntregaEppFormModal = ({ isOpen, onClose, usuarioId }: Props) => {
  const createMutation = useCreateEntregaEpp();
  const { data: tiposEpp = [] } = useSelectTiposEPP();
  const { data: users = [] } = useSelectUsers();
  const currentUser = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateEntregaEPPDTO>({
    defaultValues: {
      cantidad: 1,
      fecha_entrega: new Date().toISOString().split('T')[0],
      capacitacion_realizada: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        colaborador_id: usuarioId || (undefined as unknown as number),
        tipo_epp_id: undefined as unknown as number,
        marca: '',
        modelo: '',
        talla: '',
        serial: '',
        cantidad: 1,
        fecha_entrega: new Date().toISOString().split('T')[0],
        entregado_por_id: currentUser?.id || (undefined as unknown as number),
        capacitacion_realizada: false,
        observaciones: '',
      });
    }
  }, [isOpen, reset, usuarioId, currentUser?.id]);

  const tipoEppOptions = [
    { value: '', label: 'Selecciona tipo de EPP...' },
    ...tiposEpp.map((t) => ({ value: String(t.id), label: t.label })),
  ];

  const colaboradorOptions = [
    { value: '', label: 'Selecciona colaborador...' },
    ...users.map((u) => ({ value: String(u.id), label: u.label })),
  ];

  const onSubmit = async (data: CreateEntregaEPPDTO) => {
    const payload: CreateEntregaEPPDTO = {
      ...data,
      colaborador_id: Number(data.colaborador_id),
      tipo_epp_id: Number(data.tipo_epp_id),
      entregado_por_id: Number(data.entregado_por_id) || currentUser?.id || 0,
      cantidad: Number(data.cantidad) || 1,
    };
    // Limpiar campos vacíos opcionales
    if (!payload.marca) delete payload.marca;
    if (!payload.modelo) delete payload.modelo;
    if (!payload.talla) delete payload.talla;
    if (!payload.serial) delete payload.serial;
    if (!payload.observaciones) delete payload.observaciones;

    await createMutation.mutateAsync(payload);
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
        {/* Colaborador — solo muestra si no se pasó por prop */}
        {!usuarioId && (
          <Select
            label="Colaborador"
            options={colaboradorOptions}
            error={errors.colaborador_id?.message}
            {...register('colaborador_id', {
              required: 'Selecciona un colaborador',
              validate: (v) => Number(v) > 0 || 'Selecciona un colaborador',
            })}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Tipo de EPP"
            options={tipoEppOptions}
            error={errors.tipo_epp_id?.message}
            {...register('tipo_epp_id', {
              required: 'Selecciona el tipo de EPP',
              validate: (v) => Number(v) > 0 || 'Selecciona el tipo de EPP',
            })}
          />
          <Input
            label="Cantidad"
            type="number"
            error={errors.cantidad?.message}
            {...register('cantidad', {
              valueAsNumber: true,
              min: { value: 1, message: 'Mínimo 1' },
            })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Marca" placeholder="Marca" {...register('marca')} />
          <Input label="Modelo" placeholder="Modelo/Referencia" {...register('modelo')} />
          <Input label="Talla" placeholder="M, L, 42..." {...register('talla')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Serial" placeholder="Número de serie" {...register('serial')} />
          <Input
            label="Fecha Entrega"
            type="date"
            error={errors.fecha_entrega?.message}
            {...register('fecha_entrega', { required: 'La fecha es obligatoria' })}
          />
        </div>

        <Controller
          name="capacitacion_realizada"
          control={control}
          render={({ field }) => (
            <Switch
              label="Capacitación de uso realizada"
              checked={field.value || false}
              onCheckedChange={field.onChange}
            />
          )}
        />

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
