import { useState } from 'react';
import { Plus, Edit, Trash2, FolderTree, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormModal } from '@/components/modals/FormModal';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';

import {
  useCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
} from '../hooks/useCategorias';
import type {
  CategoriaProducto,
  CreateCategoriaProductoDTO,
} from '../types/catalogoProductos.types';

export default function CategoriasTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoriaProducto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: categorias = [], isLoading } = useCategorias();
  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();
  const deleteMutation = useDeleteCategoria();

  const form = useForm<CreateCategoriaProductoDTO>();
  const {
    register,
    reset,
    formState: { errors },
  } = form;

  function openCreate() {
    setEditing(null);
    reset({ nombre: '', descripcion: '', codigo: '', orden: 0 });
    setModalOpen(true);
  }

  function openEdit(cat: CategoriaProducto) {
    setEditing(cat);
    reset({
      nombre: cat.nombre,
      descripcion: cat.descripcion,
      codigo: cat.codigo,
      orden: cat.orden,
      parent: cat.parent ?? undefined,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function onSubmit(data: CreateCategoriaProductoDTO) {
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
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nueva categoría
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : categorias.length === 0 ? (
          <EmptyState
            icon={<FolderTree className="w-8 h-8 text-slate-400" />}
            title="Sin categorías"
            description="Crea la primera categoría de productos (ej: Grasas Animales, Empaques...)"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    Nombre
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    Ruta completa
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    Código
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    Subcategorías
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categorias.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        {cat.is_system && (
                          <Lock
                            className="w-3.5 h-3.5 text-slate-400"
                            aria-label="Categoría del sistema"
                          />
                        )}
                        {cat.nombre}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                      {cat.full_path}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {cat.codigo || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {cat.subcategorias_count}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!cat.is_system && (
                          <Button variant="ghost" size="sm" onClick={() => setDeletingId(cat.id)}>
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
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        submitLabel={editing ? 'Guardar cambios' : 'Crear categoría'}
        isLoading={isPending}
      >
        <Input
          label="Nombre"
          required
          placeholder="Ej: Grasas Animales"
          error={errors.nombre?.message}
          {...register('nombre', { required: 'El nombre es obligatorio' })}
        />
        <Input
          label="Código interno"
          placeholder="Ej: MAT-GRASA"
          helperText="Opcional — útil para integraciones con sistemas externos"
          {...register('codigo')}
        />
        <Textarea label="Descripción" rows={3} {...register('descripcion')} />
        <Input
          label="Orden"
          type="number"
          helperText="Controla el orden de aparición en listados"
          {...register('orden', { valueAsNumber: true })}
        />
      </FormModal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={onDelete}
        title="Eliminar categoría"
        message="Esta acción eliminará la categoría permanentemente. Las subcategorías y productos asociados quedarán sin categoría padre."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
