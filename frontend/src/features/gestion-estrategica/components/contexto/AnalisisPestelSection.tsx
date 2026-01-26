/**
 * Seccion de Analisis PESTEL
 *
 * Vista Hibrida: 2B + Matriz PESTEL
 * - ViewToggle para alternar entre Lista y Matriz
 * - SectionHeader con busqueda y filtros
 * - DataTableCard para la tabla (Vista 2B)
 * - PESTELMatrix para visualizacion matricial (Vista interactiva)
 * - EmptyState para estado vacio
 * - ConfirmDialog para confirmaciones
 *
 * Gestiona analisis PESTEL (Politico, Economico, Social, Tecnologico, Ecologico, Legal)
 */
import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Globe2,
  Search,
  Eye,
  CheckCircle,
  Clock,
  Building2,
  DollarSign,
  Users,
  Cpu,
  Leaf,
  Scale,
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
  useAnalisisPestel,
  useDeleteAnalisisPestel,
} from '../../hooks/useContexto';
import type {
  AnalisisPESTEL,
  AnalisisPESTELFilters,
  EstadoAnalisis,
  FactorPESTEL,
  TipoFactorPESTEL,
} from '../../types/contexto.types';
import { ESTADO_ANALISIS_CONFIG } from '../../types/contexto.types';
import { AnalisisPestelFormModal } from '../modals/AnalisisPestelFormModal';
import { FactorPestelFormModal } from '../modals/FactorPestelFormModal';
import { PESTELMatrix } from './PESTELMatrix';
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

interface AnalisisPestelSectionProps {
  triggerNewForm?: number;
}

