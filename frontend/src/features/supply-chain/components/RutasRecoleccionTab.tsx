/**
 * Tab Rutas de Recolección — Supply Chain (H-SC-RUTA-02)
 *
 * Listado y CRUD de RutaRecoleccion (catálogo CT). Una ruta es un recurso
 * logístico de la empresa (vehículo + recorrido). Tiene `modo_operacion`:
 *   - PASS_THROUGH: empresa paga directo al productor.
 *   - SEMI_AUTONOMA: la ruta tiene caja propia; doble precio.
 * La Ruta NUNCA es Proveedor (los proveedores reales se asocian vía RutaParada).
 */
import { useMemo, useState } from 'react';
import { Edit, MapPin, Plus, Route, Trash2 } from 'lucide-react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Spinner } from '@/components/common/Spinner';

import { Modules, Sections } from '@/constants/permissions';
import { usePermissions } from '@/hooks/usePermissions';

import { useDeleteRuta, useRutas } from '../hooks/useRutas';
import type { RutaRecoleccionList } from '../types/rutas.types';
import RutaFormModal from './RutaFormModal';
import RutaParadasModal from './RutaParadasModal';

export default function RutasRecoleccionTab() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.CATALOGOS_SC, 'create');
  const canUpdate = canDo(Modules.SUPPLY_CHAIN, Sections.CATALOGOS_SC, 'update');
  const canDelete = canDo(Modules.SUPPLY_CHAIN, Sections.CATALOGOS_SC, 'delete');

  const [showForm, setShowForm] = useState(false);
  const [editRuta, setEditRuta] = useState<RutaRecoleccionList | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [paradasRuta, setParadasRuta] = useState<RutaRecoleccionList | null>(null);

  const { data, isLoading } = useRutas();
  const deleteMut = useDeleteRuta();

  const rutas: RutaRecoleccionList[] = useMemo(() => data ?? [], [data]);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Rutas de Recolección"
        count={rutas.length}
        primaryAction={
          canCreate
            ? {
                label: 'Agregar Ruta',
                onClick: () => {
                  setEditRuta(null);
                  setShowForm(true);
                },
              }
            : undefined
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : rutas.length === 0 ? (
        <EmptyState
          icon={<Route className="w-16 h-16" />}
          title="No hay rutas registradas"
          description="Agregue rutas de recolección para usarlas en vouchers de recepción con modalidad RECOLECCIÓN."
          action={
            canCreate
              ? {
                  label: 'Agregar Ruta',
                  onClick: () => {
                    setEditRuta(null);
                    setShowForm(true);
                  },
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
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Modo
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
                {rutas.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {r.codigo}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {r.nombre}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {r.descripcion || '-'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {r.modo_operacion === 'SEMI_AUTONOMA' ? (
                        <Badge variant="primary" size="sm">
                          Semi-autónoma
                        </Badge>
                      ) : (
                        <Badge variant="gray" size="sm">
                          Directa
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={r.is_active ? 'success' : 'gray'} size="sm">
                        {r.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Gestionar paradas"
                            onClick={() => setParadasRuta(r)}
                          >
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Editar"
                            onClick={() => {
                              setEditRuta(r);
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
                            title="Eliminar"
                            onClick={() => setDeleteId(r.id)}
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

      <RutaFormModal
        isOpen={showForm}
        ruta={editRuta}
        onClose={() => {
          setShowForm(false);
          setEditRuta(null);
        }}
      />

      {paradasRuta && (
        <RutaParadasModal
          ruta={paradasRuta}
          isOpen={!!paradasRuta}
          onClose={() => setParadasRuta(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Eliminar Ruta"
        message="¿Está seguro de eliminar esta ruta de recolección? Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
