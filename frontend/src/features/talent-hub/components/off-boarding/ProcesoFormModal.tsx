/**
 * Proceso Form Modal - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { useCreateProcesoRetiro } from '../../hooks/useOffBoarding';
import { useColaboradores } from '../../hooks/useColaboradores';
import { useTiposRetiro } from '../../hooks/useOffBoarding';
import { useSelectUsers } from '@/hooks/useSelectLists';
import type { ProcesoRetiroFormData } from '../../types';
import { motivoRetiroOptions } from '../../types';

interface ProcesoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProcesoFormModal({ isOpen, onClose }: ProcesoFormModalProps) {
  const { data: colaboradoresData } = useColaboradores({ estado: 'activo' });
  const { data: tiposRetiro = [] } = useTiposRetiro();
  const { data: users = [] } = useSelectUsers();
  const createMutation = useCreateProcesoRetiro();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProcesoRetiroFormData>();

  const onSubmit = (data: ProcesoRetiroFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const colaboradores = Array.isArray(colaboradoresData)
    ? colaboradoresData
    : (colaboradoresData?.results ?? []);

  const colaboradorOptions = colaboradores.map((col: Record<string, unknown>) => ({
    value: String(col.id),
    label: `${col.nombres} ${col.apellidos} - ${col.numero_identificacion}`,
  }));

  const tipoRetiroSelectOptions = tiposRetiro.map((tipo) => ({
    value: tipo.id.toString(),
    label: tipo.nombre,
  }));

  const responsableOptions = users.map((u) => ({
    value: String(u.id),
    label: u.label,
  }));

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Nuevo Proceso de Retiro" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Colaborador *"
          error={errors.colaborador?.message}
          {...register('colaborador', {
            required: 'El colaborador es requerido',
            valueAsNumber: true,
          })}
          options={colaboradorOptions}
        />

        <Select
          label="Tipo de Retiro *"
          error={errors.tipo_retiro?.message}
          {...register('tipo_retiro', {
            required: 'El tipo de retiro es requerido',
            valueAsNumber: true,
          })}
          options={tipoRetiroSelectOptions}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fecha de Notificación *"
            type="date"
            error={errors.fecha_notificacion?.message}
            {...register('fecha_notificacion', {
              required: 'La fecha de notificación es requerida',
            })}
          />

          <Input
            label="Fecha Último Día de Trabajo *"
            type="date"
            error={errors.fecha_ultimo_dia_trabajo?.message}
            {...register('fecha_ultimo_dia_trabajo', {
              required: 'La fecha del último día de trabajo es requerida',
            })}
          />
        </div>

        <Select
          label="Motivo de Retiro *"
          error={errors.motivo_retiro?.message}
          {...register('motivo_retiro', {
            required: 'El motivo de retiro es requerido',
          })}
          options={motivoRetiroOptions}
        />

        <Textarea
          label="Detalle del Motivo"
          {...register('motivo_detallado')}
          rows={3}
          placeholder="Describa en detalle el motivo del retiro..."
        />

        <Select
          label="Responsable del Proceso"
          {...register('responsable_proceso', { valueAsNumber: true })}
          options={[{ value: '', label: 'Seleccionar...' }, ...responsableOptions]}
        />

        <Textarea
          label="Observaciones"
          {...register('observaciones')}
          rows={2}
          placeholder="Observaciones adicionales..."
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Proceso'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
