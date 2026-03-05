/**
 * PermisoFormModal - Formulario para crear/editar permisos
 */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { Button } from '@/components/common/Button';
import { useCreatePermiso, useUpdatePermiso } from '../../hooks/useNovedades';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { Permiso, PermisoFormData } from '../../types';
import { tipoPermisoOptions } from '../../types';

interface PermisoFormModalProps {
  permiso: Permiso | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PermisoFormModal = ({ permiso, isOpen, onClose }: PermisoFormModalProps) => {
  const isEditing = !!permiso;

  const { data: colaboradores } = useColaboradores();
  const createMutation = useCreatePermiso();
  const updateMutation = useUpdatePermiso();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PermisoFormData>({
    defaultValues: {
      colaborador: 0,
      fecha: '',
      hora_salida: '',
      hora_regreso: '',
      motivo: '',
      tipo: 'personal',
      compensable: false,
    },
  });

  useEffect(() => {
    if (permiso) {
      reset({
        colaborador: permiso.colaborador,
        fecha: permiso.fecha,
        hora_salida: permiso.hora_salida,
        hora_regreso: permiso.hora_regreso,
        motivo: permiso.motivo,
        tipo: permiso.tipo,
        compensable: permiso.compensable,
      });
    } else {
      reset({
        colaborador: 0,
        fecha: '',
        hora_salida: '',
        hora_regreso: '',
        motivo: '',
        tipo: 'personal',
        compensable: false,
      });
    }
  }, [permiso, reset]);

  const onSubmit = async (data: PermisoFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: permiso.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const colaboradoresOptions = (colaboradores || []).map((c) => ({
    value: String(c.id),
    label: c.nombre_completo || `${c.primer_nombre} ${c.primer_apellido}`,
  }));

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Permiso' : 'Solicitar Permiso'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="colaborador"
            control={control}
            rules={{ required: 'El colaborador es requerido' }}
            render={({ field }) => (
              <Select
                label="Colaborador *"
                {...field}
                value={String(field.value)}
                onChange={(e) => field.onChange(Number(e.target.value))}
                options={colaboradoresOptions}
                error={errors.colaborador?.message}
              />
            )}
          />

          <Controller
            name="fecha"
            control={control}
            rules={{ required: 'La fecha es requerida' }}
            render={({ field }) => (
              <Input label="Fecha *" type="date" {...field} error={errors.fecha?.message} />
            )}
          />

          <Controller
            name="hora_salida"
            control={control}
            rules={{ required: 'La hora de salida es requerida' }}
            render={({ field }) => (
              <Input
                label="Hora Salida *"
                type="time"
                {...field}
                error={errors.hora_salida?.message}
              />
            )}
          />

          <Controller
            name="hora_regreso"
            control={control}
            rules={{ required: 'La hora de regreso es requerida' }}
            render={({ field }) => (
              <Input
                label="Hora Regreso *"
                type="time"
                {...field}
                error={errors.hora_regreso?.message}
              />
            )}
          />

          <Controller
            name="tipo"
            control={control}
            rules={{ required: 'El tipo es requerido' }}
            render={({ field }) => (
              <Select
                label="Tipo de Permiso *"
                {...field}
                options={tipoPermisoOptions}
                error={errors.tipo?.message}
              />
            )}
          />

          <Controller
            name="compensable"
            control={control}
            render={({ field }) => (
              <div className="flex items-center h-full pt-6">
                <Checkbox label="Compensable" checked={field.value} onChange={field.onChange} />
              </div>
            )}
          />
        </div>

        <Controller
          name="motivo"
          control={control}
          rules={{ required: 'El motivo es requerido' }}
          render={({ field }) => (
            <Textarea
              label="Motivo *"
              {...field}
              rows={4}
              placeholder="Describe el motivo del permiso..."
              error={errors.motivo?.message}
            />
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Actualizar' : 'Solicitar'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
