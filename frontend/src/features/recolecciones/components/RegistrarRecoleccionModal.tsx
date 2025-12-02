/**
 * Modal para Registrar Recoleccion
 *
 * Flujo:
 * 1. Seleccionar programacion EN_RUTA (o viene preseleccionada)
 * 2. Digitar cantidad de kg pesados en bascula
 * 3. Sistema calcula valor total automaticamente
 * 4. Al guardar, genera voucher para impresion
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { formatCurrency } from '@/utils/formatters';
import {
  Scale,
  DollarSign,
  Calculator,
  Building2,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import type { ProgramacionEnRuta, RegistrarRecoleccionDTO } from '../types/recoleccion.types';

const registrarSchema = z.object({
  cantidad_kg: z
    .string()
    .min(1, 'La cantidad es requerida')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'La cantidad debe ser mayor a 0',
    }),
  observaciones: z.string().max(1000).optional(),
});

type RegistrarFormData = z.infer<typeof registrarSchema>;

interface RegistrarRecoleccionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RegistrarRecoleccionDTO) => void;
  programacion: ProgramacionEnRuta | null;
  isLoading?: boolean;
}

export const RegistrarRecoleccionModal = ({
  isOpen,
  onClose,
  onSubmit,
  programacion,
  isLoading,
}: RegistrarRecoleccionModalProps) => {
  const [valorCalculado, setValorCalculado] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RegistrarFormData>({
    resolver: zodResolver(registrarSchema),
    defaultValues: {
      cantidad_kg: '',
      observaciones: '',
    },
  });

  const cantidadKg = watch('cantidad_kg');

  // Calcular valor total cuando cambia la cantidad
  useEffect(() => {
    if (programacion && cantidadKg) {
      const cantidad = parseFloat(cantidadKg);
      if (!isNaN(cantidad) && cantidad > 0) {
        setValorCalculado(cantidad * programacion.precio_kg);
      } else {
        setValorCalculado(0);
      }
    } else {
      setValorCalculado(0);
    }
  }, [cantidadKg, programacion]);

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      reset({
        cantidad_kg: programacion?.cantidad_estimada_kg?.toString() || '',
        observaciones: '',
      });
      setValorCalculado(0);
    }
  }, [isOpen, programacion, reset]);

  const handleFormSubmit = (data: RegistrarFormData) => {
    if (!programacion) return;

    const formattedData: RegistrarRecoleccionDTO = {
      programacion_id: programacion.id,
      cantidad_kg: parseFloat(data.cantidad_kg),
      observaciones: data.observaciones,
    };

    onSubmit(formattedData);
  };

  if (!programacion) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Recoleccion" size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Informacion del Ecoaliado */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Datos del Ecoaliado
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300">Codigo:</span>
              <div className="font-medium text-blue-900 dark:text-blue-100">
                {programacion.ecoaliado_codigo}
              </div>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">Razon Social:</span>
              <div className="font-medium text-blue-900 dark:text-blue-100">
                {programacion.ecoaliado_razon_social}
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Direccion:
              </span>
              <div className="font-medium text-blue-900 dark:text-blue-100">
                {programacion.ecoaliado_direccion || 'Sin direccion'} -{' '}
                {programacion.ecoaliado_ciudad}
              </div>
            </div>
          </div>
        </div>

        {/* Precio por Kg */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Precio de Compra
              </span>
            </div>
            <span className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(programacion.precio_kg)}/kg
            </span>
          </div>
          {programacion.cantidad_estimada_kg && (
            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
              Cantidad estimada: {programacion.cantidad_estimada_kg.toLocaleString('es-CO')} kg
            </div>
          )}
        </div>

        {/* Input de Cantidad */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cantidad Recolectada (kg) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Scale className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              {...register('cantidad_kg')}
              className="block w-full pl-10 pr-12 py-3 text-lg font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              placeholder="Ej: 450.50"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">kg</span>
            </div>
          </div>
          {errors.cantidad_kg && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.cantidad_kg.message}</p>
          )}
        </div>

        {/* Calculo del Valor Total */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Valor a Pagar
            </span>
          </div>
          <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
            {formatCurrency(valorCalculado)}
          </div>
          {cantidadKg && parseFloat(cantidadKg) > 0 && (
            <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
              {parseFloat(cantidadKg).toLocaleString('es-CO')} kg x{' '}
              {formatCurrency(programacion.precio_kg)} = {formatCurrency(valorCalculado)}
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Observaciones (Opcional)
          </label>
          <textarea
            {...register('observaciones')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            placeholder="Notas adicionales sobre la recoleccion..."
          />
        </div>

        {/* Advertencia */}
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Al registrar la recoleccion, la programacion se marcara como COMPLETADA y se generara
              el voucher para impresion.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !cantidadKg || parseFloat(cantidadKg) <= 0}
          >
            {isLoading ? 'Registrando...' : 'Registrar y Generar Voucher'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
