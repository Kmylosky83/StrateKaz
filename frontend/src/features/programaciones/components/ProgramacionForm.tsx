/**
 * Formulario para Crear/Editar Programaciones
 *
 * Características:
 * - Selección de ecoaliado por nombre
 * - Selección de tipo: Programada o Inmediata
 * - Validación de fechas según tipo de programación
 * - Solo campos necesarios: tipo, fecha, cantidad, observaciones
 * - Validación con Zod
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import {
  useEcoaliadosProgramacion,
} from '../api/useProgramaciones';
import type {
  Programacion,
  CreateProgramacionDTO,
  UpdateProgramacionDTO,
} from '../types/programacion.types';

const programacionSchema = z.object({
  ecoaliado: z
    .string()
    .min(1, 'Debe seleccionar un ecoaliado')
    .transform((val) => parseInt(val)),
  tipo_programacion: z.enum(['PROGRAMADA', 'INMEDIATA'], {
    errorMap: () => ({ message: 'Seleccione el tipo de programación' }),
  }),
  fecha_programada: z.string().min(1, 'La fecha es requerida'),
  cantidad_estimada_kg: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val && val !== '' ? parseFloat(val) : undefined)),
  observaciones_comercial: z.string().max(500).optional().or(z.literal('')),
});

type ProgramacionFormData = z.infer<typeof programacionSchema>;

interface ProgramacionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProgramacionDTO | UpdateProgramacionDTO) => void;
  programacion?: Programacion | null;
  isLoading?: boolean;
}

export const ProgramacionForm = ({
  isOpen,
  onClose,
  onSubmit,
  programacion,
  isLoading,
}: ProgramacionFormProps) => {
  // Buscar en todos los ecoaliados (sin filtro de unidad)
  const { data: ecoaliadosData, isLoading: isLoadingEcoaliados } =
    useEcoaliadosProgramacion();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProgramacionFormData>({
    resolver: zodResolver(programacionSchema),
    defaultValues: {
      tipo_programacion: 'PROGRAMADA',
    },
  });

  const ecoaliadoSeleccionado = watch('ecoaliado');
  const tipoProgramacion = watch('tipo_programacion');

  // Reset form cuando se abre/cierra o cambia la programación
  useEffect(() => {
    if (isOpen) {
      if (programacion) {
        // Modo edición
        reset({
          ecoaliado: String(programacion.ecoaliado),
          tipo_programacion: programacion.tipo_programacion,
          fecha_programada: programacion.fecha_programada,
          cantidad_estimada_kg: programacion.cantidad_estimada_kg
            ? String(programacion.cantidad_estimada_kg)
            : '',
          observaciones_comercial: programacion.observaciones_comercial || '',
        });
      } else {
        // Modo creación
        reset({
          ecoaliado: '',
          tipo_programacion: 'PROGRAMADA',
          fecha_programada: '',
          cantidad_estimada_kg: '',
          observaciones_comercial: '',
        });
      }
    }
  }, [isOpen, programacion, reset]);

  const handleFormSubmit = (data: ProgramacionFormData) => {
    const formattedData = {
      ...data,
      observaciones_comercial: data.observaciones_comercial || undefined,
    };

    onSubmit(formattedData as CreateProgramacionDTO | UpdateProgramacionDTO);
  };

  const ecoaliadoInfo = ecoaliadosData?.results.find(
    (e) => e.id === Number(ecoaliadoSeleccionado)
  );

  // Opciones de ecoaliados (solo nombre)
  const ecoaliadosOptions =
    ecoaliadosData?.results.map((ecoaliado) => ({
      value: ecoaliado.id,
      label: ecoaliado.razon_social,
    })) || [];

  // Calcular fechas mínima y máxima según tipo de programación (zona horaria Bogotá)
  const now = new Date();
  const bogotaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const hoy = bogotaTime.toISOString().split('T')[0];

  const manana = new Date(bogotaTime);
  manana.setDate(manana.getDate() + 1);
  const mañanaStr = manana.toISOString().split('T')[0];

  const fechaMinima = tipoProgramacion === 'INMEDIATA' ? hoy : mañanaStr;
  const fechaMaxima = tipoProgramacion === 'INMEDIATA' ? hoy : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={programacion ? 'Editar Programación' : 'Nueva Programación'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* SECCIÓN 1: Información del Ecoaliado */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
            Información del Ecoaliado
          </h3>

          {/* Selector de Ecoaliado */}
          <Select
            label="Ecoaliado *"
            {...register('ecoaliado')}
            error={errors.ecoaliado?.message}
            options={[
              { value: '', label: 'Seleccionar ecoaliado' },
              ...ecoaliadosOptions,
            ]}
            disabled={isLoadingEcoaliados || !!programacion}
          />

          {/* Información del Ecoaliado Seleccionado */}
          {ecoaliadoInfo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <span className="text-xs text-blue-700 dark:text-blue-300">Ciudad:</span>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {ecoaliadoInfo.ciudad}
                  </p>
                </div>
                {ecoaliadoInfo.direccion && (
                  <div>
                    <span className="text-xs text-blue-700 dark:text-blue-300">Dirección:</span>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {ecoaliadoInfo.direccion}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-blue-700 dark:text-blue-300">Teléfono:</span>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {ecoaliadoInfo.telefono}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECCIÓN 2: Detalles de la Programación */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
            Detalles de la Programación
          </h3>

          <Select
            label="Tipo de Programación *"
            {...register('tipo_programacion')}
            error={errors.tipo_programacion?.message}
            options={[
              { value: 'PROGRAMADA', label: 'Programada' },
              { value: 'INMEDIATA', label: 'Inmediata' },
            ]}
          />

          <Input
            type="date"
            label="Fecha Programada *"
            {...register('fecha_programada')}
            error={errors.fecha_programada?.message}
            min={fechaMinima}
            max={fechaMaxima}
          />

          <Input
            type="number"
            label="Cantidad Estimada (kg)"
            {...register('cantidad_estimada_kg')}
            error={errors.cantidad_estimada_kg?.message}
            placeholder="Ej: 500"
            min="0"
            step="0.01"
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Observaciones
            </label>
            <textarea
              {...register('observaciones_comercial')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              placeholder="Notas adicionales sobre la programación..."
            />
            {errors.observaciones_comercial && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.observaciones_comercial.message}
              </p>
            )}
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : programacion ? 'Actualizar' : 'Crear Programación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
