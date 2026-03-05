/**
 * Tab Unidades de Negocio - CRUD de sedes, plantas y centros
 */
import { useState } from 'react';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';

import {
  useUnidadesNegocio,
  useCreateUnidadNegocio,
  useUpdateUnidadNegocio,
  useDeleteUnidadNegocio,
} from '../hooks/useProveedores';
import type { UnidadNegocio } from '../types';

// ==================== CONSTANTES ====================

const TIPOS_UNIDAD = [
  { value: 'SEDE', label: 'Sede' },
  { value: 'SUCURSAL', label: 'Sucursal' },
  { value: 'PLANTA', label: 'Planta' },
  { value: 'CENTRO_ACOPIO', label: 'Centro de Acopio' },
  { value: 'ALMACEN', label: 'Almacén' },
  { value: 'OTRO', label: 'Otro' },
];

// ==================== COMPONENTE ====================

export function UnidadesNegocioTab() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<UnidadNegocio | null>(null);

  // Query
  const { data: unidadesData, isLoading } = useUnidadesNegocio();
  const unidades: UnidadNegocio[] = Array.isArray(unidadesData)
    ? unidadesData
    : ((unidadesData as Record<string, unknown>)?.results as UnidadNegocio[]) || [];

  // Mutations
  const createMutation = useCreateUnidadNegocio();
  const updateMutation = useUpdateUnidadNegocio();
  const deleteMutation = useDeleteUnidadNegocio();

  // ==================== HANDLERS ====================

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const responsableVal = fd.get('responsable') ? Number(fd.get('responsable')) : undefined;
    const departamentoVal = fd.get('departamento') ? Number(fd.get('departamento')) : undefined;
    const data = {
      codigo: String(fd.get('codigo')),
      nombre: String(fd.get('nombre')),
      tipo_unidad: String(fd.get('tipo_unidad')) as UnidadNegocio['tipo_unidad'],
      direccion: String(fd.get('direccion') || ''),
      ciudad: String(fd.get('ciudad') || ''),
      ...(departamentoVal ? { departamento: departamentoVal } : {}),
      ...(responsableVal ? { responsable: responsableVal } : {}),
      is_active: true,
    };

    if (editItem) {
      await updateMutation.mutateAsync({ id: editItem.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Eliminar esta unidad de negocio?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Unidades de Negocio ({unidades.length})
        </h3>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
          }}
        >
          Nueva Unidad
        </Button>
      </div>

      {/* Tabla o Empty State */}
      {unidades.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-16 h-16" />}
          title="No hay unidades de negocio"
          description="Registre sedes, plantas y centros de acopio"
          action={{
            label: 'Nueva Unidad',
            onClick: () => setShowForm(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ciudad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {unidades.map((un) => (
                  <tr key={un.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {un.codigo}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {un.nombre}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant="info" size="sm">
                        {un.tipo_unidad_display || un.tipo_unidad}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {un.direccion || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {un.ciudad || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {un.responsable_nombre || '-'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={un.is_active ? 'success' : 'gray'} size="sm">
                        {un.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditItem(un);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(un.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-danger-600" />
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

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
        title={editItem ? 'Editar Unidad de Negocio' : 'Nueva Unidad de Negocio'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código *"
              type="text"
              name="codigo"
              required
              defaultValue={editItem?.codigo || ''}
              placeholder="Ej: UN-001"
            />
            <Input
              label="Nombre *"
              type="text"
              name="nombre"
              required
              defaultValue={editItem?.nombre || ''}
              placeholder="Nombre de la unidad"
            />
          </div>

          <Select
            label="Tipo de Unidad *"
            name="tipo_unidad"
            required
            defaultValue={editItem?.tipo_unidad || ''}
          >
            <option value="">Seleccione...</option>
            {TIPOS_UNIDAD.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Dirección *"
              type="text"
              name="direccion"
              required
              defaultValue={editItem?.direccion || ''}
            />
            <Input
              label="Ciudad *"
              type="text"
              name="ciudad"
              required
              defaultValue={editItem?.ciudad || ''}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : editItem
                  ? 'Actualizar'
                  : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
