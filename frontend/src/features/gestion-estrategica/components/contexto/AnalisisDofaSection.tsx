/**
 * Seccion de Analisis DOFA
 *
 * Vista Hibrida:
 * - Vista Lista (2B): Lista CRUD con Filtros en linea para gestionar analisis
 * - Vista Matriz: Visualizacion interactiva 2x2 con Drag & Drop
 *
 * Toggle entre vistas con ViewToggle del Design System
 * Gestiona analisis DOFA con factores (Fortalezas, Oportunidades, Debilidades, Amenazas)
 */
import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  FileSearch,
  Target,
  Shield,
  AlertTriangle,
  TrendingUp,
  Search,
  Eye,
  CheckCircle,
  Clock,
  List,
  LayoutGrid,
  ArrowLeft,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Alert } from '@/components/common/Alert';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Tooltip } from '@/components/common/Tooltip';
import { ViewToggle } from '@/components/common/ViewToggle';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { DataTableCard, TableSkeleton } from '@/components/layout/DataTableCard';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import {
  useAnalisisDofa,
  useDeleteAnalisisDofa,
  useAprobarAnalisisDofa,
} from '../../hooks/useContexto';
import type {
  AnalisisDOFA,
  AnalisisDOFAFilters,
  EstadoAnalisis,
  FactorDOFA,
} from '../../types/contexto.types';
import { ESTADO_ANALISIS_CONFIG } from '../../types/contexto.types';
import { AnalisisDofaFormModal } from '../modals/AnalisisDofaFormModal';
import { DOFAMatrix } from './DOFAMatrix';
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';

// =============================================================================
// TIPOS
// =============================================================================

type ViewMode = 'lista' | 'matriz';

// =============================================================================
// OPCIONES DE FILTROS
// =============================================================================

const ESTADO_OPTIONS: { value: EstadoAnalisis | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'en_revision', label: 'En Revision' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'vigente', label: 'Vigente' },
  { value: 'archivado', label: 'Archivado' },
];

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface AnalisisDofaSectionProps {
  triggerNewForm?: number;
}

