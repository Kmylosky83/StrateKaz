import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Package, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormModal } from '@/components/modals/FormModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Switch } from '@/components/forms/Switch';
import { Textarea } from '@/components/forms/Textarea';
import { PageTabs } from '@/components/layout/PageTabs';

import { useSectionPermissions } from '@/components/common/ProtectedAction';
import { Modules, Sections } from '@/constants/permissions';

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

type TipoFiltro = 'TODOS' | ProductoTipo;

const TABS_TIPO: { id: TipoFiltro; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'MATERIA_PRIMA', label: 'Materia prima' },
  { id: 'INSUMO', label: 'Insumos' },
  { id: 'PRODUCTO_TERMINADO', label: 'Prod. terminados' },
  { id: 'SERVICIO', label: 'Servicios' },
];

export default function ProductosTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [codigoManual, setCodigoManual] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('TODOS');

  // RBAC granular
  const { canCreate, canEdit, canDelete } = useSectionPermissions(
    Modules.CATALOGO_PRODUCTOS,
    Sections.GESTION_PRODUCTOS
  );

  const { data: productos = [], isLoading } = useProductos();
  const { data: categorias = [] } = useCategorias();
  const { data: unidades = [] } = useUnidadesMedida();

  // Productos filtrados según el tab activo
  const productosFiltrados = useMemo(
    () => (tipoFiltro === 'TODOS' ? productos : productos.filter((p) => p.tipo === tipoFiltro)),
    [productos, tipoFiltro]
  );

  const createMutation = useCreateProducto();
  const updateMutation = useUpdateProducto();
  const deleteMutation = useDeleteProducto();

  const form = useForm<CreateProductoDTO>({
    defaultValues: { tipo: 'MATERIA_PRIMA', requiere_qc_recepcion: false },
  });
  const {
    register,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form;

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
    // Pre-selecciona el tipo del tab activo (si no es TODOS)
    const tipoDefault: ProductoTipo = tipoFiltro === 'TODOS' ? 'MATERIA_PRIMA' : tipoFiltro;
    reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: tipoDefault,
      notas: '',
      requiere_qc_recepcion: false,
    });
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
      notas: p.notas,
      requiere_qc_recepcion: p.requiere_qc_recepcion,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function onSubmit(raw: CreateProductoDTO) {
    const data: CreateProductoDTO = {
      ...raw,
      codigo: codigoManual || editing ? raw.codigo || undefined : undefined,
      categoria: raw.categoria ? Number(raw.categoria) : null,
      unidad_medida: Number(raw.unidad_medida),
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data }, { onSuccess: closeModal });
    } else {
      createMutation.mutate(data, { onSuccess: closeModal });
    }
  }

  function onDelete() {
    if (deletingId === null) return;
    deleteMutation.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {/* Tabs por tipo + acción crear */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <PageTabs
          tabs={TABS_TIPO}
          activeTab={tipoFiltro}
          onTabChange={(t) => setTipoFiltro(t as TipoFiltro)}
          variant="underline"
          size="sm"
        />
        {canCreate && (
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo {tipoFiltro === 'SERVICIO' ? 'servicio' : 'producto'}
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : productosFiltrados.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8 text-slate-400" />}
            title={`Sin ${tipoFiltro === 'TODOS' ? 'productos' : PRODUCTO_TIPO_LABELS[tipoFiltro].toLowerCase()}`}
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
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">SKU</th>
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
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-center">
                    QC
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {productosFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {p.codigo}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-500">
                      {p.sku || '—'}
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
                    <td className="px-4 py-3 text-center">
                      {p.requiere_qc_recepcion ? (
                        <Badge variant="warning" size="sm">
                          Requiere
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="sm" onClick={() => setDeletingId(p.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <FormModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={onSubmit}
        form={form}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        subtitle={
          editing ? `Código ${editing.codigo}` : 'Código interno se generará automáticamente'
        }
        submitLabel={editing ? 'Guardar cambios' : 'Crear producto'}
        isLoading={isPending}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Código"
              placeholder={editing || codigoManual ? 'PROD-00001' : 'Se generará automáticamente'}
              disabled={!editing && !codigoManual}
              error={errors.codigo?.message}
              leftIcon={!editing && !codigoManual ? <Lock className="w-4 h-4" /> : undefined}
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
          <Select
            label="Categoría"
            options={categoriaOptions}
            helperText="Usa 'Sin categoría' si aún no has definido taxonomía"
            {...register('categoria')}
          />
          <Select
            label="Unidad de medida"
            required
            options={unidadOptions}
            error={errors.unidad_medida?.message}
            {...register('unidad_medida', { required: 'La unidad de medida es obligatoria' })}
          />
        </div>

        <Textarea label="Descripción" rows={2} {...register('descripcion')} />

        <Textarea
          label="Notas"
          rows={2}
          placeholder="Información adicional (opcional)"
          {...register('notas')}
        />

        {/* H-SC-03: Control de calidad en recepción */}
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 p-3 space-y-2">
          <div className="flex items-start gap-3">
            <Switch
              checked={watch('requiere_qc_recepcion') ?? false}
              onCheckedChange={(checked) =>
                setValue('requiere_qc_recepcion', checked, { shouldDirty: true })
              }
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Requiere control de calidad en recepción
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Si está activado, el voucher de recepción no podrá aprobarse sin registrar el QC.
                Las especificaciones por parámetro se configuran aparte.
              </p>
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={onDelete}
        title="Eliminar producto"
        message="Esta acción eliminará el producto del catálogo. Si está referenciado en inventario o recepciones, el sistema lo impedirá."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
