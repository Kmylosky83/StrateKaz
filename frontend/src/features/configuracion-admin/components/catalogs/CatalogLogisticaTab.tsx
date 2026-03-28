/**
 * Sub-tab Logística de Catálogos Maestros
 *
 * Contiene: Formas de Pago.
 */
import { useState, useMemo } from 'react';
import { Wallet, Pencil, Trash2 } from 'lucide-react';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ResponsiveTable, type ColumnDef } from '@/components/common/ResponsiveTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useFormasPagoConfig,
  useCreateFormaPago,
  useUpdateFormaPago,
  useDeleteFormaPago,
} from '../../hooks/useConfigAdmin';
import { CatalogFormModal } from './CatalogFormModal';
import type { FormaPago, SimpleCatalogItem } from '../../types/config-admin.types';

type ModuleColor = string | undefined;

interface CatalogLogisticaTabProps {
  moduleColor: ModuleColor;
}

export const CatalogLogisticaTab = ({ moduleColor }: CatalogLogisticaTabProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'create');
  const canEdit = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'edit');
  const canDelete = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'delete');

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<SimpleCatalogItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: formas, isLoading } = useFormasPagoConfig();
  const createMutation = useCreateFormaPago();
  const updateMutation = useUpdateFormaPago();
  const deleteMutation = useDeleteFormaPago();

  const items = useMemo(() => {
    return Array.isArray(formas) ? formas : ((formas as { results?: FormaPago[] })?.results ?? []);
  }, [formas]);

  const columns: ColumnDef<FormaPago>[] = useMemo(
    () => [
      {
        id: 'codigo',
        header: 'Código',
        accessorKey: 'codigo',
        cell: (row) => <span className="font-mono font-medium">{row.codigo}</span>,
      },
      { id: 'nombre', header: 'Nombre', accessorKey: 'nombre' },
      {
        id: 'descripcion',
        header: 'Descripción',
        accessorKey: 'descripcion',
        cell: (row) => <span className="text-sm text-gray-500">{row.descripcion || '—'}</span>,
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
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                title="Editar"
                onClick={() => {
                  setEditItem(row as unknown as SimpleCatalogItem);
                  setFormOpen(true);
                }}
              >
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
    [canEdit, canDelete]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Formas de Pago"
        primaryAction={
          canCreate
            ? {
                label: 'Agregar',
                onClick: () => {
                  setEditItem(null);
                  setFormOpen(true);
                },
              }
            : undefined
        }
        moduleColor={moduleColor}
      />

      {items.length > 0 ? (
        <ResponsiveTable data={items} columns={columns} />
      ) : (
        <EmptyState
          icon={<Wallet size={40} />}
          title="Sin formas de pago"
          description="Configura las formas de pago disponibles para proveedores y compras."
          action={
            canCreate
              ? {
                  label: 'Crear Forma de Pago',
                  onClick: () => {
                    setEditItem(null);
                    setFormOpen(true);
                  },
                }
              : undefined
          }
        />
      )}

      <CatalogFormModal
        catalogType="forma_pago"
        item={editItem}
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditItem(null);
        }}
        onCreate={createMutation}
        onUpdate={updateMutation}
      />

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
        title="Eliminar forma de pago"
        message="Esta acción eliminará la forma de pago de forma permanente."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
