/**
 * VoucherFormModal — Crear VoucherRecepcion (header + líneas)
 *
 * Un voucher agrupa N materias primas de un mismo proveedor en un solo
 * viaje/pesaje. El precio NO se registra aquí (solo en Liquidacion).
 *
 * Flujo:
 *   1. Operador selecciona proveedor → se cargan productos MP disponibles
 *   2. Agrega una o más líneas: producto + peso bruto + peso tara
 *   3. El peso neto se calcula en tiempo real por línea
 *   4. Si algún producto tiene requiere_qc_recepcion=True, badge informativo
 */
import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Beaker, Package, Plus, Scale, Trash2, Warehouse } from 'lucide-react';

import { FormModal } from '@/components/modals/FormModal';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import apiClient from '@/api/axios-config';

import { useCreateVoucher } from '../hooks/useRecepcion';
import { useProveedores } from '@/features/catalogo-productos/hooks/useProveedores';
import { usePreciosMP } from '../hooks/usePrecios';
import type { ModalidadEntrega } from '../types/recepcion.types';

// ─── Schemas Zod ───

const lineaSchema = z
  .object({
    producto: z.coerce.number().int().min(1, 'Selecciona un producto'),
    peso_bruto_kg: z.coerce.number().positive('El bruto debe ser mayor a cero'),
    peso_tara_kg: z.coerce.number().min(0, 'La tara no puede ser negativa'),
  })
  .refine((d) => d.peso_tara_kg <= d.peso_bruto_kg, {
    message: 'La tara no puede ser mayor que el bruto',
    path: ['peso_tara_kg'],
  });

const voucherSchema = z
  .object({
    proveedor: z.coerce.number().int().min(1, 'Selecciona un proveedor'),
    modalidad_entrega: z.enum(['DIRECTO', 'TRANSPORTE_INTERNO', 'RECOLECCION']),
    uneg_transportista: z.coerce.number().int().nullable().optional(),
    fecha_viaje: z.string().min(1, 'La fecha es obligatoria'),
    almacen_destino: z.coerce.number().int().min(1, 'Selecciona un almacén'),
    operador_bascula: z.coerce.number().int().positive(),
    observaciones: z.string().optional(),
    lineas: z.array(lineaSchema).min(1, 'Agrega al menos un producto'),
  })
  .superRefine((data, ctx) => {
    if (data.modalidad_entrega === 'RECOLECCION' && !data.uneg_transportista) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['uneg_transportista'],
        message: 'RECOLECCION requiere UNeg transportista',
      });
    }
  });

type VoucherFormValues = z.infer<typeof voucherSchema>;

// ─── Constantes ───

const MODALIDAD_OPTIONS: { value: ModalidadEntrega; label: string }[] = [
  { value: 'DIRECTO', label: 'Entrega directa del proveedor' },
  { value: 'TRANSPORTE_INTERNO', label: 'Transporte interno de la empresa' },
  { value: 'RECOLECCION', label: 'Recolección por la empresa' },
];

const LINEA_VACIA = { producto: 0, peso_bruto_kg: 0, peso_tara_kg: 0 } as const;

// ─── Interfaces auxiliares ───

interface AlmacenListItem {
  id: number;
  codigo: string;
  nombre: string;
  permite_recepcion: boolean;
}

interface SedeListItem {
  id: number;
  nombre: string;
  tipo_unidad: string;
}

interface ProductoMini {
  id: number;
  codigo: string;
  nombre: string;
  requiere_qc_recepcion?: boolean;
}

// ─── Queries auxiliares (inline) ───

function useAlmacenesRecepcion() {
  return useQuery({
    queryKey: ['sc-almacenes-recepcion'],
    queryFn: async () => {
      const resp = await apiClient.get<AlmacenListItem[] | { results: AlmacenListItem[] }>(
        '/supply-chain/catalogos/almacenes/',
        { params: { permite_recepcion: true } }
      );
      const all = Array.isArray(resp.data) ? resp.data : (resp.data.results ?? []);
      return all.filter((a) => a.permite_recepcion);
    },
  });
}

