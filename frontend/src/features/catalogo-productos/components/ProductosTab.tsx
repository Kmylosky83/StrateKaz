import { useState } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';

import {
  useProductos,
  useCreateProducto,
  useUpdateProducto,
  useDeleteProducto,
} from '../hooks/useProductos';
import { useCategorias } from '../hooks/useCategorias';
import { useUnidadesMedida } from '../hooks/useUnidadesMedida';
import type { Producto, CreateProductoDTO, ProductoTipo } from '../types/catalogoProductos.types';
import { PRODUCTO_TIPO_LABELS } from '../types/catalogoProductos.types';

const TIPO_OPTIONS = Object.entries(PRODUCTO_TIPO_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const TIPO_BADGE_VARIANT: Record<ProductoTipo, 'default' | 'success' | 'warning' | 'info'> = {
  MATERIA_PRIMA: 'info',
  INSUMO: 'warning',
  PRODUCTO_TERMINADO: 'success',
  SERVICIO: 'default',
};

export default function ProductosTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [codigoManual, setCodigoManual] = useState(false);

  const { data: productos = [], isLoading } = useProductos();
  const { data: categorias = [] } = useCategorias();
  const { data: unidades = [] } = useUnidadesMedida();

  const createMutation = useCreateProducto();
  const updateMutation = useUpdateProducto();
  const deleteMutation = useDeleteProducto();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductoDTO>({
    defaultValues: { tipo: 'MATERIA_PRIMA' },
  });

  const categoriaOptions = [
    { value: '', label: 'Sin categoría' },
    ...categorias.map((c) => ({ value: String(c.id), label: c.full_path || c.nombre })),
  ];

  const unidadOptions = unidades.map((u) => ({
    value: String(u.id),
    label: `${u.nombre} (${u.abreviatura})`,
  }));

  function openCreate() {
    setEditing(null);
    setCodigoManual(false);
    reset({ codigo: '', nombre: '', descripcion: '', tipo: 'MATERIA_PRIMA', sku: '', notas: '' });
    setModalOpen(true);
  }

  function openEdit(p: Producto) {
    setEditing(p);
    setCodigoManual(true);
    reset({
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion,
      categoria: p.categoria ?? undefined,
      unidad_medida: p.unidad_medida,
      tipo: p.tipo,
      precio_referencia: p.precio_referencia ?? undefined,
      sku: p.sku,
      notas: p.notas,
    });
    setModalOpen(true);
  }

  function onSubmit(raw: CreateProductoDTO) {
    const data: CreateProductoDTO = {
      ...raw,
      codigo: codigoManual || editing ? raw.codigo || undefined : undefined,
      categoria: raw.categoria ? Number(raw.categoria) : null,
      unidad_medida: Number(raw.unidad_medida),
      precio_referencia: raw.precio_referencia || null,
    };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data },
        {
          onSuccess: () => {
            setModalOpen(false);
            reset();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setModalOpen(false);
          reset();
        },
      });
    }
  }

  function onDelete() {
    if (deletingId === null) return;
    deleteMutation.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo producto
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : productos.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8 text-slate-400" />}
            title="Sin productos"
            description="Crea el primer producto del catálogo maestro"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    Código
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    Nombre
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Tipo</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    Categoría
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    Unidad
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {productos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {p.codigo}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {p.nombre}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={TIPO_BADGE_VARIANT[p.tipo]}>
                        {PRODUCTO_TIPO_LABELS[p.tipo]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                      {p.categoria_nombre ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                      {p.unidad_medida_nombre} ({p.unidad_medida_abreviatura})
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingId(p.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <BaseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Código"
                placeholder={editing || codigoManual ? 'PROD-00001' : 'Se generará automáticamente'}
                disabled={!editing && !codigoManual}
                error={errors.codigo?.message}
                {...register('codigo')}
              />
              {!editing && (
                <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={codigoManual}
                    onChange={(e) => setCodigoManual(e.target.checked)}
                    className="rounded"
                  />
                  Ingresar código manualmente
                </label>
              )}
            </div>
            <Select label="Tipo" options={TIPO_OPTIONS} {...register('tipo')} />
          </div>
          <Input
            label="Nombre"
            required
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es obligatorio' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Categoría" options={categoriaOptions} {...register('categoria')} />
            <Select
              label="Unidad de medida"
              required
              options={unidadOptions}
              error={errors.unidad_medida?.message}
              {...register('unidad_medida', { required: 'La unidad de medida es obligatoria' })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU / Código externo"
              placeholder="Código de barras o referencia externa"
              {...register('sku')}
            />
            <Input
              label="Precio de referencia"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('precio_referencia')}
            />
          </div>
          <Textarea label="Descripción" rows={2} {...register('descripcion')} />
          <Textarea label="Notas" rows={2} {...register('notas')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner size="sm" /> : editing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={onDelete}
        title="Eliminar producto"
        description="Esta acción eliminará el producto del catálogo. Si está referenciado en inventario o recepciones, el sistema lo impedirá."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
