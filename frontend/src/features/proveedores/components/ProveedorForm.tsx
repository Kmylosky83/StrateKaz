import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { MateriasPrimasSelector } from '@/components/proveedores/MateriasPrimasSelector';
import { AlertCircle, CheckCircle2, FileText, MapPin, CreditCard, FileEdit, Layers } from 'lucide-react';
import { cn } from '@/utils/cn';
import type {
  Proveedor,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  TipoProveedor,
  CodigoMateriaPrima,
} from '@/types/proveedores.types';

// Schema de validación base
const baseSchema = {
  nombre_comercial: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  razon_social: z.string().min(2, 'Mínimo 2 caracteres').max(200),
  tipo_documento: z.enum(['CC', 'CE', 'NIT', 'PASSPORT']),
  numero_documento: z.string().min(6, 'Mínimo 6 dígitos').max(15),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().min(5, 'Mínimo 5 caracteres'),
  ciudad: z.string().min(2, 'Mínimo 2 caracteres'),
  departamento: z.string().min(2, 'Mínimo 2 caracteres'),
  banco: z.string().optional(),
  tipo_cuenta: z.string().optional(),
  numero_cuenta: z.string().optional(),
  titular_cuenta: z.string().optional(),
  observaciones: z.string().optional(),
  formas_pago: z.array(z.string()).optional().default([]),
};

// Códigos válidos de materia prima (18 tipos específicos)
const CODIGOS_MATERIA_PRIMA_VALIDOS = [
  'HUESO_CRUDO', 'HUESO_SECO', 'HUESO_CALCINADO', 'HUESO_CENIZA',
  'SEBO_CRUDO_CARNICERIA', 'SEBO_CRUDO_MATADERO', 'SEBO_CUERO', 'SEBO_CUERO_VIRIL', 'SEBO_POLLO',
  'SEBO_PROCESADO_A', 'SEBO_PROCESADO_B', 'SEBO_PROCESADO_B1', 'SEBO_PROCESADO_B2', 'SEBO_PROCESADO_B4', 'SEBO_PROCESADO_C',
  'CHICHARRON', 'CABEZAS', 'ACU',
] as const;

// Schema para crear proveedor
const createProveedorSchema = z.object({
  tipo_proveedor: z.enum(['MATERIA_PRIMA_EXTERNO', 'UNIDAD_NEGOCIO', 'PRODUCTO_SERVICIO']),
  subtipo_materia: z.array(z.enum(CODIGOS_MATERIA_PRIMA_VALIDOS)).optional().default([]),
  modalidad_logistica: z.enum(['ENTREGA_PLANTA', 'COMPRA_EN_PUNTO']).optional().nullable(),
  ...baseSchema,
  nit: z.string().optional(),
  unidad_negocio: z.number().optional().nullable(),
  precios: z.record(z.string()).optional(),
  categoria_producto_servicio: z.enum(['PRODUCTO', 'SERVICIO']).optional().nullable(),
  descripcion_productos_servicios: z.string().optional(),
}).refine(
  (data) => {
    if (
      (data.tipo_proveedor === 'MATERIA_PRIMA_EXTERNO' || data.tipo_proveedor === 'UNIDAD_NEGOCIO') &&
      (!data.subtipo_materia || data.subtipo_materia.length === 0)
    ) {
      return false;
    }
    return true;
  },
  { message: 'Debe seleccionar al menos una materia prima', path: ['subtipo_materia'] }
).refine(
  (data) => {
    if (data.tipo_proveedor === 'MATERIA_PRIMA_EXTERNO' && !data.modalidad_logistica) {
      return false;
    }
    return true;
  },
  { message: 'La modalidad logística es obligatoria', path: ['modalidad_logistica'] }
).refine(
  (data) => {
    if (data.tipo_proveedor === 'PRODUCTO_SERVICIO' && !data.categoria_producto_servicio) {
      return false;
    }
    return true;
  },
  { message: 'La categoría es obligatoria para productos/servicios', path: ['categoria_producto_servicio'] }
).refine(
  (data) => {
    if (data.tipo_proveedor === 'PRODUCTO_SERVICIO' && !data.descripcion_productos_servicios) {
      return false;
    }
    return true;
  },
  { message: 'La descripción de productos/servicios es obligatoria', path: ['descripcion_productos_servicios'] }
).refine(
  (data) => {
    if (data.tipo_documento === 'NIT') {
      const nitClean = data.numero_documento.replace(/[-.\s]/g, '');
      if (!/^\d{9,10}$/.test(nitClean)) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'Formato de NIT inválido (debe ser 9-10 dígitos)',
    path: ['numero_documento'],
  }
);

// Schema para actualizar proveedor (sin campos readonly)
const updateProveedorSchema = z.object({
  ...baseSchema,
});

type CreateProveedorFormData = z.infer<typeof createProveedorSchema>;
type UpdateProveedorFormData = z.infer<typeof updateProveedorSchema>;

type TabType = 'clasificacion' | 'basica' | 'ubicacion' | 'financiero' | 'observaciones';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

interface ProveedorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProveedorDTO | UpdateProveedorDTO) => void;
  proveedor?: Proveedor;
  isLoading?: boolean;
  tipoProveedorForzado?: TipoProveedor;
}

