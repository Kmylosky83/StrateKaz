/**
 * MC-001: Modal de formulario para Unidades de Medida
 * Sistema de Gestión StrateKaz
 *
 * Características:
 * - Crear/Editar unidades de medida
 * - Validación de campos requeridos
 * - Selector de categoría
 * - Selector de unidad base para conversiones
 * - Campos de configuración de display
 * - Unidades del sistema tienen campos limitados
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { Alert } from '@/components/common';
import {
  useCreateUnidadMedida,
  useUpdateUnidadMedida,
  useUnidadMedida,
  useUnidadesMedidaChoices,
} from '../../hooks/useStrategic';
import type { UnidadMedidaList, CategoriaUnidad } from '../../api/strategicApi';

// Schema de validación
const unidadMedidaSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'Solo letras mayúsculas, números y guiones bajos'),
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  nombre_plural: z.string().max(100, 'Máximo 100 caracteres').optional(),
  simbolo: z.string().min(1, 'El símbolo es requerido').max(10, 'Máximo 10 caracteres'),
  categoria: z.enum(
    ['MASA', 'VOLUMEN', 'LONGITUD', 'AREA', 'CANTIDAD', 'TIEMPO', 'CONTENEDOR', 'OTRO'],
    {
      required_error: 'La categoría es requerida',
    }
  ),
  unidad_base: z.number().nullable().optional(),
  factor_conversion: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Debe ser un número positivo')
    .optional()
    .default('1'),
  decimales_display: z.number().min(0, 'Mínimo 0').max(6, 'Máximo 6').default(2),
  prefiere_notacion_cientifica: z.boolean().default(false),
  usar_separador_miles: z.boolean().default(true),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
  orden_display: z.number().min(0).default(0),
  is_active: z.boolean().default(true),
});

type UnidadMedidaFormData = z.infer<typeof unidadMedidaSchema>;

interface UnidadMedidaFormModalProps {
  unidad: UnidadMedidaList | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UnidadMedidaFormModal = ({ unidad, isOpen, onClose }: UnidadMedidaFormModalProps) => {
  const isEditing = !!unidad;

  // Obtener datos completos si estamos editando
  const { data: unidadCompleta, isLoading: loadingUnidad } = useUnidadMedida(unidad?.id || 0);

  // Obtener choices para selects
  const { data: choices, isLoading: loadingChoices } = useUnidadesMedidaChoices();

  // Mutations
  const createMutation = useCreateUnidadMedida();
  const updateMutation = useUpdateUnidadMedida();

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoading = loadingUnidad || loadingChoices;

  // Es unidad del sistema (solo permite editar campos limitados)
  const esUnidadSistema = unidadCompleta?.es_sistema || false;

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UnidadMedidaFormData>({
    resolver: zodResolver(unidadMedidaSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      nombre_plural: '',
      simbolo: '',
      categoria: 'CANTIDAD',
      unidad_base: null,
      factor_conversion: '1',
      decimales_display: 2,
      prefiere_notacion_cientifica: false,
      usar_separador_miles: true,
      descripcion: '',
      orden_display: 0,
      is_active: true,
    },
  });

  const categoriaActual = watch('categoria');
  const unidadBaseActual = watch('unidad_base');

  // Reset form cuando cambia la unidad
  useEffect(() => {
    if (isOpen) {
      if (unidadCompleta) {
        reset({
          codigo: unidadCompleta.codigo,
          nombre: unidadCompleta.nombre,
          nombre_plural: unidadCompleta.nombre_plural || '',
          simbolo: unidadCompleta.simbolo,
          categoria: unidadCompleta.categoria,
          unidad_base: unidadCompleta.unidad_base || null,
          factor_conversion: unidadCompleta.factor_conversion || '1',
          decimales_display: unidadCompleta.decimales_display,
          prefiere_notacion_cientifica: unidadCompleta.prefiere_notacion_cientifica,
          usar_separador_miles: unidadCompleta.usar_separador_miles,
          descripcion: unidadCompleta.descripcion || '',
          orden_display: unidadCompleta.orden_display,
          is_active: unidadCompleta.is_active,
        });
      } else {
        reset({
          codigo: '',
          nombre: '',
          nombre_plural: '',
          simbolo: '',
          categoria: 'CANTIDAD',
          unidad_base: null,
          factor_conversion: '1',
          decimales_display: 2,
          prefiere_notacion_cientifica: false,
          usar_separador_miles: true,
          descripcion: '',
          orden_display: 0,
          is_active: true,
        });
      }
    }
  }, [isOpen, unidadCompleta, reset]);

  // Filtrar unidades base por categoría actual
  const unidadesBaseDisponibles =
    choices?.unidades_base.filter(
      (u) => u.categoria === categoriaActual && u.value !== unidad?.id
    ) || [];

  // Si cambia la categoría, limpiar unidad base
  useEffect(() => {
    if (unidadBaseActual) {
      const baseValida = unidadesBaseDisponibles.some((u) => u.value === unidadBaseActual);
      if (!baseValida) {
        setValue('unidad_base', null);
        setValue('factor_conversion', '1');
      }
    }
  }, [categoriaActual, unidadBaseActual, unidadesBaseDisponibles, setValue]);

  const onSubmit = async (data: UnidadMedidaFormData) => {
    try {
      // Si es unidad del sistema, solo enviar campos permitidos
      if (esUnidadSistema && isEditing) {
        await updateMutation.mutateAsync({
          id: unidad!.id,
          data: {
            descripcion: data.descripcion,
            orden_display: data.orden_display,
            is_active: data.is_active,
          },
        });
      } else if (isEditing) {
        await updateMutation.mutateAsync({
          id: unidad!.id,
          data: {
            ...data,
            unidad_base: data.unidad_base || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          unidad_base: data.unidad_base || undefined,
        });
      }
      onClose();
    } catch (error) {
      // Error manejado por el hook
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
      size="lg"
    >
      {isLoading ? (
        <div className="p-6 animate-pulse space-y-4">
          <div className="h-10 bg-secondary-200 dark:bg-secondary-700 rounded" />
          <div className="h-10 bg-secondary-200 dark:bg-secondary-700 rounded" />
          <div className="h-10 bg-secondary-200 dark:bg-secondary-700 rounded" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Alerta para unidades del sistema */}
          {esUnidadSistema && (
            <Alert
              variant="warning"
              message="Esta es una unidad del sistema. Solo puede modificar la descripción, orden y estado activo."
            />
          )}

          {/* Sección: Identificación */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 border-b border-secondary-200 dark:border-secondary-700 pb-2">
              Identificación
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Código"
                placeholder="KG, TON, UND"
                error={errors.codigo?.message}
                disabled={esUnidadSistema}
                {...register('codigo', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  },
                })}
              />
              <Input
                label="Símbolo"
                placeholder="kg, ton, m³"
                error={errors.simbolo?.message}
                disabled={esUnidadSistema}
                {...register('simbolo')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Kilogramo"
                error={errors.nombre?.message}
                disabled={esUnidadSistema}
                {...register('nombre')}
              />
              <Input
                label="Nombre Plural (opcional)"
                placeholder="Kilogramos"
                error={errors.nombre_plural?.message}
                disabled={esUnidadSistema}
                {...register('nombre_plural')}
              />
            </div>

            <Select
              label="Categoría"
              error={errors.categoria?.message}
              disabled={esUnidadSistema}
              value={watch('categoria')}
              onChange={(e) => setValue('categoria', e.target.value as CategoriaUnidad)}
              options={
                choices?.categorias.map((cat) => ({
                  value: cat.value,
                  label: cat.label,
                })) || []
              }
            />
          </div>

          {/* Sección: Conversión */}
          {!esUnidadSistema && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 border-b border-secondary-200 dark:border-secondary-700 pb-2">
                Conversión
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Unidad Base (opcional)"
                  value={watch('unidad_base')?.toString() || ''}
                  onChange={(e) =>
                    setValue('unidad_base', e.target.value ? parseInt(e.target.value) : null)
                  }
                  options={[
                    { value: '', label: 'Es unidad base' },
                    ...unidadesBaseDisponibles.map((u) => ({
                      value: u.value.toString(),
                      label: u.label,
                    })),
                  ]}
                />
                <Input
                  label="Factor de Conversión"
                  placeholder="1000"
                  type="number"
                  step="any"
                  error={errors.factor_conversion?.message}
                  disabled={!watch('unidad_base')}
                  {...register('factor_conversion')}
                />
              </div>

              {watch('unidad_base') && (
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  1 {watch('codigo') || 'unidad'} = {watch('factor_conversion') || '1'}{' '}
                  {unidadesBaseDisponibles.find((u) => u.value === watch('unidad_base'))?.codigo ||
                    'base'}
                </p>
              )}
            </div>
          )}

          {/* Sección: Presentación */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 border-b border-secondary-200 dark:border-secondary-700 pb-2">
              Presentación
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Decimales a Mostrar"
                type="number"
                min={0}
                max={6}
                error={errors.decimales_display?.message}
                disabled={esUnidadSistema}
                {...register('decimales_display', { valueAsNumber: true })}
              />
              <Input
                label="Orden de Visualización"
                type="number"
                min={0}
                {...register('orden_display', { valueAsNumber: true })}
              />
            </div>

            {!esUnidadSistema && (
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={watch('usar_separador_miles')}
                    onChange={(checked) => setValue('usar_separador_miles', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">
                    Usar separador de miles
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={watch('prefiere_notacion_cientifica')}
                    onChange={(checked) => setValue('prefiere_notacion_cientifica', checked)}
                    size="sm"
                  />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">
                    Notación científica
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sección: Adicional */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 border-b border-secondary-200 dark:border-secondary-700 pb-2">
              Adicional
            </h4>

            <Textarea
              label="Descripción (opcional)"
              placeholder="Notas o descripción de la unidad..."
              rows={2}
              error={errors.descripcion?.message}
              {...register('descripcion')}
            />

            <div className="flex items-center gap-2">
              <Switch
                checked={watch('is_active')}
                onChange={(checked) => setValue('is_active', checked)}
                size="sm"
              />
              <span className="text-sm text-secondary-700 dark:text-secondary-300">
                Unidad activa
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-800 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
};
