/**
 * Tab Precios — Precios vigentes Proveedor × Producto (MP) + modalidad logística.
 *
 * Post refactor 2026-04-21:
 *   - Proveedor vive en CT (catalogo_productos)
 *   - Producto con tipo=MATERIA_PRIMA del catálogo
 *   - Modalidad logística por (proveedor, producto), no global por proveedor
 *   - Al editar precio_kg, backend crea HistorialPrecio automático via perform_update
 *
 * Obligatoria modalidad en UI solo si TipoProveedor.requiere_modalidad_logistica=True
 * (backend responde `tipo_proveedor_requiere_modalidad` en cada precio).
 */
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Edit, Plus, Trash2, Truck } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormModal } from '@/components/modals/FormModal';
import { Input, Select, Textarea } from '@/components/forms';

import { useProveedores } from '@/features/catalogo-productos/hooks/useProveedores';
import { useProductos } from '@/features/catalogo-productos/hooks/useProductos';
import {
  usePreciosMP,
  useCreatePrecioMP,
  useUpdatePrecioMP,
  useDeletePrecioMP,
  useModalidadesLogistica,
} from '../hooks/usePrecios';
import type { PrecioMP } from '../types/precio.types';

// ─── Schema ────────────────────────────────────────────────────────────────

const createSchema = z.object({
  proveedor: z.number().min(1, 'Seleccione un proveedor'),
  producto: z.number().min(1, 'Seleccione un producto'),
  precio_kg: z
    .union([z.string(), z.number()])
    .refine((v) => Number(v) >= 0, 'El precio no puede ser negativo'),
  modalidad_logistica: z.number().nullable().optional(),
});

const updateSchema = z.object({
  precio_kg: z
    .union([z.string(), z.number()])
    .refine((v) => Number(v) >= 0, 'El precio no puede ser negativo'),
  modalidad_logistica: z.number().nullable().optional(),
  motivo: z.string().optional().default(''),
});

type CreateValues = z.infer<typeof createSchema>;
type UpdateValues = z.infer<typeof updateSchema>;

// ─── Utilidades ────────────────────────────────────────────────────────────

const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(num);
};

// ─── Componente ────────────────────────────────────────────────────────────

