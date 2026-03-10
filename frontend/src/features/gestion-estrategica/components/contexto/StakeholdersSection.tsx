/**
 * Seccion de Stakeholders (Partes Interesadas)
 *
 * Vista 2B: Lista CRUD con Filtros en linea + Matriz Poder-Interes
 * - StatsGrid con metricas
 * - SectionHeader con busqueda, filtros y ViewToggle
 * - DataTableCard para vista tabla
 * - StakeholderMatrix para vista matriz
 * - EmptyState para estado vacio
 *
 * Ubicacion: gestion-estrategica/contexto
 * API: /gestion-estrategica/contexto/partes-interesadas/
 * Cumple ISO 9001:2015 Clausula 4.2 - Comprension de las necesidades
 * y expectativas de las partes interesadas.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  Building2,
  Globe,
  Zap,
  Target,
  Table,
  LayoutGrid,
  Upload,
  Download,
  FileDown,
  Send,
  ShoppingCart,
  Truck,
  TrendingUp,
  MapPin,
  Landmark,
  Leaf,
  ArrowRightLeft,
  MessageSquare,
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
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';

// Hooks y tipos de gestion-estrategica/planeacion/contexto
import {
  usePartesInteresadas,
  useTiposParteInteresada,
  useGruposParteInteresada,
  useDownloadPlantillaPI,
  useExportPartesInteresadasExcel,
  useImportPartesInteresadasExcel,
  useGenerarMatrizComunicacionMasiva,
  usePartesInteresadasEstadisticas,
  type ParteInteresada,
  type ParteInteresadaFilters,
} from '../../hooks/usePartesInteresadas';

// Componentes locales
import { ParteInteresadaFormModal } from '../modals/ParteInteresadaFormModal';
import { StakeholderMatrix } from './StakeholderMatrix';
import { MatrizComunicacionSection, FRECUENCIAS, MEDIOS } from './MatrizComunicacionSection';

// =============================================================================
// TIPOS
// =============================================================================

type NivelInfluencia = 'alta' | 'media' | 'baja';
type NivelInteres = 'alto' | 'medio' | 'bajo';
type ViewMode = 'table' | 'matrix' | 'comunicacion';
type CuadranteKey = 'gestionar_cerca' | 'mantener_satisfecho' | 'mantener_informado' | 'monitorear';

// =============================================================================
// CONSTANTES
// =============================================================================

const NIVELES_INFLUENCIA = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

const INFLUENCIA_BADGE: Record<
  NivelInfluencia,
  { variant: 'danger' | 'warning' | 'gray'; label: string }
> = {
  alta: { variant: 'danger', label: 'Alta' },
  media: { variant: 'warning', label: 'Media' },
  baja: { variant: 'gray', label: 'Baja' },
};

const INTERES_BADGE: Record<NivelInteres, { variant: 'success' | 'info' | 'gray'; label: string }> =
  {
    alto: { variant: 'success', label: 'Alto' },
    medio: { variant: 'info', label: 'Medio' },
    bajo: { variant: 'gray', label: 'Bajo' },
  };

const CUADRANTE_CONFIG: Record<
  CuadranteKey,
  { label: string; variant: 'danger' | 'warning' | 'info' | 'gray' }
> = {
  gestionar_cerca: { label: 'Gestionar', variant: 'danger' },
  mantener_satisfecho: { label: 'Satisfecho', variant: 'warning' },
  mantener_informado: { label: 'Informado', variant: 'info' },
  monitorear: { label: 'Monitorear', variant: 'gray' },
};

const VIEW_OPTIONS = [
  { value: 'table' as ViewMode, label: 'Tabla', icon: Table },
  { value: 'matrix' as ViewMode, label: 'Matriz', icon: LayoutGrid },
  { value: 'comunicacion' as ViewMode, label: 'Comunicación', icon: MessageSquare },
];

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Calcula el cuadrante de la matriz poder-interes
 * Sprint 17: Actualizado para usar nivel_influencia_pi
 */