export const AnalisisDofaSection = ({ triggerNewForm }: AnalisisDofaSectionProps) => {
  // Estados de vista
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [selectedAnalisisForMatrix, setSelectedAnalisisForMatrix] = useState<AnalisisDOFA | null>(null);

  // Estados de filtros y formulario
  const [filters, setFilters] = useState<AnalisisDOFAFilters>({});
  const [selectedAnalisis, setSelectedAnalisis] = useState<AnalisisDOFA | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<AnalisisDOFA | null>(null);
  const [aprobarConfirm, setAprobarConfirm] = useState<AnalisisDOFA | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // RBAC: Verificar permisos del usuario
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'create');
  const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'edit');
  const canDelete = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'delete');

  // Color del modulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Queries y mutations
  const { data, isLoading, error } = useAnalisisDofa({ ...filters }, 1, 50);
  const deleteMutation = useDeleteAnalisisDofa();
  const aprobarMutation = useAprobarAnalisisDofa();

  // Auto-seleccionar primer analisis vigente cuando se cambia a modo matriz
  useEffect(() => {
    if (viewMode === 'matriz' && !selectedAnalisisForMatrix && data?.results?.length) {
      const vigente = data.results.find((a) => a.estado === 'vigente');
      setSelectedAnalisisForMatrix(vigente || data.results[0]);
    }
  }, [viewMode, data?.results, selectedAnalisisForMatrix]);

  // Calcular estadisticas para StatsGrid
  const analisisStats: StatItem[] = useMemo(() => {
    const analisisList = data?.results || [];
    const vigentes = analisisList.filter((a) => a.estado === 'vigente').length;
    const enRevision = analisisList.filter((a) => a.estado === 'en_revision').length;
    const totalFactores = analisisList.reduce(
      (sum, a) => sum + (a.total_factores || 0),
      0
    );

    return [
      {
        label: 'Total Analisis',
        value: data?.count || analisisList.length,
        icon: FileSearch,
        iconColor: 'info',
      },
      {
        label: 'Vigentes',
        value: vigentes,
        icon: CheckCircle,
        iconColor: 'success',
        description: 'Analisis activos',
      },
      {
        label: 'En Revision',
        value: enRevision,
        icon: Clock,
        iconColor: 'warning',
        description: 'Pendientes de aprobacion',
      },
      {
        label: 'Total Factores',
        value: totalFactores,
        icon: Target,
        iconColor: 'primary',
        description: 'F+O+D+A identificados',
      },
    ];
  }, [data]);

  // Opciones para selector de analisis en vista matriz
  const analisisOptions = useMemo(() => {
    if (!data?.results) return [];
    return data.results.map((a) => ({
      value: a.id.toString(),
      label: `${a.nombre} (${a.periodo})`,
    }));
  }, [data?.results]);

  // Handlers
  const handleCreate = () => {
    setSelectedAnalisis(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleEdit = (analisis: AnalisisDOFA) => {
    setSelectedAnalisis(analisis);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleView = (analisis: AnalisisDOFA) => {
    setSelectedAnalisisForMatrix(analisis);
    setViewMode('matriz');
  };

  const handleDeleteRequest = (analisis: AnalisisDOFA) => {
    if (analisis.estado === 'vigente') {
      setAlertMessage({
        type: 'warning',
        message: 'No se puede eliminar un analisis vigente. Archive primero.',
      });
      return;
    }
    setDeleteConfirm(analisis);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
      setAlertMessage({ type: 'success', message: 'Analisis DOFA eliminado' });
    }
  };

  const handleAprobar = (analisis: AnalisisDOFA) => {
    if (analisis.estado !== 'en_revision') {
      setAlertMessage({
        type: 'warning',
        message: 'Solo se pueden aprobar analisis en revision.',
      });
      return;
    }
    setAprobarConfirm(analisis);
  };

  const handleAprobarConfirm = async () => {
    if (aprobarConfirm) {
      await aprobarMutation.mutateAsync(aprobarConfirm.id);
      setAprobarConfirm(null);
      setAlertMessage({ type: 'success', message: 'Analisis DOFA aprobado' });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnalisis(null);
    setIsCreating(false);
  };

  const handleEditFactor = (factor: FactorDOFA) => {
    // TODO: Abrir modal de edicion de factor
    console.log('Editar factor:', factor);
  };

  const handleBackToList = () => {
    setViewMode('lista');
    setSelectedAnalisisForMatrix(null);
  };

  const handleAnalisisChange = (id: string) => {
    const analisis = data?.results?.find((a) => a.id === parseInt(id));
    if (analisis) {
      setSelectedAnalisisForMatrix(analisis);
    }
  };

  // Renderizar badge de estado
  const renderEstadoBadge = (estado: EstadoAnalisis) => {
    const config = ESTADO_ANALISIS_CONFIG[estado];
    return (
      <Badge variant={config?.color || 'gray'} size="sm">
        {config?.label || estado}
      </Badge>
    );
  };

  // Renderizar contadores de factores
  const renderFactoresCount = (analisis: AnalisisDOFA) => {
    return (
      <div className="flex items-center gap-2">
        <Tooltip content="Fortalezas">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-emerald-500" />
            <span className="text-xs">{analisis.total_fortalezas || 0}</span>
          </div>
        </Tooltip>
        <Tooltip content="Oportunidades">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-sky-500" />
            <span className="text-xs">{analisis.total_oportunidades || 0}</span>
          </div>
        </Tooltip>
        <Tooltip content="Debilidades">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span className="text-xs">{analisis.total_debilidades || 0}</span>
          </div>
        </Tooltip>
        <Tooltip content="Amenazas">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-rose-500" />
            <span className="text-xs">{analisis.total_amenazas || 0}</span>
          </div>
        </Tooltip>
      </div>
    );
  };

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar los analisis DOFA. Intente de nuevo."
      />
    );
  }

  const isEmpty = !isLoading && (!data?.results || data.results.length === 0);

  // =============================================================================
  // VISTA MATRIZ
  // =============================================================================
  if (viewMode === 'matriz') {
    return (
      <div className="space-y-6">
        {/* Header de vista Matriz */}
        <SectionHeader
          icon={
            <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
              <LayoutGrid className={`h-5 w-5 ${colorClasses.icon}`} />
            </div>
          }
          title="Matriz DOFA"
          description={selectedAnalisisForMatrix?.nombre || 'Selecciona un analisis'}
          variant="compact"
          actions={
            <div className="flex items-center gap-3 flex-nowrap">
              {/* Selector de analisis */}
              <Select
                value={selectedAnalisisForMatrix?.id.toString() || ''}
                onChange={(e) => handleAnalisisChange(e.target.value)}
                options={analisisOptions}
                className="w-64"
              />

              {/* ViewToggle */}
              <ViewToggle
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: 'lista', label: 'Lista', icon: List },
                  { value: 'matriz', label: 'Matriz', icon: LayoutGrid },
                ]}
                moduleColor={moduleColor as 'purple' | 'blue' | 'green' | 'orange' | 'gray'}
              />

              {/* Boton volver */}
              <Button onClick={handleBackToList} variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
          }
        />

        {/* Matriz DOFA */}
        {selectedAnalisisForMatrix ? (
          <DOFAMatrix
            analisisId={selectedAnalisisForMatrix.id}
            onEditFactor={canEdit ? handleEditFactor : undefined}
            readOnly={!canEdit}
          />
        ) : (
          <EmptyState
            icon={<LayoutGrid className="h-12 w-12" />}
            title="Selecciona un analisis"
            description="Elige un analisis DOFA del selector para ver su matriz de factores."
          />
        )}

        {/* Modal de formulario */}
        <AnalisisDofaFormModal
          analisis={isCreating ? null : selectedAnalisis}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    );
  }

  // =============================================================================
  // VISTA LISTA (2B)
  // =============================================================================
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

      {/* Estadisticas */}
      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={analisisStats} columns={4} moduleColor={moduleColor} />
      )}

      {/* Section Header - Vista 2B: Filtros en linea + ViewToggle */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <FileSearch className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="DOFA"
        description="Identifica Fortalezas, Oportunidades, Debilidades y Amenazas"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              leftIcon={<Search className="h-4 w-4" />}
              className="w-48"
            />
            <Select
              value={filters.estado || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  estado: e.target.value ? (e.target.value as EstadoAnalisis) : undefined,
                })
              }
              options={ESTADO_OPTIONS}
              className="w-40"
            />

            {/* ViewToggle */}
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'lista', label: 'Lista', icon: List },
                { value: 'matriz', label: 'Matriz', icon: LayoutGrid },
              ]}
              moduleColor={moduleColor as 'purple' | 'blue' | 'green' | 'orange' | 'gray'}
            />

            {canCreate && (
              <Button onClick={handleCreate} variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Analisis
              </Button>
            )}
          </div>
        }
      />

      {/* Contenido */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : isEmpty ? (
        <EmptyState
          icon={<FileSearch className="h-12 w-12" />}
          title="Sin analisis DOFA"
          description="Cree un analisis DOFA para identificar factores internos y externos de la organizacion."
          action={
            canCreate && (
              <Button onClick={handleCreate} variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Analisis
              </Button>
            )
          }
        />
      ) : (
        <DataTableCard
          columns={[
            {
              key: 'nombre',
              header: 'Analisis',
              render: (analisis: AnalisisDOFA) => (
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {analisis.nombre}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Periodo: {analisis.periodo}
                  </div>
                </div>
              ),
            },
            {
              key: 'estado',
              header: 'Estado',
              render: (analisis: AnalisisDOFA) => renderEstadoBadge(analisis.estado),
            },
            {
              key: 'fecha_analisis',
              header: 'Fecha',
              render: (analisis: AnalisisDOFA) => (
                <div className="text-sm">
                  {new Date(analisis.fecha_analisis).toLocaleDateString('es-CO')}
                </div>
              ),
            },
            {
              key: 'factores',
              header: 'Factores',
              render: (analisis: AnalisisDOFA) => renderFactoresCount(analisis),
            },
            {
              key: 'responsable',
              header: 'Responsable',
              render: (analisis: AnalisisDOFA) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {analisis.responsable_nombre || '-'}
                </span>
              ),
            },
            {
              key: 'acciones',
              header: 'Acciones',
              align: 'right',
              render: (analisis: AnalisisDOFA) => (
                <div className="flex items-center justify-end gap-1">
                  {/* Ver matriz */}
                  <Tooltip content="Ver matriz DOFA">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(analisis)}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  {/* Aprobar (solo si esta en revision) */}
                  {analisis.estado === 'en_revision' && canEdit && (
                    <Tooltip content="Aprobar">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAprobar(analisis)}
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </Button>
                    </Tooltip>
                  )}

                  {/* Editar */}
                  {(analisis.estado === 'borrador' || analisis.estado === 'en_revision') &&
                    canEdit && (
                      <Tooltip content="Editar">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(analisis)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    )}

                  {/* Eliminar */}
                  {canDelete && analisis.estado !== 'vigente' && (
                    <Tooltip content="Eliminar">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(analisis)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              ),
            },
          ]}
          data={data?.results || []}
        />
      )}

      {/* Dialogo de confirmacion para eliminar */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Analisis DOFA"
        message={`Esta seguro de eliminar el analisis "${deleteConfirm?.nombre}"? Se eliminaran todos los factores asociados.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Dialogo de confirmacion para aprobar */}
      <ConfirmDialog
        isOpen={!!aprobarConfirm}
        title="Aprobar Analisis DOFA"
        message={`Al aprobar el analisis "${aprobarConfirm?.nombre}", quedara disponible para generar estrategias TOWS. Desea continuar?`}
        confirmLabel="Aprobar"
        cancelLabel="Cancelar"
        variant="info"
        onConfirm={handleAprobarConfirm}
        onCancel={() => setAprobarConfirm(null)}
        isLoading={aprobarMutation.isPending}
      />

      {/* Modal de formulario */}
      <AnalisisDofaFormModal
        analisis={isCreating ? null : selectedAnalisis}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AnalisisDofaSection;
