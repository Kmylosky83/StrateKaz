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
import { Input, Select, Textarea, MultiSelectCombobox } from '@/components/forms';
import { Switch } from '@/components/forms';

import { useSelectDepartamentos, useSelectTiposDocumento } from '@/hooks/useSelectLists';
import { PILookupField } from '@/features/gestion-estrategica/components/PILookupField';
import { useModalidadesLogistica } from '@/features/supply-chain/hooks/usePrecios';
import axiosInstance from '@/api/axios-config';

import { useProductos } from '../hooks/useProductos';
import { useTiposProveedor, useCreateProveedor, useUpdateProveedor } from '../hooks/useProveedores';
import type {
  Proveedor,
  ProveedorDetail,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  TipoPersona,
} from '../types/proveedor.types';

/** Fila inline de precio por MP dentro del modal de proveedor. */
interface PrecioInline {
  precio_kg: string;
  modalidad_logistica: number | null;
}

// ─── Schema Zod ────────────────────────────────────────────────────────────

const TIPO_PERSONA_OPTIONS: { value: TipoPersona; label: string }[] = [
  { value: 'natural', label: 'Persona Natural' },
  { value: 'empresa', label: 'Empresa' },
];

const proveedorSchema = z.object({
  tipo_persona: z.enum(['natural', 'empresa']),
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
  const { data: modalidades = [] } = useModalidadesLogistica();

  // Solo productos tipo MATERIA_PRIMA son suministrables
  const productosMP = useMemo(
    () => (Array.isArray(productos) ? productos.filter((p) => p.tipo === 'MATERIA_PRIMA') : []),
    [productos]
  );

  // ─── Mutations ───
  const createMutation = useCreateProveedor();
  const updateMutation = useUpdateProveedor();
  const [asignandoPrecios, setAsignandoPrecios] = useState(false);
  const isLoading = createMutation.isPending || updateMutation.isPending || asignandoPrecios;

  // ─── Vínculo PI ───
  const [piId, setPiId] = useState<number | null>(null);
  const [piNombre, setPiNombre] = useState('');

  // ─── Precios inline por MP seleccionada ───
  const [preciosInline, setPreciosInline] = useState<Record<number, PrecioInline>>({});

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
      setPreciosInline({}); // al editar no pre-llenamos precios (ya están en PreciosTab)
    } else if (!proveedor && isOpen) {
      reset(DEFAULT_VALUES);
      setPiId(null);
      setPiNombre('');
      setPreciosInline({});
    }
  }, [proveedor, isOpen, reset]);

  // Sincronizar preciosInline cuando el usuario (des)selecciona MPs del combobox.
  // Mantener filas existentes; agregar nuevas; eliminar deseleccionadas.
  const productosSeleccionados = watch('productos_suministrados') || [];
  useEffect(() => {
    setPreciosInline((prev) => {
      const next: Record<number, PrecioInline> = {};
      for (const id of productosSeleccionados) {
        next[id] = prev[id] ?? { precio_kg: '', modalidad_logistica: null };
      }
      return next;
    });
  }, [productosSeleccionados.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const tipoPersona = watch('tipo_persona');
  const esEmpresa = tipoPersona === 'empresa';

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
      // 1. Crear/actualizar proveedor
      let proveedorId: number;
      if (isEdit && proveedor) {
        await updateMutation.mutateAsync({ id: proveedor.id, data: payload as UpdateProveedorDTO });
        proveedorId = proveedor.id;
      } else {
        const created = await createMutation.mutateAsync(payload);
        proveedorId = (created as { id: number }).id;
      }

      // 2. Asignar precios (batch) — solo los que tienen precio_kg ingresado
      const preciosBatch = Object.entries(preciosInline)
        .filter(([, p]) => p.precio_kg !== '' && !isNaN(Number(p.precio_kg)))
        .map(([productoId, p]) => ({
          producto: Number(productoId),
          precio_kg: Number(p.precio_kg),
          modalidad_logistica: p.modalidad_logistica,
        }));

      if (preciosBatch.length > 0) {
        setAsignandoPrecios(true);
        try {
          await axiosInstance.post(
            `/catalogo-productos/proveedores/${proveedorId}/asignar-precios/`,
            { precios: preciosBatch }
          );
        } finally {
          setAsignandoPrecios(false);
        }
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

      {/* 3. PRODUCTOS SUMINISTRADOS + PRECIOS INLINE */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Productos suministrados y precios
        </h3>
        {productosMP.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay productos tipo Materia Prima registrados. Puede agregar productos desde el
            Catálogo y regresar aquí.
          </p>
        ) : (
          <>
            <MultiSelectCombobox
              label="Materias primas que suministra"
              placeholder="Seleccionar productos..."
              emptyMessage="Sin resultados. Pruebe con otra búsqueda."
              options={productosOptions}
              value={(watch('productos_suministrados') || []) as number[]}
              onChange={(vals) =>
                setValue('productos_suministrados', vals as number[], { shouldDirty: true })
              }
              helperText="Solo productos del catálogo con tipo Materia Prima."
            />

            {productosSeleccionados.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precios por materia prima (opcional — se puede dejar vacío y asignar después)
                </p>
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                          Materia prima
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 w-36">
                          Precio/kg (COP)
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 w-48">
                          Modalidad logística
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {productosSeleccionados.map((productoId) => {
                        const producto = productosMP.find((p) => p.id === productoId);
                        if (!producto) return null;
                        const inline = preciosInline[productoId] ?? {
                          precio_kg: '',
                          modalidad_logistica: null,
                        };
                        return (
                          <tr key={productoId}>
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                              {producto.nombre}
                              {producto.codigo && (
                                <div className="text-xs text-gray-500 font-mono">
                                  {producto.codigo}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                placeholder="0"
                                value={inline.precio_kg}
                                onChange={(e) =>
                                  setPreciosInline((prev) => ({
                                    ...prev,
                                    [productoId]: { ...inline, precio_kg: e.target.value },
                                  }))
                                }
                                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <select
                                value={inline.modalidad_logistica ?? ''}
                                onChange={(e) =>
                                  setPreciosInline((prev) => ({
                                    ...prev,
                                    [productoId]: {
                                      ...inline,
                                      modalidad_logistica: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                    },
                                  }))
                                }
                                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              >
                                <option value="">Sin modalidad</option>
                                {modalidades.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.nombre}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Cambios en precios existentes se registran automáticamente en el historial.
                </p>
              </div>
            )}
          </>
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
