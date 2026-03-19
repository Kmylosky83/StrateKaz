/**
 * ModuloFormModal - Crear/Editar modulo de induccion
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import {
  useCreateModuloInduccion,
  useUpdateModuloInduccion,
} from '../../hooks/useOnboardingInduccion';
import type { ModuloInduccion, ModuloInduccionFormData } from '../../types';

const TIPO_OPTIONS = [
  { value: 'induccion_general', label: 'Inducción General' },
  { value: 'induccion_especifica', label: 'Inducción Específica' },
  { value: 'reinduccion', label: 'Reinducción' },
  { value: 'sst', label: 'Seguridad y Salud en el Trabajo' },
  { value: 'calidad', label: 'Sistema de Calidad' },
  { value: 'ambiente', label: 'Gestión Ambiental' },
  { value: 'etica', label: 'Código de Ética' },
  { value: 'pesv', label: 'Seguridad Vial' },
  { value: 'otro', label: 'Otro' },
];

const FORMATO_OPTIONS = [
  { value: 'video', label: 'Video' },
  { value: 'presentacion', label: 'Presentación' },
  { value: 'documento', label: 'Documento PDF' },
  { value: 'quiz', label: 'Cuestionario' },
  { value: 'actividad', label: 'Actividad Práctica' },
  { value: 'presencial', label: 'Sesión Presencial' },
  { value: 'mixto', label: 'Mixto' },
];

interface Props {
  modulo: ModuloInduccion | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModuloFormModal = ({ modulo, isOpen, onClose }: Props) => {
  const isEditing = !!modulo;
  const createMutation = useCreateModuloInduccion();
  const updateMutation = useUpdateModuloInduccion();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ModuloInduccionFormData>({
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo_modulo: 'induccion_general',
      formato_contenido: 'presentacion',
      duracion_minutos: 30,
      es_obligatorio: true,
      requiere_evaluacion: false,
      nota_minima_aprobacion: 70,
      intentos_permitidos: 3,
      contenido_url: '',
      orden: 0,
    },
  });

  const requiereEval = watch('requiere_evaluacion');

  useEffect(() => {
    if (isOpen) {
      if (modulo) {
        reset({
          codigo: modulo.codigo,
          nombre: modulo.nombre,
          descripcion: modulo.descripcion || '',
          tipo_modulo: modulo.tipo_modulo,
          formato_contenido: modulo.formato_contenido,
          duracion_minutos: modulo.duracion_minutos,
          es_obligatorio: modulo.es_obligatorio,
          requiere_evaluacion: modulo.requiere_evaluacion,
          nota_minima_aprobacion: modulo.nota_minima_aprobacion,
          intentos_permitidos: modulo.intentos_permitidos,
          contenido_url: modulo.contenido_url || '',
          orden: modulo.orden,
        });
      } else {
        reset({
          codigo: '',
          nombre: '',
          descripcion: '',
          tipo_modulo: 'induccion_general',
          formato_contenido: 'presentacion',
          duracion_minutos: 30,
          es_obligatorio: true,
          requiere_evaluacion: false,
          nota_minima_aprobacion: 70,
          intentos_permitidos: 3,
          contenido_url: '',
          orden: 0,
        });
      }
    }
  }, [isOpen, modulo, reset]);

  const onSubmit = async (data: ModuloInduccionFormData) => {
    if (isEditing && modulo) {
      await updateMutation.mutateAsync({ id: modulo.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Módulo' : 'Nuevo Módulo de Inducción'}
      size="2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Módulo'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Código"
            placeholder="Se genera automáticamente"
            error={errors.codigo?.message}
            {...register('codigo')}
          />
          <Input
            label="Nombre"
            placeholder="Inducción corporativa"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es obligatorio' })}
          />
        </div>

        <Textarea
          label="Descripción"
          placeholder="Descripción del módulo..."
          rows={2}
          {...register('descripcion')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de Módulo"
            options={TIPO_OPTIONS}
            error={errors.tipo_modulo?.message}
            {...register('tipo_modulo', { required: 'Selecciona el tipo' })}
          />
          <Select label="Formato" options={FORMATO_OPTIONS} {...register('formato_contenido')} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Duración (min)"
            type="number"
            {...register('duracion_minutos', { valueAsNumber: true, min: 1 })}
          />
          <Input
            label="Orden"
            type="number"
            {...register('orden', { valueAsNumber: true, min: 0 })}
          />
          <Input label="URL Contenido" placeholder="https://..." {...register('contenido_url')} />
        </div>

        <div className="flex items-center gap-6 pt-2">
          <Checkbox label="Es obligatorio" {...register('es_obligatorio')} />
          <Checkbox label="Requiere evaluación" {...register('requiere_evaluacion')} />
        </div>

        {requiereEval && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Input
              label="Nota mínima aprobación (%)"
              type="number"
              {...register('nota_minima_aprobacion', { valueAsNumber: true, min: 0, max: 100 })}
            />
            <Input
              label="Intentos permitidos"
              type="number"
              {...register('intentos_permitidos', { valueAsNumber: true, min: 1 })}
            />
          </div>
        )}
      </form>
    </BaseModal>
  );
};
