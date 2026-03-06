/**
 * Examen de Egreso Form Modal - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 *
 * Sincronizado con backend: off_boarding/serializers.py ExamenEgresoCreateSerializer
 * Campos: proceso_retiro, fecha_examen, entidad_prestadora, medico_evaluador,
 *         resultado, concepto_medico, observaciones
 */

import { useForm, Controller } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Switch } from '@/components/forms/Switch';
import { Button } from '@/components/common/Button';
import { useCreateExamenEgreso } from '../../hooks/useOffBoarding';
import type { ExamenEgresoFormData } from '../../types';
import { resultadoExamenOptions } from '../../types';

interface ExamenFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  procesoId: number;
}

export function ExamenFormModal({ isOpen, onClose, procesoId }: ExamenFormModalProps) {
  const createMutation = useCreateExamenEgreso();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ExamenEgresoFormData>({
    defaultValues: {
      proceso_retiro: procesoId,
      enfermedad_laboral_identificada: false,
      requiere_seguimiento: false,
    },
  });

  const onSubmit = (data: ExamenEgresoFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Programar Examen de Egreso" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('proceso_retiro')} value={procesoId} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fecha del Examen *"
            type="date"
            error={errors.fecha_examen?.message}
            {...register('fecha_examen', {
              required: 'La fecha del examen es requerida',
            })}
          />

          <Input
            label="Entidad Prestadora *"
            type="text"
            error={errors.entidad_prestadora?.message}
            {...register('entidad_prestadora', {
              required: 'La entidad prestadora es requerida',
            })}
            placeholder="Nombre de la IPS o entidad"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Médico Evaluador"
            type="text"
            {...register('medico_evaluador')}
            placeholder="Nombre del médico"
          />

          <Input
            label="Licencia Médico"
            type="text"
            {...register('licencia_medico')}
            placeholder="Número de licencia"
          />
        </div>

        <Select
          label="Resultado *"
          error={errors.resultado?.message}
          {...register('resultado', {
            required: 'El resultado es requerido',
          })}
          options={resultadoExamenOptions}
        />

        <Textarea
          label="Concepto Médico"
          {...register('concepto_medico')}
          rows={2}
          placeholder="Concepto médico ocupacional..."
        />

        <Textarea
          label="Hallazgos Clínicos"
          {...register('hallazgos_clinicos')}
          rows={2}
          placeholder="Hallazgos del examen..."
        />

        <Textarea
          label="Diagnóstico de Egreso"
          {...register('diagnostico_egreso')}
          rows={2}
          placeholder="Diagnóstico al egreso..."
        />

        <Textarea
          label="Comparación con Examen de Ingreso"
          {...register('comparacion_examen_ingreso')}
          rows={2}
          placeholder="Comparativa con examen de ingreso..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="enfermedad_laboral_identificada"
            control={control}
            render={({ field }) => (
              <Switch
                label="Enfermedad Laboral Identificada"
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <Controller
            name="requiere_seguimiento"
            control={control}
            render={({ field }) => (
              <Switch
                label="Requiere Seguimiento"
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <Textarea
          label="Recomendaciones"
          {...register('recomendaciones')}
          rows={2}
          placeholder="Recomendaciones médicas..."
        />

        <Textarea
          label="Observaciones"
          {...register('observaciones')}
          rows={2}
          placeholder="Observaciones adicionales..."
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Programando...' : 'Programar Examen'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
