/**
 * MC-002: Modal de formulario para Consecutivos
 * Sistema de Gestión StrateKaz
 *
 * Características:
 * - Crear/Editar configuración de consecutivos
 * - Vista previa en tiempo real del formato
 * - Validación de campos con Zod
 * - Consecutivos del sistema tienen campos limitados
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { Alert } from '@/components/common';
import {
  useCreateConsecutivo,
  useUpdateConsecutivo,
  useConsecutivo,
  useConsecutivosChoices,
  usePreviewConsecutivo,
} from '../../hooks/useStrategic';
import type {
  ConsecutivoConfigList,
  CategoriaConsecutivo,
  SeparadorConsecutivo,
} from '../../api/strategicApi';

// Schema de validación
const consecutivoSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'Solo letras mayúsculas, números y guiones bajos'),
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
  categoria: z.enum(
    [
      'DOCUMENTOS',
      'COMPRAS',
      'VENTAS',
      'INVENTARIO',
      'CONTABILIDAD',
      'PRODUCCION',
      'CALIDAD',
      'RRHH',
      'SST',
      'AMBIENTAL',
      'GENERAL',
    ],
    {
      required_error: 'La categoría es requerida',
    }
  ),
  prefix: z.string().min(1, 'El prefijo es requerido').max(20, 'Máximo 20 caracteres'),
  suffix: z.string().max(20, 'Máximo 20 caracteres').optional().default(''),
  separator: z.enum(['-', '/', '_', '.', '']).default('-'),
  padding: z.number().min(1, 'Mínimo 1').max(10, 'Máximo 10').default(5),
  numero_inicial: z.number().min(1, 'Mínimo 1').default(1),
  include_year: z.boolean().default(true),
  include_month: z.boolean().default(false),
  include_day: z.boolean().default(false),
  reset_yearly: z.boolean().default(true),
  reset_monthly: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type ConsecutivoFormData = z.infer<typeof consecutivoSchema>;

interface ConsecutivoFormModalProps {
  consecutivo: ConsecutivoConfigList | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ConsecutivoFormModal = ({
  consecutivo,
  isOpen,
  onClose,
}: ConsecutivoFormModalProps) => {
  const isEditing = !!consecutivo;
  const [previewFormato, setPreviewFormato] = useState<string>('');

  // Obtener datos completos si estamos editando
  const { data: consecutivoCompleto, isLoading: loadingConsecutivo } = useConsecutivo(
    consecutivo?.id || 0
  );

  // Obtener choices para selects
  const { data: choices, isLoading: loadingChoices } = useConsecutivosChoices();

  // Mutations
  const createMutation = useCreateConsecutivo();
  const updateMutation = useUpdateConsecutivo();
  const previewMutation = usePreviewConsecutivo();

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoading = loadingConsecutivo || loadingChoices;

  // Es consecutivo del sistema (solo permite editar campos limitados)
  const esSistema = consecutivoCompleto?.es_sistema || false;

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConsecutivoFormData>({
    resolver: zodResolver(consecutivoSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: 'GENERAL',
      prefix: '',
      suffix: '',
      separator: '-',
      padding: 5,
      numero_inicial: 1,
      include_year: true,
      include_month: false,
      include_day: false,
      reset_yearly: true,
      reset_monthly: false,
      is_active: true,
    },
  });

  // Watches para preview
  const prefix = watch('prefix');
  const suffix = watch('suffix');
  const separator = watch('separator');
  const padding = watch('padding');
  const includeYear = watch('include_year');
  const includeMonth = watch('include_month');
  const includeDay = watch('include_day');

  // Reset form cuando cambia el consecutivo
  useEffect(() => {
    if (isOpen) {
      if (consecutivoCompleto) {
        reset({
          codigo: consecutivoCompleto.codigo,
          nombre: consecutivoCompleto.nombre,
          descripcion: consecutivoCompleto.descripcion || '',
          categoria: consecutivoCompleto.categoria,
          prefix: consecutivoCompleto.prefix,
          suffix: consecutivoCompleto.suffix || '',
          separator: consecutivoCompleto.separator,
          padding: consecutivoCompleto.padding,
          numero_inicial: consecutivoCompleto.numero_inicial,
          include_year: consecutivoCompleto.include_year,
          include_month: consecutivoCompleto.include_month,
          include_day: consecutivoCompleto.include_day,
          reset_yearly: consecutivoCompleto.reset_yearly,
          reset_monthly: consecutivoCompleto.reset_monthly,
          is_active: consecutivoCompleto.is_active,
        });
        setPreviewFormato(consecutivoCompleto.ejemplo_formato);
      } else {
        reset({
          codigo: '',
          nombre: '',
          descripcion: '',
          categoria: 'GENERAL',
          prefix: '',
          suffix: '',
          separator: '-',
          padding: 5,
          numero_inicial: 1,
          include_year: true,
          include_month: false,
          include_day: false,
          reset_yearly: true,
          reset_monthly: false,
          is_active: true,
        });
        setPreviewFormato('');
      }
    }
  }, [isOpen, consecutivoCompleto, reset]);

  // Actualizar preview cuando cambian los campos relevantes
  useEffect(() => {
    if (prefix) {
      const updatePreview = async () => {
        try {
          const result = await previewMutation.mutateAsync({
            prefix,
            suffix: suffix || undefined,
            separator: separator as SeparadorConsecutivo,
            padding,
            numero: 1,
            include_year: includeYear,
            include_month: includeMonth,
            include_day: includeDay,
          });
          setPreviewFormato(result.formato);
        } catch {
          // Ignorar errores de preview
        }
      };
      updatePreview();
    } else {
      setPreviewFormato('');
    }
  }, [prefix, suffix, separator, padding, includeYear, includeMonth, includeDay]);

  const onSubmit = async (data: ConsecutivoFormData) => {
    try {
      // Si es del sistema, solo enviar campos permitidos
      if (esSistema && isEditing) {
        await updateMutation.mutateAsync({
          id: consecutivo!.id,
          data: {
            descripcion: data.descripcion,
            is_active: data.is_active,
          },
        });
      } else if (isEditing) {
        await updateMutation.mutateAsync({
          id: consecutivo!.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch {
      // Error manejado por el hook
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Consecutivo' : 'Nuevo Consecutivo'}
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
          {/* Alerta para consecutivos del sistema */}
          {esSistema && (
            <Alert
              variant="warning"
              message="Este es un consecutivo del sistema. Solo puede modificar la descripción y estado activo."
            />
          )}

          {/* Preview del formato */}
          {previewFormato && (
            <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-secondary-500" />
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Vista Previa
                </span>
              </div>
              <code className="text-lg font-mono text-primary-600 dark:text-primary-400">
                {previewFormato}
              </code>
            </div>
          )}

          {/* Sección: Identificación */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 border-b border-secondary-200 dark:border-secondary-700 pb-2">
              Identificación
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Código"
                placeholder="FACTURA, OC, REQ"
                error={errors.codigo?.message}
                disabled={esSistema}
                {...register('codigo', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  },
                })}
              />
              <Select
                label="Categoría"
                error={errors.categoria?.message}
                disabled={esSistema}
                value={watch('categoria')}
                onChange={(e) => setValue('categoria', e.target.value as CategoriaConsecutivo)}
                options={
                  choices?.categorias.map((cat) => ({
                    value: cat.value,
                    label: cat.label,
                  })) || []
                }
              />
            </div>

            <Input
              label="Nombre"
              placeholder="Factura de Venta, Orden de Compra"
              error={errors.nombre?.message}
              disabled={esSistema}
              {...register('nombre')}
            />
          </div>

          {/* Sección: Formato */}
          {!esSistema && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 border-b border-secondary-200 dark:border-secondary-700 pb-2">
                Formato
              </h4>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Prefijo"
                  placeholder="FAC"
                  error={errors.prefix?.message}
                  {...register('prefix', {
                    onChange: (e) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
                  })}
                />
                <Select
                  label="Separador"
                  value={watch('separator')}
                  onChange={(e) => setValue('separator', e.target.value as SeparadorConsecutivo)}
                  options={
                    choices?.separadores.map((sep) => ({
                      value: sep.value,
                      label: sep.label,
                    })) || []
                  }
                />
                <Input
                  label="Sufijo (opcional)"
                  placeholder="CO"
                  error={errors.suffix?.message}
                  {...register('suffix', {
                    onChange: (e) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Dígitos de Relleno"
                  type="number"
                  min={1}
                  max={10}
                  error={errors.padding?.message}
                  {...register('padding', { valueAsNumber: true })}
                />
                <Input
                  label="Número Inicial"
                  type="number"
                  min={1}
                  error={errors.numero_inicial?.message}
                  {...register('numero_inicial', { valueAsNumber: true })}
                />
              </div>

              {/* Componentes de fecha */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Incluir en formato
                </span>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={watch('include_year')}
                      onChange={(checked) => setValue('include_year', checked)}
                      size="sm"
                    />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Año (YYYY)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={watch('include_month')}
                      onChange={(checked) => setValue('include_month', checked)}
                      size="sm"
                    />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Mes (MM)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={watch('include_day')}
                      onChange={(checked) => setValue('include_day', checked)}
                      size="sm"
                    />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Día (DD)
                    </span>
                  </div>
                </div>
              </div>

              {/* Reinicio automático */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Reinicio automático
                </span>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={watch('reset_yearly')}
                      onChange={(checked) => {
                        setValue('reset_yearly', checked);
                        if (checked) setValue('reset_monthly', false);
                      }}
                      size="sm"
                    />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Reiniciar cada año
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={watch('reset_monthly')}
                      onChange={(checked) => {
                        setValue('reset_monthly', checked);
                        if (checked) setValue('reset_yearly', false);
                      }}
                      size="sm"
                    />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Reiniciar cada mes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sección: Adicional */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 border-b border-secondary-200 dark:border-secondary-700 pb-2">
              Adicional
            </h4>

            <Textarea
              label="Descripción (opcional)"
              placeholder="Notas o descripción del consecutivo..."
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
                Consecutivo activo
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
