/**
 * Tab de Proveedores (CT-layer).
 * List + Create/Edit/Delete (soft).
 */
import { useState } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/common/Badge';

import { useSectionPermissions } from '@/components/common/ProtectedAction';
import { Modules, Sections } from '@/constants/permissions';

import { useProveedores, useDeleteProveedor } from '../hooks/useProveedores';
import type { Proveedor } from '../types/proveedor.types';
import ProveedorFormModal from './ProveedorFormModal';

const TIPO_PERSONA_BADGE: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
  natural: 'info',
  empresa: 'success',
  con_cedula: 'warning',
};

export default function ProveedoresTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // RBAC granular v4.1 — patrón canónico EntrevistasTab
  const { canCreate, canEdit, canDelete } = useSectionPermissions(
    Modules.CATALOGO_PRODUCTOS,
    Sections.PROVEEDORES
  );

  const { data: proveedores = [], isLoading } = useProveedores();
  const deleteMutation = useDeleteProveedor();

  // H-PROV-01 (2026-04-25): NO auto-redirigir a Precios.
  // La asignación de precios la hace otra persona (separación de roles).
  // El toast del modal informa adónde ir; el usuario decide cuándo.

  const handleOpenCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (prov: Proveedor) => {
    setEditing(prov);
    setModalOpen(true);
  };

  const handleClose = () => {
    setEditing(null);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteMutation.mutateAsync(deletingId);
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Dato maestro multi-industria. Tributario y bancario se gestionan en Administración.
        </p>
        {canCreate && (
          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {proveedores.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            }
            title="Sin proveedores"
            description="Cree el primer proveedor con el botón de arriba."
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Nombre comercial
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Ciudad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {proveedores.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {p.codigo_interno}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {p.nombre_comercial}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {p.razon_social}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={TIPO_PERSONA_BADGE[p.tipo_persona] ?? 'default'}>
                        {p.tipo_persona_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {p.tipo_documento_nombre}: {p.numero_documento}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {p.ciudad_nombre || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={p.is_active ? 'success' : 'default'}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(p.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
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

      <ProveedorFormModal
        isOpen={modalOpen}
        onClose={handleClose}
        proveedor={editing ?? undefined}
      />

      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Eliminar proveedor"
        message="¿Está seguro? El proveedor quedará marcado como inactivo."
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
