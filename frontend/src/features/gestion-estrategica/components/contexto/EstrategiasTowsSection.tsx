/**
 * Seccion de Estrategias TOWS
 *
 * Vista Hibrida: Lista CRUD (2B) + Matriz TOWS con ViewToggle
 * - SectionHeader con busqueda, filtros y ViewToggle
 * - Tabla para vista lista
 * - TOWSMatrix para visualizacion en cuadrantes (vista matriz)
 * - EmptyState para estado vacio
 * - ConfirmDialog para confirmaciones
 *
 * Gestiona estrategias cruzadas TOWS:
 * - FO (Fortalezas-Oportunidades): Estrategias ofensivas
 * - FA (Fortalezas-Amenazas): Estrategias defensivas
 * - DO (Debilidades-Oportunidades): Estrategias adaptativas
 * - DA (Debilidades-Amenazas): Estrategias de supervivencia
 */
import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Lightbulb,
  Search,
  Eye,
  Sword,
  Shield,
  RefreshCw,
  AlertTriangle,
  Target,
  Clock,
  CheckCircle,
  List,
  LayoutGrid,
  ArrowLeft,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Alert } from '@/components/common/Alert';
import { Progress } from '@/components/common/Progress';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ViewToggle } from '@/components/common/ViewToggle';
import { Tooltip } from '@/components/common/Tooltip';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { TableSkeleton } from '@/components/layout/DataTableCard';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import {
  useEstrategiasTows,
  useDeleteEstrategiaTows,
  useAnalisisDofa,
} from '../../hooks/useContexto';
import type {
  EstrategiaTOWS,
  EstrategiaTOWSFilters,
  TipoEstrategiaTOWS,
  EstadoEstrategia,
  Prioridad,
  AnalisisDOFA,
} from '../../types/contexto.types';
import {
  TIPO_ESTRATEGIA_TOWS_CONFIG,
  ESTADO_ESTRATEGIA_CONFIG,
  PRIORIDAD_CONFIG,
} from '../../types/contexto.types';
import { TOWSMatrix } from './TOWSMatrix';
import { EstrategiaTowsFormModal } from '../modals/EstrategiaTowsFormModal';
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

const TIPO_OPTIONS: { value: TipoEstrategiaTOWS | ''; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'fo', label: 'FO - Ofensiva' },
  { value: 'fa', label: 'FA - Defensiva' },
  { value: 'do', label: 'DO - Adaptativa' },
  { value: 'da', label: 'DA - Supervivencia' },
];

const ESTADO_OPTIONS: { value: EstadoEstrategia | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'propuesta', label: 'Propuesta' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'en_ejecucion', label: 'En Ejecución' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'suspendida', label: 'Suspendida' },
];

// =============================================================================
// ICONOS POR TIPO DE ESTRATEGIA
// =============================================================================

