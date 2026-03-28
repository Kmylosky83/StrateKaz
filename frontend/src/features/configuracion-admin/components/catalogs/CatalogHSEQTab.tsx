/**
 * Sub-tab HSEQ de Catálogos Maestros
 *
 * Contiene: Tipos EPP, Tipos Examen, Tipos Inspección, Tipos Residuo.
 */
import { useState, useMemo } from 'react';
import { HardHat, Stethoscope, ClipboardCheck, Trash2 as TrashIcon, Pencil } from 'lucide-react';
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
  useTiposEPPConfig,
  useCreateTipoEPP,
  useUpdateTipoEPP,
  useDeleteTipoEPP,
  useTiposExamenConfig,
  useCreateTipoExamen,
  useUpdateTipoExamen,
  useDeleteTipoExamen,
  useTiposInspeccionConfig,
  useCreateTipoInspeccion,
  useUpdateTipoInspeccion,
  useDeleteTipoInspeccion,
  useTiposResiduoConfig,
  useCreateTipoResiduo,
  useUpdateTipoResiduo,
  useDeleteTipoResiduo,
} from '../../hooks/useConfigAdmin';
import { CatalogFormModal, type CatalogType } from './CatalogFormModal';
import type {
  TipoEPP,
  TipoExamen,
  TipoInspeccion,
  TipoResiduo,
  SimpleCatalogItem,
} from '../../types/config-admin.types';

type ModuleColor = Parameters<typeof PageTabs>[0]['moduleColor'];

interface CatalogHSEQTabProps {
  moduleColor: ModuleColor;
}

