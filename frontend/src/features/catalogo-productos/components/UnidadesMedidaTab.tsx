import { useState } from 'react';
import { Plus, Edit, Trash2, Ruler, Lock } from 'lucide-react';
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

import {
  useUnidadesMedida,
  useCreateUnidadMedida,
  useUpdateUnidadMedida,
  useDeleteUnidadMedida,
} from '../hooks/useUnidadesMedida';
import type { UnidadMedida, CreateUnidadMedidaDTO } from '../types/catalogoProductos.types';
import { UNIDAD_MEDIDA_TIPO_LABELS } from '../types/catalogoProductos.types';

const TIPO_OPTIONS = Object.entries(UNIDAD_MEDIDA_TIPO_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function UnidadesMedidaTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UnidadMedida | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: unidades = [], isLoading } = useUnidadesMedida();
  const createMutation = useCreateUnidadMedida();
  const updateMutation = useUpdateUnidadMedida();
  const deleteMutation = useDeleteUnidadMedida();

  const form = useForm<CreateUnidadMedidaDTO>({
    defaultValues: { tipo: 'UNIDAD', es_base: false, orden: 0 },
  });
  const {
    register,
    reset,
    formState: { errors },
  } = form;

  function openCreate() {
    setEditing(null);
    reset({
      nombre: '',
      abreviatura: '',
      tipo: 'UNIDAD',
      factor_conversion: null,
      es_base: false,
      orden: 0,
    });
    setModalOpen(true);
  }

  function openEdit(u: UnidadMedida) {
    setEditing(u);
    reset({
      nombre: u.nombre,
      abreviatura: u.abreviatura,
      tipo: u.tipo,
      factor_conversion: u.factor_conversion,
      es_base: u.es_base,
      orden: u.orden,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function onSubmit(data: CreateUnidadMedidaDTO) {
    const payload = { ...data, factor_conversion: data.factor_conversion || null };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload }, { onSuccess: closeModal });
    } else {
      createMutation.mutate(payload, { onSuccess: closeModal });
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
          Nueva unidad
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : unidades.length === 0 ? (
          <EmptyState
            icon={<Ruler className="w-8 h-8 text-slate-400" />}
            title="Sin unidades de medida"
            description="Crea la primera unidad de medida (ej: kg, litro, unidad...)"
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
                    Abreviatura
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Tipo</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Base</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {unidades.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        {u.is_system && (
                          <Lock
                            className="w-3.5 h-3.5 text-slate-400"
                            aria-label="Unidad del sistema"
                          />
                        )}
                        {u.nombre}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {u.abreviatura}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{UNIDAD_MEDIDA_TIPO_LABELS[u.tipo]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {u.es_base ? <Badge variant="success">Base</Badge> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!u.is_system && (
                          <Button variant="ghost" size="sm" onClick={() => setDeletingId(u.id)}>
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
        title={editing ? 'Editar unidad de medida' : 'Nueva unidad de medida'}
        submitLabel={editing ? 'Guardar cambios' : 'Crear unidad'}
        isLoading={isPending}
      >
        <Input
          label="Nombre"
          required
          placeholder="Ej: Kilogramo"
          error={errors.nombre?.message}
          {...register('nombre', { required: 'El nombre es obligatorio' })}
        />
        <Input
          label="Abreviatura"
          required
          placeholder="Ej: kg"
          helperText="Símbolo corto que se muestra en listados e informes"
          error={errors.abreviatura?.message}
          {...register('abreviatura', { required: 'La abreviatura es obligatoria' })}
        />
        <Select label="Tipo" options={TIPO_OPTIONS} {...register('tipo')} />
        <Input
          label="Factor de conversión"
          type="number"
          step="any"
          placeholder="Ej: 1000"
          helperText="Conversión a la unidad base del tipo (ej: 1000 para g → kg). Opcional."
          {...register('factor_conversion')}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" {...register('es_base')} className="rounded" />
          Es unidad base del tipo
        </label>
        <Input label="Orden" type="number" {...register('orden', { valueAsNumber: true })} />
      </FormModal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={onDelete}
        title="Eliminar unidad de medida"
        message="Si hay productos usando esta unidad, el sistema impedirá la eliminación (PROTECT)."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
