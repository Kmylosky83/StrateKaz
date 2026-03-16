/**
 * Sección Unidades de Negocio - CRUD (Tipo B — tabla simple)
 * SectionToolbar + Card+Table + BaseModal + ConfirmDialog
 *
 * Fundación Tab 1 — Mi Empresa
 * Código autogenerado por backend (UN-001, UN-002...)
 */
import { useState } from 'react';
import { Edit, Trash2, Building2 } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';

import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useUnidadesNegocio,
  useCreateUnidadNegocio,
  useUpdateUnidadNegocio,
  useDeleteUnidadNegocio,
} from '../hooks/useUnidadesNegocio';
import type { UnidadNegocio } from '../types/unidad-negocio.types';

// ==================== CONSTANTES ====================

const TIPOS_UNIDAD = [
  { value: 'SEDE', label: 'Sede Administrativa' },
  { value: 'SUCURSAL', label: 'Sucursal' },
  { value: 'PLANTA', label: 'Planta de Producción' },
  { value: 'CENTRO_ACOPIO', label: 'Centro de Acopio' },
  { value: 'ALMACEN', label: 'Almacén' },
  { value: 'OTRO', label: 'Otro' },
];

const DEPARTAMENTOS_COLOMBIA = [
  { value: 'AMAZONAS', label: 'Amazonas' },
  { value: 'ANTIOQUIA', label: 'Antioquia' },
  { value: 'ARAUCA', label: 'Arauca' },
  { value: 'ATLANTICO', label: 'Atlántico' },
  { value: 'BOLIVAR', label: 'Bolívar' },
  { value: 'BOYACA', label: 'Boyacá' },
  { value: 'CALDAS', label: 'Caldas' },
  { value: 'CAQUETA', label: 'Caquetá' },
  { value: 'CASANARE', label: 'Casanare' },
  { value: 'CAUCA', label: 'Cauca' },
  { value: 'CESAR', label: 'Cesar' },
  { value: 'CHOCO', label: 'Chocó' },
  { value: 'CORDOBA', label: 'Córdoba' },
  { value: 'CUNDINAMARCA', label: 'Cundinamarca' },
  { value: 'GUAINIA', label: 'Guainía' },
  { value: 'GUAVIARE', label: 'Guaviare' },
  { value: 'HUILA', label: 'Huila' },
  { value: 'LA_GUAJIRA', label: 'La Guajira' },
  { value: 'MAGDALENA', label: 'Magdalena' },
  { value: 'META', label: 'Meta' },
  { value: 'NARINO', label: 'Nariño' },
  { value: 'NORTE_DE_SANTANDER', label: 'Norte de Santander' },
  { value: 'PUTUMAYO', label: 'Putumayo' },
  { value: 'QUINDIO', label: 'Quindío' },
  { value: 'RISARALDA', label: 'Risaralda' },
  { value: 'SAN_ANDRES', label: 'San Andrés y Providencia' },
  { value: 'SANTANDER', label: 'Santander' },
  { value: 'SUCRE', label: 'Sucre' },
  { value: 'TOLIMA', label: 'Tolima' },
  { value: 'VALLE_DEL_CAUCA', label: 'Valle del Cauca' },
  { value: 'VAUPES', label: 'Vaupés' },
  { value: 'VICHADA', label: 'Vichada' },
];

// ==================== COMPONENTE ====================

export function UnidadesNegocioSection() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.FUNDACION, Sections.UNIDADES_NEGOCIO, 'create');
  const canEdit = canDo(Modules.FUNDACION, Sections.UNIDADES_NEGOCIO, 'edit');
  const canDelete = canDo(Modules.FUNDACION, Sections.UNIDADES_NEGOCIO, 'delete');

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<UnidadNegocio | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: unidadesData, isLoading } = useUnidadesNegocio();
  const unidades: UnidadNegocio[] = Array.isArray(unidadesData)
    ? unidadesData
    : ((unidadesData as Record<string, unknown>)?.results as UnidadNegocio[]) || [];

  const createMutation = useCreateUnidadNegocio();
  const updateMutation = useUpdateUnidadNegocio();
  const deleteMutation = useDeleteUnidadNegocio();

  // ==================== HANDLERS ====================

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      nombre: String(fd.get('nombre')),
      tipo_unidad: String(fd.get('tipo_unidad')) as UnidadNegocio['tipo_unidad'],
      direccion: String(fd.get('direccion') || ''),
      ciudad: String(fd.get('ciudad') || ''),
      departamento: String(fd.get('departamento') || ''),
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

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
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
      <SectionToolbar
        title="Unidades de Negocio"
        count={unidades.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nueva Unidad',
                onClick: () => {
                  setEditItem(null);
                  setShowForm(true);
                },
              }
            : undefined
        }
      />

      {unidades.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-16 h-16" />}
          title="No hay unidades de negocio"
          description="Registre sedes, plantas y centros de acopio"
          action={
            canCreate
              ? {
                  label: 'Nueva Unidad',
                  onClick: () => setShowForm(true),
                  icon: <Building2 className="w-4 h-4" />,
                }
              : undefined
          }
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
                    Ciudad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Departamento
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
                      {un.ciudad || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {un.departamento_display || '-'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={un.is_active ? 'success' : 'gray'} size="sm">
                        {un.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
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
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(un.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-danger-600" />
                          </Button>
                        )}
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
      <BaseModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
        title={editItem ? 'Editar Unidad de Negocio' : 'Nueva Unidad de Negocio'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={() => {
                const form = document.getElementById('unidad-form') as HTMLFormElement;
                form?.requestSubmit();
              }}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : editItem
                  ? 'Actualizar'
                  : 'Crear'}
            </Button>
          </div>
        }
      >
        <form id="unidad-form" onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nombre *"
            type="text"
            name="nombre"
            required
            defaultValue={editItem?.nombre || ''}
            placeholder="Nombre de la unidad"
          />

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
              label="Dirección"
              type="text"
              name="direccion"
              defaultValue={editItem?.direccion || ''}
            />
            <Input label="Ciudad" type="text" name="ciudad" defaultValue={editItem?.ciudad || ''} />
          </div>

          <Select
            label="Departamento"
            name="departamento"
            defaultValue={editItem?.departamento || ''}
          >
            <option value="">Seleccione...</option>
            {DEPARTAMENTOS_COLOMBIA.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </form>
      </BaseModal>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Eliminar Unidad de Negocio"
        message="¿Está seguro de eliminar esta unidad de negocio? Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
