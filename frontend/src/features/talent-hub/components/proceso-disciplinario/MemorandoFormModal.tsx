/**
 * MemorandoFormModal - Crear/Editar memorando disciplinario
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateMemorando, useUpdateMemorando } from '../../hooks/useProcesoDisciplinario';
import { useTiposFalta, useDescargos } from '../../hooks/useProcesoDisciplinario';
import { useColaboradores } from '../../hooks/useColaboradores';
import { tipoSancionOptions } from '../../types';
import type { Memorando, MemorandoFormData } from '../../types';

interface Props {
  memorando: Memorando | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MemorandoFormModal = ({ memorando, isOpen, onClose }: Props) => {
  const isEditing = !!memorando;
  const createMutation = useCreateMemorando();
  const updateMutation = useUpdateMemorando();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { data: colaboradores } = useColaboradores();
  const { data: tiposFalta } = useTiposFalta();
  const { data: descargos } = useDescargos();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MemorandoFormData>({
    defaultValues: {
      colaborador: 0,
      tipo_falta: 0,
      fecha_memorando: new Date().toISOString().split('T')[0],
      descargo: null,
      antecedentes: '',
      hechos: '',
      normas_infringidas: '',
      descargos_considerados: '',
      consideraciones: '',
      sancion_aplicada: 'amonestacion',
      dias_suspension: 0,
      fecha_inicio_sancion: null,
      fecha_fin_sancion: null,
      valor_multa: 0,
    },
  });

  const sancionAplicada = watch('sancion_aplicada');

  useEffect(() => {
    if (isOpen) {
      if (memorando) {
        reset({
          colaborador: memorando.colaborador,
          tipo_falta: memorando.tipo_falta,
          fecha_memorando: memorando.fecha_memorando,
          descargo: memorando.descargo,
          antecedentes: memorando.antecedentes || '',
          hechos: memorando.hechos,
          normas_infringidas: memorando.normas_infringidas || '',
          descargos_considerados: memorando.descargos_considerados || '',
          consideraciones: memorando.consideraciones || '',
          sancion_aplicada: memorando.sancion_aplicada,
          dias_suspension: memorando.dias_suspension || 0,
          fecha_inicio_sancion: memorando.fecha_inicio_sancion || null,
          fecha_fin_sancion: memorando.fecha_fin_sancion || null,
          valor_multa: memorando.valor_multa || 0,
        });
      } else {
        reset({
          colaborador: 0,
          tipo_falta: 0,
          fecha_memorando: new Date().toISOString().split('T')[0],
          descargo: null,
          antecedentes: '',
          hechos: '',
          normas_infringidas: '',
          descargos_considerados: '',
          consideraciones: '',
          sancion_aplicada: 'amonestacion',
          dias_suspension: 0,
          fecha_inicio_sancion: null,
          fecha_fin_sancion: null,
          valor_multa: 0,
        });
      }
    }
  }, [isOpen, memorando, reset]);

  const onSubmit = async (data: MemorandoFormData) => {
    if (isEditing && memorando) {
      await updateMutation.mutateAsync({ id: memorando.id, data });
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

  const descargoOptions = [
    { value: '', label: 'Sin descargo relacionado' },
    ...(descargos?.map((d) => ({
      value: String(d.id),
      label: `Descargo ${d.colaborador_nombre} - ${new Date(d.fecha_citacion).toLocaleDateString('es-CO')}`,
    })) || []),
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Memorando' : 'Crear Memorando'}
      size="3xl"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              label="Fecha Memorando *"
              type="date"
              {...register('fecha_memorando', { required: true })}
              error={errors.fecha_memorando?.message}
            />
          </div>
        </div>

        <div>
          <Select
            label="Descargo Relacionado"
            {...register('descargo', { valueAsNumber: true })}
            options={descargoOptions}
            error={errors.descargo?.message}
          />
        </div>

        <div>
          <Textarea
            label="Antecedentes"
            {...register('antecedentes')}
            placeholder="Llamados de atencion previos, reincidencia, etc."
            rows={2}
            error={errors.antecedentes?.message}
          />
        </div>

        <div>
          <Textarea
            label="Hechos *"
            {...register('hechos', { required: true })}
            placeholder="Descripcion detallada de los hechos que constituyen la falta..."
            rows={4}
            error={errors.hechos?.message}
          />
        </div>

        <div>
          <Textarea
            label="Normas Infringidas"
            {...register('normas_infringidas')}
            placeholder="Articulos del reglamento interno, leyes, decretos aplicables..."
            rows={2}
            error={errors.normas_infringidas?.message}
          />
        </div>

        <div>
          <Textarea
            label="Descargos Considerados"
            {...register('descargos_considerados')}
            placeholder="Resumen de los descargos presentados por el colaborador"
            rows={2}
            error={errors.descargos_considerados?.message}
          />
        </div>

        <div>
          <Textarea
            label="Consideraciones"
            {...register('consideraciones')}
            placeholder="Analisis juridico y valoracion de pruebas que fundamentan la decision..."
            rows={3}
            error={errors.consideraciones?.message}
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Sancion Aplicada
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Tipo de Sancion *"
                {...register('sancion_aplicada', { required: true })}
                options={tipoSancionOptions}
                error={errors.sancion_aplicada?.message}
              />
            </div>

            {sancionAplicada === 'suspension' && (
              <>
                <div>
                  <Input
                    label="Dias de Suspension *"
                    type="number"
                    {...register('dias_suspension', { valueAsNumber: true })}
                    min={1}
                    error={errors.dias_suspension?.message}
                  />
                </div>

                <div>
                  <Input
                    label="Fecha Inicio Suspension"
                    type="date"
                    {...register('fecha_inicio_sancion')}
                    error={errors.fecha_inicio_sancion?.message}
                  />
                </div>

                <div>
                  <Input
                    label="Fecha Fin Suspension"
                    type="date"
                    {...register('fecha_fin_sancion')}
                    error={errors.fecha_fin_sancion?.message}
                  />
                </div>
              </>
            )}

            {sancionAplicada === 'multa' && (
              <div>
                <Input
                  label="Valor Multa (COP)"
                  type="number"
                  {...register('valor_multa', { valueAsNumber: true })}
                  min={0}
                  error={errors.valor_multa?.message}
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </BaseModal>
  );
};
