/**
 * Tab de gestión de Cargos
 *
 * Vista 2B: Lista CRUD con Filtros Avanzados
 * - SectionHeader con búsqueda y filtros en línea (sin FilterCard separado)
 * - DataTableCard para la tabla
 * - EmptyState para estado vacío
 * - ConfirmDialog para confirmaciones
 *
 * RBAC Unificado v4.0:
 * - Verifica permisos CRUD desde CargoSectionAccess
 * - REORG-B2: Módulo FUNDACION (antes TALENT_HUB)
 */
import { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Lock,
  Briefcase,
  CheckCircle,
  Search,
  Upload,
  Power,
  PowerOff,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Alert } from '@/components/common/Alert';
import { ProtectedAction } from '@/components/common';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { DataTableCard, TableSkeleton } from '@/components/layout/DataTableCard';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import type { ResponsiveTableColumn } from '@/components/common/ResponsiveTable';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import {
  useCargos,
  useDeleteCargo,
  useToggleCargo,
  useReorderCargos,
  useCargoChoices,
} from '../hooks/useCargos';
import { CargoLevelBadge } from './CargoLevelBadge';
import { CargoFormModal } from './CargoFormModal';
import { ImportCargosModal } from './ImportCargosModal';
import type { CargoList, CargoFilters, NivelJerarquico } from '../types/rbac.types';
import { NIVEL_JERARQUICO_OPTIONS } from '../types/rbac.types';
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';

