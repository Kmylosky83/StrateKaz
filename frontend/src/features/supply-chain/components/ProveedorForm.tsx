/**
 * Componente: Formulario de Proveedor (Crear/Editar)
 *
 * Usa FormModal del design system con React Hook Form + Zod.
 * Alineado con ProveedorCreateSerializer/UpdateSerializer del backend.
 */
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { FormModal } from '@/components/modals';
import { Card } from '@/components/common/Card';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { Switch } from '@/components/forms';

import {
  useTiposProveedor,
  useTiposMateriaPrima,
  useModalidadesLogistica,
  useTiposDocumento,
  useDepartamentos,
  useFormasPago,
  useTiposCuentaBancaria,
} from '../hooks/useCatalogos';
import { useCreateProveedor, useUpdateProveedor } from '../hooks/useProveedores';
import { useSelectUnidadesNegocio } from '@/hooks/useSelectLists';
import { PILookupField } from '@/features/gestion-estrategica/components/PILookupField';
import type { Proveedor, CreateProveedorDTO, UpdateProveedorDTO } from '../types';

// ==================== ZOD SCHEMA ====================

const proveedorSchema = z.object({
  tipo_proveedor: z.number().min(1, 'Seleccione un tipo de proveedor'),
  razon_social: z.string().min(1, 'La razón social es obligatoria'),
  nombre_comercial: z.string().min(1, 'El nombre comercial es obligatorio'),
  tipo_documento: z.number().min(1, 'Seleccione un tipo de documento'),
  numero_documento: z.string().min(1, 'El número de documento es obligatorio'),
  nit: z.string().optional().default(''),
  productos_suministrados: z.array(z.number()).optional().default([]),
  modalidad_logistica: z.number().optional().default(0),
  unidad_negocio: z.number().optional().default(0),
  telefono: z.string().optional().default(''),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  departamento: z.number().optional().default(0),
  ciudad: z.string().optional().default(''),
  direccion: z.string().optional().default(''),
  formas_pago: z.array(z.number()).optional().default([]),
  dias_plazo_pago: z.number().min(0).optional().default(0),
  banco: z.string().optional().default(''),
  tipo_cuenta: z.number().optional().default(0),
  numero_cuenta: z.string().optional().default(''),
  titular_cuenta: z.string().optional().default(''),
  observaciones: z.string().optional().default(''),
  es_independiente: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type ProveedorFormValues = z.infer<typeof proveedorSchema>;

// ==================== TIPOS ====================

interface ProveedorFormProps {
  proveedor?: Proveedor;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_VALUES: ProveedorFormValues = {
  tipo_proveedor: 0,
  razon_social: '',
  nombre_comercial: '',
  tipo_documento: 0,
  numero_documento: '',
  nit: '',
  productos_suministrados: [],
  modalidad_logistica: 0,
  unidad_negocio: 0,
  telefono: '',
  email: '',
  departamento: 0,
  ciudad: '',
  direccion: '',
  formas_pago: [],
  dias_plazo_pago: 0,
  banco: '',
  tipo_cuenta: 0,
  numero_cuenta: '',
  titular_cuenta: '',
  observaciones: '',
  is_active: true,
};

// ==================== COMPONENTE ====================

export function ProveedorForm({ proveedor, isOpen, onClose }: ProveedorFormProps) {
  const isEdit = !!proveedor;

  // React Hook Form
  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { watch, setValue, reset } = form;

  // ==================== QUERIES ====================

  const { data: tiposProveedor } = useTiposProveedor({ is_active: true });
  const { data: tiposMateriaPrima } = useTiposMateriaPrima({ is_active: true });
  const { data: modalidadesLogistica } = useModalidadesLogistica({ is_active: true });
  const { data: tiposDocumento } = useTiposDocumento({ is_active: true });
  const { data: departamentos } = useDepartamentos({ is_active: true });
  const { data: formasPago } = useFormasPago({ is_active: true });
  const { data: tiposCuenta } = useTiposCuentaBancaria({ is_active: true });
  const { data: unidadesNegocio } = useSelectUnidadesNegocio();

  const createMutation = useCreateProveedor();
  const updateMutation = useUpdateProveedor();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Parte Interesada (cross-module link)
  const [piId, setPiId] = useState<number | null>(null);
  const [piNombre, setPiNombre] = useState('');

  // ==================== CATÁLOGOS NORMALIZADOS ====================

  const tipoProveedorList = useMemo(
    () => (Array.isArray(tiposProveedor) ? tiposProveedor : []),
    [tiposProveedor]
  );
  const tiposMateriaPrimaList = useMemo(
    () => (Array.isArray(tiposMateriaPrima) ? tiposMateriaPrima : []),
    [tiposMateriaPrima]
  );
  const modalidadesList = useMemo(
    () => (Array.isArray(modalidadesLogistica) ? modalidadesLogistica : []),
    [modalidadesLogistica]
  );
  const tiposDocumentoList = useMemo(
    () => (Array.isArray(tiposDocumento) ? tiposDocumento : []),
    [tiposDocumento]
  );
  const departamentosList = useMemo(
    () => (Array.isArray(departamentos) ? departamentos : []),
    [departamentos]
  );
  const formasPagoList = useMemo(() => (Array.isArray(formasPago) ? formasPago : []), [formasPago]);
  const tiposCuentaList = useMemo(
    () => (Array.isArray(tiposCuenta) ? tiposCuenta : []),
    [tiposCuenta]
  );
  const unidadesList = useMemo(
    () => (Array.isArray(unidadesNegocio) ? unidadesNegocio : []),
    [unidadesNegocio]
  );

  // ==================== TIPO PROVEEDOR SELECCIONADO ====================

  const tipoProveedorId = watch('tipo_proveedor');
  const tipoProveedorSeleccionado = tipoProveedorList.find((t) => t.id === tipoProveedorId);
  const requiereMateriaPrima = tipoProveedorSeleccionado?.requiere_materia_prima ?? false;
  const requiereModalidadLogistica =
    tipoProveedorSeleccionado?.requiere_modalidad_logistica ?? false;
  const esUnidadNegocio = tipoProveedorSeleccionado?.codigo === 'UNIDAD_NEGOCIO';
  const esConsultorOContratista =
    tipoProveedorSeleccionado?.codigo === 'CONSULTOR' ||
    tipoProveedorSeleccionado?.codigo === 'CONTRATISTA';

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (proveedor && isOpen) {
      reset({
        tipo_proveedor: proveedor.tipo_proveedor,
        unidad_negocio: proveedor.unidad_negocio || 0,
        productos_suministrados: proveedor.productos_suministrados || [],
        modalidad_logistica: proveedor.modalidad_logistica || 0,
        razon_social: proveedor.razon_social || '',
        nombre_comercial: proveedor.nombre_comercial || '',
        tipo_documento: proveedor.tipo_documento,
        numero_documento: proveedor.numero_documento || '',
        nit: proveedor.nit || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        departamento: proveedor.departamento || 0,
        ciudad: proveedor.ciudad || '',
        direccion: proveedor.direccion || '',
        formas_pago: proveedor.formas_pago || [],
        dias_plazo_pago: proveedor.dias_plazo_pago || 0,
        banco: proveedor.banco || '',
        tipo_cuenta: proveedor.tipo_cuenta || 0,
        numero_cuenta: proveedor.numero_cuenta || '',
        titular_cuenta: proveedor.titular_cuenta || '',
        observaciones: proveedor.observaciones || '',
        es_independiente: proveedor.es_independiente ?? false,
        is_active: proveedor.is_active,
      });
      setPiId(proveedor.parte_interesada_id ?? null);
      setPiNombre(proveedor.parte_interesada_nombre ?? '');
    } else if (!proveedor && isOpen) {
      reset(DEFAULT_VALUES);
      setPiId(null);
      setPiNombre('');
    }
  }, [proveedor, isOpen, reset]);

  // ==================== HANDLERS ====================

  const handleMultiSelectToggle = (
    field: 'productos_suministrados' | 'formas_pago',
    value: number
  ) => {
    const currentValues = watch(field) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    setValue(field, newValues, { shouldDirty: true });
  };

  const handleSubmit = async (data: ProveedorFormValues) => {
    // Limpiar payload antes de enviar al backend
    const payload: Record<string, unknown> = {
      ...data,
      parte_interesada_id: piId,
      parte_interesada_nombre: piNombre,
    };

    // FK con valor 0 → eliminar (evita DRF "clave primaria '0' inválida")
    const fkFields = [
      'tipo_proveedor',
      'tipo_documento',
      'unidad_negocio',
      'modalidad_logistica',
      'departamento',
      'tipo_cuenta',
    ];
    for (const field of fkFields) {
      if (!payload[field]) delete payload[field];
    }

    // Campos numéricos opcionales: 0 → eliminar
    if (!payload.dias_plazo_pago) delete payload.dias_plazo_pago;

    // Strings opcionales vacíos → eliminar del payload (backend los deja blank/null)
    const optionalStringFields = [
      'nit',
      'telefono',
      'email',
      'ciudad',
      'banco',
      'numero_cuenta',
      'titular_cuenta',
    ];
    for (const field of optionalStringFields) {
      if (payload[field] === '' || payload[field] === undefined) {
        delete payload[field];
      }
    }

    try {
      if (isEdit && proveedor) {
        await updateMutation.mutateAsync({
          id: proveedor.id,
          data: payload as UpdateProveedorDTO,
        });
      } else {
        await createMutation.mutateAsync(payload as CreateProveedorDTO);
      }
      onClose();
    } catch {
      // Error manejado por mutation hooks (toast)
    }
  };

  // ==================== RENDERIZADO ====================

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      form={form}
      title={isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      subtitle={
        isEdit && proveedor?.codigo_interno
          ? `Código: ${proveedor.codigo_interno}`
          : 'Complete la información del proveedor'
      }
      size="xl"
      isLoading={isLoading}
      submitLabel={isEdit ? 'Actualizar' : 'Crear Proveedor'}
      warnUnsavedChanges
      defaultValues={DEFAULT_VALUES}
    >
      {/* ==================== INFORMACIÓN BÁSICA ==================== */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Información Básica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Proveedor"
            value={watch('tipo_proveedor') || ''}
            onChange={(e) =>
              setValue('tipo_proveedor', Number(e.target.value), { shouldDirty: true })
            }
            required
            error={form.formState.errors.tipo_proveedor?.message}
          >
            <option value="">Seleccionar...</option>
            {tipoProveedorList.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>

          {esUnidadNegocio && (
            <Select
              label="Unidad de Negocio"
              value={watch('unidad_negocio') || ''}
              onChange={(e) =>
                setValue('unidad_negocio', Number(e.target.value), { shouldDirty: true })
              }
            >
              <option value="">Seleccionar...</option>
              {unidadesList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </Select>
          )}

          {esConsultorOContratista && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={watch('es_independiente')}
                onChange={(e) =>
                  setValue('es_independiente', e.target.checked, { shouldDirty: true })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Consultor independiente (persona natural sin empresa)
              </span>
            </label>
          )}

          <div className="md:col-span-2">
            <Input
              label="Razón Social"
              {...form.register('razon_social')}
              required
              error={form.formState.errors.razon_social?.message}
            />
          </div>

          <Input
            label="Nombre Comercial"
            {...form.register('nombre_comercial')}
            required
            error={form.formState.errors.nombre_comercial?.message}
          />

          <Select
            label="Tipo de Documento"
            value={watch('tipo_documento') || ''}
            onChange={(e) =>
              setValue('tipo_documento', Number(e.target.value), { shouldDirty: true })
            }
            required
            error={form.formState.errors.tipo_documento?.message}
          >
            <option value="">Seleccionar...</option>
            {tiposDocumentoList.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Número de Documento"
            {...form.register('numero_documento')}
            required
            error={form.formState.errors.numero_documento?.message}
          />

          <Input
            label="NIT"
            {...form.register('nit')}
            placeholder="Ej: 900123456-7 o cédula"
            helperText="Persona jurídica o natural"
          />
        </div>
      </Card>

      {/* ==================== MATERIAS PRIMAS Y LOGÍSTICA ==================== */}
      {requiereMateriaPrima && (
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Materias Primas y Logística
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipos de Materia Prima <span className="text-danger-500">*</span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                {tiposMateriaPrimaList.map((tipo) => (
                  <Checkbox
                    key={tipo.id}
                    label={tipo.nombre}
                    checked={watch('productos_suministrados')?.includes(tipo.id) || false}
                    onChange={() => handleMultiSelectToggle('productos_suministrados', tipo.id)}
                  />
                ))}
              </div>
            </div>

            {requiereModalidadLogistica && (
              <Select
                label="Modalidad Logística"
                value={watch('modalidad_logistica') || ''}
                onChange={(e) =>
                  setValue('modalidad_logistica', Number(e.target.value) || 0, {
                    shouldDirty: true,
                  })
                }
              >
                <option value="">Seleccionar...</option>
                {modalidadesList.map((modalidad) => (
                  <option key={modalidad.id} value={modalidad.id}>
                    {modalidad.nombre}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </Card>
      )}

      {/* ==================== CONTACTO Y UBICACIÓN ==================== */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contacto y Ubicación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            type="tel"
            {...form.register('telefono')}
            placeholder="Ej: 3001234567"
          />

          <Input
            label="Email"
            type="email"
            {...form.register('email')}
            error={form.formState.errors.email?.message}
          />

          <Select
            label="Departamento"
            value={watch('departamento') || ''}
            onChange={(e) =>
              setValue('departamento', Number(e.target.value) || 0, { shouldDirty: true })
            }
          >
            <option value="">Seleccionar...</option>
            {departamentosList.map((depto) => (
              <option key={depto.id} value={depto.id}>
                {depto.nombre}
              </option>
            ))}
          </Select>

          <Input label="Ciudad" {...form.register('ciudad')} placeholder="Ej: Bogotá" />

          <div className="md:col-span-2">
            <Input
              label="Dirección"
              {...form.register('direccion')}
              placeholder="Ej: Calle 123 #45-67"
            />
          </div>
        </div>
      </Card>

      {/* ==================== INFORMACIÓN BANCARIA ==================== */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Información Bancaria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Banco" {...form.register('banco')} />

          <Select
            label="Tipo de Cuenta"
            value={watch('tipo_cuenta') || ''}
            onChange={(e) =>
              setValue('tipo_cuenta', Number(e.target.value) || 0, { shouldDirty: true })
            }
          >
            <option value="">Seleccionar...</option>
            {tiposCuentaList.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>

          <Input label="Número de Cuenta" {...form.register('numero_cuenta')} />
          <Input label="Titular de la Cuenta" {...form.register('titular_cuenta')} />
        </div>
      </Card>

      {/* ==================== CONDICIONES COMERCIALES ==================== */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Condiciones Comerciales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formas de Pago
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
              {formasPagoList.map((fp) => (
                <Checkbox
                  key={fp.id}
                  label={fp.nombre}
                  checked={watch('formas_pago')?.includes(fp.id) || false}
                  onChange={() => handleMultiSelectToggle('formas_pago', fp.id)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Días de Plazo de Pago"
              type="number"
              {...form.register('dias_plazo_pago', { valueAsNumber: true })}
              min={0}
            />

            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={watch('is_active') ?? true}
                onCheckedChange={(checked) => setValue('is_active', checked, { shouldDirty: true })}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Proveedor activo
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ==================== VÍNCULO PARTE INTERESADA ==================== */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Vínculo con Parte Interesada
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Vincule este proveedor con una Parte Interesada registrada en Fundación.
        </p>
        <PILookupField
          value={piId}
          displayName={piNombre}
          onChange={(id, nombre) => {
            setPiId(id);
            setPiNombre(nombre);
          }}
        />
      </Card>

      {/* ==================== OBSERVACIONES ==================== */}
      <Textarea
        label="Observaciones"
        {...form.register('observaciones')}
        rows={3}
        placeholder="Notas adicionales sobre el proveedor..."
      />
    </FormModal>
  );
}
