/**
 * Modal para Asignar Recolector a una Programación
 *
 * Características:
 * - Selección de recolector activo
 * - Detección de fecha vencida con reprogramación obligatoria
 * - Observaciones sobre la asignación
 */
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/forms/Select';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getFechaColombia, formatFechaLocal, isFechaPasada } from '@/utils/dateUtils';
import { useRecolectores } from '../api/useProgramaciones';
import type { Programacion, AsignarRecolectorDTO } from '../types/programacion.types';

// Schema dinámico basado en si la fecha está vencida
const createAsignarRecolectorSchema = (fechaVencida: boolean) =>
  z.object({
    recolector_asignado: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === 'string' ? parseInt(val) : val))
      .refine((val) => !isNaN(val) && val > 0, 'Debe seleccionar un recolector'),
    nueva_fecha: fechaVencida
      ? z.string().min(1, 'Debe seleccionar una nueva fecha de recolección')
      : z.string().optional(),
    observaciones_logistica: z.string().max(500).optional().or(z.literal('')),
  });

type AsignarRecolectorFormData = {
  recolector_asignado: string | number;
  nueva_fecha?: string;
  observaciones_logistica?: string;
};

interface AsignarRecolectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AsignarRecolectorDTO) => void;
  programacion: Programacion | null;
  isLoading?: boolean;
}

export const AsignarRecolectorModal = ({
  isOpen,
  onClose,
  onSubmit,
  programacion,
  isLoading,
}: AsignarRecolectorModalProps) => {
  const { data: recolectoresData, isLoading: isLoadingRecolectores } = useRecolectores();

  // Detectar si la fecha está vencida (usando utilidad que respeta timezone Colombia)
  const fechaVencida = useMemo(() => {
    if (!programacion) return false;
    return isFechaPasada(programacion.fecha_programada);
  }, [programacion]);

  // Fecha mínima para nueva fecha (hoy en Colombia)
  const fechaMinima = useMemo(() => {
    return getFechaColombia();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AsignarRecolectorFormData>({
    resolver: zodResolver(createAsignarRecolectorSchema(fechaVencida)),
  });

  const recolectorSeleccionado = watch('recolector_asignado');

  useEffect(() => {
    if (isOpen && programacion) {
      reset({
        recolector_asignado: programacion.recolector_asignado
          ? String(programacion.recolector_asignado)
          : '',
        nueva_fecha: '',
        observaciones_logistica: '',
      });
    }
  }, [isOpen, programacion, reset]);

  const handleFormSubmit = (data: AsignarRecolectorFormData) => {
    const recolectorId =
      typeof data.recolector_asignado === 'string'
        ? parseInt(data.recolector_asignado)
        : data.recolector_asignado;

    const formattedData: AsignarRecolectorDTO = {
      recolector_asignado: recolectorId,
      observaciones_logistica: data.observaciones_logistica || undefined,
    };

    // Solo incluir nueva_fecha si está vencida y tiene valor
    if (fechaVencida && data.nueva_fecha) {
      formattedData.nueva_fecha = data.nueva_fecha;
    }

    onSubmit(formattedData);
  };

  const recolectorInfo = recolectoresData?.results.find(
    (r) => r.id === parseInt(String(recolectorSeleccionado || '0'))
  );

  const recolectoresOptions =
    recolectoresData?.results
      .filter((r) => r.is_active)
      .map((recolector) => ({
        value: recolector.id,
        label: `${recolector.full_name || `${recolector.first_name} ${recolector.last_name}`}${
          recolector.zona_asignada ? ` - ${recolector.zona_asignada}` : ''
        }`,
      })) || [];

  if (!programacion) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar Recolector">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Alerta de fecha vencida */}
        {fechaVencida && (
          <Card
            variant="bordered"
            padding="sm"
            className="bg-warning-50 dark:bg-warning-900/20 border-warning-300 dark:border-warning-700"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-warning-800 dark:text-warning-200">
                  Fecha de recolección vencida
                </h4>
                <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
                  La fecha programada ({' '}
                  {formatFechaLocal(programacion.fecha_programada, {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })}
                  ) ya pasó. Debe seleccionar una nueva fecha para continuar.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Información de la Programación */}
        <Card variant="bordered" padding="sm">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Programación
          </h4>
          <div className="space-y-2 text-sm">
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
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ciudad:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.ecoaliado_ciudad}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Fecha original:</span>
              <span
                className={cn(
                  'font-medium',
                  fechaVencida
                    ? 'text-danger-600 dark:text-danger-400 line-through'
                    : 'text-gray-900 dark:text-gray-100'
                )}
              >
                {formatFechaLocal(programacion.fecha_programada, {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </Card>

        {/* Nueva fecha (solo si está vencida) */}
        {fechaVencida && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nueva fecha de recolección <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('nueva_fecha')}
              min={fechaMinima}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            />
            {errors.nueva_fecha && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.nueva_fecha.message}</p>
            )}
          </div>
        )}

        {/* Selección de Recolector */}
        <div className="space-y-4">
          <Select
            label="Recolector *"
            {...register('recolector_asignado')}
            error={errors.recolector_asignado?.message}
            options={[{ value: '', label: 'Seleccionar recolector' }, ...recolectoresOptions]}
            disabled={isLoadingRecolectores}
          />

          {recolectorInfo && (
            <Card
              variant="bordered"
              padding="sm"
              className="bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800"
            >
              <div className="space-y-2 text-sm">
                {recolectorInfo.email && (
                  <div>
                    <span className="text-xs text-info-700 dark:text-info-300">Email:</span>
                    <p className="font-medium text-info-900 dark:text-info-100">
                      {recolectorInfo.email}
                    </p>
                  </div>
                )}
                {(recolectorInfo.phone || recolectorInfo.telefono) && (
                  <div>
                    <span className="text-xs text-info-700 dark:text-info-300">Teléfono:</span>
                    <p className="font-medium text-info-900 dark:text-info-100">
                      {recolectorInfo.phone || recolectorInfo.telefono}
                    </p>
                  </div>
                )}
                {recolectorInfo.zona_asignada && (
                  <div>
                    <span className="text-xs text-info-700 dark:text-info-300">Zona:</span>
                    <p className="font-medium text-info-900 dark:text-info-100">
                      {recolectorInfo.zona_asignada}
                    </p>
                  </div>
                )}
                {recolectorInfo.vehiculos_asignados &&
                  recolectorInfo.vehiculos_asignados.length > 0 && (
                    <div>
                      <span className="text-xs text-info-700 dark:text-info-300">
                        Vehículos disponibles:
                      </span>
                      <p className="font-medium text-info-900 dark:text-info-100">
                        {recolectorInfo.vehiculos_asignados.join(', ')}
                      </p>
                    </div>
                  )}
              </div>
            </Card>
          )}
        </div>

        {/* Observaciones de Logística */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Observaciones de Logística
          </label>
          <textarea
            {...register('observaciones_logistica')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            placeholder="Notas adicionales sobre la asignación..."
          />
          {errors.observaciones_logistica && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.observaciones_logistica.message}
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading
              ? 'Asignando...'
              : fechaVencida
                ? 'Reprogramar y Asignar'
                : 'Asignar Recolector'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
