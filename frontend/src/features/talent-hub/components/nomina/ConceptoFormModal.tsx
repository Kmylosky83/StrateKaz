/**
 * ConceptoFormModal - Formulario para crear/editar conceptos de nómina
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
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
    _watch,
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
              {...register('codigo')}
              error={errors.codigo?.message}
              placeholder="Se genera automáticamente"
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
        <Textarea
          label="Descripción"
          {...register('descripcion')}
          rows={3}
          placeholder="Descripción del concepto..."
        />

        {/* Configuración */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Configuración
          </h3>
          <div className="space-y-3">
            <Checkbox
              label="Es un concepto fijo (se aplica automáticamente)"
              {...register('es_fijo')}
            />
            <Checkbox
              label="Es base para Seguridad Social"
              {...register('es_base_seguridad_social')}
            />
            <Checkbox label="Es base para Parafiscales" {...register('es_base_parafiscales')} />
            <Checkbox
              label="Es base para Prestaciones Sociales"
              {...register('es_base_prestaciones')}
            />
          </div>
        </div>

        {/* Fórmula y Orden */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Fórmula (opcional)"
            {...register('formula')}
            rows={2}
            placeholder="Ej: salario_base * 0.08"
          />
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
