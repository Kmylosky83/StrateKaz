/**
 * Tab de Procesos Organizacionales
 *
 * Sección dinámica desde BD (TabSection.code = 'areas')
 * Gestión de mapa de procesos organizacionales
 *
 * Usa Design System:
 * - Card para contenedores
 * - Badge para etiquetas
 * - Button para acciones
 * - EmptyState para estados vacíos
 * - DynamicIcon para iconos dinámicos desde BD
 *
 * Conectado a API real: /api/organizacion/areas/
 */
import { useState, useMemo, useCallback } from 'react';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Users,
  DollarSign,
  FolderTree,
  RefreshCw,
  Power,
  PowerOff,
  Search,
  CheckCircle,
  GitBranch,
} from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  EmptyState,
  ConfirmDialog,
  DynamicIcon,
  BrandedSkeleton,
  SectionHeader,
  ProtectedAction,
} from '@/components/common';
import { Input, Switch } from '@/components/forms';
import { StatsGrid } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { getModuleColorClasses, getMappedColorSafe } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import { useModuleColor } from '@/hooks/useModuleColor';
import { AreaFormModal } from './modals/AreaFormModal';
import { OrgTemplateSelector } from './OrgTemplateSelector';
import {
  useAreas,
  // useAreasTree,
  useDeleteArea,
  useToggleArea,
  type Area,
  type AreaList,
} from '../hooks/useAreas';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

// =============================================================================
// COMPONENTE: TARJETA DE ÁREA
// =============================================================================
interface AreaCardProps {
  area: Area | AreaList;
  level: number;
  isExpanded?: boolean;
  hasChildren?: boolean;
  onToggleExpand?: () => void;
  onEdit: (area: Area | AreaList) => void;
  onDelete: (area: Area | AreaList) => void;
  onToggleActive: (area: Area | AreaList) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const AreaCard = ({
  area,
  level,
  isExpanded,
  hasChildren,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleActive,
  canEdit: _canEdit,
  canDelete: _canDelete,
}: AreaCardProps) => {
  // Obtener clases de color dinámicas (Design System centralizado)
  const colorClasses = getModuleColorClasses(getMappedColorSafe(area.color));

  return (
    <div
      className={`
        flex items-center justify-between p-4 bg-white dark:bg-gray-800
        rounded-lg border border-gray-200 dark:border-gray-700
        hover:border-gray-300 dark:hover:border-gray-600
        transition-colors
        ${!area.is_active ? 'opacity-60' : ''}
      `}
      style={{ marginLeft: `${level * 24}px` }}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Indicador de expansión */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="!p-1 !min-h-0 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        ) : (
          <div className="w-6" /> // Spacer para alineación
        )}

        {/* Icono dinámico */}
        <div className={`p-2 rounded-lg ${colorClasses.badge} flex-shrink-0`}>
          <DynamicIcon name={area.icon || 'Building2'} size={20} className={colorClasses.icon} />
        </div>

