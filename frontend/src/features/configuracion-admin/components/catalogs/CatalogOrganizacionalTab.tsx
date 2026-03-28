/**
 * Sub-tab Organizacional de Catálogos Maestros
 *
 * Contiene: Normas ISO aplicables.
 */
import { useState, useMemo } from 'react';
import { Award, Pencil, Trash2 } from 'lucide-react';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ResponsiveTable, type ColumnDef } from '@/components/common/ResponsiveTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useNormasISOConfig,
  useCreateNormaISO,
  useUpdateNormaISO,
  useDeleteNormaISO,
} from '../../hooks/useConfigAdmin';
import { CatalogFormModal } from './CatalogFormModal';
import type { NormaISOConfig, SimpleCatalogItem } from '../../types/config-admin.types';

type ModuleColor = string | undefined;

interface CatalogOrganizacionalTabProps {
  moduleColor: ModuleColor;
}

export const CatalogOrganizacionalTab = ({ moduleColor }: CatalogOrganizacionalTabProps) => {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'create');
  const canEdit = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'edit');
  const canDelete = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'delete');

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<SimpleCatalogItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: normas, isLoading } = useNormasISOConfig();
  const createMutation = useCreateNormaISO();
  const updateMutation = useUpdateNormaISO();
  const deleteMutation = useDeleteNormaISO();

  const items = useMemo(() => {
    return Array.isArray(normas)
      ? normas
      : ((normas as { results?: NormaISOConfig[] })?.results ?? []);
  }, [normas]);

  const columns: ColumnDef<NormaISOConfig>[] = useMemo(
    () => [
      {
        id: 'icon',
        header: '',
        cell: (row) => (
          <div className="flex items-center justify-center">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: row.color ? `${row.color}20` : '#f3f4f6' }}
            >
              <DynamicIcon
                name={row.icon || 'Award'}
                size={16}
                style={{ color: row.color || '#6b7280' }}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'code',
        header: 'Código',
        accessorKey: 'code',
        cell: (row) => <span className="font-mono font-medium">{row.code}</span>,
      },
      { id: 'name', header: 'Nombre', accessorKey: 'name' },
      { id: 'short_name', header: 'Abreviatura', accessorKey: 'short_name' },
      {
        id: 'category',
        header: 'Categoría',
        accessorKey: 'category',
        cell: (row) => (
          <Badge variant="default" size="sm">
            {row.category_display || row.category}
          </Badge>
        ),
      },
      {
        id: 'sistema',
        header: '',
        accessorKey: 'es_sistema',
        cell: (row) =>
          row.es_sistema ? (
            <Badge variant="info" size="sm">
              Sistema
            </Badge>
          ) : null,
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
              <Button
                variant="ghost"
                size="sm"
                title="Editar"
                onClick={() => {
                  setEditItem({
                    id: row.id,
                    codigo: row.code,
                    nombre: row.name,
                    descripcion: row.description,
                  } as SimpleCatalogItem);
                  setFormOpen(true);
                }}
              >
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
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Normas ISO Aplicables"
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
          icon={<Award size={40} />}
          title="Sin normas ISO configuradas"
          description="Agrega las normas ISO que aplican a tu organización."
          action={
            canCreate
              ? {
                  label: 'Agregar Norma',
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
        catalogType="norma_iso"
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
        title="Eliminar norma"
        message="Esta acción eliminará la norma del catálogo."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
