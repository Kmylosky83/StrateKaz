/**
 * Tab Almacenes — CRUD global de almacenes físicos del tenant.
 *
 * Endpoint: /api/supply-chain/catalogos/almacenes/
 *
 * Diferencia con la vista por Sede en gestion-estrategica:
 *   Aquí se listan TODOS los almacenes con filtro opcional por sede.
 *
 * Design System:
 *   SectionToolbar · Card+Table · Badge · Spinner · EmptyState · ConfirmDialog
 *   Button · Select · BaseModal (vía AlmacenFormModal).
 */
import { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Power, Warehouse } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Select } from '@/components/forms/Select';

import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

import { useAlmacenes, useDeleteAlmacen, useUpdateAlmacen } from '../hooks/useAlmacenes';
import { useSedes } from '@/features/gestion-estrategica/hooks/useStrategic';
import AlmacenFormModal from './AlmacenFormModal';
import type { Almacen } from '../types';
import type { SedeEmpresaList } from '@/features/gestion-estrategica/types/strategic.types';

export default function AlmacenesTab() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.INVENTARIO, 'create');
  const canEdit = canDo(Modules.SUPPLY_CHAIN, Sections.INVENTARIO, 'edit');
  const canDelete = canDo(Modules.SUPPLY_CHAIN, Sections.INVENTARIO, 'delete');

  const [sedeFilter, setSedeFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Almacen | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  const filterParams = useMemo(
    () => (sedeFilter ? { sede: parseInt(sedeFilter, 10) } : undefined),
    [sedeFilter]
  );

  const { data: almacenes, isLoading, isError } = useAlmacenes(filterParams);
  const { data: sedesData } = useSedes();
  const updateMutation = useUpdateAlmacen();
  const deleteMutation = useDeleteAlmacen();

  const sedes: SedeEmpresaList[] = Array.isArray(sedesData)
    ? (sedesData as SedeEmpresaList[])
    : ((sedesData as { results?: SedeEmpresaList[] } | undefined)?.results ?? []);

  const items = almacenes ?? [];

  const sedeOptions = [
    { value: '', label: 'Todas las sedes' },
    ...sedes.map((s) => ({
      value: s.id.toString(),
      label: s.codigo ? `${s.codigo} — ${s.nombre}` : s.nombre,
    })),
  ];

  const handleEdit = (alm: Almacen) => {
    setEditItem(alm);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const handleToggleActive = async (alm: Almacen) => {
    try {
      await updateMutation.mutateAsync({
        id: alm.id,
        data: { is_active: !alm.is_active },
      });
    } catch {
      // El hook maneja el toast de error.
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      await deleteMutation.mutateAsync(deleteItemId);
    } catch {
      // El hook maneja el toast de error.
    } finally {
      setDeleteItemId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sede:</label>
        <div className="w-72">
          <Select
            value={sedeFilter}
            onChange={(e) => setSedeFilter(e.target.value)}
            options={sedeOptions}
          />
        </div>
      </div>

      <SectionToolbar
        title="Almacenes"
        count={items.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Almacén',
                onClick: handleNew,
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Warehouse className="w-16 h-16" />}
          title="Error al cargar almacenes"
          description="Verifique su conexión y vuelva a intentar"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="w-16 h-16" />}
          title="No hay almacenes registrados"
          description={
            sedeFilter
              ? 'No hay almacenes en la sede seleccionada'
              : 'Cree el primer almacén físico del tenant (silo, bodega, tanque, pallet)'
          }
          action={
            canCreate
              ? {
                  label: 'Nuevo Almacén',
                  onClick: handleNew,
                  icon: <Plus className="w-4 h-4" />,
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sede
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Capacidad
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recibe / Despacha
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
                {items.map((alm) => (
                  <tr key={alm.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {alm.codigo}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {alm.nombre}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {alm.sede_nombre || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {alm.tipo_almacen_nombre || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                      {alm.capacidad_maxima
                        ? Number(alm.capacidad_maxima).toLocaleString('es-CO', {
                            maximumFractionDigits: 2,
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Badge variant={alm.permite_recepcion ? 'success' : 'gray'} size="sm">
                          {alm.permite_recepcion ? 'Recibe' : 'No recibe'}
                        </Badge>
                        <Badge variant={alm.permite_despacho ? 'primary' : 'gray'} size="sm">
                          {alm.permite_despacho ? 'Despacha' : 'No despacha'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={alm.is_active ? 'success' : 'gray'} size="sm">
                        {alm.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={alm.is_active ? 'Desactivar' : 'Activar'}
                            onClick={() => handleToggleActive(alm)}
                            disabled={updateMutation.isPending}
                          >
                            <Power
                              className={
                                alm.is_active ? 'w-4 h-4 text-success-600' : 'w-4 h-4 text-gray-400'
                              }
                            />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Editar"
                            onClick={() => handleEdit(alm)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Eliminar"
                            onClick={() => setDeleteItemId(alm.id)}
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

      <AlmacenFormModal
        almacen={editItem}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteItemId}
        title="Eliminar Almacén"
        message="¿Está seguro de eliminar este almacén? Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteItemId(null)}
      />
    </div>
  );
}