export const CatalogHSEQTab = ({ moduleColor }: CatalogHSEQTabProps) => {
  const [activeTab, setActiveTab] = useState('epp');
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'create');
  const canEdit = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'edit');
  const canDelete = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'delete');

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<SimpleCatalogItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeCatalogType, setActiveCatalogType] = useState<CatalogType>('tipo_epp');

  // Hooks
  const { data: epp, isLoading: loadingEPP } = useTiposEPPConfig();
  const createEPP = useCreateTipoEPP();
  const updateEPP = useUpdateTipoEPP();
  const deleteEPP = useDeleteTipoEPP();

  const { data: examenes, isLoading: loadingExamenes } = useTiposExamenConfig();
  const createExamen = useCreateTipoExamen();
  const updateExamen = useUpdateTipoExamen();
  const deleteExamen = useDeleteTipoExamen();

  const { data: inspecciones, isLoading: loadingInspecciones } = useTiposInspeccionConfig();
  const createInspeccion = useCreateTipoInspeccion();
  const updateInspeccion = useUpdateTipoInspeccion();
  const deleteInspeccion = useDeleteTipoInspeccion();

  const { data: residuos, isLoading: loadingResiduos } = useTiposResiduoConfig();
  const createResiduo = useCreateTipoResiduo();
  const updateResiduo = useUpdateTipoResiduo();
  const deleteResiduo = useDeleteTipoResiduo();

  const tabs = [
    { id: 'epp', label: 'Tipos de EPP' },
    { id: 'examenes', label: 'Tipos de Examen' },
    { id: 'inspecciones', label: 'Tipos de Inspección' },
    { id: 'residuos', label: 'Tipos de Residuo' },
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
  const unwrap = <T,>(data: unknown): T[] =>
    Array.isArray(data) ? data : ((data as { results?: T[] })?.results ?? []);

  const eppItems = useMemo(() => unwrap<TipoEPP>(epp), [epp]);
  const examenesItems = useMemo(() => unwrap<TipoExamen>(examenes), [examenes]);
  const inspeccionesItems = useMemo(() => unwrap<TipoInspeccion>(inspecciones), [inspecciones]);
  const residuosItems = useMemo(() => unwrap<TipoResiduo>(residuos), [residuos]);

  const eppColumns: ColumnDef<TipoEPP>[] = useMemo(
    () => [
      {
        id: 'codigo',
        header: 'Código',
        accessorKey: 'codigo',
        cell: (row) => <span className="font-mono font-medium">{row.codigo}</span>,
      },
      { id: 'nombre', header: 'Nombre', accessorKey: 'nombre' },
      {
        id: 'categoria',
        header: 'Categoría',
        accessorKey: 'categoria',
        cell: (row) => (
          <Badge variant="default" size="sm">
            {row.categoria}
          </Badge>
        ),
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'activo',
        cell: (row) => (
          <Badge variant={row.activo ? 'success' : 'default'} size="sm">
            {row.activo ? 'Activo' : 'Inactivo'}
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
                onClick={() => openEdit('tipo_epp', row as unknown as SimpleCatalogItem)}
              >
                <Pencil size={14} />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                <TrashIcon size={14} className="text-red-500" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete]
  );

  const examenesColumns: ColumnDef<TipoExamen>[] = useMemo(
    () => [
      {
        id: 'codigo',
        header: 'Código',
        accessorKey: 'codigo',
        cell: (row) => <span className="font-mono font-medium">{row.codigo}</span>,
      },
      { id: 'nombre', header: 'Nombre', accessorKey: 'nombre' },
      {
        id: 'tipo',
        header: 'Tipo',
        accessorKey: 'tipo',
        cell: (row) => (
          <Badge variant="default" size="sm">
            {row.tipo}
          </Badge>
        ),
      },
      { id: 'periodicidad', header: 'Periodicidad', accessorKey: 'periodicidad' },
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
                onClick={() => openEdit('tipo_examen', row as unknown as SimpleCatalogItem)}
              >
                <Pencil size={14} />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                <TrashIcon size={14} className="text-red-500" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete]
  );

  const inspeccionesColumns: ColumnDef<TipoInspeccion>[] = useMemo(
    () => [
      {
        id: 'codigo',
        header: 'Código',
        accessorKey: 'codigo',
        cell: (row) => <span className="font-mono font-medium">{row.codigo}</span>,
      },
      { id: 'nombre', header: 'Nombre', accessorKey: 'nombre' },
      { id: 'frecuencia', header: 'Frecuencia', accessorKey: 'frecuencia_recomendada' },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'activo',
        cell: (row) => (
          <Badge variant={row.activo ? 'success' : 'default'} size="sm">
            {row.activo ? 'Activo' : 'Inactivo'}
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
                onClick={() => openEdit('tipo_inspeccion', row as unknown as SimpleCatalogItem)}
              >
                <Pencil size={14} />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                <TrashIcon size={14} className="text-red-500" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete]
  );

  const residuosColumns: ColumnDef<TipoResiduo>[] = useMemo(
    () => [
      {
        id: 'codigo',
        header: 'Código',
        accessorKey: 'codigo',
        cell: (row) => <span className="font-mono font-medium">{row.codigo}</span>,
      },
      { id: 'nombre', header: 'Nombre', accessorKey: 'nombre' },
      {
        id: 'clase',
        header: 'Clase',
        accessorKey: 'clase',
        cell: (row) => (
          <Badge variant="default" size="sm">
            {row.clase}
          </Badge>
        ),
      },
      {
        id: 'color',
        header: 'Color',
        accessorKey: 'color_contenedor',
        cell: (row) =>
          row.color_contenedor ? (
            <div
              className="h-5 w-5 rounded-full border"
              style={{ backgroundColor: row.color_contenedor }}
            />
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'activo',
        cell: (row) => (
          <Badge variant={row.activo ? 'success' : 'default'} size="sm">
            {row.activo ? 'Activo' : 'Inactivo'}
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
                onClick={() => openEdit('tipo_residuo', row as unknown as SimpleCatalogItem)}
              >
                <Pencil size={14} />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                <TrashIcon size={14} className="text-red-500" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete]
  );

  const getCurrentType = (): CatalogType => {
    switch (activeTab) {
      case 'epp':
        return 'tipo_epp';
      case 'examenes':
        return 'tipo_examen';
      case 'inspecciones':
        return 'tipo_inspeccion';
      case 'residuos':
        return 'tipo_residuo';
      default:
        return 'tipo_epp';
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'epp':
        return 'Tipos de Equipo de Protección Personal';
      case 'examenes':
        return 'Tipos de Examen Médico Ocupacional';
      case 'inspecciones':
        return 'Tipos de Inspección';
      case 'residuos':
        return 'Tipos de Residuo';
      default:
        return '';
    }
  };

  const renderTable = () => {
    switch (activeTab) {
      case 'epp':
        if (loadingEPP)
          return (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          );
        return eppItems.length > 0 ? (
          <ResponsiveTable data={eppItems} columns={eppColumns} />
        ) : (
          <EmptyState
            icon={<HardHat size={40} />}
            title="Sin tipos de EPP"
            action={
              canCreate ? { label: 'Crear Tipo', onClick: () => openCreate('tipo_epp') } : undefined
            }
          />
        );
      case 'examenes':
        if (loadingExamenes)
          return (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          );
        return examenesItems.length > 0 ? (
          <ResponsiveTable data={examenesItems} columns={examenesColumns} />
        ) : (
          <EmptyState
            icon={<Stethoscope size={40} />}
            title="Sin tipos de examen"
            action={
              canCreate
                ? { label: 'Crear Tipo', onClick: () => openCreate('tipo_examen') }
                : undefined
            }
          />
        );
      case 'inspecciones':
        if (loadingInspecciones)
          return (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          );
        return inspeccionesItems.length > 0 ? (
          <ResponsiveTable data={inspeccionesItems} columns={inspeccionesColumns} />
        ) : (
          <EmptyState
            icon={<ClipboardCheck size={40} />}
            title="Sin tipos de inspección"
            action={
              canCreate
                ? { label: 'Crear Tipo', onClick: () => openCreate('tipo_inspeccion') }
                : undefined
            }
          />
        );
      case 'residuos':
        if (loadingResiduos)
          return (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          );
        return residuosItems.length > 0 ? (
          <ResponsiveTable data={residuosItems} columns={residuosColumns} />
        ) : (
          <EmptyState
            icon={<TrashIcon size={40} />}
            title="Sin tipos de residuo"
            action={
              canCreate
                ? { label: 'Crear Tipo', onClick: () => openCreate('tipo_residuo') }
                : undefined
            }
          />
        );
      default:
        return null;
    }
  };

  const deleteMutation = (() => {
    switch (activeTab) {
      case 'epp':
        return deleteEPP;
      case 'examenes':
        return deleteExamen;
      case 'inspecciones':
        return deleteInspeccion;
      case 'residuos':
        return deleteResiduo;
      default:
        return deleteEPP;
    }
  })();

  const getCreateMutation = () => {
    switch (activeCatalogType) {
      case 'tipo_epp':
        return createEPP;
      case 'tipo_examen':
        return createExamen;
      case 'tipo_inspeccion':
        return createInspeccion;
      case 'tipo_residuo':
        return createResiduo;
      default:
        return createEPP;
    }
  };

  const getUpdateMutation = () => {
    switch (activeCatalogType) {
      case 'tipo_epp':
        return updateEPP;
      case 'tipo_examen':
        return updateExamen;
      case 'tipo_inspeccion':
        return updateInspeccion;
      case 'tipo_residuo':
        return updateResiduo;
      default:
        return updateEPP;
    }
  };

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
        title={getTitle()}
        primaryAction={
          canCreate ? { label: 'Agregar', onClick: () => openCreate(getCurrentType()) } : undefined
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
          if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
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
