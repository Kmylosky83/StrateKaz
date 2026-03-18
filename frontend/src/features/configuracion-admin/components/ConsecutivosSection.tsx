/**
 * Sección: Consecutivos
 *
 * Tabla CRUD de configuración de consecutivos automáticos.
 * Tipo A: SectionToolbar + ResponsiveTable.
 *
 * Campos alineados con ConsecutivoConfigSerializer (backend):
 * prefix, suffix, current_number, padding, categoria, ejemplo_formato
 */
import { useState, useMemo } from 'react';
import { Hash, Plus, Pencil, Trash2 } from 'lucide-react';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ResponsiveTable, type ColumnDef } from '@/components/common/ResponsiveTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { useConsecutivosConfig, useDeleteConsecutivo } from '../hooks/useConfigAdmin';
import { ConsecutivoFormModal } from './ConsecutivoFormModal';
import type { ConsecutivoConfig } from '../types/config-admin.types';

export const ConsecutivosSection = () => {
  const { data: consecutivos, isLoading } = useConsecutivosConfig();
  const deleteMutation = useDeleteConsecutivo();
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CONSECUTIVOS, 'create');
  const canEdit = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CONSECUTIVOS, 'edit');
  const canDelete = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CONSECUTIVOS, 'delete');
  const { color: moduleColor } = useModuleColor('configuracion_plataforma');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ConsecutivoConfig | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: ConsecutivoConfig) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditItem(null);
  };

  const columns: ColumnDef<ConsecutivoConfig>[] = useMemo(
    () => [
      {
        id: 'codigo',
        header: 'Código',
        accessorKey: 'codigo',
        cell: (row) => <span className="font-mono text-sm font-medium">{row.codigo}</span>,
      },
      {
        id: 'nombre',
        header: 'Nombre',
        accessorKey: 'nombre',
      },
      {
        id: 'categoria',
        header: 'Categoría',
        accessorKey: 'categoria',
        cell: (row) => (
          <Badge variant="default" size="sm">
            {row.categoria_display || row.categoria}
          </Badge>
        ),
      },
      {
        id: 'formato',
        header: 'Formato',
        accessorKey: 'ejemplo_formato',
        cell: (row) => (
          <span className="font-mono text-xs text-gray-500">{row.ejemplo_formato || '—'}</span>
        ),
      },
      {
        id: 'siguiente',
        header: 'Siguiente #',
        accessorKey: 'current_number',
        cell: (row) => (
          <span className="font-mono">
            {String((row.current_number || 0) + 1).padStart(row.padding || 4, '0')}
          </span>
        ),
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'is_active',
        cell: (row) => (
          <Badge variant={row.is_active ? 'success' : 'default'} size="sm">
            {row.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
      {
        id: 'acciones',
        header: '',
        cell: (row) => (
          <div className="flex items-center gap-1 justify-end">
            {canEdit && !row.es_sistema && (
              <Button variant="ghost" size="sm" title="Editar" onClick={() => openEdit(row)}>
                <Pencil size={14} />
              </Button>
            )}
            {canDelete && !row.es_sistema && (
              <Button
                variant="ghost"
                size="sm"
                title="Eliminar"
                onClick={() => setDeleteId(row.id)}
              >
                <Trash2 size={14} className="text-red-500" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const items = Array.isArray(consecutivos)
    ? consecutivos
    : ((consecutivos as { results?: ConsecutivoConfig[] })?.results ?? []);

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Consecutivos"
        description="Numeración automática de documentos por tipo y módulo"
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Consecutivo',
                onClick: openCreate,
              }
            : undefined
        }
        moduleColor={moduleColor}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Hash size={40} />}
          title="Sin consecutivos configurados"
          description="Configura la numeración automática de documentos del sistema."
          action={
            canCreate
              ? {
                  label: 'Crear Consecutivo',
                  onClick: openCreate,
                }
              : undefined
          }
        />
      ) : (
        <ResponsiveTable data={items} columns={columns} />
      )}

      <ConsecutivoFormModal consecutivo={editItem} isOpen={formOpen} onClose={closeForm} />

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, {
              onSuccess: () => setDeleteId(null),
            });
          }
        }}
        title="Eliminar consecutivo"
        message="Esta acción no se puede deshacer. El consecutivo dejará de generar números automáticos."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
