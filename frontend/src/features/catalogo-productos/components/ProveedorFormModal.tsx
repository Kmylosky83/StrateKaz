/**
 * Modal de Proveedor (Crear/Editar) — SOLO datos CT.
 *
 * Secciones:
 *   1. Identificación (tipo_persona + documento + razón social)
 *   2. Contacto (teléfono, email, departamento, ciudad, dirección)
 *   3. Productos suministrados (M2M a catalogo_productos.Producto)
 *   4. Vínculo con Parte Interesada (opcional)
 *
 * Doctrina 2026-04-21 (Opción A - separación estricta):
 *   CT NO importa de C2. Precios y modalidad logística viven en
 *   /supply-chain/precios (PreciosTab vista masiva por proveedor).
 *   Al crear proveedor con MPs, el callback onCreated lleva al flujo
 *   de asignar precios en SC.
 */
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { FormModal } from '@/components/modals';
import { Card } from '@/components/common/Card';
import { Input, Select, Textarea, MultiSelectCombobox } from '@/components/forms';
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
];

const proveedorSchema = z
  .object({
    tipo_persona: z.enum(['natural', 'empresa']),
    tipo_proveedor: z.number().nullable().optional(),
    razon_social: z.string().min(1, 'La razón social es obligatoria'),
    nombre_comercial: z.string().min(1, 'El nombre comercial es obligatorio'),
    // Para empresa: se auto-rellena desde nit. Para natural: el usuario lo selecciona.
    tipo_documento: z.number().optional().default(0),
    numero_documento: z.string().optional().default(''),
    nit: z.string().optional().default(''),
    telefono: z.string().optional().default(''),
    email: z.string().email('Email inválido').or(z.literal('')).optional(),
    departamento: z.number().nullable().optional(),
    ciudad: z.string().optional().default(''),
    direccion: z.string().optional().default(''),
    productos_suministrados: z.array(z.number()).optional().default([]),
    is_active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    // Validación condicional según tipo_persona
    if (data.tipo_persona === 'empresa') {
      if (!data.nit || data.nit.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nit'],
          message: 'El NIT es obligatorio para empresas',
        });
      }
    } else {
      // natural
      if (!data.tipo_documento || data.tipo_documento === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tipo_documento'],
          message: 'Seleccione un tipo de documento',
        });
      }
      if (!data.numero_documento || data.numero_documento.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['numero_documento'],
          message: 'El número de documento es obligatorio',
        });
      }
    }
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
  /** Callback al crear/actualizar — permite redirigir a PreciosTab. */
  onSaved?: (proveedor: Proveedor, hasMps: boolean) => void;
}

export default function ProveedorFormModal({
  proveedor,
  isOpen,
  onClose,
  onSaved,
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

  // Identificar ID de tipo_documento 'NIT' para auto-setear en empresas
  const nitTipoDocId = useMemo(() => {
    const item = tiposDocumento.find(
      (td) => (td as { extra?: { codigo?: string } }).extra?.codigo === 'NIT'
    );
    return item?.id ?? null;
  }, [tiposDocumento]);

  // Tipos de documento SIN NIT (para persona natural)
  const tiposDocumentoNatural = useMemo(
    () =>
      tiposDocumento.filter(
        (td) => (td as { extra?: { codigo?: string } }).extra?.codigo !== 'NIT'
      ),
    [tiposDocumento]
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

  // Auto-setear tipo_documento=NIT cuando se cambia a empresa
  useEffect(() => {
    if (esEmpresa && nitTipoDocId && watch('tipo_documento') !== nitTipoDocId) {
      setValue('tipo_documento', nitTipoDocId, { shouldDirty: true });
    }
  }, [esEmpresa, nitTipoDocId, setValue, watch]);

  // Opciones para el combobox de productos MP
  const productosOptions = useMemo(
    () =>
      productosMP.map((p) => ({
        value: p.id,
        label: p.nombre,
        description: p.codigo ? `Código: ${p.codigo}` : undefined,
      })),
    [productosMP]
  );

  // ─── Submit ───
  const handleSubmit = async (data: ProveedorFormValues) => {
    // Para empresa: el NIT es el documento → auto-rellenar tipo_documento + numero_documento
    const isEmpresa = data.tipo_persona === 'empresa';
    const tipoDocFinal = isEmpresa && nitTipoDocId ? nitTipoDocId : data.tipo_documento;
    const numeroDocFinal = isEmpresa ? data.nit || '' : data.numero_documento;

    const payload: CreateProveedorDTO = {
      tipo_persona: data.tipo_persona,
      tipo_proveedor: data.tipo_proveedor ?? null,
      razon_social: data.razon_social,
      nombre_comercial: data.nombre_comercial,
      tipo_documento: tipoDocFinal,
      numero_documento: numeroDocFinal,
      nit: isEmpresa ? data.nit || undefined : undefined,
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
      let saved: Proveedor;
      if (isEdit && proveedor) {
        saved = (await updateMutation.mutateAsync({
          id: proveedor.id,
          data: payload as UpdateProveedorDTO,
        })) as Proveedor;
      } else {
        saved = (await createMutation.mutateAsync(payload)) as Proveedor;
      }

      const hasMps = (data.productos_suministrados || []).length > 0;

      if (!isEdit && hasMps) {
        // UX: notificar al usuario y dejar que el parent navegue a PreciosTab
        toast.success(
          `Proveedor creado. ${data.productos_suministrados.length} MP(s) asignada(s). Asigne precios en Cadena de Suministro → Precios.`,
          { duration: 5000 }
        );
      }

      onSaved?.(saved, hasMps);
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

          {esEmpresa ? (
            /* EMPRESA → solo NIT (tipo_documento se auto-setea a NIT) */
            <div className="md:col-span-2">
              <Input
                label="NIT"
                {...form.register('nit')}
                required
                placeholder="Ej: 900123456-7"
                helperText="Número de identificación tributaria de la empresa"
                error={form.formState.errors.nit?.message}
              />
            </div>
          ) : (
            /* PERSONA NATURAL → tipo de documento (CC/CE/PA/etc.) + número */
            <>
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
                {tiposDocumentoNatural.map((td) => (
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
            </>
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
          Productos suministrados
        </h3>
        {productosMP.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay productos tipo Materia Prima registrados. Puede agregar productos desde el
            Catálogo y regresar aquí.
          </p>
        ) : (
          <MultiSelectCombobox
            label="Materias primas que suministra"
            placeholder="Seleccionar productos..."
            emptyMessage="Sin resultados. Pruebe con otra búsqueda."
            options={productosOptions}
            value={(watch('productos_suministrados') || []) as number[]}
            onChange={(vals) =>
              setValue('productos_suministrados', vals as number[], { shouldDirty: true })
            }
            helperText="Precios y modalidad logística se asignan en Cadena de Suministro → Precios."
          />
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
