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
import { useState, useMemo, useEffect } from 'react';
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
  type ParteInteresada,
  type ParteInteresadaFilters,
} from '../../hooks/usePartesInteresadas';

// Componentes locales
import { ParteInteresadaFormModal } from '../modals/ParteInteresadaFormModal';
import { StakeholderMatrix } from './StakeholderMatrix';

// =============================================================================
// TIPOS
// =============================================================================

type NivelInfluencia = 'alta' | 'media' | 'baja';
type NivelInteres = 'alto' | 'medio' | 'bajo';
type ViewMode = 'table' | 'matrix';
type CuadranteKey = 'gestionar_cerca' | 'mantener_satisfecho' | 'mantener_informado' | 'monitorear';

// =============================================================================
// CONSTANTES
// =============================================================================

const NIVELES_INFLUENCIA = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

const INFLUENCIA_BADGE: Record<NivelInfluencia, { variant: 'danger' | 'warning' | 'gray'; label: string }> = {
  alta: { variant: 'danger', label: 'Alta' },
  media: { variant: 'warning', label: 'Media' },
  baja: { variant: 'gray', label: 'Baja' },
};

const INTERES_BADGE: Record<NivelInteres, { variant: 'success' | 'info' | 'gray'; label: string }> = {
  alto: { variant: 'success', label: 'Alto' },
  medio: { variant: 'info', label: 'Medio' },
  bajo: { variant: 'gray', label: 'Bajo' },
};

const CUADRANTE_CONFIG: Record<CuadranteKey, { label: string; variant: 'danger' | 'warning' | 'info' | 'gray' }> = {
  gestionar_cerca: { label: 'Gestionar', variant: 'danger' },
  mantener_satisfecho: { label: 'Satisfecho', variant: 'warning' },
  mantener_informado: { label: 'Informado', variant: 'info' },
  monitorear: { label: 'Monitorear', variant: 'gray' },
};

const VIEW_OPTIONS = [
  { value: 'table' as ViewMode, label: 'Tabla', icon: Table },
  { value: 'matrix' as ViewMode, label: 'Matriz', icon: LayoutGrid },
];

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Calcula el cuadrante de la matriz poder-interes
 */
const getCuadrante = (stakeholder: ParteInteresada): CuadranteKey => {
  const influenciaAlta = stakeholder.nivel_influencia === 'alta';
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

  // RBAC: Verificar permisos del usuario
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'create');
  const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'edit');
  const canDelete = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'delete');

  // Color del modulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

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

  // Opciones de filtro para tipos
  const tipoOptions = useMemo(() => {
    const tiposList = tipos || [];
    return [
      { value: '', label: 'Todos los tipos' },
      ...tiposList.map((t) => ({ value: t.id.toString(), label: t.nombre })),
    ];
  }, [tipos]);

  // Calcular estadisticas para StatsGrid
  const stakeholderStats: StatItem[] = useMemo(() => {
    const internos = stakeholders.filter((s) =>
      s.tipo_categoria === 'interna'
    ).length;
    const externos = stakeholders.length - internos;
    const altaInfluencia = stakeholders.filter((s) => s.nivel_influencia === 'alta').length;
    const gestionarCerca = stakeholders.filter((s) => getCuadrante(s) === 'gestionar_cerca').length;

    return [
      {
        label: 'Total',
        value: totalCount,
        icon: Users,
        iconColor: 'info',
        description: 'Partes interesadas',
      },
      {
        label: 'Internos',
        value: internos,
        icon: Building2,
        iconColor: 'primary',
        description: 'Empleados, directivos',
      },
      {
        label: 'Externos',
        value: externos,
        icon: Globe,
        iconColor: 'success',
        description: 'Clientes, proveedores',
      },
      {
        label: 'Gestionar de Cerca',
        value: gestionarCerca,
        icon: Zap,
        iconColor: 'danger',
        description: 'Atencion prioritaria',
      },
    ];
  }, [stakeholders, totalCount]);

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

  // Renderizar sistemas relacionados
  const renderSistemas = (stakeholder: ParteInteresada) => {
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
            {/* Busqueda */}
            <Input
              placeholder="Buscar..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              leftIcon={<Search className="h-4 w-4" />}
              className="w-48"
            />
            {/* Filtro: Tipo */}
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
            {/* Filtro: Influencia */}
            <Select
              value={filters.nivel_influencia || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  nivel_influencia: e.target.value ? (e.target.value as NivelInfluencia) : undefined,
                  page: 1,
                })
              }
              options={[
                { value: '', label: 'Toda influencia' },
                ...NIVELES_INFLUENCIA.map((n) => ({ value: n.value, label: n.label })),
              ]}
              className="w-36"
            />
            {/* ViewToggle */}
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              options={VIEW_OPTIONS}
              moduleColor={moduleColor as 'purple' | 'blue' | 'green' | 'orange' | 'gray'}
            />
            {/* Boton: Nuevo */}
            {canCreate && (
              <Button onClick={handleCreate} variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo
              </Button>
            )}
          </div>
        }
      />

      {/* 3. Contenido: Tabla o Matriz */}
      {isLoading ? (
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
        /* Vista Tabla */
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
              key: 'contacto',
              header: 'Contacto',
              render: (stakeholder: ParteInteresada) => (
                <div className="text-sm">
                  {stakeholder.representante ? (
                    <>
                      <div className="text-gray-900 dark:text-gray-100">
                        {stakeholder.representante}
                      </div>
                      {stakeholder.cargo_representante && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {stakeholder.cargo_representante}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              ),
            },
            {
              key: 'influencia',
              header: 'Influencia',
              render: (stakeholder: ParteInteresada) =>
                renderInfluenciaBadge(stakeholder.nivel_influencia),
            },
            {
              key: 'interes',
              header: 'Interes',
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(stakeholder)}
                      >
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
