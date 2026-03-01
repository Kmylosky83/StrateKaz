/**
 * Tab Unidades de Negocio - CRUD de plantas y centros de distribución
 */
import { useState } from 'react';
import { Plus, Edit, Trash2, Building2, Factory, Warehouse } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';

import {
  useUnidadesNegocio,
  useCreateUnidadNegocio,
  useUpdateUnidadNegocio,
  useDeleteUnidadNegocio,
} from '../hooks/useProveedores';
import type { UnidadNegocio } from '../types';

// ==================== COMPONENTE ====================

export function UnidadesNegocioTab() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<UnidadNegocio | null>(null);

  // Query
  const { data: unidadesData, isLoading } = useUnidadesNegocio();
  const unidades: UnidadNegocio[] = Array.isArray(unidadesData)
    ? unidadesData
    : (unidadesData as any)?.results || [];

  // Mutations
  const createMutation = useCreateUnidadNegocio();
  const updateMutation = useUpdateUnidadNegocio();
  const deleteMutation = useDeleteUnidadNegocio();

  // ==================== HANDLERS ====================

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      codigo: String(fd.get('codigo')),
      nombre: String(fd.get('nombre')),
      descripcion: String(fd.get('descripcion') || ''),
      direccion: String(fd.get('direccion') || ''),
      telefono: String(fd.get('telefono') || ''),
      email: String(fd.get('email') || ''),
      responsable: String(fd.get('responsable') || ''),
      es_planta_produccion: fd.get('es_planta_produccion') === 'true',
      es_centro_distribucion: fd.get('es_centro_distribucion') === 'true',
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
          description="Registre plantas de producción y centros de distribución"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
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
                      <div>
                        <p>{un.nombre}</p>
                        {un.descripcion && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {un.descripcion}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {un.direccion || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {un.responsable || '-'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {un.es_planta_produccion && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-teal-700 dark:text-teal-400"
                            title="Planta de Producción"
                          >
                            <Factory className="w-3.5 h-3.5" />
                            Planta
                          </span>
                        )}
                        {un.es_centro_distribucion && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400"
                            title="Centro de Distribución"
                          >
                            <Warehouse className="w-3.5 h-3.5" />
                            Centro
                          </span>
                        )}
                        {!un.es_planta_produccion && !un.es_centro_distribucion && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
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
          <div className="grid grid-cols-2 gap-4">
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

          <Textarea
            label="Descripción"
            name="descripcion"
            rows={2}
            defaultValue={editItem?.descripcion || ''}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Dirección"
              type="text"
              name="direccion"
              defaultValue={editItem?.direccion || ''}
            />
            <Input
              label="Responsable"
              type="text"
              name="responsable"
              defaultValue={editItem?.responsable || ''}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Teléfono"
              type="tel"
              name="telefono"
              defaultValue={editItem?.telefono || ''}
            />
            <Input
              label="Email"
              type="email"
              name="email"
              defaultValue={editItem?.email || ''}
            />
            <div className="space-y-3">
              <Select
                label="Planta de Producción"
                name="es_planta_produccion"
                defaultValue={editItem?.es_planta_produccion ? 'true' : 'false'}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </Select>
              <Select
                label="Centro de Distribución"
                name="es_centro_distribucion"
                defaultValue={editItem?.es_centro_distribucion ? 'true' : 'false'}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </Select>
            </div>
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
