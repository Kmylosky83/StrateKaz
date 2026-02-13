/**
 * PlanMejoraFormModal - Crear/Editar plan de mejora
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreatePlanMejora } from '../../hooks/useDesempeno';
import { useColaboradores } from '../../hooks/useColaboradores';
import type { PlanMejora, PlanMejoraFormData } from '../../types';

const TIPO_OPTIONS = [
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'mejora', label: 'Mejora' },
  { value: 'alto_potencial', label: 'Alto Potencial' },
  { value: 'correctivo', label: 'Correctivo' },
  { value: 'transicion', label: 'Transicion' },
];

interface Props {
  plan: PlanMejora | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlanMejoraFormModal = ({ plan, isOpen, onClose }: Props) => {
  const isEditing = !!plan;
  const createMutation = useCreatePlanMejora();
  const isPending = createMutation.isPending;
  const { data: colaboradoresData } = useColaboradores({ estado: 'activo' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanMejoraFormData>({
    defaultValues: {
      codigo: '',
      titulo: '',
      colaborador: 0,
      tipo_plan: 'desarrollo',
      fecha_inicio: '',
      fecha_fin: '',
      responsable: 0,
      objetivo_general: '',
      competencias_a_desarrollar: '',
      recursos_necesarios: '',
      indicadores_exito: '',
      observaciones: '',
    },
  });

  const colaboradorOptions = [
    { value: '', label: 'Selecciona un colaborador...' },
    ...(colaboradoresData?.results || []).map(
      (c: {
        id: number;
        nombre_completo?: string;
        primer_nombre?: string;
        primer_apellido?: string;
      }) => ({
        value: String(c.id),
        label: c.nombre_completo || `${c.primer_nombre} ${c.primer_apellido}`,
      })
    ),
  ];

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        reset({
          codigo: plan.codigo,
          titulo: plan.titulo,
          colaborador: plan.colaborador,
          tipo_plan: plan.tipo_plan,
          fecha_inicio: plan.fecha_inicio,
          fecha_fin: plan.fecha_fin,
          responsable: plan.responsable,
          objetivo_general: plan.objetivo_general,
          competencias_a_desarrollar: plan.competencias_a_desarrollar || '',
          recursos_necesarios: plan.recursos_necesarios || '',
          indicadores_exito: plan.indicadores_exito || '',
          observaciones: plan.observaciones || '',
        });
      } else {
        reset({
          codigo: '',
          titulo: '',
          colaborador: 0,
          tipo_plan: 'desarrollo',
          fecha_inicio: '',
          fecha_fin: '',
          responsable: 0,
          objetivo_general: '',
          competencias_a_desarrollar: '',
          recursos_necesarios: '',
          indicadores_exito: '',
          observaciones: '',
        });
      }
    }
  }, [isOpen, plan, reset]);

  const onSubmit = async (data: PlanMejoraFormData) => {
    await createMutation.mutateAsync(data);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Plan de Mejora' : 'Nuevo Plan de Mejora'}
      size="2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Plan'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Codigo"
            placeholder="PM-2026-001"
            error={errors.codigo?.message}
            {...register('codigo', { required: 'El codigo es obligatorio' })}
          />
          <Input
            label="Titulo"
            placeholder="Plan de desarrollo tecnico"
            error={errors.titulo?.message}
            {...register('titulo', { required: 'El titulo es obligatorio' })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Colaborador"
            options={colaboradorOptions}
            error={errors.colaborador?.message}
            {...register('colaborador', {
              valueAsNumber: true,
              required: 'Selecciona un colaborador',
            })}
          />
          <Select
            label="Responsable"
            options={colaboradorOptions}
            error={errors.responsable?.message}
            {...register('responsable', {
              valueAsNumber: true,
              required: 'Selecciona un responsable',
            })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select label="Tipo de Plan" options={TIPO_OPTIONS} {...register('tipo_plan')} />
          <Input
            label="Fecha Inicio"
            type="date"
            error={errors.fecha_inicio?.message}
            {...register('fecha_inicio', { required: 'La fecha de inicio es obligatoria' })}
          />
          <Input
            label="Fecha Fin"
            type="date"
            error={errors.fecha_fin?.message}
            {...register('fecha_fin', { required: 'La fecha de fin es obligatoria' })}
          />
        </div>

        <Textarea
          label="Objetivo General"
          placeholder="Describir el objetivo del plan..."
          rows={2}
          error={errors.objetivo_general?.message}
          {...register('objetivo_general', { required: 'El objetivo es obligatorio' })}
        />

        <Textarea
          label="Competencias a Desarrollar"
          placeholder="Competencias que se busca mejorar..."
          rows={2}
          {...register('competencias_a_desarrollar')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Textarea
            label="Recursos Necesarios"
            placeholder="Recursos requeridos..."
            rows={2}
            {...register('recursos_necesarios')}
          />
          <Textarea
            label="Indicadores de Exito"
            placeholder="Como se medira el exito..."
            rows={2}
            {...register('indicadores_exito')}
          />
        </div>

        <Textarea
          label="Observaciones"
          placeholder="Observaciones adicionales..."
          rows={2}
          {...register('observaciones')}
        />
      </form>
    </BaseModal>
  );
};