const getCuadrante = (stakeholder: ParteInteresada): CuadranteKey => {
  const influenciaAlta = stakeholder.nivel_influencia_pi === 'alta';
  const interesAlto = stakeholder.nivel_interes === 'alto';

  if (influenciaAlta && interesAlto) return 'gestionar_cerca';
  if (influenciaAlta && !interesAlto) return 'mantener_satisfecho';
  if (!influenciaAlta && interesAlto) return 'mantener_informado';
  return 'monitorear';
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface StakeholdersSectionProps {
  triggerNewForm?: number;
}

export const StakeholdersSection = ({ triggerNewForm }: StakeholdersSectionProps) => {
  // Estado local
  const [filters, setFilters] = useState<ParteInteresadaFilters>({
    page: 1,
    page_size: 10,
  });
  const [selectedStakeholder, setSelectedStakeholder] = useState<ParteInteresada | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ParteInteresada | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Estado para filtros de vista Comunicación
  const [comSearch, setComSearch] = useState('');
  const [comFrecuencia, setComFrecuencia] = useState('');
  const [comMedio, setComMedio] = useState('');
  const [comTriggerNew, setComTriggerNew] = useState(0);

  // RBAC: Verificar permisos del usuario
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.CONTEXTO, 'create');
  const canEdit = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.CONTEXTO, 'edit');
  const canDelete = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.CONTEXTO, 'delete');

  // Color del modulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Sprint 17: Ref para input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries - Hook de partes interesadas
  const {
    data: stakeholders,
    totalCount,
    isLoading,
    error,
    delete: deleteStakeholder,
    isDeleting,
  } = usePartesInteresadas(filters);

  const { data: tipos } = useTiposParteInteresada();

  // Sprint 17: Queries nuevas
  const { data: grupos } = useGruposParteInteresada();
  const { data: stats } = usePartesInteresadasEstadisticas();
  const { descargar: descargarPlantilla, isDownloading: isDownloadingPlantilla } =
    useDownloadPlantillaPI();
  const { exportar, isExporting } = useExportPartesInteresadasExcel();
  const { importar, isImporting } = useImportPartesInteresadasExcel();
  const { generar: generarMatrices, isGenerating } = useGenerarMatrizComunicacionMasiva();

  // Opciones de filtro para tipos
  const tipoOptions = useMemo(() => {
    const tiposList = tipos || [];
    return [
      { value: '', label: 'Todos los tipos' },
      ...tiposList.map((t) => ({ value: t.id.toString(), label: t.nombre })),
    ];
  }, [tipos]);

  // Sprint 17: Opciones de filtro para grupos
  const grupoOptions = useMemo(() => {
    const gruposList = Array.isArray(grupos) ? grupos : grupos?.results || [];
    return [
      { value: '', label: 'Todos los grupos' },
      ...gruposList.map((g) => ({ value: g.id.toString(), label: g.nombre })),
    ];
  }, [grupos]);

  // Sprint 17: Mapeo de iconos de grupos
  const GRUPO_ICONS: Record<string, React.ElementType> = {
    Users,
    Building2,
    ShoppingCart,
    Truck,
    TrendingUp,
    MapPin,
    Landmark,
    Globe,
    Leaf,
  };

  // Sprint 17: Calcular estadisticas para StatsGrid (usa stats del backend)
  const stakeholderStats: StatItem[] = useMemo(() => {
    if (!stats) return [];

    // Top 3 grupos por cantidad
    const topGrupos = Object.entries(stats.por_grupo || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3);

    const altaInfluenciaPI = stats.por_influencia_pi?.alta || 0;
    const altaInfluenciaEmpresa = stats.por_influencia_empresa?.alta || 0;

    return [
      {
        label: 'Total',
        value: stats.total,
        icon: Users,
        iconColor: 'info',
        description: 'Partes interesadas',
      },
      {
        label: 'Grupo Principal',
        value: topGrupos[0]?.[1] || 0,
        icon: LayoutGrid,
        iconColor: 'primary',
        description: topGrupos[0]?.[0] || 'Sin datos',
      },
      {
        label: 'Alto Impacto → Empresa',
        value: altaInfluenciaPI,
        icon: ArrowRightLeft,
        iconColor: 'danger',
        description: 'PI con poder sobre empresa',
      },
      {
        label: 'Alto Impacto → PI',
        value: altaInfluenciaEmpresa,
        icon: Zap,
        iconColor: 'warning',
        description: 'Empresa con poder sobre PI',
      },
    ];
  }, [stats]);

  // Efecto para abrir modal cuando se dispara desde el padre
  useEffect(() => {
    if (triggerNewForm && triggerNewForm > 0) {
      handleCreate();
    }
  }, [triggerNewForm]);

  // Handlers
  const handleCreate = () => {
    setSelectedStakeholder(null);
    setIsModalOpen(true);
  };

  const handleEdit = (stakeholder: ParteInteresada) => {
    setSelectedStakeholder(stakeholder);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (stakeholder: ParteInteresada) => {
    setDeleteConfirm(stakeholder);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      try {
        await deleteStakeholder(deleteConfirm.id);
        setDeleteConfirm(null);
        setAlertMessage({ type: 'success', message: 'Parte interesada eliminada correctamente' });
      } catch {
        setAlertMessage({ type: 'error', message: 'Error al eliminar la parte interesada' });
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStakeholder(null);
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleStakeholderClickFromMatrix = (stakeholder: ParteInteresada) => {
    handleEdit(stakeholder);
  };

  // Handlers para Plantilla/Import/Export/Generate Matrix
  const handleDownloadPlantilla = async () => {
    try {
      await descargarPlantilla();
    } catch {
      setAlertMessage({ type: 'error', message: 'Error al descargar la plantilla' });
    }
  };

  const handleExport = async () => {
    try {
      await exportar();
      setAlertMessage({ type: 'success', message: 'Archivo Excel exportado correctamente' });
    } catch {
      setAlertMessage({ type: 'error', message: 'Error al exportar archivo Excel' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importar(file);
      setAlertMessage({ type: 'success', message: 'Archivo Excel importado correctamente' });
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      setAlertMessage({ type: 'error', message: 'Error al importar archivo Excel' });
    }
  };

  const handleGenerateMatrices = async () => {
    try {
      const grupoId = filters.tipo__grupo ? filters.tipo__grupo : undefined;
      await generarMatrices(grupoId);
      setAlertMessage({
        type: 'success',
        message: 'Matrices de comunicación generadas correctamente',
      });
    } catch {
      setAlertMessage({ type: 'error', message: 'Error al generar matrices de comunicación' });
    }
  };

  // Renderizar badges
  const renderInfluenciaBadge = (nivel: NivelInfluencia) => {
    const config = INFLUENCIA_BADGE[nivel];
    return (
      <Badge variant={config?.variant || 'gray'} size="sm">
        {config?.label || nivel}
      </Badge>
    );
  };

  const renderInteresBadge = (nivel: NivelInteres) => {
    const config = INTERES_BADGE[nivel];
    return (
      <Badge variant={config?.variant || 'gray'} size="sm">
        {config?.label || nivel}
      </Badge>
    );
  };

  const renderCuadranteBadge = (stakeholder: ParteInteresada) => {
    const cuadrante = getCuadrante(stakeholder);
    const config = CUADRANTE_CONFIG[cuadrante];
    return (
      <Tooltip content={`Estrategia: ${config.label}`}>
        <Badge variant={config.variant} size="sm">
          <Target className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </Tooltip>
    );
  };

  // Renderizar sistemas de gestion relacionados (dinámico desde NormaISO)
  const renderSistemas = (stakeholder: ParteInteresada) => {
    const normas = stakeholder.normas_relacionadas_detail;

    // Si tiene normas dinámicas, mostrarlas
    if (normas && normas.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {normas.map((n) => (
            <Tooltip key={n.id} content={n.name}>
              <Badge variant="outline" size="sm" style={{ borderColor: n.color, color: n.color }}>
                {n.short_name || n.code}
              </Badge>
            </Tooltip>
          ))}
        </div>
      );
    }

    // Fallback: campos legacy (compatibilidad mientras se migran datos)
    const sistemas = [];
    if (stakeholder.relacionado_sst) sistemas.push('SST');
    if (stakeholder.relacionado_ambiental) sistemas.push('AMB');
    if (stakeholder.relacionado_calidad) sistemas.push('CAL');
    if (stakeholder.relacionado_pesv) sistemas.push('PESV');

    if (sistemas.length === 0) return <span className="text-gray-400">-</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {sistemas.map((s) => (
          <Badge key={s} variant="gray" size="sm">
            {s}
          </Badge>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar los stakeholders. Intente de nuevo."
      />
    );
  }

  const isEmpty = !isLoading && stakeholders.length === 0;

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

      {/* 1. StatsGrid */}
      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={stakeholderStats} columns={4} moduleColor={moduleColor} />
      )}

      {/* Toolbar con Plantilla/Import/Export/Generate Matrix — solo en vistas tabla/matriz */}
      {viewMode !== 'comunicacion' && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadPlantilla}
              variant="outline"
              size="sm"
              disabled={isDownloadingPlantilla}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {isDownloadingPlantilla ? 'Descargando...' : 'Plantilla'}
            </Button>
            <Button
              onClick={handleImportClick}
              variant="outline"
              size="sm"
              disabled={isImporting || !canCreate}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importando...' : 'Importar'}
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm" disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
          </div>
          <Button
            onClick={handleGenerateMatrices}
            variant="outline"
            size="sm"
            disabled={isGenerating || !canCreate}
          >
            <Send className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generando...' : 'Generar Matriz Comunicaciones'}
          </Button>
          {/* Input oculto para importar archivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* 2. SectionHeader con filtros en linea y ViewToggle */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Users className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Partes Interesadas"
        description={`${totalCount} stakeholder${totalCount !== 1 ? 's' : ''} identificado${totalCount !== 1 ? 's' : ''}`}
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            {/* Busqueda — adaptativa por vista */}
            {viewMode !== 'comunicacion' ? (
              <>
                <Input
                  placeholder="Buscar..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="w-48"
                />
                <Select
                  value={filters.tipo__grupo?.toString() || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      tipo__grupo: e.target.value ? parseInt(e.target.value) : undefined,
                      page: 1,
                    })
                  }
                  options={grupoOptions}
                  className="w-40"
                />
                <Select
                  value={filters.tipo?.toString() || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      tipo: e.target.value ? parseInt(e.target.value) : undefined,
                      page: 1,
                    })
                  }
                  options={tipoOptions}
                  className="w-40"
                />
                <Select
                  value={filters.nivel_influencia_pi || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      nivel_influencia_pi: e.target.value
                        ? (e.target.value as NivelInfluencia)
                        : undefined,
                      page: 1,
                    })
                  }
                  options={[
                    { value: '', label: 'Toda influencia' },
                    ...NIVELES_INFLUENCIA.map((n) => ({ value: n.value, label: n.label })),
                  ]}
                  className="w-36"
                />
              </>
            ) : (
              <>
                <Input
                  placeholder="Buscar..."
                  value={comSearch}
                  onChange={(e) => setComSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="w-48"
                />
                <Select
                  value={comFrecuencia}
                  onChange={(e) => setComFrecuencia(e.target.value)}
                  options={[{ value: '', label: 'Toda frecuencia' }, ...FRECUENCIAS]}
                  className="w-40"
                />
                <Select
                  value={comMedio}
                  onChange={(e) => setComMedio(e.target.value)}
                  options={[
                    { value: '', label: 'Todo medio' },
                    ...MEDIOS.map((m) => ({ value: m.value, label: m.label })),
                  ]}
                  className="w-44"
                />
              </>
            )}
            {/* ViewToggle */}
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              options={VIEW_OPTIONS}
              moduleColor={moduleColor as 'purple' | 'blue' | 'green' | 'orange' | 'gray'}
            />
            {/* Boton: Nuevo — adaptativo por vista */}
            {canCreate && (
              <Button
                onClick={
                  viewMode === 'comunicacion' ? () => setComTriggerNew((p) => p + 1) : handleCreate
                }
                variant="primary"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo
              </Button>
            )}
          </div>
        }
      />

      {/* 3. Contenido: Tabla, Matriz o Comunicación */}
      {viewMode === 'comunicacion' ? (
        /* Vista Matriz de Comunicación */
        <MatrizComunicacionSection
          searchFilter={comSearch}
          frecuenciaFilter={comFrecuencia}
          medioFilter={comMedio}
          triggerNewForm={comTriggerNew}
        />
      ) : isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : isEmpty ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Sin stakeholders"
          description="Identifique las partes interesadas de su organizacion para el analisis de contexto (ISO 9001:2015 Clausula 4.2)."
          action={
            canCreate
              ? {
                  label: 'Agregar Primer Stakeholder',
                  onClick: handleCreate,
                  icon: <Plus className="h-4 w-4" />,
                }
              : undefined
          }
        />
      ) : viewMode === 'matrix' ? (
        /* Vista Matriz Poder-Interes */
        <StakeholderMatrix
          stakeholders={stakeholders}
          onStakeholderClick={handleStakeholderClickFromMatrix}
          moduleColor={moduleColor as 'purple' | 'blue' | 'green' | 'orange' | 'gray'}
          showLegend
        />
      ) : (
        /* Vista Tabla - Sprint 17: Columnas actualizadas */
        <DataTableCard
          columns={[
            {
              key: 'nombre',
              header: 'Nombre',
              render: (stakeholder: ParteInteresada) => (
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {stakeholder.nombre}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stakeholder.tipo_nombre}
                  </div>
                </div>
              ),
            },
            {
              key: 'grupo',
              header: 'Grupo',
              render: (stakeholder: ParteInteresada) => {
                if (!stakeholder.grupo_nombre) return <span className="text-gray-400">-</span>;
                const IconComponent = GRUPO_ICONS[stakeholder.grupo_icono || 'Users'] || Users;
                return (
                  <Badge
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 w-fit"
                    style={{
                      borderColor: stakeholder.grupo_color || '#6B7280',
                      color: stakeholder.grupo_color || '#6B7280',
                    }}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{stakeholder.grupo_nombre}</span>
                  </Badge>
                );
              },
            },
            {
              key: 'responsable',
              header: 'Responsable',
              render: (stakeholder: ParteInteresada) => (
                <div className="text-sm">
                  {stakeholder.responsable_empresa_nombre ? (
                    <>
                      <div className="text-gray-900 dark:text-gray-100">
                        {stakeholder.responsable_empresa_nombre}
                      </div>
                      {stakeholder.area_responsable_nombre && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {stakeholder.area_responsable_nombre}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">Sin asignar</span>
                  )}
                </div>
              ),
            },
            {
              key: 'impactos',
              header: 'Impactos',
              render: (stakeholder: ParteInteresada) => (
                <div className="flex flex-col gap-1">
                  <Tooltip content="Poder de la PI sobre la Empresa">
                    <div className="flex items-center gap-1.5">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-red-500" />
                      {renderInfluenciaBadge(stakeholder.nivel_influencia_pi)}
                    </div>
                  </Tooltip>
                  <Tooltip content="Poder de la Empresa sobre la PI">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      {renderInfluenciaBadge(stakeholder.nivel_influencia_empresa)}
                    </div>
                  </Tooltip>
                </div>
              ),
            },
            {
              key: 'interes',
              header: 'Interés',
              render: (stakeholder: ParteInteresada) =>
                renderInteresBadge(stakeholder.nivel_interes),
            },
            {
              key: 'estrategia',
              header: 'Estrategia',
              render: (stakeholder: ParteInteresada) => renderCuadranteBadge(stakeholder),
            },
            {
              key: 'sistemas',
              header: 'Sistemas',
              render: (stakeholder: ParteInteresada) => renderSistemas(stakeholder),
            },
            {
              key: 'acciones',
              header: 'Acciones',
              align: 'right',
              render: (stakeholder: ParteInteresada) => (
                <div className="flex items-center justify-end gap-1">
                  {/* Editar */}
                  {canEdit && (
                    <Tooltip content="Editar">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(stakeholder)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  )}
                  {/* Eliminar */}
                  {canDelete && (
                    <Tooltip content="Eliminar">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(stakeholder)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              ),
            },
          ]}
          data={stakeholders}
          pagination={{
            currentPage: filters.page || 1,
            totalItems: totalCount,
            pageSize: filters.page_size || 10,
            onPageChange: handlePageChange,
          }}
        />
      )}

      {/* Dialogo de confirmacion para eliminar */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Stakeholder"
        message={`Esta seguro de eliminar "${deleteConfirm?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        isLoading={isDeleting}
      />

      {/* Modal de formulario para crear/editar stakeholder */}
      <ParteInteresadaFormModal
        parteInteresada={selectedStakeholder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          setAlertMessage({
            type: 'success',
            message: selectedStakeholder
              ? 'Parte interesada actualizada correctamente'
              : 'Parte interesada creada correctamente',
          });
        }}
      />
    </div>
  );
};

export default StakeholdersSection;