const cargoColumns: ResponsiveTableColumn<CargoList & Record<string, unknown>>[] = [
  {
    key: 'orden',
    header: '#',
    render: (item) => {
      const c = item as unknown as CargoList;
      return (
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{c.orden ?? '-'}</span>
      );
    },
  },
  {
    key: 'name',
    header: 'Cargo',
    priority: 1,
    render: (item) => {
      const c = item as unknown as CargoList;
      return (
        <div className={`flex items-center gap-2 ${!c.is_active ? 'opacity-50' : ''}`}>
          {c.is_system && <Lock className="h-4 w-4 text-gray-400" />}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
          {c.is_system && (
            <Badge variant="gray" size="sm">
              Sistema
            </Badge>
          )}
          {!c.is_active && (
            <Badge variant="warning" size="sm">
              Inactivo
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    key: 'nivel',
    header: 'Nivel',
    priority: 2,
    render: (item) => {
      const c = item as unknown as CargoList;
      return <CargoLevelBadge level={c.nivel_jerarquico} />;
    },
  },
  {
    key: 'proceso',
    header: 'Proceso',
    render: (item) => {
      const c = item as unknown as CargoList;
      return (
        <span className="text-sm text-gray-500 dark:text-gray-400">{c.area_nombre || '-'}</span>
      );
    },
  },
  {
    key: 'usuarios',
    header: 'Usuarios',
    render: (item) => {
      const c = item as unknown as CargoList;
      return (
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Users className="h-4 w-4" />
          {c.users_count || 0}
        </div>
      );
    },
  },
];

export const CargosTab = () => {
  const [filters, setFilters] = useState<CargoFilters>({});
  const [selectedCargo, setSelectedCargo] = useState<CargoList | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CargoList | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // RBAC: Verificar permisos del usuario
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.FUNDACION, Sections.CARGOS, 'create');

  // Color del módulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('fundacion');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const { data, isLoading, error } = useCargos({
    ...filters,
    page_size: 100,
    include_inactive: true,
  });
  const deleteMutation = useDeleteCargo();
  const toggleMutation = useToggleCargo();
  const reorderMutation = useReorderCargos();
  const { data: choicesData } = useCargoChoices();

  // Opciones de areas desde el backend
  const areaOptions = choicesData?.areas || [];

  // Calcular estadísticas para StatsGrid
  const cargoStats: StatItem[] = useMemo(() => {
    const cargos = data?.results || [];
    const totalUsuarios = cargos.reduce((sum, c) => sum + (c.users_count || 0), 0);
    const cargosConUsuarios = cargos.filter((c) => (c.users_count || 0) > 0).length;

    return [
      {
        label: 'Total Cargos',
        value: data?.count || cargos.length,
        icon: Briefcase,
        iconColor: 'info',
      },
      { label: 'Usuarios Asignados', value: totalUsuarios, icon: Users, iconColor: 'primary' },
      {
        label: 'Con Usuarios',
        value: cargosConUsuarios,
        icon: CheckCircle,
        iconColor: 'gray',
        description: 'Cargos ocupados',
      },
    ];
  }, [data]);

  const handleCreate = () => {
    setSelectedCargo(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleEdit = (cargo: CargoList) => {
    setSelectedCargo(cargo);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (cargo: CargoList) => {
    if (cargo.is_system) {
      setAlertMessage('No se puede eliminar un cargo del sistema');
      return;
    }
    if (cargo.users_count && cargo.users_count > 0) {
      setAlertMessage(
        `No se puede eliminar el cargo porque tiene ${cargo.users_count} usuario(s) asignado(s)`
      );
      return;
    }
    setDeleteConfirm(cargo);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCargo(null);
    setIsCreating(false);
  };

  const handleMoveUp = async (index: number) => {
    const results = data?.results;
    if (!results || index <= 0) return;
    const orders = results.map((c, i) => ({
      id: c.id,
      orden: i === index ? index - 1 : i === index - 1 ? index : i,
    }));
    await reorderMutation.mutateAsync(orders);
  };

  const handleMoveDown = async (index: number) => {
    const results = data?.results;
    if (!results || index >= results.length - 1) return;
    const orders = results.map((c, i) => ({
      id: c.id,
      orden: i === index ? index + 1 : i === index + 1 ? index : i,
    }));
    await reorderMutation.mutateAsync(orders);
  };

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar los cargos. Intente de nuevo."
      />
    );
  }

  const isEmpty = !isLoading && (!data?.results || data.results.length === 0);

  return (
    <div className="space-y-6">
      {/* Alerta de error */}
      {alertMessage && (
        <Alert
          variant="warning"
          message={alertMessage}
          closable
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Estadísticas */}
      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={cargoStats} columns={4} moduleColor={moduleColor} />
      )}

      {/* Section Header - Vista 2B: Filtros en línea */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Briefcase className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Cargos"
        description="Estructura de puestos y niveles jerárquicos"
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
              value={filters.nivel_jerarquico || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  nivel_jerarquico: e.target.value
                    ? (e.target.value as NivelJerarquico)
                    : undefined,
                })
              }
              options={[
                { value: '', label: 'Todos los niveles' },
                ...NIVEL_JERARQUICO_OPTIONS.map((opt) => ({
                  value: opt.value.toString(),
                  label: opt.label,
                })),
              ]}
              className="w-44"
            />
            <Select
              value={filters.area?.toString() || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  area: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              options={[
                { value: '', label: 'Todos los procesos' },
                ...areaOptions.map((opt) => ({
                  value: opt.value.toString(),
                  label: opt.label,
                })),
              ]}
              className="w-44"
            />
            <ProtectedAction permission="fundacion.cargos.create">
              <Button onClick={() => setIsImportOpen(true)} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </ProtectedAction>
            <ProtectedAction permission="fundacion.cargos.create">
              <Button onClick={handleCreate} variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cargo
              </Button>
            </ProtectedAction>
          </div>
        }
      />

      {/* Tabla - Vista 2 */}
      <DataTableCard
        isLoading={isLoading}
        isEmpty={isEmpty}
        emptyMessage="No se encontraron cargos"
      >
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : isEmpty ? (
          <EmptyState
            icon={<Briefcase className="h-12 w-12" />}
            title="Sin cargos"
            description={
              canCreate
                ? 'No hay cargos configurados en el sistema. Crea el primer cargo para comenzar.'
                : 'No hay cargos configurados en el sistema.'
            }
            action={
              canCreate
                ? {
                    label: 'Crear Cargo',
                    onClick: handleCreate,
                    icon: <Plus className="h-4 w-4" />,
                  }
                : undefined
            }
          />
        ) : (
          <>
            <ResponsiveTable<CargoList & Record<string, unknown>>
              data={(data?.results || []) as (CargoList & Record<string, unknown>)[]}
              columns={cargoColumns}
              keyExtractor={(item) => item.id as number}
              mobileCardTitle={(item) => {
                const c = item as unknown as CargoList;
                return (
                  <div className="flex items-center gap-2">
                    {c.is_system && <Lock className="h-4 w-4 text-gray-400" />}
                    <span>{c.name}</span>
                    {c.is_system && (
                      <Badge variant="gray" size="sm">
                        Sistema
                      </Badge>
                    )}
                  </div>
                );
              }}
              mobileCardSubtitle={(item) => {
                const c = item as unknown as CargoList;
                return <span>{c.area_nombre || 'Sin proceso'}</span>;
              }}
              renderActions={(item, index) => {
                const cargo = item as unknown as CargoList;
                const itemIndex =
                  typeof index === 'number'
                    ? index
                    : (data?.results || []).findIndex((c) => c.id === cargo.id);
                return (
                  <div className="flex items-center gap-1">
                    <ProtectedAction permission="fundacion.cargos.edit">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(itemIndex)}
                        disabled={itemIndex <= 0 || reorderMutation.isPending}
                        title="Subir"
                        className="!p-1"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                    </ProtectedAction>
                    <ProtectedAction permission="fundacion.cargos.edit">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(itemIndex)}
                        disabled={
                          itemIndex >= (data?.results || []).length - 1 || reorderMutation.isPending
                        }
                        title="Bajar"
                        className="!p-1"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </ProtectedAction>
                    <ProtectedAction permission="fundacion.cargos.edit">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cargo)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </ProtectedAction>
                    <ProtectedAction permission="fundacion.cargos.edit">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await toggleMutation.mutateAsync({ id: cargo.id });
                        }}
                        title={cargo.is_active ? 'Desactivar cargo' : 'Activar cargo'}
                      >
                        {cargo.is_active ? (
                          <PowerOff className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Power className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                    </ProtectedAction>
                    <ProtectedAction permission="fundacion.cargos.delete">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(cargo)}
                        disabled={cargo.is_system || (cargo.users_count || 0) > 0}
                        title={
                          cargo.is_system
                            ? 'Cargo del sistema'
                            : (cargo.users_count || 0) > 0
                              ? 'Tiene usuarios asignados'
                              : 'Eliminar'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </ProtectedAction>
                  </div>
                );
              }}
              hoverable
            />

            {/* Info de paginación */}
            {data && data.count > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 text-center">
                Mostrando {data.results.length} de {data.count} cargos
              </div>
            )}
          </>
        )}
      </DataTableCard>

      {/* Modal de edición/creación */}
      {isModalOpen && (
        <CargoFormModal
          cargo={isCreating ? null : selectedCargo}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Dialog de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Cargo"
        message={`¿Está seguro que desea eliminar el cargo "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Modal de importación masiva */}
      <ImportCargosModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
};
