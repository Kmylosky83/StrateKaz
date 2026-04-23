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

import {
  useSelectCiudades,
  useSelectDepartamentos,
  useSelectTiposDocumento,
} from '@/hooks/useSelectLists';
import { PILookupField } from '@/features/gestion-estrategica/components/PILookupField';

import { useModalidadesLogistica } from '@/features/supply-chain/hooks/usePrecios';
import { useProductos } from '../hooks/useProductos';
import {
  useTiposProveedor,
  useCreateProveedor,
  useUpdateProveedor,
  useProveedor,
} from '../hooks/useProveedores';
import type {
  Proveedor,
  ProveedorDetail,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  TipoPersona,
} from '../types/proveedor.types';
import { PRODUCTO_TIPO_LABELS } from '../types/catalogoProductos.types';

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
    ciudad: z.number().nullable().optional(),
    direccion: z.string().optional().default(''),
    modalidad_logistica: z.number().nullable().optional(),
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
  ciudad: null,
  direccion: '',
  modalidad_logistica: null,
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
  const { data: modalidadesLogistica = [] } = useModalidadesLogistica();

  // Ciudad filtrada por departamento — solo fetch cuando hay depto seleccionado.
  const departamentoSeleccionado = watch('departamento');
  const { data: ciudades = [] } = useSelectCiudades(
    departamentoSeleccionado ?? undefined,
    departamentoSeleccionado !== null && departamentoSeleccionado !== undefined
  );

  // Filtro dinámico: qué tipos de productos suministra este tipo de proveedor.
  // Si `tipos_productos_permitidos` está vacío o undefined → se permiten todos.
  // Si tiene valores (["MATERIA_PRIMA", "SERVICIO", ...]) → solo esos tipos.
  const tipoProveedorSeleccionado = watch('tipo_proveedor');
  const tiposPermitidos = useMemo(() => {
    if (!tipoProveedorSeleccionado) return null; // null = sin filtrar
    const tp = tiposProveedor.find((t) => t.id === Number(tipoProveedorSeleccionado));
    const lista = tp?.tipos_productos_permitidos ?? [];
    return lista.length > 0 ? lista : null;
  }, [tipoProveedorSeleccionado, tiposProveedor]);

  // Productos suministrables por el tipo de proveedor actual
  const productosSuministrables = useMemo(() => {
    const base = Array.isArray(productos) ? productos : [];
    if (!tiposPermitidos) return base; // sin filtro
    return base.filter((p) => tiposPermitidos.includes(p.tipo));
  }, [productos, tiposPermitidos]);

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

  // ─── Fetch detail completo al editar ───
  // El `proveedor` que recibe el modal es un ProveedorList (serializer liviano)
  // sin productos_suministrados, parte_interesada_id/nombre, ni direccion.
  // Hacemos fetch explícito del detail cuando hay proveedor + modal abierto.
  //
  // `staleTime: 0` + `refetchOnMount: 'always'` fuerzan re-fetch cada vez que
  // se abre el modal, para evitar que el cache de React Query devuelva data
  // desactualizada después de ediciones (useUpdateProveedor solo invalida
  // el cache de list, no de detail).
  const { data: proveedorDetail } = useProveedor(isEdit && isOpen ? (proveedor!.id as number) : 0, {
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // ─── Effect: reset form al abrir/editar ───
  // EDIT: esperar a que `proveedorDetail` llegue (tiene M2M + PI). Si hacemos
  // reset con el list item inicial + otro reset con el detail después, se
  // produce un flicker que puede sobreescribir valores que el usuario ya
  // tocó (por ejemplo una PI recién seleccionada).
  //
  // CREATE: reset a DEFAULT_VALUES solo cuando el modal se abre por primera
  // vez, identificando la transición isOpen:false→true (no en cada render).
  useEffect(() => {
    if (!isOpen) return;

    if (proveedor) {
      // EDIT: solo resetear cuando el detail está disponible
      if (!proveedorDetail) return;
      const detailed = proveedorDetail;
      reset({
        tipo_persona: detailed.tipo_persona,
        tipo_proveedor: detailed.tipo_proveedor,
        razon_social: detailed.razon_social,
        nombre_comercial: detailed.nombre_comercial,
        tipo_documento: detailed.tipo_documento,
        numero_documento: detailed.numero_documento,
        nit: detailed.nit ?? '',
        telefono: detailed.telefono ?? '',
        email: detailed.email ?? '',
        departamento: detailed.departamento,
        ciudad: detailed.ciudad ?? null,
        direccion: detailed.direccion ?? '',
        modalidad_logistica: detailed.modalidad_logistica ?? null,
        productos_suministrados: detailed.productos_suministrados ?? [],
        is_active: detailed.is_active,
      });
      setPiId(detailed.parte_interesada_id ?? null);
      setPiNombre(detailed.parte_interesada_nombre ?? '');
    } else {
      // CREATE: reset una sola vez al abrir (isOpen va de false→true)
      reset(DEFAULT_VALUES);
      setPiId(null);
      setPiNombre('');
    }
    // Intencionalmente NO incluimos `reset` — usamos ref estable de RHF.
    // Incluir `reset` dispara el efecto en cada render cuando el form cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedor, proveedorDetail, isOpen]);

  const tipoPersona = watch('tipo_persona');
  const esEmpresa = tipoPersona === 'empresa';

  // Auto-setear tipo_documento=NIT cuando se cambia a empresa
  useEffect(() => {
    if (esEmpresa && nitTipoDocId && watch('tipo_documento') !== nitTipoDocId) {
      setValue('tipo_documento', nitTipoDocId, { shouldDirty: true });
    }
  }, [esEmpresa, nitTipoDocId, setValue, watch]);

  // Opciones para el combobox de productos/servicios suministrables
  const productosOptions = useMemo(
    () =>
      productosSuministrables.map((p) => ({
        value: p.id,
        label: p.nombre,
        description: p.codigo ? `${p.codigo} · ${PRODUCTO_TIPO_LABELS[p.tipo]}` : undefined,
      })),
    [productosSuministrables]
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
      ciudad: data.ciudad ?? null,
      direccion: data.direccion || undefined,
      modalidad_logistica: data.modalidad_logistica ?? null,
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
              // Al cambiar departamento, reset la ciudad (evita ciudad huérfana de otro depto)
              setValue('ciudad', null, { shouldDirty: true });
            }}
          >
            <option value="">Seleccionar...</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
          <Select
            label="Ciudad"
            value={watch('ciudad') ?? ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              setValue('ciudad', v, { shouldDirty: true });
            }}
            disabled={!departamentoSeleccionado}
            helperText={
              !departamentoSeleccionado ? 'Seleccione primero un departamento' : undefined
            }
          >
            <option value="">{departamentoSeleccionado ? 'Seleccionar ciudad...' : '—'}</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
          <div className="md:col-span-2">
            <Textarea
              label="Dirección"
              {...form.register('direccion')}
              rows={2}
              placeholder="Ej: Calle 123 #45-67"
            />
          </div>
          {/* Fase 1 modalidad: se define al crear el proveedor y aplica a todas sus MPs */}
          <div className="md:col-span-2">
            <Select
              label="Modalidad logística"
              value={watch('modalidad_logistica') ?? ''}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null;
                setValue('modalidad_logistica', v, { shouldDirty: true });
              }}
              helperText="Define cómo llega la materia prima desde este proveedor. Se aplica a todas sus MPs."
            >
              <option value="">Sin modalidad definida</option>
              {modalidadesLogistica.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* 3. PRODUCTOS / SERVICIOS SUMINISTRADOS */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
          Productos / Servicios suministrados
        </h3>
        {tipoProveedorSeleccionado && tiposPermitidos && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Según el tipo de proveedor seleccionado, se filtran:{' '}
            <span className="font-medium">
              {tiposPermitidos.map((t) => PRODUCTO_TIPO_LABELS[t]).join(', ')}
            </span>
          </p>
        )}
        {!tipoProveedorSeleccionado ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecciona primero el <strong>Tipo de proveedor</strong> arriba para filtrar qué puede
            suministrar.
          </p>
        ) : productosSuministrables.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay productos/servicios del tipo requerido. Crea uno en el Catálogo de Productos y
            regresa aquí.
          </p>
        ) : (
          <MultiSelectCombobox
            label="Productos/servicios que suministra"
            placeholder="Seleccionar..."
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
