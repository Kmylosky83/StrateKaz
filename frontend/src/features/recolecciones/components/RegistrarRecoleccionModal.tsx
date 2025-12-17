/**
 * Modal para Registrar Recolección
 *
 * Flujo:
 * 1. Conductor ve la programación EN_RUTA
 * 2. Digita cantidad de kg pesados en báscula
 * 3. Si es ACU (siempre para Ecoaliados), ingresa porcentaje de acidez
 * 4. Sistema calcula calidad (A, B, B1, B2, B4, C) basado en acidez
 * 5. Sistema calcula valor sugerido (kg × precio negociado)
 * 6. Conductor ingresa valor real pagado (puede diferir del sugerido)
 * 7. Sistema muestra la diferencia
 * 8. Al guardar, genera voucher para impresión
 */
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { formatCurrency } from '@/utils/formatters';
import {
  Scale,
  DollarSign,
  Calculator,
  Building2,
  MapPin,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Award,
} from 'lucide-react';
import type { ProgramacionEnRuta, RegistrarRecoleccionDTO } from '../types/recoleccion.types';

/**
 * Calcula la calidad del ACU basado en el porcentaje de acidez
 * - A: 1-5%
 * - B: 5.1-8%
 * - B1: 8.1-10%
 * - B2: 10.1-15%
 * - B4: 15.1-20%
 * - C: >20%
 */
const calcularCalidad = (acidez: number): { calidad: string; color: 'success' | 'primary' | 'info' | 'warning' | 'danger' } | null => {
  if (isNaN(acidez) || acidez < 0) return null;

  if (acidez <= 5) return { calidad: 'A', color: 'success' };
  if (acidez <= 8) return { calidad: 'B', color: 'primary' };
  if (acidez <= 10) return { calidad: 'B1', color: 'info' };
  if (acidez <= 15) return { calidad: 'B2', color: 'warning' };
  if (acidez <= 20) return { calidad: 'B4', color: 'warning' };
  return { calidad: 'C', color: 'danger' };
};