function useSedesEmpresa() {
  return useQuery({
    queryKey: ['sedes-empresa'],
    queryFn: async () => {
      const resp = await apiClient.get<SedeListItem[] | { results: SedeListItem[] }>(
        '/gestion-estrategica/configuracion/sedes/'
      );
      return Array.isArray(resp.data) ? resp.data : (resp.data.results ?? []);
    },
  });
}

// ─── Props ───

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
}

// ─── Componente ───

export default function VoucherFormModal({
  isOpen,
  onClose,
  currentUserId,
}: VoucherFormModalProps) {
  const createMut = useCreateVoucher();
  const { data: proveedoresRaw } = useProveedores();
  const { data: preciosMPRaw } = usePreciosMP();
  const { data: almacenes = [] } = useAlmacenesRecepcion();
  const { data: sedes = [] } = useSedesEmpresa();

  const proveedores = useMemo(
    () =>
      Array.isArray(proveedoresRaw)
        ? proveedoresRaw
        : ((proveedoresRaw as { results?: typeof proveedoresRaw })?.results ?? []),
    [proveedoresRaw]
  );

  const precios = useMemo(
    () =>
      Array.isArray(preciosMPRaw)
        ? preciosMPRaw
        : ((preciosMPRaw as { results?: typeof preciosMPRaw })?.results ?? []),
    [preciosMPRaw]
  );

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      proveedor: 0,
      modalidad_entrega: 'DIRECTO',
      uneg_transportista: null,
      fecha_viaje: new Date().toISOString().slice(0, 10),
      almacen_destino: 0,
      operador_bascula: currentUserId,
      observaciones: '',
      lineas: [{ ...LINEA_VACIA }],
    },
  });

  const { register, watch, control, formState, reset } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineas',
  });

  const proveedorSel = watch('proveedor');
  const modalidadSel = watch('modalidad_entrega');

  // Productos disponibles del proveedor (deduplicados desde PrecioMP)
  const productosDelProveedor = useMemo((): ProductoMini[] => {
    if (!proveedorSel || Number(proveedorSel) === 0) return [];
    const map = new Map<number, ProductoMini>();
    for (const p of precios) {
      if (p.proveedor === Number(proveedorSel) && !map.has(p.producto)) {
        map.set(p.producto, {
          id: p.producto,
          codigo: p.producto_codigo,
          nombre: p.producto_nombre,
          // requiere_qc_recepcion no viene en PrecioMP — se omite aquí
        });
      }
    }
    return Array.from(map.values());
  }, [proveedorSel, precios]);

  // Limpiar líneas cuando cambia el proveedor
  useEffect(() => {
    form.setValue('lineas', [{ ...LINEA_VACIA }]);
  }, [proveedorSel, form]);

  // Reset al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleSubmit = async (data: VoucherFormValues) => {
    await createMut.mutateAsync({
      proveedor: data.proveedor,
      modalidad_entrega: data.modalidad_entrega,
      uneg_transportista: data.uneg_transportista ?? null,
      fecha_viaje: data.fecha_viaje,
      almacen_destino: data.almacen_destino,
      operador_bascula: data.operador_bascula,
      observaciones: data.observaciones || '',
      lineas: data.lineas.map((l) => ({
        producto: l.producto,
        peso_bruto_kg: l.peso_bruto_kg,
        peso_tara_kg: l.peso_tara_kg,
      })),
    });
    onClose();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      form={form}
      title="Nuevo Voucher de Recepción"
      subtitle="Registro primario de ingreso de MP (pesaje en báscula)"
      submitLabel={createMut.isPending ? 'Guardando...' : 'Guardar voucher'}
      isLoading={createMut.isPending}
      size="xl"
    >
      {/* ── LOGÍSTICA ── */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" /> Logística
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Proveedor"
            required
            error={formState.errors.proveedor?.message}
            {...register('proveedor')}
          >
            <option value={0}>Seleccionar...</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_comercial}
              </option>
            ))}
          </Select>

          <Select
            label="Modalidad de entrega"
            required
            error={formState.errors.modalidad_entrega?.message}
            {...register('modalidad_entrega')}
          >
            {MODALIDAD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Input
            label="Fecha del viaje"
            type="date"
            required
            error={formState.errors.fecha_viaje?.message}
            {...register('fecha_viaje')}
          />

          {modalidadSel === 'RECOLECCION' && (
            <Controller
              control={control}
              name="uneg_transportista"
              render={({ field }) => (
                <Select
                  label="UNeg transportista"
                  required
                  error={formState.errors.uneg_transportista?.message}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Seleccionar...</option>
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </Select>
              )}
            />
          )}
        </div>
      </Card>

      {/* ── MATERIAS PRIMAS (líneas) ── */}
      <Card variant="bordered" padding="md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4" /> Materias Primas
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...LINEA_VACIA })}
            disabled={!proveedorSel || Number(proveedorSel) === 0}
          >
            <Plus className="w-4 h-4 mr-1" /> Agregar producto
          </Button>
        </div>

        {/* Error global de líneas */}
        {formState.errors.lineas?.root?.message && (
          <p className="text-xs text-danger-600 mb-2">{formState.errors.lineas.root.message}</p>
        )}
        {typeof formState.errors.lineas?.message === 'string' && (
          <p className="text-xs text-danger-600 mb-2">{formState.errors.lineas.message}</p>
        )}

        {fields.length === 0 || Number(proveedorSel) === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Selecciona un proveedor y agrega al menos un producto.
          </p>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => {
              const pesoBruto = Number(watch(`lineas.${index}.peso_bruto_kg`) ?? 0);
              const pesoTara = Number(watch(`lineas.${index}.peso_tara_kg`) ?? 0);
              const pesoNeto = Math.max(pesoBruto - pesoTara, 0);

              return (
                <div
                  key={field.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Línea {index + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        title="Eliminar línea"
                      >
                        <Trash2 className="w-3 h-3 text-danger-600" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Producto */}
                    <div className="md:col-span-1">
                      <Select
                        label="Producto"
                        required
                        error={formState.errors.lineas?.[index]?.producto?.message}
                        {...register(`lineas.${index}.producto`)}
                      >
                        <option value={0}>Seleccionar...</option>
                        {productosDelProveedor.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.codigo})
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Peso bruto */}
                    <Input
                      label="Bruto (kg)"
                      type="number"
                      step="0.001"
                      required
                      error={formState.errors.lineas?.[index]?.peso_bruto_kg?.message}
                      {...register(`lineas.${index}.peso_bruto_kg`)}
                    />

                    {/* Peso tara */}
                    <Input
                      label="Tara (kg)"
                      type="number"
                      step="0.001"
                      error={formState.errors.lineas?.[index]?.peso_tara_kg?.message}
                      {...register(`lineas.${index}.peso_tara_kg`)}
                    />

                    {/* Peso neto (calculado) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Neto (kg)
                      </label>
                      <div className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-sm">
                        {pesoNeto.toLocaleString('es-CO', {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}{' '}
                        kg
                      </div>
                    </div>
                  </div>

                  {/* Badge QC informativo (cuando el producto lo requiera) */}
                  {(() => {
                    const prodId = Number(watch(`lineas.${index}.producto`));
                    const prod = productosDelProveedor.find((p) => p.id === prodId);
                    return prod?.requiere_qc_recepcion ? (
                      <div className="mt-2 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <Beaker className="w-4 h-4" />
                        <Badge variant="warning" size="sm">
                          Requiere QC
                        </Badge>
                        <span className="text-xs">
                          Este producto exige control de calidad antes de aprobar el voucher.
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── DESTINO ── */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Warehouse className="w-4 h-4" /> Destino
        </h3>
        <Select
          label="Almacén destino"
          required
          error={formState.errors.almacen_destino?.message}
          {...register('almacen_destino')}
        >
          <option value={0}>Seleccionar...</option>
          {almacenes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.codigo} — {a.nombre}
            </option>
          ))}
        </Select>
      </Card>

      <Textarea
        label="Observaciones"
        rows={2}
        placeholder="Notas del operador sobre el ingreso"
        {...register('observaciones')}
      />
    </FormModal>
  );
}
