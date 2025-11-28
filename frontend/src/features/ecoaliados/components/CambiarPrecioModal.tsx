/**
 * Modal para Cambiar Precio de Ecoaliado
 *
 * Permite al Líder Comercial o superior modificar el precio de compra
 * por kg del ecoaliado.
 *
 * Características:
 * - Muestra precio actual
 * - Visualización de cambio con % de variación
 * - Registro de justificación obligatorio
 * - Auditoría completa en historial
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
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

  if (!ecoaliado) return null;

  // Calcular diferencia y cambio porcentual
  const precioActual = parseFloat(ecoaliado.precio_compra_kg);
  const nuevoPrecio = precioNuevo ? parseFloat(precioNuevo) : null;
  const diferencia = nuevoPrecio !== null ? nuevoPrecio - precioActual : null;
  const porcentajeCambio =
    diferencia !== null && precioActual > 0
      ? ((diferencia / precioActual) * 100).toFixed(2)
      : null;

  const esAumento = diferencia !== null && diferencia > 0;
  const esReduccion = diferencia !== null && diferencia < 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Precio de Compra" size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* INFO DEL ECOALIADO */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {ecoaliado.razon_social}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Código:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {ecoaliado.codigo}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Ciudad:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {ecoaliado.ciudad}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Unidad Interna:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {ecoaliado.unidad_negocio_nombre}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Comercial:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {ecoaliado.comercial_asignado_nombre}
              </span>
            </div>
          </div>
        </div>

        {/* PRECIO ACTUAL */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Precio Actual
            </span>
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            ${precioActual.toLocaleString('es-CO', { minimumFractionDigits: 2 })} / kg
          </div>
        </div>

        {/* NUEVO PRECIO */}
        <div>
          <Input
            label="Nuevo Precio ($/kg) *"
            type="number"
            step="0.01"
            min="0"
            {...register('precio_nuevo')}
            error={errors.precio_nuevo?.message}
            placeholder="Ingrese el nuevo precio"
          />
        </div>

        {/* VISUALIZACIÓN DE CAMBIO */}
        {diferencia !== null && diferencia !== 0 && (
          <div
            className={`p-4 rounded-lg border ${
              esAumento
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : esReduccion
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {esAumento ? (
                <>
                  <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">
                    Aumento de Precio
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Disminución de Precio
                  </span>
                </>
              )}
            </div>
            <div
              className={`text-2xl font-bold ${
                esAumento
                  ? 'text-red-900 dark:text-red-100'
                  : 'text-green-900 dark:text-green-100'
              }`}
            >
              {esAumento ? '+' : ''}${diferencia.toLocaleString('es-CO', { minimumFractionDigits: 2 })}{' '}
              / kg
            </div>
            {porcentajeCambio && (
              <p
                className={`text-sm mt-1 ${
                  esAumento
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-green-700 dark:text-green-300'
                }`}
              >
                {esAumento ? '+' : ''}
                {porcentajeCambio}% respecto al precio actual
              </p>
            )}
          </div>
        )}

        {/* JUSTIFICACIÓN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Justificación del Cambio *
          </label>
          <textarea
            {...register('justificacion')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Explique el motivo del cambio de precio (mínimo 10 caracteres)..."
          />
          {errors.justificacion && (
            <p className="mt-1 text-sm text-red-600">{errors.justificacion.message}</p>
          )}
        </div>

        {/* ADVERTENCIA */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Advertencia:</strong> Este cambio quedará registrado en el historial de precios
            con tu nombre de usuario y la fecha actual. Asegúrate de que el precio y la
            justificación sean correctos antes de confirmar.
          </p>
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={esAumento ? 'danger' : 'primary'}
            disabled={isLoading || diferencia === 0}
          >
            {isLoading ? 'Guardando...' : 'Confirmar Cambio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
