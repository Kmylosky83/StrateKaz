/**
 * Formulario para Crear/Editar Programaciones
 *
 * Características:
 * - Diseño con TABS para organizar información
 * - Selección de ecoaliado por nombre
 * - Selección de tipo: Programada o Inmediata
 * - Validación de fechas según tipo de programación
 * - Solo campos necesarios: tipo, fecha, cantidad, observaciones
 * - Validación con Zod
 */
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Building2, Calendar, MessageSquare, MapPin, Phone } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getFechaColombia, addDaysToDateString } from '@/utils/dateUtils';
import { useEcoaliadosProgramacion } from '../api/useProgramaciones';
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

type TabType = 'ecoaliado' | 'programacion' | 'observaciones';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

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
  const isEditMode = !!programacion;

  // Estado de tabs
  const [activeTab, setActiveTab] = useState<TabType>('ecoaliado');

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
    mode: 'onChange',
  });

  const ecoaliadoSeleccionado = watch('ecoaliado');
  const tipoProgramacion = watch('tipo_programacion');

  // Configuración de tabs
  const tabs: Tab[] = [
    { id: 'ecoaliado', label: 'Ecoaliado', icon: Building2 },
    { id: 'programacion', label: 'Programación', icon: Calendar },
    { id: 'observaciones', label: 'Observaciones', icon: MessageSquare },
  ];

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
      // Resetear tab al inicio
      setActiveTab('ecoaliado');
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
  const hoy = getFechaColombia();
  const mañanaStr = addDaysToDateString(hoy, 1);

  const fechaMinima = tipoProgramacion === 'INMEDIATA' ? hoy : mañanaStr;
  const fechaMaxima = tipoProgramacion === 'INMEDIATA' ? hoy : undefined;

  // Calcular progreso del formulario (solo en modo creación)
  const requiredFieldsCount = 3; // ecoaliado, tipo_programacion, fecha_programada

  const completedFieldsCount = useMemo(() => {
    let count = 0;
    if (watch('ecoaliado')) count++;
    if (watch('tipo_programacion')) count++;
    if (watch('fecha_programada')) count++;
    return count;
  }, [watch('ecoaliado'), watch('tipo_programacion'), watch('fecha_programada')]);

  const progressPercentage = (completedFieldsCount / requiredFieldsCount) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={programacion ? 'Editar Programación' : 'Nueva Programación'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
        {/* BARRA DE PROGRESO - Solo en modo creación */}
        {!isEditMode && (
          <div className="bg-info-50 dark:bg-info-900/20 p-4 rounded-lg border border-info-200 dark:border-info-800 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-info-900 dark:text-info-100">
                Progreso del Formulario
              </span>
              <span className="text-sm font-medium text-info-700 dark:text-info-300">
                {completedFieldsCount} de {requiredFieldsCount} campos requeridos
              </span>
            </div>
            <div className="w-full bg-info-100 dark:bg-info-900/40 rounded-full h-2.5">
              <div
                className="bg-info-600 dark:bg-info-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-1 -mb-px" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* CONTENIDO DE TABS */}
        <div className="mb-6">
          {/* TAB: ECOALIADO */}
          {activeTab === 'ecoaliado' && (
            <div className="space-y-4">
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
                <div className="bg-info-50 dark:bg-info-900/20 p-4 rounded-lg border border-info-200 dark:border-info-800">
                  <h4 className="text-sm font-semibold text-info-900 dark:text-info-100 mb-3">
                    Información del Ecoaliado
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-info-100 dark:bg-info-900/30 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-info-600 dark:text-info-400" />
                      </div>
                      <div>
                        <p className="text-xs text-info-700 dark:text-info-300">Ciudad</p>
                        <p className="text-sm font-medium text-info-900 dark:text-info-100">
                          {ecoaliadoInfo.ciudad}
                        </p>
                      </div>
                    </div>
                    {ecoaliadoInfo.direccion && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-info-100 dark:bg-info-900/30 rounded-lg flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-info-600 dark:text-info-400" />
                        </div>
                        <div>
                          <p className="text-xs text-info-700 dark:text-info-300">Dirección</p>
                          <p className="text-sm font-medium text-info-900 dark:text-info-100">
                            {ecoaliadoInfo.direccion}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-info-100 dark:bg-info-900/30 rounded-lg flex items-center justify-center">
                        <Phone className="h-4 w-4 text-info-600 dark:text-info-400" />
                      </div>
                      <div>
                        <p className="text-xs text-info-700 dark:text-info-300">Teléfono</p>
                        <p className="text-sm font-medium text-info-900 dark:text-info-100">
                          {ecoaliadoInfo.telefono}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PROGRAMACIÓN */}
          {activeTab === 'programacion' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Info sobre tipo de programación */}
              <div
                className={cn(
                  'p-4 rounded-lg border',
                  tipoProgramacion === 'INMEDIATA'
                    ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                )}
              >
                <p
                  className={cn(
                    'text-sm',
                    tipoProgramacion === 'INMEDIATA'
                      ? 'text-warning-800 dark:text-warning-200'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {tipoProgramacion === 'INMEDIATA' ? (
                    <>
                      <strong>Programación Inmediata:</strong> Solo para hoy. Se crea con urgencia
                      para recolección del día actual.
                    </>
                  ) : (
                    <>
                      <strong>Programación Regular:</strong> Para fechas futuras. Permite
                      planificación anticipada de la recolección.
                    </>
                  )}
                </p>
              </div>

              <Input
                type="number"
                label="Cantidad Estimada (kg)"
                {...register('cantidad_estimada_kg')}
                error={errors.cantidad_estimada_kg?.message}
                placeholder="Ej: 500"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* TAB: OBSERVACIONES */}
          {activeTab === 'observaciones' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observaciones
              </label>
              <textarea
                {...register('observaciones_comercial')}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                placeholder="Notas adicionales sobre la programación, instrucciones especiales, o información relevante para el recolector..."
              />
              {errors.observaciones_comercial && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.observaciones_comercial.message}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Estas observaciones serán visibles para el equipo de logística y el recolector
                asignado.
              </p>
            </div>
          )}
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