const ESTRATEGIA_ICONS: Record<TipoEstrategiaTOWS, React.ElementType> = {
  fo: Sword,
  fa: Shield,
  do: RefreshCw,
  da: AlertTriangle,
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface EstrategiasTowsSectionProps {
  triggerNewForm?: number;
}

export const EstrategiasTowsSection = ({ triggerNewForm }: EstrategiasTowsSectionProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [filters, setFilters] = useState<EstrategiaTOWSFilters>({});
  const [selectedEstrategia, setSelectedEstrategia] = useState<EstrategiaTOWS | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<EstrategiaTOWS | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Para vista matriz: seleccionar analisis DOFA
  const [selectedAnalisisForMatrix, setSelectedAnalisisForMatrix] = useState<AnalisisDOFA | null>(
    null
  );

  // RBAC: Verificar permisos del usuario
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.DOFA_ESTRATEGIAS, 'create');
  const canEdit = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.DOFA_ESTRATEGIAS, 'edit');
  const canDelete = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.DOFA_ESTRATEGIAS, 'delete');

  // Color del modulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Queries y mutations
  const { data, isLoading, error } = useEstrategiasTows({ ...filters }, 1, 50);
  const deleteMutation = useDeleteEstrategiaTows();

  // Query para analisis DOFA (para vista matriz)
  const { data: analisisData } = useAnalisisDofa({}, 1, 20);

  // Opciones de analisis para el selector
  const analisisOptions = useMemo(() => {
    const analisis = analisisData?.results || [];
    return [
      { value: '', label: 'Seleccionar analisis...' },
      ...analisis.map((a) => ({
        value: a.id.toString(),
        label: `${a.nombre} (${a.periodo})`,
      })),
    ];
  }, [analisisData]);

  // Calcular estadisticas para StatsGrid
  const estrategiasStats: StatItem[] = useMemo(() => {
    const estrategias = data?.results || [];
    const enEjecucion = estrategias.filter((e) => e.estado === 'en_ejecucion').length;
    const completadas = estrategias.filter((e) => e.estado === 'completada').length;
    const altaPrioridad = estrategias.filter((e) => e.prioridad === 'alta').length;

    return [
      {
        label: 'Total Estrategias',
        value: data?.count || estrategias.length,
        icon: Lightbulb,
        iconColor: 'info',
      },
      {
        label: 'En Ejecución',
        value: enEjecucion,
        icon: Clock,
        iconColor: 'warning',
        description: 'Implementándose',
      },
      {
        label: 'Completadas',
        value: completadas,
        icon: CheckCircle,
        iconColor: 'success',
        description: 'Finalizadas',
      },
      {
        label: 'Alta Prioridad',
        value: altaPrioridad,
        icon: Target,
        iconColor: 'danger',
        description: 'Requieren atención',
      },
    ];
  }, [data]);

  // Handlers
  const handleCreate = () => {
    setSelectedEstrategia(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleEdit = (estrategia: EstrategiaTOWS) => {
    setSelectedEstrategia(estrategia);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleView = (estrategia: EstrategiaTOWS) => {
    setSelectedEstrategia(estrategia);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (estrategia: EstrategiaTOWS) => {
    if (estrategia.estado === 'en_ejecucion') {
      setAlertMessage({
        type: 'warning',
        message: 'No se puede eliminar una estrategia en ejecucion.',
      });
      return;
    }
    setDeleteConfirm(estrategia);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
      setAlertMessage({ type: 'success', message: 'Estrategia eliminada' });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEstrategia(null);
    setIsCreating(false);
  };

  const handleAnalisisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const analisisId = e.target.value;
    if (analisisId) {
      const analisis = analisisData?.results.find((a) => a.id.toString() === analisisId);
      setSelectedAnalisisForMatrix(analisis || null);
    } else {
      setSelectedAnalisisForMatrix(null);
    }
  };

  const handleBackToList = () => {
    setViewMode('lista');
    setSelectedAnalisisForMatrix(null);
  };

  // Trigger de modal externo (desde header)
  useEffect(() => {
    if (triggerNewForm && triggerNewForm > 0) {
      handleCreate();
    }
  }, [triggerNewForm]);

  // Renderizar badge de tipo de estrategia
  const renderTipoBadge = (tipo: TipoEstrategiaTOWS) => {
    const config = TIPO_ESTRATEGIA_TOWS_CONFIG[tipo];
    const Icon = ESTRATEGIA_ICONS[tipo];
    return (
      <div className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.textClass}`} />
        <span className={`text-xs font-medium ${config.textClass}`}>{config.label}</span>
      </div>
    );
  };

  // Renderizar badge de estado
  const renderEstadoBadge = (estado: EstadoEstrategia) => {
    const config = ESTADO_ESTRATEGIA_CONFIG[estado];
    return (
      <Badge variant={config?.color || 'gray'} size="sm">
        {config?.label || estado}
      </Badge>
    );
  };

  // Renderizar badge de prioridad
  const renderPrioridadBadge = (prioridad: Prioridad) => {
    const config = PRIORIDAD_CONFIG[prioridad];
    return (
      <Badge variant={config?.color || 'gray'} size="sm">
        {config?.label || prioridad}
      </Badge>
    );
  };

  // Renderizar progreso con color dinamico
  const renderProgreso = (estrategia: EstrategiaTOWS) => {
    const porcentaje = estrategia.progreso_porcentaje || 0;
    return (
      <div className="flex items-center gap-2">
        <Progress value={porcentaje} className="w-16 h-2" />
        <span className="text-xs text-gray-500 dark:text-gray-400">{porcentaje}%</span>
      </div>
    );
  };

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar las estrategias TOWS. Intente de nuevo."
      />
    );
  }

  const isEmpty = !isLoading && (!data?.results || data.results.length === 0);

  // Renderizar vista de matriz
  const renderMatrixView = () => {
    if (!selectedAnalisisForMatrix) {
      return (
        <Card className="p-8">
          <div className="text-center">
            <LayoutGrid className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Seleccione un Analisis DOFA
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Para ver la matriz TOWS, primero seleccione un analisis DOFA del cual se generaron las
              estrategias.
            </p>
            <Select
              value=""
              onChange={handleAnalisisChange}
              options={analisisOptions}
              className="max-w-xs mx-auto"
            />
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {/* Header con selector y boton volver */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
            <Select
              value={selectedAnalisisForMatrix.id.toString()}
              onChange={handleAnalisisChange}
              options={analisisOptions}
              className="w-64"
            />
          </div>
          <Badge variant="info">
            {selectedAnalisisForMatrix.nombre} - {selectedAnalisisForMatrix.periodo}
          </Badge>
        </div>

        {/* Matriz TOWS */}
        <TOWSMatrix
          analisisId={selectedAnalisisForMatrix.id}
          onEditEstrategia={handleEdit}
          readOnly={!canEdit}
        />
      </div>
    );
  };

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
        <StatsGrid stats={estrategiasStats} columns={4} moduleColor={moduleColor} />
      )}

      {/* Section Header con ViewToggle */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Lightbulb className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="TOWS"
        description="Define estrategias cruzando Fortalezas, Oportunidades, Debilidades y Amenazas"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            {viewMode === 'lista' && (
              <>
                <Input
                  placeholder="Buscar..."
                  value={((filters as Record<string, unknown>).search as string) || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      search: e.target.value,
                    } as EstrategiaTOWSFilters)
                  }
                  leftIcon={<Search className="h-4 w-4" />}
                  className="w-40"
                />
                <Select
                  value={filters.tipo || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      tipo: e.target.value ? (e.target.value as TipoEstrategiaTOWS) : undefined,
                    })
                  }
                  options={TIPO_OPTIONS}
                  className="w-36"
                />
                <Select
                  value={filters.estado || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      estado: e.target.value ? (e.target.value as EstadoEstrategia) : undefined,
                    })
                  }
                  options={ESTADO_OPTIONS}
                  className="w-36"
                />
              </>
            )}

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

            {canCreate && viewMode === 'lista' && (
              <Button onClick={handleCreate} variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Estrategia
              </Button>
            )}
          </div>
        }
      />

      {/* Contenido segun vista */}
      {viewMode === 'matriz' ? (
        renderMatrixView()
      ) : (
        <>
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : isEmpty ? (
            <EmptyState
              icon={<Lightbulb className="h-12 w-12" />}
              title="Sin estrategias TOWS"
              description="Cree estrategias cruzando los factores DOFA identificados para aprovechar oportunidades y mitigar riesgos."
              action={
                canCreate
                  ? {
                      label: 'Crear Primera Estrategia',
                      onClick: handleCreate,
                      icon: <Plus className="h-4 w-4" />,
                    }
                  : undefined
              }
            />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estrategia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Progreso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Responsable
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {data?.results.map((estrategia) => (
                      <tr
                        key={estrategia.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                              {estrategia.descripcion}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {estrategia.objetivo}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{renderTipoBadge(estrategia.tipo)}</td>
                        <td className="px-6 py-4">{renderEstadoBadge(estrategia.estado)}</td>
                        <td className="px-6 py-4">{renderPrioridadBadge(estrategia.prioridad)}</td>
                        <td className="px-6 py-4">{renderProgreso(estrategia)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {estrategia.responsable_nombre ||
                              estrategia.area_responsable?.nombre ||
                              '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* Ver detalle */}
                            <Tooltip content="Ver detalle">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(estrategia)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Tooltip>

                            {/* Editar */}
                            {estrategia.estado !== 'completada' &&
                              estrategia.estado !== 'cancelada' &&
                              canEdit && (
                                <Tooltip content="Editar">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(estrategia)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </Tooltip>
                              )}

                            {/* Eliminar */}
                            {canDelete && estrategia.estado !== 'en_ejecucion' && (
                              <Tooltip content="Eliminar">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRequest(estrategia)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </Tooltip>
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
        </>
      )}

      {/* Dialogo de confirmacion para eliminar */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Estrategia TOWS"
        message={`Esta seguro de eliminar la estrategia "${deleteConfirm?.descripcion?.slice(
          0,
          50
        )}..."?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Modal de formulario */}
      <EstrategiaTowsFormModal
        estrategia={isCreating ? null : selectedEstrategia}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default EstrategiasTowsSection;