export const ProveedorForm = ({
  isOpen,
  onClose,
  onSubmit,
  proveedor,
  isLoading,
  tipoProveedorForzado,
}: ProveedorFormProps) => {
  const isEditMode = !!proveedor;
  const schema = isEditMode ? updateProveedorSchema : createProveedorSchema;

  // Determinar tab inicial: en edición, empezar en "basica", en creación, en "clasificacion"
  const [activeTab, setActiveTab] = useState<TabType>(isEditMode ? 'basica' : 'clasificacion');

  // FIX: Determinar el tipo de proveedor efectivo ANTES de crear defaultValues
  const tipoProveedorEfectivo = tipoProveedorForzado || proveedor?.tipo_proveedor;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateProveedorFormData | UpdateProveedorFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: isEditMode
      ? {
          nombre_comercial: proveedor?.nombre_comercial || '',
          razon_social: proveedor?.razon_social || '',
          tipo_documento: proveedor?.tipo_documento || 'NIT',
          numero_documento: proveedor?.numero_documento || '',
          telefono: proveedor?.telefono || '',
          email: proveedor?.email || '',
          direccion: proveedor?.direccion || '',
          ciudad: proveedor?.ciudad || '',
          departamento: proveedor?.departamento || '',
          banco: proveedor?.banco || '',
          tipo_cuenta: proveedor?.tipo_cuenta || '',
          numero_cuenta: proveedor?.numero_cuenta || '',
          titular_cuenta: proveedor?.titular_cuenta || '',
          observaciones: proveedor?.observaciones || '',
          formas_pago: proveedor?.formas_pago || [],
        }
      : {
          tipo_documento: 'NIT',
          tipo_proveedor: tipoProveedorEfectivo as any,
          subtipo_materia: [],
          formas_pago: [],
          modalidad_logistica: 'ENTREGA_PLANTA',
          nombre_comercial: '',
          razon_social: '',
          numero_documento: '',
          direccion: '',
          ciudad: '',
          departamento: '',
        },
  });

  // Watch valores para renderizado condicional
  const watchedTipoProveedor = watch('tipo_proveedor' as any) as TipoProveedor | undefined;
  const tipoProveedor = tipoProveedorForzado || watchedTipoProveedor;
  const watchTipoDocumento = watch('tipo_documento');
  const watchSubtipoMateria = watch('subtipo_materia' as any);
  const watchFormasPago = watch('formas_pago');

  // Determinar qué campos mostrar
  const showSubtipoMateria = useMemo(() => {
    return (
      !isEditMode &&
      (tipoProveedor === 'MATERIA_PRIMA_EXTERNO' || tipoProveedor === 'UNIDAD_NEGOCIO')
    );
  }, [isEditMode, tipoProveedor]);

  const showModalidadLogistica = useMemo(() => {
    return !isEditMode && tipoProveedor === 'MATERIA_PRIMA_EXTERNO';
  }, [isEditMode, tipoProveedor]);

  const showPrecioCompra = useMemo(() => {
    return (
      tipoProveedor === 'MATERIA_PRIMA_EXTERNO' || tipoProveedor === 'UNIDAD_NEGOCIO'
    );
  }, [tipoProveedor]);

  const showProductoServicioFields = useMemo(() => {
    return !isEditMode && tipoProveedor === 'PRODUCTO_SERVICIO';
  }, [isEditMode, tipoProveedor]);

  const showTipoProveedorSelector = !tipoProveedorForzado && !isEditMode;

  // Configurar tabs dinámicamente
  const allTabs: Tab[] = [
    { id: 'clasificacion', label: 'Clasificación', icon: Layers },
    { id: 'basica', label: 'Información Básica', icon: FileText },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
    { id: 'financiero', label: 'Financiero', icon: CreditCard },
    { id: 'observaciones', label: 'Observaciones', icon: FileEdit },
  ];

  // Filtrar tabs según modo
  const tabs = useMemo(() => {
    if (isEditMode) {
      // En modo edición, ocultar el tab "clasificacion"
      return allTabs.filter((tab) => tab.id !== 'clasificacion');
    }
    return allTabs;
  }, [isEditMode]);

  // Si hay tipo forzado, establecerlo en el formulario
  useEffect(() => {
    if (tipoProveedorForzado && !isEditMode) {
      setValue('tipo_proveedor' as any, tipoProveedorForzado);
    }
  }, [tipoProveedorForzado, isEditMode, setValue]);

  useEffect(() => {
    if (isOpen && proveedor) {
      setValue('nombre_comercial', proveedor.nombre_comercial);
      setValue('razon_social', proveedor.razon_social);
      setValue('tipo_documento', proveedor.tipo_documento);
      setValue('numero_documento', proveedor.numero_documento);
      setValue('telefono', proveedor.telefono || '');
      setValue('email', proveedor.email || '');
      setValue('direccion', proveedor.direccion);
      setValue('ciudad', proveedor.ciudad);
      setValue('departamento', proveedor.departamento);
      setValue('banco', proveedor.banco || '');
      setValue('tipo_cuenta', proveedor.tipo_cuenta || '');
      setValue('numero_cuenta', proveedor.numero_cuenta || '');
      setValue('titular_cuenta', proveedor.titular_cuenta || '');
      setValue('observaciones', proveedor.observaciones || '');
      setValue('formas_pago', proveedor.formas_pago || []);
    } else if (isOpen && !proveedor) {
      reset({
        tipo_documento: 'NIT',
        tipo_proveedor: tipoProveedorForzado as any,
        subtipo_materia: [],
        formas_pago: [],
        modalidad_logistica: 'ENTREGA_PLANTA',
      });
    }
  }, [isOpen, proveedor, tipoProveedorForzado, setValue, reset]);

  // Resetear tab cuando el modal se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setActiveTab(isEditMode ? 'basica' : 'clasificacion');
    }
  }, [isOpen, isEditMode]);

  const handleFormSubmit = (data: CreateProveedorFormData | UpdateProveedorFormData) => {
    if (isEditMode) {
      onSubmit(data as UpdateProveedorDTO);
    } else {
      const createData = data as CreateProveedorFormData;
      const transformedData: any = {
        ...createData,
      };

      if (tipoProveedorForzado && !transformedData.tipo_proveedor) {
        transformedData.tipo_proveedor = tipoProveedorForzado;
      }

      if (transformedData.tipo_proveedor === 'MATERIA_PRIMA_EXTERNO' && !transformedData.modalidad_logistica) {
        transformedData.modalidad_logistica = 'ENTREGA_PLANTA';
      }

      if (transformedData.unidad_negocio === undefined) {
        transformedData.unidad_negocio = null;
      }

      delete transformedData.precios;

      onSubmit(transformedData as CreateProveedorDTO);
    }
  };

  // ==================== OPCIONES PARA SELECTS ====================

  const departamentosOptions = [
    { value: '', label: 'Seleccione departamento' },
    { value: 'AMAZONAS', label: 'Amazonas' },
    { value: 'ANTIOQUIA', label: 'Antioquia' },
    { value: 'ARAUCA', label: 'Arauca' },
    { value: 'ATLANTICO', label: 'Atlántico' },
    { value: 'BOLIVAR', label: 'Bolívar' },
    { value: 'BOYACA', label: 'Boyacá' },
    { value: 'CALDAS', label: 'Caldas' },
    { value: 'CAQUETA', label: 'Caquetá' },
    { value: 'CASANARE', label: 'Casanare' },
    { value: 'CAUCA', label: 'Cauca' },
    { value: 'CESAR', label: 'Cesar' },
    { value: 'CHOCO', label: 'Chocó' },
    { value: 'CORDOBA', label: 'Córdoba' },
    { value: 'CUNDINAMARCA', label: 'Cundinamarca' },
    { value: 'GUAINIA', label: 'Guainía' },
    { value: 'GUAVIARE', label: 'Guaviare' },
    { value: 'HUILA', label: 'Huila' },
    { value: 'LA_GUAJIRA', label: 'La Guajira' },
    { value: 'MAGDALENA', label: 'Magdalena' },
    { value: 'META', label: 'Meta' },
    { value: 'NARINO', label: 'Nariño' },
    { value: 'NORTE_DE_SANTANDER', label: 'Norte de Santander' },
    { value: 'PUTUMAYO', label: 'Putumayo' },
    { value: 'QUINDIO', label: 'Quindío' },
    { value: 'RISARALDA', label: 'Risaralda' },
    { value: 'SAN_ANDRES', label: 'San Andrés y Providencia' },
    { value: 'SANTANDER', label: 'Santander' },
    { value: 'SUCRE', label: 'Sucre' },
    { value: 'TOLIMA', label: 'Tolima' },
    { value: 'VALLE_DEL_CAUCA', label: 'Valle del Cauca' },
    { value: 'VAUPES', label: 'Vaupés' },
    { value: 'VICHADA', label: 'Vichada' },
  ];

  const tipoCuentaOptions = [
    { value: '', label: 'Seleccione tipo' },
    { value: 'AHORROS', label: 'Ahorros' },
    { value: 'CORRIENTE', label: 'Corriente' },
  ];

  const tipoProveedorOptions = [
    { value: '', label: 'Seleccione tipo' },
    { value: 'MATERIA_PRIMA_EXTERNO', label: 'Materia Prima Externa' },
    { value: 'UNIDAD_NEGOCIO', label: 'Unidad Interna' },
    { value: 'PRODUCTO_SERVICIO', label: 'Producto/Servicio' },
  ];

  const modalidadLogisticaOptions = [
    { value: 'ENTREGA_PLANTA', label: 'Entrega en Planta' },
    { value: 'COMPRA_EN_PUNTO', label: 'Compra en Punto de Recolección' },
  ];

  const documentTypeOptions = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'NIT', label: 'NIT' },
    { value: 'PASSPORT', label: 'Pasaporte' },
  ];

  const formasPagoOptions = [
    { value: 'CONTADO', label: 'Contado' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
    { value: 'CREDITO', label: 'Crédito' },
    { value: 'OTRO', label: 'Otro' },
  ];

  const categoriaProductoServicioOptions = [
    { value: '', label: 'Seleccione categoría' },
    { value: 'PRODUCTO', label: 'Producto' },
    { value: 'SERVICIO', label: 'Servicio' },
  ];

  // Calcular campos completos para progreso visual
  const requiredFieldsCount = useMemo(() => {
    let count = 6;
    if (showTipoProveedorSelector) count += 1;
    if (showSubtipoMateria) count += 1;
    if (showProductoServicioFields) count += 2;
    return count;
  }, [showTipoProveedorSelector, showSubtipoMateria, showProductoServicioFields]);

  const completedFieldsCount = useMemo(() => {
    let count = 0;
    if (watch('nombre_comercial')?.trim()) count++;
    if (watch('razon_social')?.trim()) count++;
    if (watch('numero_documento')?.trim()) count++;
    if (watch('direccion')?.trim()) count++;
    if (watch('ciudad')?.trim()) count++;
    if (watch('departamento')?.trim()) count++;

    if (showTipoProveedorSelector && watchedTipoProveedor) count++;

    if (showSubtipoMateria && watchSubtipoMateria?.length > 0) count++;
    if (showProductoServicioFields) {
      if (watch('categoria_producto_servicio' as any)) count++;
      if ((watch('descripcion_productos_servicios' as any) as string)?.trim()) count++;
    }

    return count;
  }, [watch, watchedTipoProveedor, showTipoProveedorSelector, showSubtipoMateria, showProductoServicioFields, watchSubtipoMateria]);

  const progressPercentage = (completedFieldsCount / requiredFieldsCount) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
          {/* TAB: CLASIFICACIÓN (solo en creación) */}
          {activeTab === 'clasificacion' && !isEditMode && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 p-6 rounded-lg border-2 border-primary-200 dark:border-primary-700">
                <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100 mb-4">
                  {tipoProveedorForzado
                    ? tipoProveedorForzado === 'PRODUCTO_SERVICIO'
                      ? 'Proveedor de Productos/Servicios'
                      : tipoProveedorForzado === 'UNIDAD_NEGOCIO'
                        ? 'Unidad Interna'
                        : 'Proveedor de Materia Prima'
                    : 'Seleccione el Tipo de Proveedor'
                  }
                </h3>
                <div className="space-y-4">
                  {showTipoProveedorSelector && (
                    <Select
                      label="Tipo de Proveedor *"
                      {...register('tipo_proveedor' as any)}
                      options={tipoProveedorOptions}
                      error={(errors as any).tipo_proveedor?.message}
                      placeholder="Seleccione tipo"
                    />
                  )}

                  {showSubtipoMateria && (
                    <MateriasPrimasSelector
                      value={(watchSubtipoMateria || []) as CodigoMateriaPrima[]}
                      onChange={(materias) => setValue('subtipo_materia' as any, materias)}
                      error={(errors as any).subtipo_materia?.message}
                    />
                  )}

                  {showModalidadLogistica && (
                    <Select
                      label="Modalidad Logística *"
                      {...register('modalidad_logistica' as any)}
                      options={modalidadLogisticaOptions}
                      error={(errors as any).modalidad_logistica?.message}
                      placeholder="Seleccione modalidad"
                    />
                  )}

                  {showProductoServicioFields && (
                    <>
                      <Select
                        label="Categoría *"
                        {...register('categoria_producto_servicio' as any)}
                        options={categoriaProductoServicioOptions}
                        error={(errors as any).categoria_producto_servicio?.message}
                        placeholder="Seleccione categoría"
                      />

                      <Input
                        label="Descripción de Productos/Servicios *"
                        {...register('descripcion_productos_servicios' as any)}
                        error={(errors as any).descripcion_productos_servicios?.message}
                        placeholder="Ej: Químicos de limpieza, Mantenimiento de maquinaria..."
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: INFORMACIÓN BÁSICA */}
          {activeTab === 'basica' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre Comercial *"
                  {...register('nombre_comercial')}
                  error={errors.nombre_comercial?.message}
                  placeholder="Nombre del proveedor"
                />

                <Input
                  label="Razón Social *"
                  {...register('razon_social')}
                  error={errors.razon_social?.message}
                  placeholder="Razón social"
                />

                <Select
                  label="Tipo de Documento *"
                  {...register('tipo_documento')}
                  options={documentTypeOptions}
                  error={errors.tipo_documento?.message}
                  disabled={isEditMode}
                />

                <Input
                  label="Número de Documento *"
                  {...register('numero_documento')}
                  error={errors.numero_documento?.message}
                  placeholder={watchTipoDocumento === 'NIT' ? 'Ej: 900123456-1' : 'Número de documento'}
                  disabled={isEditMode}
                />

                {!isEditMode && watchTipoDocumento && watchTipoDocumento !== 'NIT' && (
                  <Input
                    label="NIT"
                    {...register('nit' as any)}
                    error={(errors as any).nit?.message}
                    placeholder="Ej: 900123456-1"
                  />
                )}

                <Input
                  label="Teléfono"
                  {...register('telefono')}
                  error={errors.telefono?.message}
                  placeholder="Teléfono de contacto"
                />

                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
          )}

          {/* TAB: UBICACIÓN */}
          {activeTab === 'ubicacion' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Dirección *"
                    {...register('direccion')}
                    error={errors.direccion?.message}
                    placeholder="Dirección completa"
                  />
                </div>

                <Input
                  label="Ciudad *"
                  {...register('ciudad')}
                  error={errors.ciudad?.message}
                  placeholder="Ciudad"
                />

                <Select
                  label="Departamento *"
                  {...register('departamento')}
                  options={departamentosOptions}
                  error={errors.departamento?.message}
                  placeholder="Seleccione departamento"
                />
              </div>
            </div>
          )}

          {/* TAB: FINANCIERO */}
          {activeTab === 'financiero' && (
            <div className="space-y-6">
              {/* Mostrar precios en modo edición (readonly) */}
              {isEditMode && showPrecioCompra && proveedor?.precios_materia_prima && proveedor.precios_materia_prima.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Precios de Compra por Materia Prima
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Los precios solo pueden ser modificados desde el botón "Cambiar Precio" por un Gerente.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {proveedor.precios_materia_prima.map((precio) => (
                      <div key={precio.id} className="bg-white dark:bg-blue-950 p-4 rounded-lg border border-blue-300 dark:border-blue-700">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                          {precio.tipo_materia_display}
                        </div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          ${parseFloat(precio.precio_kg).toLocaleString('es-CO')} / kg
                        </div>
                        {precio.modificado_fecha && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Última modificación:{' '}
                            {new Date(precio.modificado_fecha).toLocaleDateString('es-CO')}
                            {precio.modificado_por_nombre && ` por ${precio.modificado_por_nombre}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formas de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formas de Pago
                </label>
                <div className="space-y-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
                  {formasPagoOptions.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={(watchFormasPago || []).includes(option.value)}
                        onChange={(e) => {
                          const current = watchFormasPago || [];
                          if (e.target.checked) {
                            setValue('formas_pago', [...current, option.value]);
                          } else {
                            setValue('formas_pago', current.filter((v: string) => v !== option.value));
                          }
                        }}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.formas_pago && (
                  <p className="mt-1 text-sm text-red-600">{errors.formas_pago?.message}</p>
                )}
              </div>

              {/* Datos bancarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Banco"
                  {...register('banco')}
                  error={errors.banco?.message}
                  placeholder="Nombre del banco"
                />

                <Select
                  label="Tipo de Cuenta"
                  {...register('tipo_cuenta')}
                  options={tipoCuentaOptions}
                  error={errors.tipo_cuenta?.message}
                  placeholder="Seleccione tipo de cuenta"
                />

                <Input
                  label="Número de Cuenta"
                  {...register('numero_cuenta')}
                  error={errors.numero_cuenta?.message}
                  placeholder="Número de cuenta"
                />

                <Input
                  label="Titular de la Cuenta"
                  {...register('titular_cuenta')}
                  error={errors.titular_cuenta?.message}
                  placeholder="Nombre del titular"
                />
              </div>
            </div>
          )}

          {/* TAB: OBSERVACIONES */}
          {activeTab === 'observaciones' && (
            <div className="space-y-4 overflow-hidden">
              <div className="overflow-hidden">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observaciones
                </label>
                <textarea
                  {...register('observaciones')}
                  rows={8}
                  className="w-full max-w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y overflow-auto"
                  placeholder="Notas adicionales sobre el proveedor..."
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                />
                {errors.observaciones && (
                  <p className="mt-1 text-sm text-red-600">{errors.observaciones.message}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* DEBUG: Mostrar errores de validación */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-2 border-red-300 dark:border-red-700 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm font-bold text-red-800 dark:text-red-200">
                Errores de validación ({Object.keys(errors).length}):
              </p>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  <strong>{field}:</strong> {(error as any)?.message || 'Error desconocido'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FOOTER CON BOTONES */}
        <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || isSubmitting || (!isValid && !isEditMode)}
            className="relative"
          >
            {isLoading || isSubmitting ? (
              <>
                <span className="opacity-0">{isEditMode ? 'Actualizar' : 'Crear Proveedor'}</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              </>
            ) : (
              <>
                {isEditMode ? 'Actualizar' : 'Crear Proveedor'}
                {!isValid && !isEditMode && (
                  <span className="ml-2 text-xs opacity-75">(Complete campos requeridos)</span>
                )}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
