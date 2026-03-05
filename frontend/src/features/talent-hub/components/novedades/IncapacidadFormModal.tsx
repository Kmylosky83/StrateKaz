/**
 * IncapacidadFormModal - Formulario para crear/editar incapacidades
 */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/common/Button';
import {
  useCreateIncapacidad,
  useUpdateIncapacidad,
  useTiposIncapacidad,
  useIncapacidades,
} from '../../hooks/useNovedades';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { Incapacidad, IncapacidadFormData } from '../../types';

interface IncapacidadFormModalProps {
  incapacidad: Incapacidad | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IncapacidadFormModal = ({
  incapacidad,
  isOpen,
  onClose,
}: IncapacidadFormModalProps) => {
  const isEditing = !!incapacidad;

  const { data: colaboradores } = useColaboradores();
  const { data: tiposIncapacidad } = useTiposIncapacidad();
  const { data: incapacidades } = useIncapacidades();
  const createMutation = useCreateIncapacidad();
  const updateMutation = useUpdateIncapacidad();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncapacidadFormData>({
    defaultValues: {
      colaborador: 0,
      tipo_incapacidad: 0,
      fecha_inicio: '',
      fecha_fin: '',
      diagnostico: '',
      codigo_cie10: '',
      eps_arl: '',
      numero_incapacidad: '',
      prorroga_de: null,
      observaciones: '',
    },
  });

  useEffect(() => {
    if (incapacidad) {
      reset({
        colaborador: incapacidad.colaborador,
        tipo_incapacidad: incapacidad.tipo_incapacidad,
        fecha_inicio: incapacidad.fecha_inicio,
        fecha_fin: incapacidad.fecha_fin,
        diagnostico: incapacidad.diagnostico,
        codigo_cie10: incapacidad.codigo_cie10,
        eps_arl: incapacidad.eps_arl,
        numero_incapacidad: incapacidad.numero_incapacidad,
        prorroga_de: incapacidad.prorroga_de,
        observaciones: incapacidad.observaciones,
      });
    } else {
      reset({
        colaborador: 0,
        tipo_incapacidad: 0,
        fecha_inicio: '',
        fecha_fin: '',
        diagnostico: '',
        codigo_cie10: '',
        eps_arl: '',
        numero_incapacidad: '',
        prorroga_de: null,
        observaciones: '',
      });
    }
  }, [incapacidad, reset]);

  const onSubmit = async (data: IncapacidadFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: incapacidad.id, data });
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

  const tiposOptions = (tiposIncapacidad || []).map((t) => ({
    value: String(t.id),
    label: t.nombre,
  }));

  const prorrogasOptions = [
    { value: '', label: 'No es prorroga' },
    ...(incapacidades || [])
      .filter((i) => !i.es_prorroga)
      .map((i) => ({
        value: String(i.id),
        label: `${i.numero_incapacidad} - ${i.colaborador_nombre}`,
      })),
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Incapacidad' : 'Registrar Incapacidad'}
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
            name="tipo_incapacidad"
            control={control}
            rules={{ required: 'El tipo de incapacidad es requerido' }}
            render={({ field }) => (
              <Select
                label="Tipo de Incapacidad *"
                {...field}
                value={String(field.value)}
                onChange={(e) => field.onChange(Number(e.target.value))}
                options={tiposOptions}
                error={errors.tipo_incapacidad?.message}
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
            name="numero_incapacidad"
            control={control}
            rules={{ required: 'El numero de incapacidad es requerido' }}
            render={({ field }) => (
              <Input
                label="Numero de Incapacidad *"
                {...field}
                error={errors.numero_incapacidad?.message}
              />
            )}
          />

          <Controller
            name="eps_arl"
            control={control}
            rules={{ required: 'La EPS/ARL es requerida' }}
            render={({ field }) => (
              <Input label="EPS/ARL *" {...field} error={errors.eps_arl?.message} />
            )}
          />

          <Controller
            name="codigo_cie10"
            control={control}
            render={({ field }) => <Input label="Codigo CIE-10" {...field} />}
          />

          <Controller
            name="prorroga_de"
            control={control}
            render={({ field }) => (
              <Select
                label="Es Prorroga De"
                {...field}
                value={field.value ? String(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                options={prorrogasOptions}
              />
            )}
          />
        </div>

        <Controller
          name="diagnostico"
          control={control}
          rules={{ required: 'El diagnostico es requerido' }}
          render={({ field }) => (
            <Textarea
              label="Diagnostico *"
              {...field}
              rows={3}
              error={errors.diagnostico?.message}
            />
          )}
        />

        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => <Textarea label="Observaciones" {...field} rows={3} />}
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
            {isEditing ? 'Actualizar' : 'Registrar'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
