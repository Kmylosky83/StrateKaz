/**
 * VoucherFormModal — Crear/editar VoucherRecepcion (H-SC-03 smoke)
 *
 * Formulario mínimo funcional para registrar un voucher de recepción
 * de MP. Auto-llena `precio_kg_snapshot` a partir del PrecioMP vigente
 * del proveedor + producto seleccionados.
 *
 * Flujo:
 *   1. Operador selecciona proveedor → se cargan productos MP suministrados
 *   2. Al seleccionar producto, se carga PrecioMP.precio_kg como snapshot
 *   3. Si el producto tiene `requiere_qc_recepcion=True`, el voucher nace
 *      PENDIENTE_QC y NO puede aprobarse hasta registrar QC (ver H-SC-03).
 */
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Beaker, Package, Scale, Warehouse } from 'lucide-react';

import { FormModal } from '@/components/modals/FormModal';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Badge } from '@/components/common/Badge';
import apiClient from '@/api/axios-config';

import { useCreateVoucher } from '../hooks/useRecepcion';
// H-SC-03 F8: Proveedor vive en catalogo_productos (CT layer) desde 2026-04-21
// (Opción A). El hook legacy en supply-chain/hooks apunta al endpoint viejo
// que ya no lista proveedores nuevos.
import { useProveedores } from '@/features/catalogo-productos/hooks/useProveedores';
import { usePreciosMP } from '../hooks/usePrecios';
import type { ModalidadEntrega } from '../types/recepcion.types';

// ─── Schema de validación ───
const voucherSchema = z
  .object({
    proveedor: z.coerce.number().int().positive('Selecciona un proveedor'),
    producto: z.coerce.number().int().positive('Selecciona un producto'),
    modalidad_entrega: z.enum(['DIRECTO', 'TRANSPORTE_INTERNO', 'RECOLECCION']),
    uneg_transportista: z.coerce.number().int().nullable().optional(),
    fecha_viaje: z.string().min(1, 'La fecha es obligatoria'),
    peso_bruto_kg: z.coerce.number().positive('El peso bruto debe ser mayor a cero'),
    peso_tara_kg: z.coerce.number().min(0, 'La tara no puede ser negativa'),
    precio_kg_snapshot: z.coerce.number().nonnegative('El precio no puede ser negativo'),
    almacen_destino: z.coerce.number().int().positive('Selecciona un almacén'),
    operador_bascula: z.coerce.number().int().positive(),
    observaciones: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.peso_tara_kg > data.peso_bruto_kg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['peso_tara_kg'],
        message: 'La tara no puede ser mayor que el peso bruto',
      });
    }
    if (data.modalidad_entrega === 'RECOLECCION' && !data.uneg_transportista) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['uneg_transportista'],
        message: 'RECOLECCION requiere UNeg transportista',
      });
    }
  });

type VoucherFormValues = z.infer<typeof voucherSchema>;

const MODALIDAD_OPTIONS: { value: ModalidadEntrega; label: string }[] = [
  { value: 'DIRECTO', label: 'Entrega directa del proveedor' },
  { value: 'TRANSPORTE_INTERNO', label: 'Transporte interno de la empresa' },
  { value: 'RECOLECCION', label: 'Recolección por la empresa' },
];

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
}

// ─── Queries auxiliares (inline) ───
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

