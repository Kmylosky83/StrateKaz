/**
 * Tab Tipos de Proveedor (CT-layer).
 *
 * Catálogo clasificador dinámico. Cada tipo expone flags operativos
 * (`requiere_materia_prima`, `requiere_modalidad_logistica`) que condicionan
 * el formulario de Proveedor. Migrado desde supply-chain/CatalogosTab el
 * 2026-04-22 (Sidebar V3).
 */
import { useState } from 'react';
import { Plus, Edit, Trash2, Tags } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormModal } from '@/components/modals/FormModal';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';

import { useSectionPermissions } from '@/components/common/ProtectedAction';
import { Modules, Sections } from '@/constants/permissions';

import {
  useTiposProveedor,
  useCreateTipoProveedor,
  useUpdateTipoProveedor,
  useDeleteTipoProveedor,
} from '../hooks/useProveedores';
import type {
  TipoProveedor,
  CreateTipoProveedorDTO,
  TipoProductoPermitido,
} from '../types/proveedor.types';
import { TIPO_PRODUCTO_PERMITIDO_LABELS } from '../types/proveedor.types';

const TIPO_PRODUCTO_OPTIONS = Object.entries(TIPO_PRODUCTO_PERMITIDO_LABELS) as [
  TipoProductoPermitido,
  string,
][];

export default function TiposProveedorTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TipoProveedor | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { canCreate, canEdit, canDelete } = useSectionPermissions(
    Modules.CATALOGO_PRODUCTOS,
    Sections.TIPOS_PROVEEDOR
  );

  const { data: tipos = [], isLoading } = useTiposProveedor();
  const createMutation = useCreateTipoProveedor();
  const updateMutation = useUpdateTipoProveedor();
  const deleteMutation = useDeleteTipoProveedor();

  const form = useForm<CreateTipoProveedorDTO>({
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      requiere_materia_prima: false,
      requiere_modalidad_logistica: false,
      tipos_productos_permitidos: [],
      orden: 0,
      is_active: true,
    },
  });
  const {
    register,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const tiposSeleccionados = watch('tipos_productos_permitidos') ?? [];

  const toggleTipoProducto = (tipo: TipoProductoPermitido) => {
    const current = tiposSeleccionados;
    const next = current.includes(tipo) ? current.filter((t) => t !== tipo) : [...current, tipo];
    setValue('tipos_productos_permitidos', next, { shouldDirty: true });
  };

  function openCreate() {
    setEditing(null);
    reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      requiere_materia_prima: false,
      requiere_modalidad_logistica: false,
      tipos_productos_permitidos: [],
      orden: 0,
      is_active: true,
    });
    setModalOpen(true);
  }

  function openEdit(t: TipoProveedor) {
    setEditing(t);
    reset({
      codigo: t.codigo,
      nombre: t.nombre,
      descripcion: t.descripcion ?? '',
      requiere_materia_prima: t.requiere_materia_prima,
      requiere_modalidad_logistica: t.requiere_modalidad_logistica,
      tipos_productos_permitidos: t.tipos_productos_permitidos ?? [],
      orden: t.orden,
      is_active: t.is_active,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function onSubmit(data: CreateTipoProveedorDTO) {
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
      <div className="flex justify-end mb-4">
        {canCreate && (
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo tipo
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : tipos.length === 0 ? (
          <EmptyState
            icon={<Tags className="w-8 h-8 text-slate-400" />}
            title="Sin tipos de proveedor"
            description="Crea el primer tipo para clasificar a tus proveedores (ej: Fabricante, Distribuidor, Transportista)."
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
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    Descripción
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-center">
                    Productos
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-center">
                    Modalidad logística
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-center">
                    Estado
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tipos.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {t.codigo}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {t.nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {t.descripcion || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.requiere_materia_prima ? (
                        <Badge variant="success">Requiere</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.requiere_modalidad_logistica ? (
                        <Badge variant="info">Requiere</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={t.is_active ? 'success' : 'default'}>
                        {t.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="sm" onClick={() => setDeletingId(t.id)}>
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
        title={editing ? 'Editar tipo de proveedor' : 'Nuevo tipo de proveedor'}
        submitLabel={editing ? 'Guardar cambios' : 'Crear tipo'}
        isLoading={isPending}
      >
        <Input
          label="Código"
          required
          placeholder="Ej: FABRICANTE"
          helperText="Identificador único en mayúsculas (no se puede cambiar fácilmente)"
          error={errors.codigo?.message}
          {...register('codigo', { required: 'El código es obligatorio' })}
        />
        <Input
          label="Nombre"
          required
          placeholder="Ej: Fabricante"
          error={errors.nombre?.message}
          {...register('nombre', { required: 'El nombre es obligatorio' })}
        />
        <Textarea
          label="Descripción"
          rows={2}
          placeholder="Breve descripción del tipo (opcional)"
          {...register('descripcion')}
        />

        {/* Tipos de productos permitidos — configuración dinámica */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              ¿Qué puede suministrar este tipo de proveedor?
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filtra qué productos/servicios aparecen al crear un proveedor de este tipo. Si no
              seleccionas ninguno, se permiten todos.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TIPO_PRODUCTO_OPTIONS.map(([value, label]) => {
              const selected = tiposSeleccionados.includes(value);
              return (
                <label
                  key={value}
                  className={`flex items-center gap-2 text-sm rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                    selected
                      ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleTipoProducto(value)}
                    className="rounded"
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            {...register('requiere_modalidad_logistica')}
            className="rounded"
          />
          Requiere modalidad logística en precios
          <span className="text-xs text-slate-400">(Entrega en planta / recolección)</span>
        </label>
        <Input label="Orden" type="number" {...register('orden', { valueAsNumber: true })} />
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" {...register('is_active')} className="rounded" />
          Activo
        </label>
      </FormModal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={onDelete}
        title="Eliminar tipo de proveedor"
        message="Si hay proveedores asignados a este tipo, el sistema podría impedir la eliminación."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
