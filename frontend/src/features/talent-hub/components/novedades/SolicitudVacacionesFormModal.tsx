/**
 * SolicitudVacacionesFormModal - Formulario para crear/editar solicitudes de vacaciones
 */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/common/Button';
import {
  useCreateSolicitudVacaciones,
  useUpdateSolicitudVacaciones,
  usePeriodosVacaciones,
} from '../../hooks/useNovedades';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { SolicitudVacaciones, SolicitudVacacionesFormData } from '../../types';

interface SolicitudVacacionesFormModalProps {
  solicitud: SolicitudVacaciones | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SolicitudVacacionesFormModal = ({
  solicitud,
  isOpen,
  onClose,
}: SolicitudVacacionesFormModalProps) => {
  const isEditing = !!solicitud;

  const { data: colaboradores } = useColaboradores();
  const { data: periodos } = usePeriodosVacaciones();
  const createMutation = useCreateSolicitudVacaciones();
  const updateMutation = useUpdateSolicitudVacaciones();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SolicitudVacacionesFormData>({
    defaultValues: {
      colaborador: 0,
      periodo: 0,
      fecha_inicio: '',
      fecha_fin: '',
      incluye_prima: false,
      observaciones: '',
    },
  });

  const selectedColaborador = watch('colaborador');

  useEffect(() => {
    if (solicitud) {
      reset({
        colaborador: solicitud.colaborador,
        periodo: solicitud.periodo,
        fecha_inicio: solicitud.fecha_inicio,
        fecha_fin: solicitud.fecha_fin,
        incluye_prima: solicitud.incluye_prima,
        observaciones: solicitud.observaciones,
      });
    } else {
      reset({
        colaborador: 0,
        periodo: 0,
        fecha_inicio: '',
        fecha_fin: '',
        incluye_prima: false,
        observaciones: '',
      });
    }
  }, [solicitud, reset]);

  const onSubmit = async (data: SolicitudVacacionesFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: solicitud.id, data });
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

  const periodosOptions = (periodos || [])
    .filter((p) => !selectedColaborador || p.colaborador === selectedColaborador)
    .map((p) => ({
      value: String(p.id),
      label: `${p.colaborador_nombre} - ${p.dias_pendientes} dias disponibles`,
    }));

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Solicitud' : 'Nueva Solicitud de Vacaciones'}
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
            name="periodo"
            control={control}
            rules={{ required: 'El periodo es requerido' }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Periodo *
                </label>
                <Select
                  {...field}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  options={periodosOptions}
                  error={errors.periodo?.message}
                  disabled={!selectedColaborador}
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

          <Controller
            name="incluye_prima"
            control={control}
            render={({ field }) => (
              <div className="flex items-center h-full pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Incluye prima de vacaciones
                  </span>
                </label>
              </div>
            )}
          />
        </div>

        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => (
            <Textarea
              label="Observaciones"
              {...field}
              rows={3}
              placeholder="Observaciones adicionales..."
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