function useProductoById(id: number | null | undefined) {
  return useQuery({
    queryKey: ['producto', id],
    queryFn: async () => {
      const resp = await apiClient.get<ProductoMini>(`/catalogo-productos/productos/${id}/`);
      return resp.data;
    },
    enabled: !!id,
  });
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
      producto: 0,
      modalidad_entrega: 'DIRECTO',
      uneg_transportista: null,
      fecha_viaje: new Date().toISOString().slice(0, 10),
      peso_bruto_kg: 0,
      peso_tara_kg: 0,
      precio_kg_snapshot: 0,
      almacen_destino: 0,
      operador_bascula: currentUserId,
      observaciones: '',
    },
  });
  const { register, watch, setValue, formState, reset } = form;

  const proveedorSel = watch('proveedor');
  const productoSel = watch('producto');
  const modalidadSel = watch('modalidad_entrega');
  const pesoBruto = Number(watch('peso_bruto_kg') ?? 0);
  const pesoTara = Number(watch('peso_tara_kg') ?? 0);
  const pesoNeto = Math.max(pesoBruto - pesoTara, 0);

  // Productos disponibles del proveedor (desde PrecioMP)
  const productosDelProveedor = useMemo(() => {
    if (!proveedorSel) return [];
    const map = new Map<number, { id: number; nombre: string; codigo: string; precio: string }>();
    for (const p of precios) {
      if (p.proveedor === Number(proveedorSel)) {
        map.set(p.producto, {
          id: p.producto,
          nombre: p.producto_nombre,
          codigo: p.producto_codigo,
          precio: p.precio_kg,
        });
      }
    }
    return Array.from(map.values());
  }, [proveedorSel, precios]);

  // Auto-fill precio cuando cambia producto
  useEffect(() => {
    if (!productoSel) return;
    const item = productosDelProveedor.find((x) => x.id === Number(productoSel));
    if (item) {
      setValue('precio_kg_snapshot', Number(item.precio), { shouldDirty: true });
    }
  }, [productoSel, productosDelProveedor, setValue]);

  // Cargar detalle del producto para mostrar badge QC
  const { data: productoDetalle } = useProductoById(Number(productoSel) || null);
  const requiereQC = productoDetalle?.requiere_qc_recepcion === true;

  // Reset al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleSubmit = async (data: VoucherFormValues) => {
    await createMut.mutateAsync({
      proveedor: data.proveedor,
      producto: data.producto,
      modalidad_entrega: data.modalidad_entrega,
      uneg_transportista: data.uneg_transportista ?? null,
      fecha_viaje: data.fecha_viaje,
      peso_bruto_kg: data.peso_bruto_kg,
      peso_tara_kg: data.peso_tara_kg,
      precio_kg_snapshot: data.precio_kg_snapshot,
      almacen_destino: data.almacen_destino,
      operador_bascula: data.operador_bascula,
      observaciones: data.observaciones || undefined,
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
      {/* PARTES */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" /> Partes
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
            label="Producto (Materia Prima)"
            required
            helperText={
              !proveedorSel
                ? 'Primero selecciona un proveedor'
                : productosDelProveedor.length === 0
                  ? 'Este proveedor no tiene productos con precio vigente'
                  : undefined
            }
            error={formState.errors.producto?.message}
            disabled={!proveedorSel || productosDelProveedor.length === 0}
            {...register('producto')}
          >
            <option value={0}>Seleccionar...</option>
            {productosDelProveedor.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.codigo})
              </option>
            ))}
          </Select>
        </div>
        {requiereQC && (
          <div className="mt-2 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <Beaker className="w-4 h-4" />
            <Badge variant="warning" size="sm">
              Requiere QC
            </Badge>
            <span className="text-xs">
              El voucher se creará en estado PENDIENTE_QC y no podrá aprobarse sin registrar control
              de calidad.
            </span>
          </div>
        )}
      </Card>

      {/* LOGÍSTICA */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Logística</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              control={form.control}
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

      {/* PESAJE */}
      <Card variant="bordered" padding="md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4" /> Pesaje (báscula)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Peso bruto (kg)"
            type="number"
            step="0.001"
            required
            error={formState.errors.peso_bruto_kg?.message}
            {...register('peso_bruto_kg')}
          />
          <Input
            label="Peso tara (kg)"
            type="number"
            step="0.001"
            error={formState.errors.peso_tara_kg?.message}
            {...register('peso_tara_kg')}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Peso neto (calc.)
            </label>
            <div className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-sm">
              {pesoNeto.toLocaleString('es-CO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 3,
              })}{' '}
              kg
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Input
            label="Precio por kg (snapshot)"
            type="number"
            step="0.01"
            required
            helperText="Se auto-llena con el precio vigente del proveedor. Editable si hay un acuerdo puntual."
            error={formState.errors.precio_kg_snapshot?.message}
            {...register('precio_kg_snapshot')}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor estimado (COP)
            </label>
            <div className="px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-sm">
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0,
              }).format(pesoNeto * Number(watch('precio_kg_snapshot') || 0))}
            </div>
          </div>
        </div>
      </Card>

      {/* DESTINO */}
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
