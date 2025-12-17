/**
 * Formulario para Crear/Editar Ecoaliados
 *
 * Características:
 * - Validación con Zod
 * - Captura de geolocalización GPS opcional
 * - Auto-asignación de comercial si es el usuario actual
 * - Soporte para crear y editar
 * - Diseño con TABS para organizar información
 */
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { GeolocationButton } from './GeolocationButton';
import { useUnidadesNegocio, useComerciales } from '../api/useEcoaliados';
import { FileText, MapPin, Navigation, DollarSign, FileEdit } from 'lucide-react';
import { cn } from '@/utils/cn';
import type {
  Ecoaliado,
  CreateEcoaliadoDTO,
  UpdateEcoaliadoDTO,
  TipoDocumento,
  GeolocationCoordinates,
} from '../types/ecoaliado.types';

const ecoaliadoSchema = z.object({
  razon_social: z
    .string()
    .min(3, 'La razón social debe tener al menos 3 caracteres')
    .max(255),
  documento_tipo: z.enum(['CC', 'CE', 'NIT', 'PASAPORTE'], {
    errorMap: () => ({ message: 'Seleccione un tipo de documento válido' }),
  }),
  documento_numero: z
    .string()
    .min(5, 'El número de documento debe tener al menos 5 caracteres')
    .max(50),
  unidad_negocio: z
    .string()
    .min(1, 'Debe seleccionar una unidad de negocio')
    .transform((val) => parseInt(val)),
  telefono: z.string().min(7, 'El teléfono debe tener al menos 7 caracteres').max(20),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(255),
  ciudad: z.string().min(2, 'La ciudad es requerida').max(100),
  departamento: z.string().min(2, 'El departamento es requerido').max(100),
  precio_compra_kg: z
    .string()
    .min(1, 'El precio es requerido')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Debe ser un número válido mayor o igual a 0',
    }),
  comercial_asignado: z
    .string()
    .min(1, 'Debe asignar un comercial')
    .transform((val) => parseInt(val)),
  observaciones: z.string().max(500).optional().or(z.literal('')),
});

type EcoaliadoFormData = z.infer<typeof ecoaliadoSchema>;

type TabType = 'basica' | 'ubicacion' | 'geolocalizacion' | 'comercial' | 'observaciones';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

interface EcoaliadoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEcoaliadoDTO | UpdateEcoaliadoDTO) => void;
  ecoaliado?: Ecoaliado | null;
  currentUserId?: number;
  isComercial?: boolean;
  isLoading?: boolean;
}