export const AnalisisPestelSection = ({ triggerNewForm }: AnalisisPestelSectionProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [filters, setFilters] = useState<AnalisisPESTELFilters>({});
  const [selectedAnalisis, setSelectedAnalisis] = useState<AnalisisPESTEL | null>(null);
  const [selectedAnalisisForMatrix, setSelectedAnalisisForMatrix] = useState<AnalisisPESTEL | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<AnalisisPESTEL | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Estado para modal de factor (desde matriz)
  const [isFactorModalOpen, setIsFactorModalOpen] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState<FactorPESTEL | null>(null);
  const [factorTipoInicial, setFactorTipoInicial] = useState<TipoFactorPESTEL | undefined>(undefined);

  // RBAC: Verificar permisos del usuario
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'create');
  const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'edit');
  const canDelete = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'delete');

  // Color del modulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Queries y mutations
  const { data, isLoading, error } = useAnalisisPestel({ ...filters }, 1, 50);
  const deleteMutation = useDeleteAnalisisPestel();

  // Auto-seleccionar el primer analisis vigente para la matriz
  useEffect(() => {
    if (viewMode === 'matriz' && data?.results && data.results.length > 0 && !selectedAnalisisForMatrix) {
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
        icon: Globe2,
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
        icon: Building2,
        iconColor: 'primary',
        description: 'P+E+S+T+E+L identificados',
      },
    ];
  }, [data]);

  // Handlers
  const handleCreate = () => {
    setSelectedAnalisis(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleEdit = (analisis: AnalisisPESTEL) => {
    setSelectedAnalisis(analisis);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleView = (analisis: AnalisisPESTEL) => {
    // Cambiar a vista matriz con el analisis seleccionado
    setSelectedAnalisisForMatrix(analisis);
    setViewMode('matriz');
  };

  const handleDeleteRequest = (analisis: AnalisisPESTEL) => {
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
      setAlertMessage({ type: 'success', message: 'Analisis PESTEL eliminado' });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnalisis(null);
    setIsCreating(false);
  };

  // Handlers para la matriz
  const handleEditFactor = (factor: FactorPESTEL) => {
    setSelectedFactor(factor);
    setFactorTipoInicial(undefined);
    setIsFactorModalOpen(true);
  };

  const handleAddFactor = (tipo: TipoFactorPESTEL) => {
    setSelectedFactor(null);
    setFactorTipoInicial(tipo);
    setIsFactorModalOpen(true);
  };

  const handleCloseFactorModal = () => {
    setIsFactorModalOpen(false);
    setSelectedFactor(null);
    setFactorTipoInicial(undefined);
  };

  const handleBackToList = () => {
    setViewMode('lista');
    setSelectedAnalisisForMatrix(null);
  };

  const handleAnalisisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const analisisId = parseInt(e.target.value, 10);
    const analisis = data?.results.find((a) => a.id === analisisId);
    setSelectedAnalisisForMatrix(analisis || null);
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

  // Renderizar contadores de factores por tipo PESTEL
  const renderFactoresPorTipo = (analisis: AnalisisPESTEL) => {
    const factoresPorTipo = (analisis.factores_por_tipo || {}) as Record<TipoFactorPESTEL, number>;
    return (
      <div className="flex items-center gap-2">
        <Tooltip content="Politico">
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3 text-purple-500" />
            <span className="text-xs">{factoresPorTipo.politico || 0}</span>
          </div>
        </Tooltip>
        <Tooltip content="Economico">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-green-500" />
            <span className="text-xs">{factoresPorTipo.economico || 0}</span>
          </div>
        </Tooltip>
        <Tooltip content="Social">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-blue-500" />
            <span className="text-xs">{factoresPorTipo.social || 0}</span>
          </div>
        </Tooltip>
        <Tooltip content="Tecnologico">
          <div className="flex items-center gap-1">
            <Cpu className="h-3 w-3 text-cyan-500" />
            <span className="text-xs">{factoresPorTipo.tecnologico || 0}</span>
          </div>
        </Tooltip>
        <Tooltip content="Ecologico">
          <div className="flex items-center gap-1">
            <Leaf className="h-3 w-3 text-emerald-500" />
            <span className="text-xs">{factoresPorTipo.ecologico || 0}</span>
          </div>
        </Tooltip>
        <Tooltip content="Legal">
          <div className="flex items-center gap-1">
            <Scale className="h-3 w-3 text-amber-500" />
            <span className="text-xs">{factoresPorTipo.legal || 0}</span>
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
        message="Error al cargar los analisis PESTEL. Intente de nuevo."
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
        {/* Alerta de feedback */}
        {alertMessage && (
          <Alert
            variant={alertMessage.type}
            message={alertMessage.message}
            closable
            onClose={() => setAlertMessage(null)}
          />
        )}

        {/* Header de matriz */}
        <SectionHeader
          icon={
            <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
              <LayoutGrid className={`h-5 w-5 ${colorClasses.icon}`} />
            </div>
          }
          title="Matriz PESTEL"
          description={selectedAnalisisForMatrix?.nombre || 'Seleccione un analisis'}
          variant="compact"
          actions={
            <div className="flex items-center gap-3 flex-nowrap">
              {/* Selector de analisis */}
              <Select
                value={selectedAnalisisForMatrix?.id?.toString() || ''}
                onChange={handleAnalisisChange}
                options={[
                  { value: '', label: 'Seleccionar analisis...' },
                  ...(data?.results?.map((a) => ({
                    value: a.id.toString(),
                    label: `${a.nombre} (${a.periodo})`,
                  })) || []),
                ]}
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
              <Button variant="outline" size="sm" onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Lista
              </Button>
            </div>
          }
        />

        {/* Contenido de matriz */}
        {selectedAnalisisForMatrix ? (
          <PESTELMatrix
            analisisId={selectedAnalisisForMatrix.id}
            onEditFactor={canEdit ? handleEditFactor : undefined}
            onAddFactor={canEdit ? handleAddFactor : undefined}
            readOnly={!canEdit}
          />
        ) : (
          <EmptyState
            icon={<LayoutGrid className="h-12 w-12" />}
            title="Seleccione un analisis"
            description="Elija un analisis PESTEL del selector para ver su matriz de factores."
          />
        )}

        {/* Modal de factor */}
        {isFactorModalOpen && selectedAnalisisForMatrix && (
          <FactorPestelFormModal
            factor={selectedFactor}
            analisisId={selectedAnalisisForMatrix.id}
            tipoInicial={factorTipoInicial}
            isOpen={isFactorModalOpen}
            onClose={handleCloseFactorModal}
          />
        )}
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

      {/* Section Header - Vista 2B: Filtros en linea */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Globe2 className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="PESTEL"
        description="Analiza factores Politicos, Economicos, Sociales, Tecnologicos, Ecologicos y Legales"
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
          icon={<Globe2 className="h-12 w-12" />}
          title="Sin analisis PESTEL"
          description="Cree un analisis PESTEL para evaluar el entorno externo de la organizacion."
          action={
            canCreate
              ? {
                  label: 'Crear Primer Analisis',
                  onClick: handleCreate,
                  icon: <Plus className="h-4 w-4" />,
                }
              : undefined
          }
        />
      ) : (
        <DataTableCard
          columns={[
            {
              key: 'nombre',
              header: 'Analisis',
              render: (analisis: AnalisisPESTEL) => (
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
              render: (analisis: AnalisisPESTEL) => renderEstadoBadge(analisis.estado),
            },
            {
              key: 'fecha_analisis',
              header: 'Fecha',
              render: (analisis: AnalisisPESTEL) => (
                <div className="text-sm">
                  {new Date(analisis.fecha_analisis).toLocaleDateString('es-CO')}
                </div>
              ),
            },
            {
              key: 'factores',
              header: 'Factores',
              render: (analisis: AnalisisPESTEL) => renderFactoresPorTipo(analisis),
            },
            {
              key: 'responsable',
              header: 'Responsable',
              render: (analisis: AnalisisPESTEL) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {analisis.responsable_nombre || '-'}
                </span>
              ),
            },
            {
              key: 'acciones',
              header: 'Acciones',
              align: 'right',
              render: (analisis: AnalisisPESTEL) => (
                <div className="flex items-center justify-end gap-1">
                  {/* Ver matriz */}
                  <Tooltip content="Ver matriz">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(analisis)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Tooltip>

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
                        <Trash2 className="h-4 w-4 text-red-500" />
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
        title="Eliminar Analisis PESTEL"
        message={`Esta seguro de eliminar el analisis "${deleteConfirm?.nombre}"? Se eliminaran todos los factores asociados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Modal de formulario */}
      <AnalisisPestelFormModal
        analisis={isCreating ? null : selectedAnalisis}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AnalisisPestelSection;
