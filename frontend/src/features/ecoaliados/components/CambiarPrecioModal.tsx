/**
 * Modal para Cambiar Precio de Ecoaliado
 *
 * Permite al Líder Comercial o superior modificar el precio de compra
 * por kg del ecoaliado.
 *
 * Características:
 * - Header con información del ecoaliado
 * - Muestra precio actual
 * - Visualización de cambio con % de variación
 * - Registro de justificación obligatorio
 * - Auditoría completa en historial
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import {
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Building2,
  User,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Ecoaliado, CambiarPrecioEcoaliadoDTO } from '../types/ecoaliado.types';

const cambiarPrecioSchema = z.object({
  precio_nuevo: z
    .string()
    .min(1, 'El precio es requerido')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Debe ser un número válido mayor o igual a 0',
    }),
  justificacion: z
    .string()
    .min(10, 'La justificación debe tener al menos 10 caracteres')
    .max(500),
});

type CambiarPrecioFormData = z.infer<typeof cambiarPrecioSchema>;

interface CambiarPrecioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CambiarPrecioEcoaliadoDTO) => void;
  ecoaliado: Ecoaliado | null;
  isLoading?: boolean;
}

export const CambiarPrecioModal = ({
  isOpen,
  onClose,
  onSubmit,
  ecoaliado,
  isLoading,
}: CambiarPrecioModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CambiarPrecioFormData>({
    resolver: zodResolver(cambiarPrecioSchema),
  });

  const precioNuevo = watch('precio_nuevo');

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleFormSubmit = (data: CambiarPrecioFormData) => {
    const precioActual = parseFloat(ecoaliado?.precio_compra_kg || '0');
    const nuevoPrecio = parseFloat(data.precio_nuevo);

    // Validar que sea diferente
    if (precioActual === nuevoPrecio) {
      alert('El nuevo precio debe ser diferente al precio actual');
      return;
    }

    onSubmit({
      precio_nuevo: data.precio_nuevo,
      justificacion: data.justificacion,
    });
  };

  if (!isOpen || !ecoaliado) return null;

  // Calcular diferencia y cambio porcentual
  const precioActual = parseFloat(ecoaliado.precio_compra_kg);
  const nuevoPrecio = precioNuevo ? parseFloat(precioNuevo) : null;
  const diferencia = nuevoPrecio !== null && !isNaN(nuevoPrecio) ? nuevoPrecio - precioActual : null;
  const porcentajeCambio =
    diferencia !== null && precioActual > 0
      ? (diferencia / precioActual) * 100
      : null;

  const esAumento = diferencia !== null && diferencia > 0;
  const esReduccion = diferencia !== null && diferencia < 0;
  const sinCambio = diferencia !== null && diferencia === 0;

  // Helper para renderizar campos
  const renderField = (
    icon: React.ElementType,
    label: string,
    value: React.ReactNode,
    className?: string
  ) => {
    if (!value) return null;
    const Icon = icon;

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
            {value}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-mono font-bold">
                    {ecoaliado.codigo}
                  </span>
                  <Badge variant={ecoaliado.is_active ? 'success' : 'gray'} size="sm">
                    {ecoaliado.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {ecoaliado.razon_social}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cambiar Precio de Compra
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-6">
              {/* Info del Ecoaliado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField(Building2, 'Unidad de Negocio', ecoaliado.unidad_negocio_nombre)}
                {renderField(User, 'Comercial Asignado', ecoaliado.comercial_asignado_nombre)}
              </div>

              {/* Precio Actual */}
              <div className="bg-info-50 dark:bg-info-900/20 p-4 rounded-lg border border-info-200 dark:border-info-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-info-600 dark:text-info-400" />
                  <span className="text-sm font-medium text-info-900 dark:text-info-100">
                    Precio Actual
                  </span>
                </div>
                <div className="text-3xl font-bold text-info-900 dark:text-info-100">
                  ${precioActual.toLocaleString('es-CO', { minimumFractionDigits: 2 })} / kg
                </div>
              </div>

              {/* Nuevo Precio */}
              <Input
                label="Nuevo Precio ($/kg) *"
                type="number"
                step="0.01"
                min="0"
                {...register('precio_nuevo')}
                error={errors.precio_nuevo?.message}
                placeholder="Ingrese el nuevo precio"
              />

              {/* Visualización de Cambio */}
              {diferencia !== null && !sinCambio && (
                <div
                  className={cn(
                    'p-4 rounded-lg border',
                    esAumento && 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800',
                    esReduccion && 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {esAumento ? (
                      <>
                        <TrendingUp className="h-5 w-5 text-danger-600 dark:text-danger-400" />
                        <span className="text-sm font-medium text-danger-900 dark:text-danger-100">
                          Aumento de Precio
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-5 w-5 text-success-600 dark:text-success-400" />
                        <span className="text-sm font-medium text-success-900 dark:text-success-100">
                          Disminución de Precio
                        </span>
                      </>
                    )}
                  </div>
                  <div
                    className={cn(
                      'text-2xl font-bold',
                      esAumento && 'text-danger-900 dark:text-danger-100',
                      esReduccion && 'text-success-900 dark:text-success-100'
                    )}
                  >
                    {esAumento ? '+' : ''}${diferencia.toLocaleString('es-CO', { minimumFractionDigits: 2 })} / kg
                  </div>
                  {porcentajeCambio !== null && (
                    <p
                      className={cn(
                        'text-sm mt-1',
                        esAumento && 'text-danger-700 dark:text-danger-300',
                        esReduccion && 'text-success-700 dark:text-success-300'
                      )}
                    >
                      {esAumento ? '+' : ''}{porcentajeCambio.toFixed(1)}% respecto al precio actual
                    </p>
                  )}
                </div>
              )}

              {/* Resumen del Cambio */}
              {diferencia !== null && !sinCambio && nuevoPrecio !== null && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                        Cambio a aplicar
                      </p>
                      <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                        <span className="font-medium">Precio:</span>{' '}
                        ${precioActual.toLocaleString('es-CO')} →{' '}
                        ${nuevoPrecio.toLocaleString('es-CO')}
                        {porcentajeCambio !== null && (
                          <span
                            className={cn(
                              'ml-1',
                              esAumento ? 'text-danger-600' : 'text-success-600'
                            )}
                          >
                            ({esAumento ? '+' : ''}{porcentajeCambio.toFixed(1)}%)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Justificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Justificación del Cambio *
                </label>
                <textarea
                  {...register('justificacion')}
                  rows={4}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400',
                    'focus:outline-none focus:ring-2',
                    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
                    errors.justificacion
                      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600'
                  )}
                  placeholder="Explique el motivo del cambio de precio (mínimo 10 caracteres)..."
                />
                {errors.justificacion && (
                  <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
                    {errors.justificacion.message}
                  </p>
                )}
              </div>

              {/* Advertencia */}
              <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg border border-warning-200 dark:border-warning-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5" />
                  <p className="text-sm text-warning-800 dark:text-warning-200">
                    Este cambio quedará registrado en el historial de precios con tu nombre de usuario
                    y la fecha actual. Asegúrate de que el precio y la justificación sean correctos
                    antes de confirmar.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant={esAumento ? 'danger' : 'primary'}
                  disabled={isLoading || sinCambio}
                >
                  {isLoading ? (
                    'Guardando...'
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Confirmar Cambio
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