export const EcoaliadoForm = ({
  isOpen,
  onClose,
  onSubmit,
  ecoaliado,
  currentUserId,
  isComercial = false,
  isLoading,
}: EcoaliadoFormProps) => {
  const isEditMode = !!ecoaliado;

  // Estado de tabs
  const [activeTab, setActiveTab] = useState<TabType>('basica');

  // Estado de geolocalización
  const [geoCoords, setGeoCoords] = useState<{
    latitude?: number | null;
    longitude?: number | null;
  }>({
    latitude: null,
    longitude: null,
  });

  // Hooks de datos
  const { data: unidadesData, isLoading: isLoadingUnidades } = useUnidadesNegocio();
  const { data: comercialesData, isLoading: isLoadingComerciales } = useComerciales();

  // Configuración de formulario
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EcoaliadoFormData>({
    resolver: zodResolver(ecoaliadoSchema),
    mode: 'onChange',
  });

  // Configuración de tabs
  const tabs: Tab[] = [
    { id: 'basica', label: 'Información Básica', icon: FileText },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
    { id: 'geolocalizacion', label: 'GPS', icon: Navigation },
    { id: 'comercial', label: 'Comercial', icon: DollarSign },
    { id: 'observaciones', label: 'Observaciones', icon: FileEdit },
  ];

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (ecoaliado) {
        // Modo edición
        reset({
          razon_social: ecoaliado.razon_social,
          documento_tipo: ecoaliado.documento_tipo,
          documento_numero: ecoaliado.documento_numero,
          unidad_negocio: String(ecoaliado.unidad_negocio),
          telefono: ecoaliado.telefono,
          email: ecoaliado.email || '',
          direccion: ecoaliado.direccion,
          ciudad: ecoaliado.ciudad,
          departamento: ecoaliado.departamento,
          precio_compra_kg: ecoaliado.precio_compra_kg,
          comercial_asignado: String(ecoaliado.comercial_asignado),
          observaciones: ecoaliado.observaciones || '',
        });
        setGeoCoords({
          latitude: ecoaliado.latitud,
          longitude: ecoaliado.longitud,
        });
      } else {
        // Modo creación
        const defaultValues: any = {};
        // Auto-asignar comercial si es el usuario actual
        if (isComercial && currentUserId) {
          defaultValues.comercial_asignado = String(currentUserId);
        }
        reset(defaultValues);
        setGeoCoords({ latitude: null, longitude: null });
      }
      // Resetear tab al inicio
      setActiveTab('basica');
    }
  }, [isOpen, ecoaliado, reset, isComercial, currentUserId]);

  const handleGeoCoordsCapture = (coords: GeolocationCoordinates) => {
    setGeoCoords({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  };

  const handleFormSubmit = (data: EcoaliadoFormData) => {
    const payload: CreateEcoaliadoDTO | UpdateEcoaliadoDTO = {
      razon_social: data.razon_social,
      documento_tipo: data.documento_tipo as TipoDocumento,
      documento_numero: data.documento_numero,
      unidad_negocio: data.unidad_negocio,
      telefono: data.telefono,
      email: data.email || undefined,
      direccion: data.direccion,
      ciudad: data.ciudad,
      departamento: data.departamento,
      latitud: geoCoords.latitude || null,
      longitud: geoCoords.longitude || null,
      precio_compra_kg: data.precio_compra_kg,
      comercial_asignado: data.comercial_asignado,
      observaciones: data.observaciones || undefined,
    };

    onSubmit(payload);
  };

  // Opciones para selects
  const tiposDocumento = [
    { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
    { value: 'CE', label: 'Cédula de Extranjería (CE)' },
    { value: 'NIT', label: 'NIT' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
  ];

  const unidadesOptions =
    unidadesData?.results.map((unidad) => ({
      value: unidad.id,
      label: unidad.nombre_comercial,
    })) || [];

  // Si es comercial, solo mostrar el usuario actual en el dropdown
  const comercialesOptions = isComercial && currentUserId
    ? comercialesData?.filter((c: any) => c.id === currentUserId).map((comercial: any) => ({
        value: comercial.id,
        label: `${comercial.nombre_completo} (${comercial.cargo})`,
      })) || []
    : comercialesData?.map((comercial: any) => ({
        value: comercial.id,
        label: `${comercial.nombre_completo} (${comercial.cargo})`,
      })) || [];

  // Calcular progreso del formulario (solo en modo creación)
  const requiredFieldsCount = 9; // razon_social, documento_tipo, documento_numero, unidad_negocio, telefono, direccion, ciudad, departamento, precio_compra_kg, comercial_asignado

  const completedFieldsCount = useMemo(() => {
    let count = 0;
    if (watch('razon_social')?.trim()) count++;
    if (watch('documento_tipo')) count++;
    if (watch('documento_numero')?.trim()) count++;
    if (watch('unidad_negocio')) count++;
    if (watch('telefono')?.trim()) count++;
    if (watch('direccion')?.trim()) count++;
    if (watch('ciudad')?.trim()) count++;
    if (watch('departamento')?.trim()) count++;
    if (watch('precio_compra_kg')) count++;
    if (watch('comercial_asignado')) count++;
    return count;
  }, [watch]);

  const progressPercentage = (completedFieldsCount / requiredFieldsCount) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ecoaliado ? 'Editar Ecoaliado' : 'Nuevo Ecoaliado'}
      size="3xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
        {/* BARRA DE PROGRESO - Solo en modo creación */}
        {!isEditMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Progreso del Formulario
              </span>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {completedFieldsCount} de {requiredFieldsCount} campos completados
              </span>
            </div>
            <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2.5">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
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
          {/* TAB: INFORMACIÓN BÁSICA */}
          {activeTab === 'basica' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Razón Social *"
                    {...register('razon_social')}
                    error={errors.razon_social?.message}
                    placeholder="Nombre completo del ecoaliado"
                  />
                </div>

                <Select
                  label="Tipo de Documento *"
                  {...register('documento_tipo')}
                  options={tiposDocumento}
                  error={errors.documento_tipo?.message}
                  placeholder="Seleccione tipo"
                  disabled={!!ecoaliado} // No editable en modo edición
                />

                <Input
                  label="Número de Documento *"
                  {...register('documento_numero')}
                  error={errors.documento_numero?.message}
                  placeholder="Ej: 123456789"
                  disabled={!!ecoaliado} // No editable en modo edición
                />
              </div>
            </div>
          )}

          {/* TAB: UBICACIÓN */}
          {activeTab === 'ubicacion' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Unidad Interna *"
                  {...register('unidad_negocio')}
                  options={unidadesOptions}
                  error={errors.unidad_negocio?.message}
                  placeholder="Seleccione unidad"
                  disabled={!!ecoaliado || isLoadingUnidades}
                />

                <Input
                  label="Teléfono *"
                  {...register('telefono')}
                  error={errors.telefono?.message}
                  placeholder="3001234567"
                  type="tel"
                />

                <Input
                  label="Email"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="correo@ejemplo.com"
                  type="email"
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección *
                  </label>
                  <textarea
                    {...register('direccion')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Dirección completa del ecoaliado"
                  />
                  {errors.direccion && (
                    <p className="mt-1 text-sm text-red-600">{errors.direccion.message}</p>
                  )}
                </div>

                <Input
                  label="Ciudad *"
                  {...register('ciudad')}
                  error={errors.ciudad?.message}
                  placeholder="Ej: Bogotá"
                />

                <Input
                  label="Departamento *"
                  {...register('departamento')}
                  error={errors.departamento?.message}
                  placeholder="Ej: Cundinamarca"
                />
              </div>
            </div>
          )}

          {/* TAB: GEOLOCALIZACIÓN */}
          {activeTab === 'geolocalizacion' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 p-6 rounded-lg border-2 border-primary-200 dark:border-primary-700">
                <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100 mb-2">
                  Geolocalización GPS (Opcional)
                </h3>
                <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
                  Capture la ubicación exacta del ecoaliado utilizando el GPS del dispositivo.
                  Esta información es útil para optimizar las rutas de recolección.
                </p>
                <GeolocationButton
                  onCoordsCapture={handleGeoCoordsCapture}
                  currentCoords={geoCoords}
                />
              </div>
            </div>
          )}

          {/* TAB: COMERCIAL */}
          {activeTab === 'comercial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Precio de Compra ($/kg) *"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('precio_compra_kg')}
                  error={errors.precio_compra_kg?.message}
                  placeholder="0.00"
                  disabled={!!ecoaliado} // No editable en modo edición (usar CambiarPrecio)
                  helperText={
                    ecoaliado
                      ? 'Use el botón "Cambiar Precio" para modificar el precio'
                      : undefined
                  }
                />

                <Select
                  label="Comercial Asignado *"
                  {...register('comercial_asignado')}
                  options={comercialesOptions}
                  error={errors.comercial_asignado?.message}
                  placeholder="Seleccione comercial"
                  disabled={isComercial || isLoadingComerciales} // Auto-asignado si es comercial o cargando
                />
              </div>
            </div>
          )}

          {/* TAB: OBSERVACIONES */}
          {activeTab === 'observaciones' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observaciones
              </label>
              <textarea
                {...register('observaciones')}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                placeholder="Notas adicionales sobre el ecoaliado..."
              />
              {errors.observaciones && (
                <p className="mt-1 text-sm text-red-600">{errors.observaciones.message}</p>
              )}
            </div>
          )}
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading
              ? 'Guardando...'
              : ecoaliado
              ? 'Actualizar Ecoaliado'
              : 'Crear Ecoaliado'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
