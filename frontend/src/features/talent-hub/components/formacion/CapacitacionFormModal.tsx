/**
 * CapacitacionFormModal - Crear/Editar capacitacion
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { useCreateCapacitacion, useUpdateCapacitacion } from '../../hooks/useFormacionReinduccion';
import type { Capacitacion, CapacitacionFormData } from '../../types';

const TIPO_OPTIONS = [
  { value: 'induccion', label: 'Induccion' },
  { value: 'reinduccion', label: 'Reinduccion' },
  { value: 'tecnica', label: 'Tecnica' },
  { value: 'habilidades_blandas', label: 'Habilidades Blandas' },
  { value: 'sst', label: 'Seguridad y Salud en el Trabajo' },
  { value: 'calidad', label: 'Sistema de Calidad' },
  { value: 'ambiente', label: 'Gestion Ambiental' },
  { value: 'pesv', label: 'Seguridad Vial' },
  { value: 'liderazgo', label: 'Liderazgo' },
  { value: 'normativa', label: 'Normativa/Legal' },
  { value: 'otro', label: 'Otro' },
];

const MODALIDAD_OPTIONS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual Sincronica' },
  { value: 'asincronica', label: 'Virtual Asincronica' },
  { value: 'mixta', label: 'Mixta' },
  { value: 'outdoor', label: 'Outdoor/Experiencial' },
];

interface Props {
  capacitacion: Capacitacion | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CapacitacionFormModal = ({ capacitacion, isOpen, onClose }: Props) => {
  const isEditing = !!capacitacion;
  const createMutation = useCreateCapacitacion();
  const updateMutation = useUpdateCapacitacion();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CapacitacionFormData>({
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo_capacitacion: 'tecnica',
      modalidad: 'presencial',
      duracion_horas: 2,
      numero_sesiones: 1,
      instructor_externo: '',
      proveedor_externo: '',
      cupo_maximo: 20,
      cupo_minimo: 5,
      requiere_evaluacion: true,
      nota_aprobacion: 70,
      genera_certificado: true,
      costo_por_persona: 0,
      puntos_otorgados: 10,
    },
  });

  const requiereEval = watch('requiere_evaluacion');

  useEffect(() => {
    if (isOpen) {
      if (capacitacion) {
        reset({
          codigo: capacitacion.codigo,
          nombre: capacitacion.nombre,
          descripcion: capacitacion.descripcion || '',
          tipo_capacitacion: capacitacion.tipo_capacitacion,
          modalidad: capacitacion.modalidad,
          duracion_horas: capacitacion.duracion_horas,
          numero_sesiones: capacitacion.numero_sesiones,
          instructor_externo: capacitacion.instructor_externo || '',
          proveedor_externo: capacitacion.proveedor_externo || '',
          cupo_maximo: capacitacion.cupo_maximo,
          cupo_minimo: capacitacion.cupo_minimo,
          requiere_evaluacion: capacitacion.requiere_evaluacion,
          nota_aprobacion: capacitacion.nota_aprobacion,
          genera_certificado: capacitacion.genera_certificado,
          costo_por_persona: capacitacion.costo_por_persona,
          puntos_otorgados: capacitacion.puntos_otorgados,
        });
      } else {
        reset({
          codigo: '',
          nombre: '',
          descripcion: '',
          tipo_capacitacion: 'tecnica',
          modalidad: 'presencial',
          duracion_horas: 2,
          numero_sesiones: 1,
          instructor_externo: '',
          proveedor_externo: '',
          cupo_maximo: 20,
          cupo_minimo: 5,
          requiere_evaluacion: true,
          nota_aprobacion: 70,
          genera_certificado: true,
          costo_por_persona: 0,
          puntos_otorgados: 10,
        });
      }
    }
  }, [isOpen, capacitacion, reset]);

  const onSubmit = async (data: CapacitacionFormData) => {
    if (isEditing && capacitacion) {
      await updateMutation.mutateAsync({ id: capacitacion.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Capacitacion' : 'Nueva Capacitacion'}
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
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Codigo"
            placeholder="CAP-2026-001"
            error={errors.codigo?.message}
            {...register('codigo', { required: 'El codigo es obligatorio' })}
          />
          <Input
            label="Nombre"
            placeholder="Capacitacion en SST"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es obligatorio' })}
          />
        </div>

        <Textarea
          label="Descripcion"
          placeholder="Descripcion de la capacitacion..."
          rows={2}
          {...register('descripcion')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo"
            options={TIPO_OPTIONS}
            error={errors.tipo_capacitacion?.message}
            {...register('tipo_capacitacion', { required: 'Selecciona el tipo' })}
          />
          <Select label="Modalidad" options={MODALIDAD_OPTIONS} {...register('modalidad')} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Duracion (horas)"
            type="number"
            {...register('duracion_horas', { valueAsNumber: true, min: 1 })}
          />
          <Input
            label="No. Sesiones"
            type="number"
            {...register('numero_sesiones', { valueAsNumber: true, min: 1 })}
          />
          <Input
            label="Puntos Otorgados"
            type="number"
            {...register('puntos_otorgados', { valueAsNumber: true, min: 0 })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Instructor Externo"
            placeholder="Nombre del instructor..."
            {...register('instructor_externo')}
          />
          <Input
            label="Proveedor"
            placeholder="Institucion/empresa..."
            {...register('proveedor_externo')}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Cupo Maximo"
            type="number"
            {...register('cupo_maximo', { valueAsNumber: true, min: 1 })}
          />
          <Input
            label="Cupo Minimo"
            type="number"
            {...register('cupo_minimo', { valueAsNumber: true, min: 1 })}
          />
          <Input
            label="Costo/Persona (COP)"
            type="number"
            {...register('costo_por_persona', { valueAsNumber: true, min: 0 })}
          />
        </div>

        <div className="flex items-center gap-6 pt-2">
          <Checkbox label="Requiere evaluacion" {...register('requiere_evaluacion')} />
          <Checkbox label="Genera certificado" {...register('genera_certificado')} />
        </div>

        {requiereEval && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Input
              label="Nota minima aprobacion (%)"
              type="number"
              className="w-48"
              {...register('nota_aprobacion', { valueAsNumber: true, min: 0, max: 100 })}
            />
          </div>
        )}
      </form>
    </BaseModal>
  );
};
