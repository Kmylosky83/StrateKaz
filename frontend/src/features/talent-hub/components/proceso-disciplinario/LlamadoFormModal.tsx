/**
 * LlamadoFormModal - Crear/Editar llamado de atencion
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import {
  useCreateLlamadoAtencion,
  useUpdateLlamadoAtencion,
} from '../../hooks/useProcesoDisciplinario';
import { useTiposFalta } from '../../hooks/useProcesoDisciplinario';
import { useColaboradores } from '../../hooks/useColaboradores';
import { tipoLlamadoOptions } from '../../types';
import type { LlamadoAtencion, LlamadoAtencionFormData } from '../../types';

interface Props {
  llamado: LlamadoAtencion | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LlamadoFormModal = ({ llamado, isOpen, onClose }: Props) => {
  const isEditing = !!llamado;
  const createMutation = useCreateLlamadoAtencion();
  const updateMutation = useUpdateLlamadoAtencion();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { data: colaboradores } = useColaboradores();
  const { data: tiposFalta } = useTiposFalta();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LlamadoAtencionFormData>({
    defaultValues: {
      colaborador: 0,
      tipo: 'verbal',
      tipo_falta: null,
      fecha_llamado: new Date().toISOString().split('T')[0],
      fecha_falta: new Date().toISOString().split('T')[0],
      descripcion_hechos: '',
      lugar_hechos: '',
      testigos: '',
      compromiso_colaborador: '',
      observaciones: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (llamado) {
        reset({
          colaborador: llamado.colaborador,
          tipo: llamado.tipo,
          tipo_falta: llamado.tipo_falta,
          fecha_llamado: llamado.fecha_llamado,
          fecha_falta: llamado.fecha_falta,
          descripcion_hechos: llamado.descripcion_hechos,
          lugar_hechos: llamado.lugar_hechos || '',
          testigos: llamado.testigos || '',
          compromiso_colaborador: llamado.compromiso_colaborador || '',
          observaciones: llamado.observaciones || '',
        });
      } else {
        reset({
          colaborador: 0,
          tipo: 'verbal',
          tipo_falta: null,
          fecha_llamado: new Date().toISOString().split('T')[0],
          fecha_falta: new Date().toISOString().split('T')[0],
          descripcion_hechos: '',
          lugar_hechos: '',
          testigos: '',
          compromiso_colaborador: '',
          observaciones: '',
        });
      }
    }
  }, [isOpen, llamado, reset]);

  const onSubmit = async (data: LlamadoAtencionFormData) => {
    if (isEditing && llamado) {
      await updateMutation.mutateAsync({ id: llamado.id, data });
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

  const tipoFaltaOptions = [
    { value: '', label: 'Seleccionar falta (opcional)' },
    ...(tiposFalta?.map((tf) => ({
      value: String(tf.id),
      label: `${tf.codigo} - ${tf.nombre}`,
    })) || []),
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Llamado de Atención' : 'Registrar Llamado de Atención'}
      size="2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Registrar'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
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
              label="Tipo *"
              {...register('tipo', { required: true })}
              options={tipoLlamadoOptions}
              error={errors.tipo?.message}
            />
          </div>

          <div>
            <Select
              label="Tipo de Falta"
              {...register('tipo_falta', { valueAsNumber: true })}
              options={tipoFaltaOptions}
              error={errors.tipo_falta?.message}
            />
          </div>

          <div>
            <Input
              label="Fecha del Llamado *"
              type="date"
              {...register('fecha_llamado', { required: true })}
              error={errors.fecha_llamado?.message}
            />
          </div>

          <div>
            <Input
              label="Fecha de los Hechos *"
              type="date"
              {...register('fecha_falta', { required: true })}
              error={errors.fecha_falta?.message}
            />
          </div>

          <div>
            <Input
              label="Lugar de los Hechos"
              {...register('lugar_hechos')}
              placeholder="Ej: Área de producción"
              error={errors.lugar_hechos?.message}
            />
          </div>
        </div>

        <div>
          <Textarea
            label="Descripción de los Hechos *"
            {...register('descripcion_hechos', { required: true })}
            placeholder="Describa detalladamente los hechos que motivan este llamado de atención..."
            rows={4}
            error={errors.descripcion_hechos?.message}
          />
        </div>

        <div>
          <Textarea
            label="Testigos"
            {...register('testigos')}
            placeholder="Nombres de testigos (si aplica)"
            rows={2}
            error={errors.testigos?.message}
          />
        </div>

        <div>
          <Textarea
            label="Compromiso del Colaborador"
            {...register('compromiso_colaborador')}
            placeholder="Compromiso adquirido por el colaborador para evitar reincidencia..."
            rows={3}
            error={errors.compromiso_colaborador?.message}
          />
        </div>

        <div>
          <Textarea
            label="Observaciones"
            {...register('observaciones')}
            placeholder="Observaciones adicionales"
            rows={2}
            error={errors.observaciones?.message}
          />
        </div>
      </form>
    </BaseModal>
  );
};
