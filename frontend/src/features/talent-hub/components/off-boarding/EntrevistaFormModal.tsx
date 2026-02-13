/**
 * Entrevista Form Modal - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { useCreateEntrevistaRetiro } from '../../hooks/useOffBoarding';
import type { EntrevistaRetiroFormData } from '../../types';
import { satisfaccionGeneralOptions } from '../../types';

interface EntrevistaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  procesoId: number;
}

export function EntrevistaFormModal({ isOpen, onClose, procesoId }: EntrevistaFormModalProps) {
  const createMutation = useCreateEntrevistaRetiro();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EntrevistaRetiroFormData>({
    defaultValues: {
      proceso_retiro: procesoId,
      recomendaria_empresa: true,
      volveria_trabajar: true,
    },
  });

  const onSubmit = (data: EntrevistaRetiroFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Registrar Entrevista de Retiro" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register('proceso_retiro')} value={procesoId} />

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha de Entrevista"
            type="date"
            error={errors.fecha_entrevista?.message}
            {...register('fecha_entrevista', {
              required: 'La fecha de entrevista es requerida',
            })}
          />
        </div>

        {/* Motivos */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Motivos del Retiro
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo Principal *
            </label>
            <textarea
              {...register('motivo_principal_retiro', {
                required: 'El motivo principal es requerido',
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
              rows={2}
              placeholder="Principal razón del retiro..."
            />
            {errors.motivo_principal_retiro && (
              <p className="mt-1 text-sm text-red-600">{errors.motivo_principal_retiro.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivos Secundarios
            </label>
            <textarea
              {...register('motivos_secundarios')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
              rows={2}
              placeholder="Otros motivos que influyeron..."
            />
          </div>
        </div>

        {/* Aspectos */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Evaluación de la Experiencia
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aspectos Positivos
            </label>
            <textarea
              {...register('aspectos_positivos')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
              rows={3}
              placeholder="¿Qué aspectos valoró más de trabajar aquí?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aspectos a Mejorar
            </label>
            <textarea
              {...register('aspectos_mejorar')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
              rows={3}
              placeholder="¿Qué aspectos cree que se podrían mejorar?"
            />
          </div>
        </div>

        {/* Satisfacción */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Niveles de Satisfacción
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Satisfacción con el Salario"
              {...register('satisfaccion_salario')}
              options={satisfaccionGeneralOptions}
            />

            <Select
              label="Satisfacción con el Ambiente Laboral"
              {...register('satisfaccion_ambiente')}
              options={satisfaccionGeneralOptions}
            />

            <Select
              label="Satisfacción con el Liderazgo"
              {...register('satisfaccion_liderazgo')}
              options={satisfaccionGeneralOptions}
            />

            <Select
              label="Satisfacción con el Desarrollo Profesional"
              {...register('satisfaccion_desarrollo')}
              options={satisfaccionGeneralOptions}
            />
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Recomendaciones y Sugerencias
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('recomendaria_empresa')}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Recomendaría la empresa a otros
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('volveria_trabajar')}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Volvería a trabajar en la empresa
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sugerencias
            </label>
            <textarea
              {...register('sugerencias')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
              rows={2}
              placeholder="Sugerencias para mejorar..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observaciones Generales
            </label>
            <textarea
              {...register('observaciones_generales')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
              rows={3}
              placeholder="Otras observaciones..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Guardando...' : 'Registrar Entrevista'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
