/**
 * IncapacidadFormModal - Formulario para crear/editar incapacidades
 */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
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
            name="tipo_incapacidad"
            control={control}
            rules={{ required: 'El tipo de incapacidad es requerido' }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Incapacidad *
                </label>
                <Select
                  {...field}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  options={tiposOptions}
                  error={errors.tipo_incapacidad?.message}
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
            name="numero_incapacidad"
            control={control}
            rules={{ required: 'El numero de incapacidad es requerido' }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Numero de Incapacidad *
                </label>
                <Input {...field} error={errors.numero_incapacidad?.message} />
              </div>
            )}
          />

          <Controller
            name="eps_arl"
            control={control}
            rules={{ required: 'La EPS/ARL es requerida' }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  EPS/ARL *
                </label>
                <Input {...field} error={errors.eps_arl?.message} />
              </div>
            )}
          />

          <Controller
            name="codigo_cie10"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Codigo CIE-10
                </label>
                <Input {...field} />
              </div>
            )}
          />

          <Controller
            name="prorroga_de"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Es Prorroga De
                </label>
                <Select
                  {...field}
                  value={field.value ? String(field.value) : ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  options={prorrogasOptions}
                />
              </div>
            )}
          />
        </div>

        <Controller
          name="diagnostico"
          control={control}
          rules={{ required: 'El diagnostico es requerido' }}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Diagnostico *
              </label>
              <textarea
                {...field}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.diagnostico && (
                <p className="mt-1 text-sm text-red-600">{errors.diagnostico.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observaciones
              </label>
              <textarea
                {...field}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
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
            {isEditing ? 'Actualizar' : 'Registrar'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