        {/* Información */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{area.code}</span>
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {area.name}
            </span>
            {!area.is_active && (
              <Badge variant="gray" size="sm">
                Inactiva
              </Badge>
            )}
          </div>
          {'description' in area && area.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {area.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {'cost_center' in area && area.cost_center && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <DollarSign className="h-3 w-3" />
                {area.cost_center}
              </span>
            )}
            {'manager_name' in area && area.manager_name && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Users className="h-3 w-3" />
                {area.manager_name}
              </span>
            )}
            {'children_count' in area && area.children_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <FolderTree className="h-3 w-3" />
                {area.children_count} subprocesos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
        <ProtectedAction permission="fundacion.areas.edit">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(area)}
            title={area.is_active ? 'Desactivar proceso' : 'Activar proceso'}
            className={
              area.is_active
                ? ''
                : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
            }
          >
            {area.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
          </Button>
        </ProtectedAction>
        <ProtectedAction permission="fundacion.areas.edit">
          <Button variant="ghost" size="sm" onClick={() => onEdit(area)} title="Editar proceso">
            <Edit className="h-4 w-4" />
          </Button>
        </ProtectedAction>
        <ProtectedAction permission="fundacion.areas.delete">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(area)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Eliminar proceso"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </ProtectedAction>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
export const AreasTab = () => {
  // Color del módulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('fundacion');
  const moduleColorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Estado local
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | AreaList | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<Area | AreaList | null>(null);
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(true); // Por defecto mostrar todas
  const [templateSelectorDismissed, setTemplateSelectorDismissed] = useState(false);

  // Queries
  // NOTA: El backend usa 'include_inactive=true' para mostrar todas (activas + inactivas)
  // Por defecto solo muestra activas
  const {
    data: areasData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAreas({
    search: searchTerm || undefined,
    include_inactive: showInactive || undefined, // true = mostrar todas, undefined = solo activas
  });

  // const { data: treeData } = useAreasTree();
  // TODO: Use treeData for tree view if needed

  // Mutations
  const deleteMutation = useDeleteArea();
  const toggleMutation = useToggleArea();

  // RBAC Permission Checks
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.FUNDACION, Sections.AREAS, 'create');
  const canEdit = canDo(Modules.FUNDACION, Sections.AREAS, 'edit');
  const canDelete = canDo(Modules.FUNDACION, Sections.AREAS, 'delete');

  // Lista de áreas
  const areas = useMemo(() => areasData?.results || [], [areasData]);

  // Organizar áreas por jerarquía para vista de árbol
  const rootAreas = useMemo(() => {
    return areas.filter((a) => !a.parent);
  }, [areas]);

  // Calcular estadísticas para StatsGrid
  const areaStats: StatItem[] = useMemo(() => {
    const activas = areas.filter((a) => a.is_active).length;
    // const inactivas = areas.filter((a) => !a.is_active).length;
    // Buscar por manager (ID) en lugar de manager_name ya que el nombre puede estar vacío
    const conManager = areas.filter((a) => a.manager !== null && a.manager !== undefined).length;
    const areasRaiz = areas.filter((a) => !a.parent).length;

    return [
      {
        label: 'Total Procesos',
        value: areas.length,
        icon: Building2,
        iconColor: 'info' as const,
      },
      {
        label: 'Procesos Activos',
        value: activas,
        icon: CheckCircle,
        iconColor: 'success' as const,
      },
      {
        label: 'Procesos Raiz',
        value: areasRaiz,
        icon: GitBranch,
        iconColor: 'info' as const,
        description: 'Sin proceso padre',
      },
      {
        label: 'Con Responsable',
        value: conManager,
        icon: Users,
        iconColor: 'gray' as const,
      },
    ];
  }, [areas]);

  const getChildAreas = useCallback(
    (parentId: number) => {
      return areas.filter((a) => a.parent === parentId);
    },
    [areas]
  );

  // Handlers
  const handleAdd = () => {
    setSelectedArea(null);
    setShowFormModal(true);
  };

  const handleEdit = (area: Area | AreaList) => {
    setSelectedArea(area);
    setShowFormModal(true);
  };

  const handleDelete = (area: Area | AreaList) => {
    setAreaToDelete(area);
  };

  const confirmDelete = async () => {
    if (areaToDelete) {
      await deleteMutation.mutateAsync(areaToDelete.id);
      setAreaToDelete(null);
    }
  };

  const handleToggleActive = async (area: Area | AreaList) => {
    await toggleMutation.mutateAsync({
      id: area.id,
      isActive: !area.is_active,
    });
  };

  const toggleExpand = (areaId: number) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  // Renderizar área con sus hijos recursivamente
  const renderAreaWithChildren = (area: AreaList, level: number = 0) => {
    const children = getChildAreas(area.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedAreas.has(area.id);

    return (
      <div key={area.id} className="space-y-2">
        <AreaCard
          area={area}
          level={level}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggleExpand={() => toggleExpand(area.id)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          canEdit={canEdit}
          canDelete={canDelete}
        />
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {children.map((child) => renderAreaWithChildren(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Loading state - muestra logo del branding
  if (isLoading) {
    return <BrandedSkeleton height="h-96" logoSize="xl" showText />;
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <div className="p-6">
          <EmptyState
            icon={<Building2 className="h-12 w-12" />}
            title="Error al cargar procesos"
            description="No se pudieron cargar los procesos. Por favor, intente nuevamente."
            action={{
              label: 'Reintentar',
              onClick: () => refetch(),
              icon: <RefreshCw className="h-4 w-4" />,
            }}
          />
        </div>
      </Card>
    );
  }

  // Empty state solo si no hay áreas Y el filtro incluye inactivas (significa que realmente no hay ninguna)
  const reallyEmpty = areas.length === 0 && !searchTerm && showInactive;

  if (reallyEmpty) {
    // Mostrar selector de plantillas si no ha sido descartado
    if (!templateSelectorDismissed && canCreate) {
      return (
        <>
          <OrgTemplateSelector onSkip={() => setTemplateSelectorDismissed(true)} />
          <AreaFormModal
            area={null}
            isOpen={showFormModal}
            onClose={() => setShowFormModal(false)}
          />
        </>
      );
    }

    // Si descartó las plantillas, mostrar empty state clásico
    return (
      <>
        <Card>
          <div className="p-6">
            <EmptyState
              icon={<Building2 className="h-12 w-12" />}
              title="Sin Procesos Configurados"
              description="No hay procesos definidos. Crea el primer proceso para comenzar a estructurar tu organización."
              action={
                canCreate
                  ? {
                      label: 'Crear Primer Proceso',
                      onClick: handleAdd,
                      icon: <Plus className="h-4 w-4" />,
                    }
                  : undefined
              }
            />
          </div>
        </Card>
        <AreaFormModal area={null} isOpen={showFormModal} onClose={() => setShowFormModal(false)} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. StatsGrid de Áreas */}
      <StatsGrid stats={areaStats} columns={4} moduleColor={moduleColor} />

      {/* 2. Section Header - FUERA de cualquier contenedor (Vista 7) */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${moduleColorClasses.badge}`}>
            <Building2 className={`h-5 w-5 ${moduleColorClasses.icon}`} />
          </div>
        }
        title="Procesos"
        description="Mapa de procesos organizacionales"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="w-48"
            />
            <Switch
              label="Incluir inactivas"
              checked={showInactive}
              onCheckedChange={setShowInactive}
              size="sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Actualizar lista"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <ProtectedAction permission="fundacion.areas.create">
              <Button variant="primary" size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proceso
              </Button>
            </ProtectedAction>
          </div>
        }
      />

      {/* 3. Tree Cards - Lista jerárquica de áreas (Vista 7) */}
      {areas.length === 0 ? (
        <Card>
          <div className="p-6">
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="Sin resultados"
              description={
                searchTerm
                  ? `No se encontraron procesos que coincidan con "${searchTerm}"`
                  : !showInactive
                    ? 'No hay procesos activos. Activa el filtro "Incluir inactivos" para ver todos.'
                    : 'No hay procesos configurados.'
              }
              action={
                searchTerm
                  ? { label: 'Limpiar búsqueda', onClick: () => setSearchTerm('') }
                  : !showInactive
                    ? { label: 'Incluir inactivas', onClick: () => setShowInactive(true) }
                    : {
                        label: 'Crear Proceso',
                        onClick: handleAdd,
                        icon: <Plus className="h-4 w-4" />,
                      }
              }
            />
          </div>
        </Card>
      ) : (
        <div className="space-y-2">{rootAreas.map((area) => renderAreaWithChildren(area))}</div>
      )}

      {/* Modal de formulario */}
      <AreaFormModal
        area={selectedArea as Area | null}
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedArea(null);
        }}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!areaToDelete}
        onClose={() => setAreaToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Proceso"
        message={
          <>
            ¿Estas seguro de eliminar el proceso <strong>"{areaToDelete?.name}"</strong>?
            {(areaToDelete as Area)?.children_count > 0 && (
              <span className="block mt-2 text-amber-600 dark:text-amber-400">
                Este proceso tiene subprocesos que tambien seran afectados.
              </span>
            )}
            <span className="block mt-2">Esta acción no se puede deshacer.</span>
          </>
        }
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AreasTab;
