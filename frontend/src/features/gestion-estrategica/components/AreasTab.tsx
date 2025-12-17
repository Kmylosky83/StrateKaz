/**
 * Tab de Áreas y Departamentos
 *
 * Sección dinámica desde BD (TabSection.code = 'areas')
 * Gestión de estructura organizacional por áreas/departamentos
 *
 * Usa Design System:
 * - Card para contenedores
 * - Badge para etiquetas
 * - Button para acciones
 * - EmptyState para estados vacíos
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
  XCircle,
  GitBranch,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState, ConfirmDialog } from '@/components/common';
import { Input, Switch } from '@/components/forms';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { AreaFormModal } from './modals/AreaFormModal';
import {
  useAreas,
  useAreasTree,
  useDeleteArea,
  useToggleArea,
  type Area,
  type AreaList,
} from '../hooks/useAreas';

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
}: AreaCardProps) => {
  return (
    <div
      className={`
        flex items-center justify-between p-4 bg-white dark:bg-gray-800
        rounded-lg border border-gray-200 dark:border-gray-700
        hover:border-purple-300 dark:hover:border-purple-600
        transition-colors
        ${!area.is_active ? 'opacity-60' : ''}
      `}
      style={{ marginLeft: `${level * 24}px` }}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Indicador de expansión */}
        {hasChildren ? (
          <button
            onClick={onToggleExpand}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-6" /> // Spacer para alineación
        )}

        {/* Icono */}
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
          <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>

        {/* Información */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {area.code}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {area.name}
            </span>
            {!area.is_active && (
              <Badge variant="gray" size="sm">Inactiva</Badge>
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
                {area.children_count} subáreas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(area)}
          title={area.is_active ? 'Desactivar área' : 'Activar área'}
          className={area.is_active ? '' : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'}
        >
          {area.is_active ? (
            <PowerOff className="h-4 w-4" />
          ) : (
            <Power className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(area)}
          title="Editar área"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(area)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Eliminar área"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
export const AreasTab = () => {
  // Estado local
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | AreaList | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<Area | AreaList | null>(null);
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(true); // Por defecto mostrar todas

  // Queries
  // NOTA: El backend usa 'show_inactive=true' para mostrar todas (activas + inactivas)
  // Por defecto solo muestra activas
  const {
    data: areasData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAreas({
    search: searchTerm || undefined,
    show_inactive: showInactive || undefined, // true = mostrar todas, undefined = solo activas
  });

  const { data: treeData } = useAreasTree();

  // Mutations
  const deleteMutation = useDeleteArea();
  const toggleMutation = useToggleArea();

  // Lista de áreas
  const areas = areasData?.results || [];

  // Organizar áreas por jerarquía para vista de árbol
  const rootAreas = useMemo(() => {
    return areas.filter((a) => !a.parent);
  }, [areas]);

  // Calcular estadísticas para StatsGrid
  const areaStats: StatItem[] = useMemo(() => {
    const activas = areas.filter((a) => a.is_active).length;
    const inactivas = areas.filter((a) => !a.is_active).length;
    const conManager = areas.filter((a) => 'manager_name' in a && a.manager_name).length;
    const areasRaiz = areas.filter((a) => !a.parent).length;

    return [
      {
        label: 'Total Áreas',
        value: areas.length,
        icon: Building2,
        iconColor: 'primary' as const,
      },
      {
        label: 'Áreas Activas',
        value: activas,
        icon: CheckCircle,
        iconColor: 'success' as const,
      },
      {
        label: 'Áreas Raíz',
        value: areasRaiz,
        icon: GitBranch,
        iconColor: 'info' as const,
        description: 'Sin área padre',
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
        />
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {children.map((child) => renderAreaWithChildren(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatsGridSkeleton count={4} />
        <Card>
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <div className="p-6">
          <EmptyState
            icon={<Building2 className="h-12 w-12" />}
            title="Error al cargar áreas"
            description="No se pudieron cargar las áreas. Por favor, intente nuevamente."
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
    return (
      <>
        <Card>
          <div className="p-6">
            <EmptyState
              icon={<Building2 className="h-12 w-12" />}
              title="Sin Áreas Configuradas"
              description="No hay áreas o departamentos definidos. Crea la primera área para comenzar a estructurar tu organización."
              action={{
                label: 'Crear Primera Área',
                onClick: handleAdd,
                icon: <Plus className="h-4 w-4" />,
              }}
            />
          </div>
        </Card>
        <AreaFormModal
          area={null}
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* StatsGrid de Áreas */}
      <StatsGrid stats={areaStats} columns={4} macroprocessColor="purple" />

      <Card>
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Áreas y Departamentos
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estructura organizacional de la empresa
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Actualizar lista"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="primary" size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Área
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center gap-4">
              <Switch
                label="Incluir inactivas"
                checked={showInactive}
                onCheckedChange={setShowInactive}
                size="sm"
              />
            </div>
          </div>

          {/* Lista jerárquica de áreas */}
          {areas.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="Sin resultados"
              description={
                searchTerm
                  ? `No se encontraron áreas que coincidan con "${searchTerm}"`
                  : !showInactive
                    ? 'No hay áreas activas. Activa el filtro "Incluir inactivas" para ver todas.'
                    : 'No hay áreas configuradas.'
              }
              action={
                searchTerm
                  ? { label: 'Limpiar búsqueda', onClick: () => setSearchTerm('') }
                  : !showInactive
                    ? { label: 'Incluir inactivas', onClick: () => setShowInactive(true) }
                    : { label: 'Crear Área', onClick: handleAdd, icon: <Plus className="h-4 w-4" /> }
              }
            />
          ) : (
            <div className="space-y-2">
              {rootAreas.map((area) => renderAreaWithChildren(area))}
            </div>
          )}
        </div>
      </Card>

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
        title="Eliminar Área"
        message={
          <>
            ¿Estás seguro de eliminar el área <strong>"{areaToDelete?.name}"</strong>?
            {(areaToDelete as Area)?.children_count > 0 && (
              <span className="block mt-2 text-amber-600 dark:text-amber-400">
                Esta área tiene subáreas que también serán afectadas.
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
