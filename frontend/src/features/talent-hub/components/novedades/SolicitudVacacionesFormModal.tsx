/**
 * SolicitudVacacionesFormModal - Formulario para crear/editar solicitudes de vacaciones
 */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
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
    } catch {
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
            name="periodo"
            control={control}
            rules={{ required: 'El periodo es requerido' }}
            render={({ field }) => (
              <Select
                label="Periodo *"
                {...field}
                value={String(field.value)}
                onChange={(e) => field.onChange(Number(e.target.value))}
                options={periodosOptions}
                error={errors.periodo?.message}
                disabled={!selectedColaborador}
              />
            )}
          />

          <Controller
            name="fecha_inicio"
            control={control}
            rules={{ required: 'La fecha de inicio es requerida' }}
            render={({ field }) => (
              <Input
                label="Fecha Inicio *"
                type="date"
                {...field}
                error={errors.fecha_inicio?.message}
              />
            )}
          />

          <Controller
            name="fecha_fin"
            control={control}
            rules={{ required: 'La fecha de fin es requerida' }}
            render={({ field }) => (
              <Input label="Fecha Fin *" type="date" {...field} error={errors.fecha_fin?.message} />
            )}
          />

          <Controller
            name="incluye_prima"
            control={control}
            render={({ field }) => (
              <div className="flex items-center h-full pt-6">
                <Checkbox
                  label="Incluye prima de vacaciones"
                  checked={field.value}
                  onChange={field.onChange}
                />
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
