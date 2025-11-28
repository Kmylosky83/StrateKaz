/**
 * Modal para Reprogramar una Recolección
 *
 * Características:
 * - Nueva fecha (sin horas)
 * - Motivo de reprogramación obligatorio
 * - Opción de mantener o cambiar recolector
 * - Solo para Líder Logístico
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { AlertCircle } from 'lucide-react';
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

  if (!programacion) return null;

  // Fecha mínima: hoy (para reprogramación se permite el mismo día)
  const hoy = new Date();
  const fechaMinimaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  // Si no tiene permisos, mostrar mensaje
  if (!canReprogramar) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Reprogramar Recolección"
      >
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-100">Permisos Insuficientes</h4>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                Solo el Líder de Logística puede reprogramar recolecciones.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reprogramar Recolección"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Advertencia */}
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900 dark:text-orange-100">
                Reprogramación de Recolección
              </h4>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                La programación actual será marcada como reprogramada y se actualizará con la nueva
                fecha. Esta acción quedará registrada en el historial.
              </p>
            </div>
          </div>
        </div>

        {/* Información de la Programación Actual */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Programación Actual
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Código:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.codigo}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ecoaliado:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.ecoaliado_razon_social}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Fecha original:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {new Date(programacion.fecha_programada).toLocaleDateString('es-CO', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
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
        </div>

        {/* Nueva Fecha */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
            Nueva Fecha
          </h3>

          <Input
            type="date"
            label="Nueva Fecha *"
            {...register('fecha_reprogramada')}
            error={errors.fecha_reprogramada?.message}
            min={fechaMinimaStr}
          />
        </div>

        {/* Motivo de Reprogramación */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Motivo de Reprogramación *
          </label>
          <textarea
            {...register('motivo_reprogramacion')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            placeholder="Explique detalladamente el motivo de la reprogramación (mínimo 10 caracteres)..."
          />
          {errors.motivo_reprogramacion && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.motivo_reprogramacion.message}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ejemplos: Solicitud del ecoaliado, condiciones climáticas, disponibilidad del
            recolector, falta de material suficiente, etc.
          </p>
        </div>

        {/* Mantener Recolector */}
        {programacion.recolector_asignado && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('mantener_recolector')}
                className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Mantener el mismo recolector
                </span>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Si desmarca esta opción, la programación volverá al estado PROGRAMADA y deberá
                  asignar un nuevo recolector.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Reprogramando...' : 'Reprogramar Recolección'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
