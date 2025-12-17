/**
 * Modal para Reprogramar una Recolección
 *
 * Características:
 * - Header con código y badge de estado
 * - Nueva fecha (sin horas)
 * - Motivo de reprogramación obligatorio
 * - Opción de mantener o cambiar recolector
 * - Solo para Líder Logístico
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import {
  X,
  AlertCircle,
  Calendar,
  Building2,
  User,
  FileText,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { getFechaColombia, formatFechaLocal } from '@/utils/dateUtils';
import type { Programacion, ReprogramarDTO } from '../types/programacion.types';

const reprogramarSchema = z.object({
  fecha_reprogramada: z.string().min(1, 'La nueva fecha es requerida'),
  motivo_reprogramacion: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500),
  mantener_recolector: z.boolean().optional(),
});

type ReprogramarFormData = z.infer<typeof reprogramarSchema>;

interface ReprogramarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReprogramarDTO) => void;
  programacion: Programacion | null;
  canReprogramar?: boolean;
  isLoading?: boolean;
}

export const ReprogramarModal = ({
  isOpen,
  onClose,
  onSubmit,
  programacion,
  canReprogramar = false,
  isLoading,
}: ReprogramarModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReprogramarFormData>({
    resolver: zodResolver(reprogramarSchema),
    defaultValues: {
      mantener_recolector: true,
    },
  });

  useEffect(() => {
    if (isOpen && programacion) {
      reset({
        fecha_reprogramada: '',
        motivo_reprogramacion: '',
        mantener_recolector: !!programacion.recolector_asignado,
      });
    }
  }, [isOpen, programacion, reset]);

  const handleFormSubmit = (data: ReprogramarFormData) => {
    const formattedData: ReprogramarDTO = {
      fecha_reprogramada: data.fecha_reprogramada,
      motivo_reprogramacion: data.motivo_reprogramacion,
      mantener_recolector: data.mantener_recolector,
    };

    onSubmit(formattedData);
  };

  if (!isOpen || !programacion) return null;

  // Fecha mínima: hoy (para reprogramación se permite el mismo día)
  const fechaMinimaStr = getFechaColombia();

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

  // Badge variant según estado
  const getEstadoBadgeVariant = (
    estado: string
  ): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray' => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> =
      {
        PROGRAMADA: 'gray',
        CONFIRMADA: 'info',
        EN_RUTA: 'warning',
        COMPLETADA: 'success',
        CANCELADA: 'danger',
        REPROGRAMADA: 'primary',
      };
    return variants[estado] || 'gray';
  };

  // Si no tiene permisos, mostrar mensaje
  if (!canReprogramar) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Reprogramar Recolección
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="px-6 py-5">
              <Card
                variant="bordered"
                padding="sm"
                className="bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-danger-600 dark:text-danger-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-danger-900 dark:text-danger-100">
                      Permisos Insuficientes
                    </h4>
                    <p className="text-sm text-danger-800 dark:text-danger-200 mt-1">
                      Solo el Líder de Logística puede reprogramar recolecciones.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <div className="flex justify-end">
                <Button onClick={onClose}>Cerrar</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                    {programacion.codigo}
                  </span>
                  <Badge variant={getEstadoBadgeVariant(programacion.estado)} size="sm">
                    {programacion.estado_display || programacion.estado}
                  </Badge>
                  {programacion.esta_vencida && (
                    <Badge variant="danger" size="sm">
                      Vencida
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {programacion.ecoaliado_razon_social}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Reprogramar Recolección
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
              {/* Advertencia */}
              <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg border border-warning-200 dark:border-warning-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-warning-900 dark:text-warning-100">
                      Reprogramación de Recolección
                    </h4>
                    <p className="text-sm text-warning-800 dark:text-warning-200 mt-1">
                      La programación actual será actualizada con la nueva fecha. Esta acción
                      quedará registrada en el historial.
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de la Programación Actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField(Building2, 'Ecoaliado', programacion.ecoaliado_razon_social)}
                {renderField(
                  Calendar,
                  'Fecha Original',
                  formatFechaLocal(programacion.fecha_programada, {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })
                )}
                {renderField(User, 'Recolector Asignado', programacion.recolector_asignado_nombre)}
                {renderField(FileText, 'Ciudad', programacion.ecoaliado_ciudad)}
              </div>

              {/* Nueva Fecha */}
              <div className="bg-info-50 dark:bg-info-900/20 p-4 rounded-lg border border-info-200 dark:border-info-800">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-info-600 dark:text-info-400" />
                  <span className="text-sm font-medium text-info-900 dark:text-info-100">
                    Nueva Fecha de Recolección
                  </span>
                </div>
                <Input
                  type="date"
                  {...register('fecha_reprogramada')}
                  error={errors.fecha_reprogramada?.message}
                  min={fechaMinimaStr}
                />
              </div>

              {/* Motivo de Reprogramación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo de Reprogramación *
                </label>
                <textarea
                  {...register('motivo_reprogramacion')}
                  rows={4}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400',
                    'focus:outline-none focus:ring-2',
                    'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
                    errors.motivo_reprogramacion
                      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600'
                  )}
                  placeholder="Explique detalladamente el motivo de la reprogramación (mínimo 10 caracteres)..."
                />
                {errors.motivo_reprogramacion && (
                  <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
                    {errors.motivo_reprogramacion.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ejemplos: Solicitud del ecoaliado, condiciones climáticas, disponibilidad del
                  recolector, falta de material suficiente, etc.
                </p>
              </div>

              {/* Mantener Recolector */}
              {programacion.recolector_asignado && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('mantener_recolector')}
                      className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                        Mantener el mismo recolector
                      </span>
                      <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
                        Si desmarca esta opción, la programación volverá al estado PROGRAMADA y
                        deberá asignar un nuevo recolector.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? 'Reprogramando...' : 'Reprogramar Recolección'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
