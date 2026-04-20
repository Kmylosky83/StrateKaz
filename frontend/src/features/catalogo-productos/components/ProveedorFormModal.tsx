/**
 * Modal de Proveedor (Crear/Editar) — Modal mínimo multi-industria.
 *
 * Secciones:
 *   1. Identificación (tipo_persona + documento + razón social)
 *   2. Contacto (teléfono, email, departamento, ciudad, dirección)
 *   3. Productos suministrados (M2M a catalogo_productos.Producto)
 *   4. Vínculo con Parte Interesada (opcional)
 *
 * Datos tributarios, bancarios, contratos → fuera de scope (Admin/Compras).
 * Fix bug submit 2026-04-21: FKs requeridos validados con .min(1), no delete.
 */
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { FormModal } from '@/components/modals';
import { Card } from '@/components/common/Card';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { Switch } from '@/components/forms';

import { useSelectDepartamentos, useSelectTiposDocumento } from '@/hooks/useSelectLists';
import { PILookupField } from '@/features/gestion-estrategica/components/PILookupField';

import { useProductos } from '../hooks/useProductos';
import { useTiposProveedor, useCreateProveedor, useUpdateProveedor } from '../hooks/useProveedores';
import type {
  Proveedor,
  ProveedorDetail,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  TipoPersona,
} from '../types/proveedor.types';

// ─── Schema Zod ────────────────────────────────────────────────────────────

const TIPO_PERSONA_OPTIONS: { value: TipoPersona; label: string }[] = [
  { value: 'natural', label: 'Persona Natural' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'con_cedula', label: 'Persona con Cédula (sin NIT)' },
];

const proveedorSchema = z.object({
  tipo_persona: z.enum(['natural', 'empresa', 'con_cedula']),
  tipo_proveedor: z.number().nullable().optional(),
  razon_social: z.string().min(1, 'La razón social es obligatoria'),
  nombre_comercial: z.string().min(1, 'El nombre comercial es obligatorio'),
  tipo_documento: z.number().min(1, 'Seleccione un tipo de documento'),
  numero_documento: z.string().min(1, 'El número de documento es obligatorio'),
  nit: z.string().optional().default(''),
  telefono: z.string().optional().default(''),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  departamento: z.number().nullable().optional(),
  ciudad: z.string().optional().default(''),
  direccion: z.string().optional().default(''),
  productos_suministrados: z.array(z.number()).optional().default([]),
  is_active: z.boolean().default(true),
});

type ProveedorFormValues = z.infer<typeof proveedorSchema>;

const DEFAULT_VALUES: ProveedorFormValues = {
  tipo_persona: 'empresa',
  tipo_proveedor: null,
  razon_social: '',
  nombre_comercial: '',
  tipo_documento: 0,
  numero_documento: '',
  nit: '',
  telefono: '',
  email: '',
  departamento: null,
  ciudad: '',
  direccion: '',
  productos_suministrados: [],
  is_active: true,
};

// ─── Props ────────────────────────────────────────────────────────────────