export function PreciosTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PrecioMP | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ─── Queries ───
  const { data: precios = [], isLoading } = usePreciosMP();
  const { data: proveedores = [] } = useProveedores();
  const { data: productos = [] } = useProductos();
  const { data: modalidades = [] } = useModalidadesLogistica();

  // Proveedores activos + productos MP
  const proveedoresActivos = useMemo(
    () => (Array.isArray(proveedores) ? proveedores.filter((p) => p.is_active) : []),
    [proveedores]
  );
  const productosMP = useMemo(
    () => (Array.isArray(productos) ? productos.filter((p) => p.tipo === 'MATERIA_PRIMA') : []),
    [productos]
  );

  // Para saber si la modalidad es obligatoria según el proveedor seleccionado
  const proveedoresMap = useMemo(() => {
    const map = new Map<number, { requiereModalidad: boolean }>();
    proveedoresActivos.forEach((p) => {
      map.set(p.id, { requiereModalidad: false });
    });
    return map;
  }, [proveedoresActivos]);

  // ─── Mutations ───
  const createMutation = useCreatePrecioMP();
  const updateMutation = useUpdatePrecioMP();
  const deleteMutation = useDeletePrecioMP();

  // ─── Forms ───
  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { proveedor: 0, producto: 0, precio_kg: '', modalidad_logistica: null },
  });
  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { precio_kg: '', modalidad_logistica: null, motivo: '' },
  });

  const form = editing ? updateForm : createForm;

  // ─── Handlers ───
  const handleOpenCreate = () => {
    setEditing(null);
    createForm.reset({ proveedor: 0, producto: 0, precio_kg: '', modalidad_logistica: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (precio: PrecioMP) => {
    setEditing(precio);
    updateForm.reset({
      precio_kg: precio.precio_kg,
      modalidad_logistica: precio.modalidad_logistica ?? null,
      motivo: '',
    });
    setModalOpen(true);
  };

  const handleClose = () => {
    setEditing(null);
    setModalOpen(false);
  };

  const handleSubmit = async (values: CreateValues | UpdateValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: {
            precio_kg: Number((values as UpdateValues).precio_kg),
            modalidad_logistica: (values as UpdateValues).modalidad_logistica ?? null,
            motivo: (values as UpdateValues).motivo || 'Ajuste de precio',
          },
        });
      } else {
        const v = values as CreateValues;
        await createMutation.mutateAsync({
          proveedor: v.proveedor,
          producto: v.producto,
          precio_kg: Number(v.precio_kg),
          modalidad_logistica: v.modalidad_logistica ?? null,
        });
      }
      handleClose();
    } catch {
      /* toast mostrado por mutation */
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteMutation.mutateAsync(deletingId);
    setDeletingId(null);
  };

  // ─── Render ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const precioEdit = editing;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Precio vigente por proveedor × materia prima. Al editar, el historial se registra
          automáticamente.
        </p>
        <Button variant="primary" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Precio
        </Button>
      </div>

      {precios.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            }
            title="Sin precios registrados"
            description="Cree el primer precio con el botón de arriba. Requiere al menos un proveedor y un producto tipo MP en el catálogo."
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Modalidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {precios.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {p.proveedor_nombre}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {p.proveedor_codigo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {p.producto_nombre}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {p.producto_codigo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(p.precio_kg)}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        por {p.unidad_medida || 'kg'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {p.modalidad_logistica_nombre ? (
                        <Badge variant="info">
                          <Truck className="w-3 h-3 mr-1 inline" />
                          {p.modalidad_logistica_nombre}
                        </Badge>
                      ) : p.tipo_proveedor_requiere_modalidad ? (
                        <Badge variant="warning">⚠ Falta asignar</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingId(p.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Crear o Editar */}
      <FormModal
        isOpen={modalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        form={form as never}
        title={precioEdit ? 'Editar Precio' : 'Nuevo Precio'}
        subtitle={
          precioEdit
            ? `${precioEdit.proveedor_nombre} × ${precioEdit.producto_nombre}`
            : 'Asigne precio y modalidad logística'
        }
        size="md"
        isLoading={createMutation.isPending || updateMutation.isPending}
        submitLabel={precioEdit ? 'Guardar cambios' : 'Crear Precio'}
        warnUnsavedChanges
      >
        {!precioEdit && (
          <>
            <Select
              label="Proveedor"
              value={createForm.watch('proveedor') || ''}
              onChange={(e) =>
                createForm.setValue('proveedor', Number(e.target.value), { shouldDirty: true })
              }
              required
              error={createForm.formState.errors.proveedor?.message}
            >
              <option value="">Seleccionar...</option>
              {proveedoresActivos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_comercial} ({p.codigo_interno})
                </option>
              ))}
            </Select>
            <Select
              label="Producto (Materia Prima)"
              value={createForm.watch('producto') || ''}
              onChange={(e) =>
                createForm.setValue('producto', Number(e.target.value), { shouldDirty: true })
              }
              required
              error={createForm.formState.errors.producto?.message}
            >
              <option value="">Seleccionar...</option>
              {productosMP.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.codigo})
                </option>
              ))}
            </Select>
          </>
        )}

        <Input
          label="Precio por kg (COP)"
          type="number"
          step="0.01"
          min={0}
          {...form.register('precio_kg' as never)}
          required
          error={form.formState.errors.precio_kg?.message as string | undefined}
        />

        <Select
          label="Modalidad logística"
          value={form.watch('modalidad_logistica' as never) ?? ''}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            form.setValue('modalidad_logistica' as never, v as never, { shouldDirty: true });
          }}
          helperText={
            precioEdit?.tipo_proveedor_requiere_modalidad
              ? 'Este proveedor exige modalidad logística.'
              : 'Opcional (entrega en planta / recolección en punto / etc.)'
          }
        >
          <option value="">Sin modalidad</option>
          {modalidades.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </Select>

        {precioEdit && (
          <Textarea
            label="Motivo del cambio"
            {...updateForm.register('motivo')}
            rows={2}
            placeholder="Ej: Ajuste por inflación, nuevo contrato..."
            helperText="Se registra en el historial de precios"
          />
        )}
      </FormModal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Eliminar precio"
        message="¿Está seguro? El precio quedará marcado como inactivo (soft delete)."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
