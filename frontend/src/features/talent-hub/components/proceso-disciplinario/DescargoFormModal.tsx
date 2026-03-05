/**
 * DescargoFormModal - Crear/Editar citacion a descargos
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateDescargo, useUpdateDescargo } from '../../hooks/useProcesoDisciplinario';
import { useTiposFalta } from '../../hooks/useProcesoDisciplinario';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { Descargo, DescargoFormData } from '../../types';

interface Props {
  descargo: Descargo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DescargoFormModal = ({ descargo, isOpen, onClose }: Props) => {
  const isEditing = !!descargo;
  const createMutation = useCreateDescargo();
  const updateMutation = useUpdateDescargo();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { data: colaboradores } = useColaboradores();
  const { data: tiposFalta } = useTiposFalta();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DescargoFormData>({
    defaultValues: {
      colaborador: 0,
      tipo_falta: 0,
      fecha_hechos: new Date().toISOString().split('T')[0],
      descripcion_hechos: '',
      pruebas_empresa: '',
      testigos_empresa: '',
      fecha_citacion: '',
      hora_citacion: '',
      lugar_citacion: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (descargo) {
        reset({
          colaborador: descargo.colaborador,
          tipo_falta: descargo.tipo_falta,
          fecha_hechos: descargo.fecha_hechos,
          descripcion_hechos: descargo.descripcion_hechos,
          pruebas_empresa: descargo.pruebas_empresa || '',
          testigos_empresa: descargo.testigos_empresa || '',
          fecha_citacion: descargo.fecha_citacion,
          hora_citacion: descargo.hora_citacion,
          lugar_citacion: descargo.lugar_citacion,
        });
      } else {
        // Fecha citacion minima: 5 dias habiles despues (aprox 7 dias calendario)
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 7);
        reset({
          colaborador: 0,
          tipo_falta: 0,
          fecha_hechos: new Date().toISOString().split('T')[0],
          descripcion_hechos: '',
          pruebas_empresa: '',
          testigos_empresa: '',
          fecha_citacion: minDate.toISOString().split('T')[0],
          hora_citacion: '09:00',
          lugar_citacion: '',
        });
      }
    }
  }, [isOpen, descargo, reset]);

  const onSubmit = async (data: DescargoFormData) => {
    if (isEditing && descargo) {
      await updateMutation.mutateAsync({ id: descargo.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  const colaboradorOptions =
    colaboradores?.map((c) => ({
      value: String(c.id),
      label: c.usuario_nombre,
    })) || [];

  const tipoFaltaOptions =
    tiposFalta?.map((tf) => ({
      value: String(tf.id),
      label: `${tf.codigo} - ${tf.nombre}`,
    })) || [];

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 7);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Citacion a Descargos' : 'Crear Citacion a Descargos'}
      size="2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Alert
          variant="info"
          title="Ley 2466/2025"
          message="La citación a descargos debe realizarse con mínimo 5 días hábiles de anticipación."
          className="mb-4"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              label="Colaborador *"
              {...register('colaborador', { required: true, valueAsNumber: true })}
              options={colaboradorOptions}
              error={errors.colaborador?.message}
            />
          </div>

          <div>
            <Select
              label="Tipo de Falta *"
              {...register('tipo_falta', { required: true, valueAsNumber: true })}
              options={tipoFaltaOptions}
              error={errors.tipo_falta?.message}
            />
          </div>

          <div>
            <Input
              label="Fecha de los Hechos *"
              type="date"
              {...register('fecha_hechos', { required: true })}
              error={errors.fecha_hechos?.message}
            />
          </div>
        </div>

        <div>
          <Textarea
            label="Descripcion de los Hechos (Cargos) *"
            {...register('descripcion_hechos', { required: true })}
            placeholder="Descripcion detallada de los hechos que constituyen la falta..."
            rows={4}
            error={errors.descripcion_hechos?.message}
          />
        </div>

        <div>
          <Textarea
            label="Pruebas de la Empresa"
            {...register('pruebas_empresa')}
            placeholder="Pruebas documentales, fotograficas, testimoniales que soportan los cargos..."
            rows={3}
            error={errors.pruebas_empresa?.message}
          />
        </div>

        <div>
          <Textarea
            label="Testigos de la Empresa"
            {...register('testigos_empresa')}
            placeholder="Nombres de testigos de la empresa"
            rows={2}
            error={errors.testigos_empresa?.message}
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Datos de la Citacion
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Fecha Citacion *"
                type="date"
                {...register('fecha_citacion', { required: true })}
                min={minDate.toISOString().split('T')[0]}
                error={errors.fecha_citacion?.message}
              />
              <p className="text-xs text-gray-500 mt-1">Minimo 7 dias despues de hoy</p>
            </div>

            <div>
              <Input
                label="Hora *"
                type="time"
                {...register('hora_citacion', { required: true })}
                error={errors.hora_citacion?.message}
              />
            </div>

            <div>
              <Input
                label="Lugar *"
                {...register('lugar_citacion', { required: true })}
                placeholder="Ej: Sala de juntas"
                error={errors.lugar_citacion?.message}
              />
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  );
};
