/**
 * Sección: Integraciones Externas
 *
 * Tabla CRUD con acciones especiales: probar conexión, activar/desactivar.
 * Tipo A: SectionToolbar + ResponsiveTable.
 */
import { useState, useMemo } from 'react';
import { Plug, Pencil, Trash2, Wifi, Power } from 'lucide-react';
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
import {
  useIntegracionesConfig,
  useDeleteIntegracion,
  useTestIntegrationConnection,
  useToggleIntegrationStatus,
} from '../hooks/useConfigAdmin';
import { IntegracionFormModal } from './IntegracionFormModal';
import type { IntegracionExterna } from '../types/config-admin.types';

export const IntegracionesSection = () => {
  const { data: integraciones, isLoading } = useIntegracionesConfig();
  const deleteMutation = useDeleteIntegracion();
  const testMutation = useTestIntegrationConnection();
  const toggleMutation = useToggleIntegrationStatus();
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.INTEGRACIONES, 'create');
  const canEdit = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.INTEGRACIONES, 'edit');
  const canDelete = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.INTEGRACIONES, 'delete');
  const { color: moduleColor } = useModuleColor('configuracion_plataforma');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<IntegracionExterna | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: IntegracionExterna) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditItem(null);
  };

  const estadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'conectado':
        return 'success' as const;
      case 'error':
        return 'danger' as const;
      case 'pendiente':
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  };

  const columns: ColumnDef<IntegracionExterna>[] = useMemo(
    () => [
      {
        id: 'nombre',
        header: 'Nombre',
        accessorKey: 'nombre',
        cell: (row) => <span className="font-medium">{row.nombre}</span>,
      },
      {
        id: 'tipo_servicio',
        header: 'Tipo',
        accessorKey: 'tipo_servicio',
        cell: (row) => (
          <Badge variant="default" size="sm">
            {row.tipo_servicio}
          </Badge>
        ),
      },
      {
        id: 'proveedor',
        header: 'Proveedor',
        accessorKey: 'proveedor',
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'estado',
        cell: (row) => (
          <Badge variant={estadoBadgeVariant(row.estado)} size="sm">
            {row.estado}
          </Badge>
        ),
      },
      {
        id: 'activa',
        header: 'Activa',
        accessorKey: 'is_active',
        cell: (row) => (
          <Badge variant={row.is_active ? 'success' : 'default'} size="sm">
            {row.is_active ? 'Sí' : 'No'}
          </Badge>
        ),
      },
      {
        id: 'sincronizacion',
        header: 'Última Sincronización',
        accessorKey: 'ultima_sincronizacion',
        cell: (row) => (
          <span className="text-sm text-gray-500">
            {row.ultima_sincronizacion
              ? new Date(row.ultima_sincronizacion).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </span>
        ),
      },
      {
        id: 'acciones',
        header: '',
        cell: (row) => (
          <div className="flex items-center gap-1 justify-end">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                title="Probar conexión"
                onClick={() => testMutation.mutate(row.id)}
                disabled={testMutation.isPending}
              >
                <Wifi size={14} />
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                title={row.is_active ? 'Desactivar' : 'Activar'}
                onClick={() => toggleMutation.mutate(row.id)}
                disabled={toggleMutation.isPending}
              >
                <Power size={14} className={row.is_active ? 'text-green-500' : 'text-gray-400'} />
              </Button>
            )}
            {canEdit && (
              <Button variant="ghost" size="sm" title="Editar" onClick={() => openEdit(row)}>
                <Pencil size={14} />
              </Button>
            )}
            {canDelete && (
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
    [canEdit, canDelete, testMutation, toggleMutation]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const items = Array.isArray(integraciones)
    ? integraciones
    : ((integraciones as { results?: IntegracionExterna[] })?.results ?? []);

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Integraciones Externas"
        description="Conexiones con servicios y APIs de terceros"
        primaryAction={canCreate ? { label: 'Nueva Integración', onClick: openCreate } : undefined}
        moduleColor={moduleColor}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Plug size={40} />}
          title="Sin integraciones configuradas"
          description="Conecta servicios externos como facturación electrónica, pasarelas de pago o APIs de terceros."
          action={canCreate ? { label: 'Agregar Integración', onClick: openCreate } : undefined}
        />
      ) : (
        <ResponsiveTable data={items} columns={columns} />
      )}

      <IntegracionFormModal integracion={editItem} isOpen={formOpen} onClose={closeForm} />

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
        title="Eliminar integración"
        message="Esta acción eliminará la integración y sus credenciales asociadas. No se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
