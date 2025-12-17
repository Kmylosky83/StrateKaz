/**
 * Modal para Cambiar Estado de una Programación
 *
 * Características:
 * - Transiciones válidas de estado según flujo
 * - Campo de cantidad recolectada al completar
 * - Motivo requerido al cancelar
 * - Validaciones dinámicas según estado
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Badge } from '@/components/common/Badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { Programacion, CambiarEstadoDTO, EstadoProgramacion } from '../types/programacion.types';

const cambiarEstadoSchema = z
  .object({
    nuevo_estado: z.enum(['PROGRAMADA', 'CONFIRMADA', 'EN_RUTA', 'COMPLETADA', 'CANCELADA'], {
      errorMap: () => ({ message: 'Seleccione un estado válido' }),
    }),
    cantidad_recolectada_kg: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val && val !== '' ? parseFloat(val) : undefined)),
    motivo_cancelacion: z.string().optional().or(z.literal('')),
    observaciones: z.string().max(500).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // Si el estado es COMPLETADA, debe tener cantidad recolectada
      if (data.nuevo_estado === 'COMPLETADA' && !data.cantidad_recolectada_kg) {
        return false;
      }
      return true;
    },
    {
      message: 'Debe ingresar la cantidad recolectada al completar',
      path: ['cantidad_recolectada_kg'],
    }
  )
  .refine(
    (data) => {
      // Si el estado es CANCELADA, debe tener motivo
      if (data.nuevo_estado === 'CANCELADA' && !data.motivo_cancelacion) {
        return false;
      }
      return true;
    },
    {
      message: 'Debe ingresar el motivo de la cancelación',
      path: ['motivo_cancelacion'],
    }
  );

type CambiarEstadoFormData = z.infer<typeof cambiarEstadoSchema>;

interface CambiarEstadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CambiarEstadoDTO) => void;
  programacion: Programacion | null;
  isLoading?: boolean;
}

export const CambiarEstadoModal = ({
  isOpen,
  onClose,
  onSubmit,
  programacion,
  isLoading,
}: CambiarEstadoModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CambiarEstadoFormData>({
    resolver: zodResolver(cambiarEstadoSchema),
  });

  const nuevoEstado = watch('nuevo_estado');

  useEffect(() => {
    if (isOpen && programacion) {
      reset({
        nuevo_estado: programacion.estado,
        cantidad_recolectada_kg: programacion.cantidad_recolectada_kg
          ? String(programacion.cantidad_recolectada_kg)
          : '',
        motivo_cancelacion: '',
        observaciones: '',
      });
    }
  }, [isOpen, programacion, reset]);

  const handleFormSubmit = (data: CambiarEstadoFormData) => {
    const formattedData: CambiarEstadoDTO = {
      nuevo_estado: data.nuevo_estado,
      cantidad_recolectada_kg: data.cantidad_recolectada_kg,
      motivo_cancelacion: data.motivo_cancelacion || undefined,
      observaciones: data.observaciones || undefined,
    };

    onSubmit(formattedData);
  };

  // Determinar estados disponibles según el estado actual
  const getEstadosDisponibles = (): { value: EstadoProgramacion; label: string }[] => {
    if (!programacion) return [];

    const estadoActual = programacion.estado;

    const todosLosEstados: { value: EstadoProgramacion; label: string }[] = [
      { value: 'PROGRAMADA', label: 'Programada' },
      { value: 'CONFIRMADA', label: 'Confirmada' },
      { value: 'EN_RUTA', label: 'En Ruta' },
      { value: 'COMPLETADA', label: 'Completada' },
      { value: 'CANCELADA', label: 'Cancelada' },
    ];

    // Filtrar según el flujo lógico
    switch (estadoActual) {
      case 'PROGRAMADA':
        return todosLosEstados.filter((e) =>
          ['CONFIRMADA', 'CANCELADA'].includes(e.value)
        );
      case 'CONFIRMADA':
        return todosLosEstados.filter((e) =>
          ['EN_RUTA', 'CANCELADA'].includes(e.value)
        );
      case 'EN_RUTA':
        return todosLosEstados.filter((e) =>
          ['COMPLETADA', 'CANCELADA'].includes(e.value)
        );
      case 'COMPLETADA':
      case 'CANCELADA':
      case 'REPROGRAMADA':
        return []; // Estados finales, no se pueden cambiar
      default:
        return todosLosEstados;
    }
  };

  const estadosDisponibles = getEstadosDisponibles();

  const getEstadoBadge = (programacion: Programacion) => {
    // Si está vencida, mostrar badge especial
    if (programacion.esta_vencida) {
      return (
        <Badge variant="danger" size="sm">
          Vencida
        </Badge>
      );
    }

    const badgeMap: Record<
      string,
      { variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'; label: string }
    > = {
      PROGRAMADA: { variant: 'gray', label: 'Programada' },
      CONFIRMADA: { variant: 'info', label: 'Confirmada' },
      EN_RUTA: { variant: 'warning', label: 'En Ruta' },
      COMPLETADA: { variant: 'success', label: 'Completada' },
      CANCELADA: { variant: 'danger', label: 'Cancelada' },
      REPROGRAMADA: { variant: 'primary', label: 'Reprogramada' },
    };

    const badge = badgeMap[programacion.estado] || badgeMap.PROGRAMADA;

    return (
      <Badge variant={badge.variant} size="sm">
        {badge.label}
      </Badge>
    );
  };

  if (!programacion) return null;

  const mostrarCantidadRecolectada = nuevoEstado === 'COMPLETADA';
  const mostrarMotivoCancelacion = nuevoEstado === 'CANCELADA';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar Estado de Programación"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Información de la Programación */}
        <Card variant="bordered" padding="sm">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Programación
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Estado actual:</span>
              {getEstadoBadge(programacion)}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Código:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.ecoaliado_codigo}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ecoaliado:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.ecoaliado_razon_social}
              </span>
            </div>
            {programacion.recolector_asignado_nombre && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Recolector:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {programacion.recolector_asignado_nombre}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Advertencia si no hay estados disponibles */}
        {estadosDisponibles.length === 0 && (
          <Card
            variant="bordered"
            padding="sm"
            className="bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-warning-900 dark:text-warning-100">
                  Estado final alcanzado
                </h4>
                <p className="text-sm text-warning-800 dark:text-warning-200 mt-1">
                  Esta programación está en un estado final (
                  {programacion.estado === 'COMPLETADA' ? 'Completada' : 'Cancelada'}) y no puede
                  ser modificada.
                </p>
              </div>
            </div>
          </Card>
        )}

        {estadosDisponibles.length > 0 && (
          <>
            {/* Selección de Nuevo Estado */}
            <Select
              label="Nuevo Estado *"
              {...register('nuevo_estado')}
              error={errors.nuevo_estado?.message}
              options={[
                { value: '', label: 'Seleccionar estado' },
                ...estadosDisponibles,
              ]}
            />

            {/* Cantidad Recolectada (solo si COMPLETADA) */}
            {mostrarCantidadRecolectada && (
              <Card
                variant="bordered"
                padding="sm"
                className="bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800"
              >
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-success-900 dark:text-success-100">
                      Completar Recolección
                    </h4>
                    <p className="text-sm text-success-800 dark:text-success-200 mt-1">
                      Ingrese la cantidad real de material recolectado
                    </p>
                  </div>
                </div>
                <Input
                  type="number"
                  label="Cantidad Recolectada (kg) *"
                  {...register('cantidad_recolectada_kg')}
                  error={errors.cantidad_recolectada_kg?.message}
                  placeholder="Ej: 450"
                  min="0"
                  step="0.01"
                />
                {programacion.cantidad_estimada_kg && (
                  <p className="text-xs text-success-700 dark:text-success-300 mt-2">
                    Cantidad estimada: {programacion.cantidad_estimada_kg.toLocaleString('es-CO')}{' '}
                    kg
                  </p>
                )}
              </Card>
            )}

            {/* Motivo de Cancelación (solo si CANCELADA) */}
            {mostrarMotivoCancelacion && (
              <Card
                variant="bordered"
                padding="sm"
                className="bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800"
              >
                <div className="flex items-start gap-3 mb-3">
                  <XCircle className="h-5 w-5 text-danger-600 dark:text-danger-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-danger-900 dark:text-danger-100">
                      Cancelar Programación
                    </h4>
                    <p className="text-sm text-danger-800 dark:text-danger-200 mt-1">
                      Debe especificar el motivo de la cancelación
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-danger-900 dark:text-danger-100">
                    Motivo de Cancelación *
                  </label>
                  <textarea
                    {...register('motivo_cancelacion')}
                    rows={3}
                    className="w-full px-3 py-2 border border-danger-300 dark:border-danger-700 rounded-lg focus:ring-2 focus:ring-danger-500 focus:border-transparent dark:bg-danger-900/10 dark:text-gray-100"
                    placeholder="Ej: Proveedor no disponible, material insuficiente..."
                  />
                  {errors.motivo_cancelacion && (
                    <p className="text-sm text-danger-600 dark:text-danger-400">
                      {errors.motivo_cancelacion.message}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Observaciones */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Observaciones adicionales
              </label>
              <textarea
                {...register('observaciones')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="Notas adicionales sobre el cambio de estado..."
              />
              {errors.observaciones && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.observaciones.message}
                </p>
              )}
            </div>
          </>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          {estadosDisponibles.length > 0 && (
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Cambiar Estado'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
