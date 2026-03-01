/**
 * LicenciaFormModal - Formulario para crear/editar licencias
 */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/common/Button';
import { useCreateLicencia, useUpdateLicencia, useTiposLicencia } from '../../hooks/useNovedades';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { Licencia, LicenciaFormData } from '../../types';

interface LicenciaFormModalProps {
  licencia: Licencia | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LicenciaFormModal = ({ licencia, isOpen, onClose }: LicenciaFormModalProps) => {
  const isEditing = !!licencia;

  const { data: colaboradores } = useColaboradores();
  const { data: tiposLicencia } = useTiposLicencia();
  const createMutation = useCreateLicencia();
  const updateMutation = useUpdateLicencia();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LicenciaFormData>({
    defaultValues: {
      colaborador: 0,
      tipo_licencia: 0,
      fecha_inicio: '',
      fecha_fin: '',
      motivo: '',
    },
  });

  useEffect(() => {
    if (licencia) {
      reset({
        colaborador: licencia.colaborador,
        tipo_licencia: licencia.tipo_licencia,
        fecha_inicio: licencia.fecha_inicio,
        fecha_fin: licencia.fecha_fin,
        motivo: licencia.motivo,
      });
    } else {
      reset({
        colaborador: 0,
        tipo_licencia: 0,
        fecha_inicio: '',
        fecha_fin: '',
        motivo: '',
      });
    }
  }, [licencia, reset]);

  const onSubmit = async (data: LicenciaFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: licencia.id, data });
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

  const tiposOptions = (tiposLicencia || []).map((t) => ({
    value: String(t.id),
    label: `${t.nombre} (${t.categoria})`,
  }));

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Licencia' : 'Solicitar Licencia'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="colaborador"
            control={control}
            rules={{ required: 'El colaborador es requerido' }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Colaborador *
                </label>
                <Select
                  {...field}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  options={colaboradoresOptions}
                  error={errors.colaborador?.message}
                />
              </div>
            )}
          />

          <Controller
            name="tipo_licencia"
            control={control}
            rules={{ required: 'El tipo de licencia es requerido' }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Licencia *
                </label>
                <Select
                  {...field}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  options={tiposOptions}
                  error={errors.tipo_licencia?.message}
                />
              </div>
            )}
          />

          <Controller
            name="fecha_inicio"
            control={control}
            rules={{ required: 'La fecha de inicio es requerida' }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha Inicio *
                </label>
                <Input type="date" {...field} error={errors.fecha_inicio?.message} />
              </div>
            )}
          />

          <Controller
            name="fecha_fin"
            control={control}
            rules={{ required: 'La fecha de fin es requerida' }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha Fin *
                </label>
                <Input type="date" {...field} error={errors.fecha_fin?.message} />
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
              placeholder="Describe el motivo de la licencia..."
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
