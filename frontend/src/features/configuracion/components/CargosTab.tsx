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
 * - Códigos: gestion_estrategica.cargos.{view|create|edit|delete}
 */
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Users, Lock, Briefcase, CheckCircle, Search } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Alert } from '@/components/common/Alert';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { DataTableCard, TableSkeleton } from '@/components/layout/DataTableCard';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { useCargos, useDeleteCargo, useCargoChoices } from '../hooks/useCargos';
import { CargoLevelBadge } from './CargoLevelBadge';
import { CargoFormModal } from './CargoFormModal';
import type { CargoList, CargoFilters, NivelJerarquico } from '../types/rbac.types';
import { NIVEL_JERARQUICO_OPTIONS } from '../types/rbac.types';
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';

export const CargosTab = () => {
  const [filters, setFilters] = useState<CargoFilters>({});
  const [selectedCargo, setSelectedCargo] = useState<CargoList | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CargoList | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // RBAC: Verificar permisos del usuario
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_ESTRATEGICA, Sections.CARGOS, 'create');
  const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.CARGOS, 'edit');
  const canDelete = canDo(Modules.GESTION_ESTRATEGICA, Sections.CARGOS, 'delete');

  // Color del módulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const { data, isLoading, error } = useCargos({ ...filters, page_size: 100 });
  const deleteMutation = useDeleteCargo();
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
            {canCreate && (
              <Button onClick={handleCreate} variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cargo
              </Button>
            )}
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nivel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proceso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuarios
                    </th>
                    {(canEdit || canDelete) && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.results.map((cargo) => (
                    <tr key={cargo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {cargo.is_system && <Lock className="h-4 w-4 text-gray-400" />}
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {cargo.name}
                          </span>
                          {cargo.is_system && (
                            <Badge variant="gray" size="sm">
                              Sistema
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CargoLevelBadge level={cargo.nivel_jerarquico} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {cargo.area_nombre || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Users className="h-4 w-4" />
                          {cargo.users_count || 0}
                        </div>
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(cargo)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
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
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
    </div>
  );
};