interface ProveedorFormModalProps {
  proveedor?: Proveedor | ProveedorDetail;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProveedorFormModal({
  proveedor,
  isOpen,
  onClose,
}: ProveedorFormModalProps) {
  const isEdit = !!proveedor;

  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const { watch, setValue, reset } = form;

  // ─── Catálogos ───
  const { data: tiposDocumento = [] } = useSelectTiposDocumento();
  const { data: departamentos = [] } = useSelectDepartamentos();
  const { data: tiposProveedor = [] } = useTiposProveedor();
  const { data: productos = [] } = useProductos();

  // Solo productos tipo MATERIA_PRIMA son suministrables
  const productosMP = useMemo(
    () => (Array.isArray(productos) ? productos.filter((p) => p.tipo === 'MATERIA_PRIMA') : []),
    [productos]
  );

  // ─── Mutations ───
  const createMutation = useCreateProveedor();
  const updateMutation = useUpdateProveedor();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // ─── Vínculo PI ───
  const [piId, setPiId] = useState<number | null>(null);
  const [piNombre, setPiNombre] = useState('');

  // ─── Effect: reset form al abrir/editar ───
  useEffect(() => {
    if (proveedor && isOpen) {
      const detailed = proveedor as ProveedorDetail;
      reset({
        tipo_persona: proveedor.tipo_persona,
        tipo_proveedor: proveedor.tipo_proveedor,
        razon_social: proveedor.razon_social,
        nombre_comercial: proveedor.nombre_comercial,
        tipo_documento: proveedor.tipo_documento,
        numero_documento: proveedor.numero_documento,
        nit: proveedor.nit ?? '',
        telefono: proveedor.telefono ?? '',
        email: proveedor.email ?? '',
        departamento: proveedor.departamento,
        ciudad: proveedor.ciudad ?? '',
        direccion: detailed.direccion ?? '',
        productos_suministrados: detailed.productos_suministrados ?? [],
        is_active: proveedor.is_active,
      });
      setPiId(detailed.parte_interesada_id ?? null);
      setPiNombre(detailed.parte_interesada_nombre ?? '');
    } else if (!proveedor && isOpen) {
      reset(DEFAULT_VALUES);
      setPiId(null);
      setPiNombre('');
    }
  }, [proveedor, isOpen, reset]);

  const tipoPersona = watch('tipo_persona');
  const esEmpresa = tipoPersona === 'empresa';

  // ─── Toggle producto suministrado ───
  const handleToggleProducto = (productoId: number) => {
    const current = watch('productos_suministrados') || [];
    const next = current.includes(productoId)
      ? current.filter((id) => id !== productoId)
      : [...current, productoId];
    setValue('productos_suministrados', next, { shouldDirty: true });
  };

  // ─── Submit ───
  const handleSubmit = async (data: ProveedorFormValues) => {
    const payload: CreateProveedorDTO = {
      tipo_persona: data.tipo_persona,
      tipo_proveedor: data.tipo_proveedor ?? null,
      razon_social: data.razon_social,
      nombre_comercial: data.nombre_comercial,
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
      nit: data.nit || undefined,
      telefono: data.telefono || undefined,
      email: data.email || undefined,
      departamento: data.departamento ?? null,
      ciudad: data.ciudad || undefined,
      direccion: data.direccion || undefined,
      productos_suministrados: data.productos_suministrados || [],
      parte_interesada_id: piId,
      parte_interesada_nombre: piNombre || undefined,
      is_active: data.is_active,
    };

    try {
      if (isEdit && proveedor) {
        await updateMutation.mutateAsync({ id: proveedor.id, data: payload as UpdateProveedorDTO });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      /* toast mostrado por el mutation hook */
    }
  };

  // ─── Render ───
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
          : 'Datos mínimos para registrar un proveedor'
      }
      size="xl"
      isLoading={isLoading}
      submitLabel={isEdit ? 'Actualizar' : 'Crear Proveedor'}
      warnUnsavedChanges
      defaultValues={DEFAULT_VALUES}
    >
      {/* 1. IDENTIFICACIÓN */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Identificación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de persona"
            value={watch('tipo_persona')}
            onChange={(e) =>
              setValue('tipo_persona', e.target.value as TipoPersona, { shouldDirty: true })
            }
            required
            error={form.formState.errors.tipo_persona?.message}
          >
            {TIPO_PERSONA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            label="Tipo de proveedor (opcional)"
            value={watch('tipo_proveedor') ?? ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              setValue('tipo_proveedor', v, { shouldDirty: true });
            }}
          >
            <option value="">Sin clasificar</option>
            {tiposProveedor.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Select>

          <div className="md:col-span-2">
            <Input
              label="Razón social"
              {...form.register('razon_social')}
              required
              error={form.formState.errors.razon_social?.message}
            />
          </div>

          <Input
            label="Nombre comercial"
            {...form.register('nombre_comercial')}
            required
            error={form.formState.errors.nombre_comercial?.message}
          />

          <Select
            label="Tipo de documento"
            value={watch('tipo_documento') || ''}
            onChange={(e) =>
              setValue('tipo_documento', Number(e.target.value), { shouldDirty: true })
            }
            required
            error={form.formState.errors.tipo_documento?.message}
          >
            <option value="">Seleccionar...</option>
            {tiposDocumento.map((td) => (
              <option key={td.id} value={td.id}>
                {td.label}
              </option>
            ))}
          </Select>

          <Input
            label="Número de documento"
            {...form.register('numero_documento')}
            required
            error={form.formState.errors.numero_documento?.message}
          />

          {esEmpresa && (
            <Input
              label="NIT"
              {...form.register('nit')}
              placeholder="Ej: 900123456-7"
              helperText="Solo para personas jurídicas"
            />
          )}
        </div>
      </Card>

      {/* 2. CONTACTO */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contacto</h3>
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
            value={watch('departamento') ?? ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              setValue('departamento', v, { shouldDirty: true });
            }}
          >
            <option value="">Seleccionar...</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
          <Input label="Ciudad" {...form.register('ciudad')} placeholder="Ej: Bogotá" />
          <div className="md:col-span-2">
            <Textarea
              label="Dirección"
              {...form.register('direccion')}
              rows={2}
              placeholder="Ej: Calle 123 #45-67"
            />
          </div>
        </div>
      </Card>

      {/* 3. PRODUCTOS SUMINISTRADOS */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Productos suministrados (opcional)
        </h3>
        {productosMP.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay productos tipo Materia Prima registrados. Puede agregar productos desde el
            Catálogo y regresar aquí.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            {productosMP.map((p) => (
              <Checkbox
                key={p.id}
                label={p.nombre}
                checked={watch('productos_suministrados')?.includes(p.id) || false}
                onChange={() => handleToggleProducto(p.id)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* 4. VÍNCULO PARTE INTERESADA */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Vínculo con Parte Interesada (opcional)
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

      {/* Estado activo */}
      <div className="flex items-center gap-3 pt-2">
        <Switch
          checked={watch('is_active') ?? true}
          onCheckedChange={(checked) => setValue('is_active', checked, { shouldDirty: true })}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Proveedor activo
        </span>
      </div>
    </FormModal>
  );
}
