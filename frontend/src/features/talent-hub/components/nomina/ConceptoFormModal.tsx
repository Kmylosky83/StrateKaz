/**
 * ConceptoFormModal - Formulario para crear/editar conceptos de nómina
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { useCreateConceptoNomina, useUpdateConceptoNomina } from '../../hooks/useNomina';
import type { ConceptoNominaFormData, ConceptoNomina } from '../../types';
import { tipoConceptoOptions, categoriaConceptoOptions } from '../../types';

interface ConceptoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  concepto?: ConceptoNomina | null;
}

export const ConceptoFormModal = ({ isOpen, onClose, concepto }: ConceptoFormModalProps) => {
  const isEdit = !!concepto;
  const createMutation = useCreateConceptoNomina();
  const updateMutation = useUpdateConceptoNomina();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ConceptoNominaFormData>({
    defaultValues: {
      es_fijo: false,
      es_base_seguridad_social: false,
      es_base_parafiscales: false,
      es_base_prestaciones: false,
      orden: 0,
    },
  });

  useEffect(() => {
    if (isOpen && concepto) {
      reset({
        codigo: concepto.codigo,
        nombre: concepto.nombre,
        descripcion: concepto.descripcion || '',
        tipo: concepto.tipo,
        categoria: concepto.categoria,
        es_fijo: concepto.es_fijo,
        es_base_seguridad_social: concepto.es_base_seguridad_social,
        es_base_parafiscales: concepto.es_base_parafiscales,
        es_base_prestaciones: concepto.es_base_prestaciones,
        formula: concepto.formula || '',
        orden: concepto.orden,
      });
    } else if (isOpen) {
      reset({
        es_fijo: false,
        es_base_seguridad_social: false,
        es_base_parafiscales: false,
        es_base_prestaciones: false,
        orden: 0,
      });
    }
  }, [isOpen, concepto, reset]);

  const onSubmit = async (data: ConceptoNominaFormData) => {
    try {
      if (isEdit && concepto) {
        await updateMutation.mutateAsync({ id: concepto.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving concepto:', error);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Editar Concepto' : 'Nuevo Concepto'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código"
              {...register('codigo', { required: 'El código es requerido' })}
              error={errors.codigo?.message}
              placeholder="Ej: DEV001"
            />
            <Input
              label="Nombre"
              {...register('nombre', { required: 'El nombre es requerido' })}
              error={errors.nombre?.message}
              placeholder="Ej: Salario Básico"
            />
          </div>
        </div>

        {/* Clasificación */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Clasificación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo"
              {...register('tipo', { required: 'El tipo es requerido' })}
              options={tipoConceptoOptions}
              error={errors.tipo?.message}
            />
            <Select
              label="Categoría"
              {...register('categoria', { required: 'La categoría es requerida' })}
              options={categoriaConceptoOptions}
              error={errors.categoria?.message}
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            {...register('descripcion')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Descripción del concepto..."
          />
        </div>

        {/* Configuración */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Configuración
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('es_fijo')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Es un concepto fijo (se aplica automáticamente)
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('es_base_seguridad_social')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Es base para Seguridad Social
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('es_base_parafiscales')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Es base para Parafiscales
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('es_base_prestaciones')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Es base para Prestaciones Sociales
              </span>
            </label>
          </div>
        </div>

        {/* Fórmula y Orden */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fórmula (opcional)
            </label>
            <textarea
              {...register('formula')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              placeholder="Ej: salario_base * 0.08"
            />
          </div>
          <Input
            label="Orden de Cálculo"
            type="number"
            {...register('orden', { min: 0 })}
            error={errors.orden?.message}
            placeholder="0"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : isEdit
                ? 'Actualizar'
                : 'Crear'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