const registrarSchema = z.object({
  cantidad_kg: z
    .string()
    .min(1, 'La cantidad es requerida')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'La cantidad debe ser mayor a 0',
    }),
  porcentaje_acidez: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100),
      {
        message: 'El porcentaje debe estar entre 0 y 100',
      }
    ),
  valor_real_pagado: z
    .string()
    .min(1, 'El valor pagado es requerido')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'El valor debe ser mayor a 0',
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
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<RegistrarFormData>({
    resolver: zodResolver(registrarSchema),
    defaultValues: {
      cantidad_kg: '',
      porcentaje_acidez: '',
      valor_real_pagado: '',
      observaciones: '',
    },
  });

  const cantidadKg = watch('cantidad_kg');
  const porcentajeAcidez = watch('porcentaje_acidez');
  const valorRealPagado = watch('valor_real_pagado');

  // Calcular calidad basada en acidez
  const calidadInfo = useMemo(() => {
    if (!porcentajeAcidez) return null;
    const acidez = parseFloat(porcentajeAcidez);
    return calcularCalidad(acidez);
  }, [porcentajeAcidez]);

  // Calcular valor sugerido (kg × precio)
  const valorSugerido = useMemo(() => {
    if (programacion && cantidadKg) {
      const cantidad = parseFloat(cantidadKg);
      if (!isNaN(cantidad) && cantidad > 0) {
        return cantidad * programacion.precio_kg;
      }
    }
    return 0;
  }, [cantidadKg, programacion]);

  // Calcular precio real por kg (valor_real / kg)
  const precioRealPorKg = useMemo(() => {
    if (cantidadKg && valorRealPagado) {
      const cantidad = parseFloat(cantidadKg);
      const valor = parseFloat(valorRealPagado);
      if (!isNaN(cantidad) && cantidad > 0 && !isNaN(valor) && valor > 0) {
        return valor / cantidad;
      }
    }
    return 0;
  }, [cantidadKg, valorRealPagado]);

  // Calcular diferencia
  const diferencia = useMemo(() => {
    if (valorRealPagado && valorSugerido > 0) {
      const valorReal = parseFloat(valorRealPagado);
      if (!isNaN(valorReal)) {
        return valorReal - valorSugerido;
      }
    }
    return 0;
  }, [valorRealPagado, valorSugerido]);

  // Auto-llenar valor sugerido cuando cambian los kg
  useEffect(() => {
    if (valorSugerido > 0 && !valorRealPagado) {
      setValue('valor_real_pagado', Math.round(valorSugerido).toString());
    }
  }, [valorSugerido, valorRealPagado, setValue]);

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen && programacion) {
      reset({
        cantidad_kg: programacion?.cantidad_estimada_kg?.toString() || '',
        porcentaje_acidez: '',
        valor_real_pagado: '',
        observaciones: '',
      });
    }
  }, [isOpen, programacion, reset]);

  const handleFormSubmit = (data: RegistrarFormData) => {
    if (!programacion) return;

    const formattedData: RegistrarRecoleccionDTO = {
      programacion_id: programacion.id,
      cantidad_kg: parseFloat(data.cantidad_kg),
      valor_real_pagado: parseFloat(data.valor_real_pagado),
      porcentaje_acidez: data.porcentaje_acidez ? parseFloat(data.porcentaje_acidez) : undefined,
      observaciones: data.observaciones,
    };

    onSubmit(formattedData);
  };

  // Usar valor sugerido
  const handleUsarSugerido = () => {
    if (valorSugerido > 0) {
      setValue('valor_real_pagado', Math.round(valorSugerido).toString());
    }
  };

  if (!programacion) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Recolección" size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Información del Ecoaliado */}
        <Card variant="bordered" padding="sm">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Datos del Ecoaliado
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Código:</span>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.ecoaliado_codigo}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Razón Social:</span>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.ecoaliado_razon_social}
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Dirección:
              </span>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.ecoaliado_direccion || 'Sin dirección'} -{' '}
                {programacion.ecoaliado_ciudad}
              </div>
            </div>
          </div>
        </Card>

        {/* Precio por Kg (Solo lectura) */}
        <Card variant="bordered" padding="sm" className="bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Precio Negociado
              </span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(programacion.precio_kg)}/kg
            </span>
          </div>
        </Card>

        {/* Kilos Recolectados */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Kilos Recolectados <span className="text-red-500">*</span>
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
              placeholder="Ej: 20"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">kg</span>
            </div>
          </div>
          {programacion.cantidad_estimada_kg && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cantidad estimada: {programacion.cantidad_estimada_kg.toLocaleString('es-CO')} kg
            </p>
          )}
          {errors.cantidad_kg && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.cantidad_kg.message}</p>
          )}
        </div>

        {/* Porcentaje de Acidez (ACU) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Porcentaje de Acidez (%) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Droplets className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('porcentaje_acidez')}
              className="block w-full pl-10 pr-20 py-3 text-lg font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              placeholder="Ej: 3.5"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">%</span>
              {calidadInfo && (
                <Badge variant={calidadInfo.color} size="sm">
                  <Award className="h-3 w-3 mr-1" />
                  Calidad {calidadInfo.calidad}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            La calidad del ACU se determina automáticamente: A (1-5%), B (5.1-8%), B1 (8.1-10%), B2 (10.1-15%), B4 (15.1-20%), C (&gt;20%)
          </p>
          {errors.porcentaje_acidez && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.porcentaje_acidez.message}</p>
          )}
        </div>

        {/* Valor Sugerido (Automático, solo lectura) */}
        <Card variant="bordered" padding="sm" className="bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="h-4 w-4 text-info-600 dark:text-info-400" />
                <span className="text-sm font-medium text-info-900 dark:text-info-100">
                  Valor Sugerido
                </span>
              </div>
              <p className="text-xs text-info-600 dark:text-info-400">
                {cantidadKg && parseFloat(cantidadKg) > 0
                  ? `${parseFloat(cantidadKg).toLocaleString('es-CO')} kg × ${formatCurrency(programacion.precio_kg)}`
                  : 'Según negociación'}
              </p>
            </div>
            <span className="text-2xl font-bold text-info-700 dark:text-info-300">
              {formatCurrency(valorSugerido)}
            </span>
          </div>
        </Card>

        {/* Valor Real Pagado */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Valor Real Pagado <span className="text-red-500">*</span>
            </label>
            {valorSugerido > 0 && (
              <button
                type="button"
                onClick={handleUsarSugerido}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Usar valor sugerido
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              step="1"
              min="1"
              {...register('valor_real_pagado')}
              className="block w-full pl-10 pr-4 py-3 text-lg font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              placeholder="Ej: 105000"
            />
          </div>
          {errors.valor_real_pagado && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.valor_real_pagado.message}</p>
          )}
        </div>

        {/* Precio Real por Kg y Diferencia */}
        {valorRealPagado && parseFloat(valorRealPagado) > 0 && cantidadKg && parseFloat(cantidadKg) > 0 && (
          <div className="space-y-3">
            {/* Precio Real por Kg */}
            <Card
              variant="bordered"
              padding="sm"
              className={
                precioRealPorKg !== programacion.precio_kg
                  ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Precio Real por Kg
                    </span>
                    {precioRealPorKg !== programacion.precio_kg && (
                      <p className="text-xs text-warning-600 dark:text-warning-400">
                        Diferente al precio negociado ({formatCurrency(programacion.precio_kg)})
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xl font-bold text-warning-700 dark:text-warning-300">
                  {formatCurrency(precioRealPorKg)}/kg
                </span>
              </div>
            </Card>

            {/* Diferencia */}
            {valorSugerido > 0 && (
              <Card
                variant="bordered"
                padding="sm"
                className={
                  diferencia > 0
                    ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                    : diferencia < 0
                      ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {diferencia > 0 ? (
                      <TrendingUp className="h-5 w-5 text-danger-600 dark:text-danger-400" />
                    ) : diferencia < 0 ? (
                      <TrendingDown className="h-5 w-5 text-success-600 dark:text-success-400" />
                    ) : (
                      <Minus className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        diferencia > 0
                          ? 'text-danger-900 dark:text-danger-100'
                          : diferencia < 0
                            ? 'text-success-900 dark:text-success-100'
                            : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {diferencia > 0 ? 'Pagó de más' : diferencia < 0 ? 'Pagó de menos' : 'Sin diferencia'}
                    </span>
                  </div>
                  <span
                    className={`text-xl font-bold ${
                      diferencia > 0
                        ? 'text-danger-700 dark:text-danger-300'
                        : diferencia < 0
                          ? 'text-success-700 dark:text-success-300'
                          : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {diferencia > 0 ? '+' : ''}
                    {formatCurrency(diferencia)}
                  </span>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Observaciones */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Observaciones (Opcional)
          </label>
          <textarea
            {...register('observaciones')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            placeholder="Notas adicionales sobre la recolección..."
          />
        </div>

        {/* Advertencia */}
        <Card
          variant="bordered"
          padding="sm"
          className="bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning-800 dark:text-warning-200">
              Al registrar la recolección, la programación se marcará como COMPLETADA y se generará
              el voucher para impresión.
            </p>
          </div>
        </Card>

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
