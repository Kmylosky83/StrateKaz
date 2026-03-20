/**
 * FuerzasPorterSection - Sección para gestión de 5 Fuerzas de Porter
 *
 * Vista Híbrida: Tabla CRUD + Radar Chart + Diagrama en Cruz
 * - ViewToggle para alternar entre Tabla (principal), Radar y Diagrama
 * - StatsGrid con métricas clave
 * - Import/Export Excel (mismo patrón que Partes Interesadas)
 * - Modal para crear/editar fuerzas
 *
 * Gestiona las 5 fuerzas competitivas de Michael Porter:
 * - Rivalidad entre competidores
 * - Amenaza de nuevos entrantes
 * - Amenaza de productos sustitutos
 * - Poder de negociación de proveedores
 * - Poder de negociación de clientes
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Target,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Swords,
  Users,
  PieChart,
  LayoutGrid,
  Table,
  Upload,
  Download,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Tooltip } from '@/components/common/Tooltip';
import { ViewToggle } from '@/components/common/ViewToggle';
import { Select } from '@/components/forms/Select';
import { DataTableCard, TableSkeleton } from '@/components/layout/DataTableCard';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { useFuerzasPorter, useDeleteFuerzaPorter } from '../../hooks/useContexto';
import { fuerzasPorterApi } from '../../api/contextoApi';
import type { FuerzaPorter, TipoFuerzaPorter } from '../../types/contexto.types';
import { PorterRadarChart } from './PorterRadarChart';
import { PorterDiagram } from './PorterDiagram';
import { FuerzaPorterFormModal } from '../modals/FuerzaPorterFormModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';

// =============================================================================
// TIPOS Y CONSTANTES
// =============================================================================

type ViewMode = 'tabla' | 'radar' | 'diagrama';

const FUERZA_CONFIG: Record<
  string,
  {
    label: string;
    shortLabel: string;
    badgeVariant: 'danger' | 'warning' | 'info' | 'accent' | 'success';
  }
> = {
  rivalidad: {
    label: 'Rivalidad entre Competidores',
    shortLabel: 'Rivalidad',
    badgeVariant: 'danger',
  },
  nuevos_entrantes: {
    label: 'Amenaza de Nuevos Entrantes',
    shortLabel: 'Nuevos Entrantes',
    badgeVariant: 'warning',
  },
  sustitutos: { label: 'Amenaza de Sustitutos', shortLabel: 'Sustitutos', badgeVariant: 'info' },
  poder_proveedores: {
    label: 'Poder de Proveedores',
    shortLabel: 'Proveedores',
    badgeVariant: 'accent',
  },
  poder_clientes: { label: 'Poder de Clientes', shortLabel: 'Clientes', badgeVariant: 'success' },
};

const NIVEL_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'success' }> = {
  alto: { label: 'Alto', variant: 'danger' },
  medio: { label: 'Medio', variant: 'warning' },
  bajo: { label: 'Bajo', variant: 'success' },
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface FuerzasPorterSectionProps {
  triggerNewForm?: number;
}

export const FuerzasPorterSection = ({ triggerNewForm }: FuerzasPorterSectionProps) => {
  const currentYear = new Date().getFullYear();
  const [viewMode, setViewMode] = useState<ViewMode>('tabla');
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>(currentYear.toString());
  const [selectedFuerza, setSelectedFuerza] = useState<FuerzaPorter | null>(null);
  const [preselectedTipo, setPreselectedTipo] = useState<TipoFuerzaPorter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<FuerzaPorter | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.FUNDACION, Sections.ANALISIS_CONTEXTO, 'create');
  const canEdit = canDo(Modules.FUNDACION, Sections.ANALISIS_CONTEXTO, 'edit');
  const canDelete = canDo(Modules.FUNDACION, Sections.ANALISIS_CONTEXTO, 'delete');

  // Color del módulo
  const { color: moduleColor } = useModuleColor('fundacion');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Queries
  const { data, isLoading } = useFuerzasPorter({ periodo: selectedPeriodo }, 1, 10);
  const deleteMutation = useDeleteFuerzaPorter();

  // Opciones de periodo
  const periodoOptions = useMemo(() => {
    const years = [];
    for (let i = -3; i <= 2; i++) {
      const year = currentYear + i;
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  }, [currentYear]);

  // Estadísticas
  const porterStats: StatItem[] = useMemo(() => {
    const fuerzas = data?.results || [];
    const configuradas = fuerzas.length;
    const pendientes = 5 - configuradas;

    const distribNivel = {
      alto: fuerzas.filter((f) => f.nivel === 'alto').length,
      medio: fuerzas.filter((f) => f.nivel === 'medio').length,
      bajo: fuerzas.filter((f) => f.nivel === 'bajo').length,
    };

    const intensidadPromedio =
      fuerzas.length > 0
        ? Math.round(
            fuerzas.reduce((sum, f) => {
              const val = f.nivel === 'alto' ? 80 : f.nivel === 'medio' ? 50 : 20;
              return sum + val;
            }, 0) / fuerzas.length
          )
        : 0;

    return [
      {
        label: 'Fuerzas Configuradas',
        value: `${configuradas}/5`,
        icon: Target,
        iconColor: configuradas === 5 ? 'success' : 'warning',
        description: pendientes > 0 ? `${pendientes} pendientes` : 'Completo',
      },
      {
        label: 'Nivel Alto',
        value: distribNivel.alto,
        icon: Swords,
        iconColor: 'danger',
        description: 'Fuerzas de alto impacto',
      },
      {
        label: 'Nivel Medio',
        value: distribNivel.medio,
        icon: Filter,
        iconColor: 'warning',
        description: 'Impacto moderado',
      },
      {
        label: 'Intensidad Competitiva',
        value: `${intensidadPromedio}%`,
        icon: Users,
        iconColor: intensidadPromedio >= 70 ? 'danger' : 'info',
        description: 'Promedio de todas las fuerzas',
      },
    ];
  }, [data]);

  // Handlers
  const handleEditFuerza = (fuerza: FuerzaPorter) => {
    if (!canEdit) {
      setAlertMessage({ type: 'warning', message: 'No tiene permisos para editar fuerzas' });
      return;
    }
    setSelectedFuerza(fuerza);
    setPreselectedTipo(null);
    setIsModalOpen(true);
  };

  const handleConfigureFuerza = (tipo: TipoFuerzaPorter) => {
    if (!canCreate) {
      setAlertMessage({ type: 'warning', message: 'No tiene permisos para crear fuerzas' });
      return;
    }
    setSelectedFuerza(null);
    setPreselectedTipo(tipo);
    setIsModalOpen(true);
  };

  const handleNewFuerza = () => {
    if (!canCreate) {
      setAlertMessage({ type: 'warning', message: 'No tiene permisos para crear fuerzas' });
      return;
    }
    setSelectedFuerza(null);
    setPreselectedTipo(null);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (fuerza: FuerzaPorter) => {
    setDeleteConfirm(fuerza);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
      setAlertMessage({ type: 'success', message: 'Fuerza eliminada correctamente' });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFuerza(null);
    setPreselectedTipo(null);
  };

  const handleExport = async () => {
    try {
      const blobUrl = await fuerzasPorterApi.exportExcel({ periodo: selectedPeriodo });
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'Fuerzas_Porter.xlsx';
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success('Excel exportado');
    } catch {
      toast.error('Error al exportar');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blobUrl = await fuerzasPorterApi.downloadTemplate();
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'Plantilla_Fuerzas_Porter.xlsx';
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success('Plantilla descargada');
    } catch {
      toast.error('Error al descargar plantilla');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await fuerzasPorterApi.importExcel(file, selectedPeriodo);
      setAlertMessage({
        type: result.errors?.length ? 'warning' : 'success',
        message:
          result.message + (result.errors?.length ? ` (${result.errors.length} errores)` : ''),
      });
    } catch {
      setAlertMessage({ type: 'error', message: 'Error al importar archivo' });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Trigger externo
  useEffect(() => {
    if (triggerNewForm && triggerNewForm > 0) {
      handleNewFuerza();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNewForm]);

  const fuerzas = data?.results || [];
  const isEmpty = !isLoading && fuerzas.length === 0;

  return (
    <div className="space-y-6">
      {/* Alerta de feedback */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.message}
          closable
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Estadísticas */}
      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={porterStats} columns={4} moduleColor={moduleColor} />
      )}

      {/* Section Header con ViewToggle */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Target className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Porter"
        description="Evalúa las 5 fuerzas competitivas que determinan la intensidad de la competencia"
        variant="compact"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value)}
              options={periodoOptions}
              className="w-28"
            />

            {/* ViewToggle con 3 opciones */}
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'tabla', label: 'Tabla', icon: Table },
                { value: 'radar', label: 'Radar', icon: PieChart },
                { value: 'diagrama', label: 'Diagrama', icon: LayoutGrid },
              ]}
              moduleColor={moduleColor as 'purple' | 'blue' | 'green' | 'orange' | 'gray'}
            />

            {/* Import/Export */}
            {canCreate && (
              <>
                <Tooltip content="Descargar plantilla">
                  <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
                    <FileDown className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Importar Excel">
                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
              </>
            )}
            <Tooltip content="Exportar Excel">
              <Button variant="ghost" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </Tooltip>

            {canCreate && (
              <Button onClick={handleNewFuerza} variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Fuerza
              </Button>
            )}
          </div>
        }
      />

      {/* Contenido según vista */}
      {viewMode === 'radar' ? (
        <PorterRadarChart
          periodo={selectedPeriodo}
          onEditFuerza={handleEditFuerza}
          onConfigureFuerza={handleConfigureFuerza}
          readOnly={!canEdit}
        />
      ) : viewMode === 'diagrama' ? (
        <PorterDiagram
          periodo={selectedPeriodo}
          onEditFuerza={handleEditFuerza}
          readOnly={!canEdit}
        />
      ) : (
        <>
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : isEmpty ? (
            <EmptyState
              icon={<Target className="h-12 w-12" />}
              title="Sin fuerzas de Porter"
              description="Agregue las 5 fuerzas competitivas manualmente o importe desde Excel para evaluar la intensidad competitiva del sector."
              action={
                canCreate
                  ? {
                      label: 'Agregar Fuerza',
                      onClick: handleNewFuerza,
                      icon: <Plus className="h-4 w-4" />,
                    }
                  : undefined
              }
            />
          ) : (
            <DataTableCard
              columns={[
                {
                  key: 'tipo',
                  header: 'Fuerza Competitiva',
                  render: (fuerza: FuerzaPorter) => {
                    const config = FUERZA_CONFIG[fuerza.tipo];
                    return config ? (
                      <Badge variant={config.badgeVariant} size="sm">
                        {config.shortLabel}
                      </Badge>
                    ) : (
                      <span>{fuerza.tipo}</span>
                    );
                  },
                },
                {
                  key: 'nivel',
                  header: 'Nivel',
                  render: (fuerza: FuerzaPorter) => {
                    const config = NIVEL_CONFIG[fuerza.nivel];
                    return config ? (
                      <Badge variant={config.variant} size="sm">
                        {config.label}
                      </Badge>
                    ) : (
                      <span>{fuerza.nivel}</span>
                    );
                  },
                },
                {
                  key: 'descripcion',
                  header: 'Descripción',
                  render: (fuerza: FuerzaPorter) => (
                    <div className="max-w-md">
                      <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                        {fuerza.descripcion}
                      </div>
                      {fuerza.implicaciones_estrategicas && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {fuerza.implicaciones_estrategicas}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'factores',
                  header: 'Factores Clave',
                  render: (fuerza: FuerzaPorter) => {
                    const factores = Array.isArray(fuerza.factores) ? fuerza.factores : [];
                    return (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {factores.slice(0, 3).map((f, i) => (
                          <Badge key={i} variant="gray" size="sm">
                            {f}
                          </Badge>
                        ))}
                        {factores.length > 3 && (
                          <Badge variant="gray" size="sm">
                            +{factores.length - 3}
                          </Badge>
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: 'acciones',
                  header: 'Acciones',
                  align: 'right',
                  render: (fuerza: FuerzaPorter) => (
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Tooltip content="Editar">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditFuerza(fuerza)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip content="Eliminar">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRequest(fuerza)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  ),
                },
              ]}
              data={fuerzas}
            />
          )}
        </>
      )}

      {/* Diálogo eliminar */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Fuerza de Porter"
        message={`¿Está seguro de eliminar la fuerza "${FUERZA_CONFIG[deleteConfirm?.tipo || '']?.label || deleteConfirm?.tipo}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Modal de formulario */}
      <FuerzaPorterFormModal
        fuerza={selectedFuerza}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        defaultPeriodo={selectedPeriodo}
        tipoPreselected={preselectedTipo}
      />
    </div>
  );
};

export default FuerzasPorterSection;
