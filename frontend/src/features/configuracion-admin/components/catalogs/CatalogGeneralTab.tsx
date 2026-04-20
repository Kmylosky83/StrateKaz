/**
 * Sub-tab General de Catálogos Maestros
 *
 * Contiene: Tipos de Contrato, Tipos de Documento de Identidad.
 *
 * Unidades de Medida se administran exclusivamente en
 * Infraestructura → Catálogo de Productos → Unidades de Medida
 * (source-of-truth unico post-consolidacion S7).
 */
import { useState, useMemo } from 'react';
import { FileText, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { PageTabs } from '@/components/layout/PageTabs';
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
  useTiposContratoConfig,
  useDeleteTipoContrato,
  useCreateTipoContrato,
  useUpdateTipoContrato,
  useTiposDocumentoConfig,
  useDeleteTipoDocumento,
  useCreateTipoDocumento,
  useUpdateTipoDocumento,
} from '../../hooks/useConfigAdmin';
import { CatalogFormModal, type CatalogType } from './CatalogFormModal';
import type {
  TipoContrato,
  TipoDocumentoIdentidad,
  SimpleCatalogItem,
} from '../../types/config-admin.types';

type ModuleColor = Parameters<typeof PageTabs>[0]['moduleColor'];

interface CatalogGeneralTabProps {
  moduleColor: ModuleColor;
}

export const CatalogGeneralTab = ({ moduleColor }: CatalogGeneralTabProps) => {
  const [activeTab, setActiveTab] = useState('contratos');
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'create');
  const canEdit = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'edit');
  const canDelete = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'delete');

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<SimpleCatalogItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeCatalogType, setActiveCatalogType] = useState<CatalogType>('tipo_contrato');

  // Hooks — Tipos de Contrato
  const { data: contratos, isLoading: loadingContratos } = useTiposContratoConfig();
  const createContrato = useCreateTipoContrato();
  const updateContrato = useUpdateTipoContrato();
  const deleteContrato = useDeleteTipoContrato();

  // Hooks — Tipos de Documento
  const { data: documentos, isLoading: loadingDocumentos } = useTiposDocumentoConfig();
  const createDocumento = useCreateTipoDocumento();
  const updateDocumento = useUpdateTipoDocumento();
  const deleteDocumento = useDeleteTipoDocumento();

  const tabs = [
    { id: 'contratos', label: 'Tipos de Contrato' },
    { id: 'documentos', label: 'Tipos de Documento' },
  ];

  const openCreate = (type: CatalogType) => {
    setActiveCatalogType(type);
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (type: CatalogType, item: SimpleCatalogItem) => {
    setActiveCatalogType(type);
    setEditItem(item);
    setFormOpen(true);
  };

  const getDeleteMutation = () => {
    switch (activeTab) {
      case 'contratos':
        return deleteContrato;
      case 'documentos':
        return deleteDocumento;
      default:
        return deleteContrato;
    }
  };

  const getCreateMutation = () => {
    switch (activeCatalogType) {
      case 'tipo_contrato':
        return createContrato;
      case 'tipo_documento_identidad':
        return createDocumento;
      default:
        return createContrato;
    }
  };

  const getUpdateMutation = () => {
    switch (activeCatalogType) {
      case 'tipo_contrato':
        return updateContrato;
      case 'tipo_documento_identidad':
        return updateDocumento;
      default:
        return updateContrato;
    }
  };

  // ── Tipos de Contrato ──
  const contratosItems = useMemo(() => {
    const raw = contratos;
    return Array.isArray(raw) ? raw : ((raw as { results?: TipoContrato[] })?.results ?? []);
  }, [contratos]);

  const contratosColumns: ColumnDef<TipoContrato>[] = useMemo(
    () => [
      {
        id: 'code',
        header: 'Código',
        accessorKey: 'code',
        cell: (row) => <span className="font-mono font-medium">{row.code}</span>,
      },
      { id: 'name', header: 'Nombre', accessorKey: 'name' },
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
                onClick={() =>
                  openEdit('tipo_contrato', {
                    id: row.id,
                    codigo: row.code,
                    nombre: row.name,
                    descripcion: row.descripcion,
                  } as SimpleCatalogItem)
                }
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

  // ── Tipos de Documento ──
  const documentosItems = useMemo(() => {
    const raw = documentos;
    return Array.isArray(raw)
      ? raw
      : ((raw as { results?: TipoDocumentoIdentidad[] })?.results ?? []);
  }, [documentos]);

  const documentosColumns: ColumnDef<TipoDocumentoIdentidad>[] = useMemo(
    () => [
      {
        id: 'codigo',
        header: 'Código',
        accessorKey: 'codigo',
        cell: (row) => <span className="font-mono font-medium">{row.codigo}</span>,
      },
      { id: 'nombre', header: 'Nombre', accessorKey: 'nombre' },
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
                onClick={() =>
                  openEdit('tipo_documento_identidad', row as unknown as SimpleCatalogItem)
                }
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

  const renderTable = () => {
    switch (activeTab) {
      case 'contratos':
        if (loadingContratos)
          return (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          );
        return contratosItems.length > 0 ? (
          <ResponsiveTable data={contratosItems} columns={contratosColumns} />
        ) : (
          <EmptyState
            icon={<FileText size={40} />}
            title="Sin tipos de contrato"
            description="Define los tipos de contrato laboral disponibles."
            action={
              canCreate
                ? { label: 'Crear Tipo', onClick: () => openCreate('tipo_contrato') }
                : undefined
            }
          />
        );

      case 'documentos':
        if (loadingDocumentos)
          return (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          );
        return documentosItems.length > 0 ? (
          <ResponsiveTable data={documentosItems} columns={documentosColumns} />
        ) : (
          <EmptyState
            icon={<CreditCard size={40} />}
            title="Sin tipos de documento"
            description="Configura los tipos de documento de identidad."
            action={
              canCreate
                ? { label: 'Crear Tipo', onClick: () => openCreate('tipo_documento_identidad') }
                : undefined
            }
          />
        );

      default:
        return null;
    }
  };

  const getCurrentCatalogType = (): CatalogType => {
    switch (activeTab) {
      case 'contratos':
        return 'tipo_contrato';
      case 'documentos':
        return 'tipo_documento_identidad';
      default:
        return 'tipo_contrato';
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'contratos':
        return 'Tipos de Contrato';
      case 'documentos':
        return 'Tipos de Documento de Identidad';
      default:
        return '';
    }
  };

  const deleteMutation = getDeleteMutation();

  return (
    <div className="space-y-4">
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
        moduleColor={moduleColor}
      />

      <SectionToolbar
        title={getTabTitle()}
        primaryAction={
          canCreate
            ? { label: 'Agregar', onClick: () => openCreate(getCurrentCatalogType()) }
            : undefined
        }
        moduleColor={moduleColor}
      />

      {renderTable()}

      <CatalogFormModal
        catalogType={activeCatalogType}
        item={editItem}
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditItem(null);
        }}
        onCreate={getCreateMutation()}
        onUpdate={getUpdateMutation()}
      />

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
          }
        }}
        title="Eliminar registro"
        message="Esta acción eliminará el registro de forma permanente."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
