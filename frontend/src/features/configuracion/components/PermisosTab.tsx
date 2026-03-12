/**
 * Tab de visualización de Permisos (solo lectura)
 *
 * Usa Design System:
 * - FilterCard para búsqueda y filtros
 * - Card para contenedores
 * - Badge para etiquetas
 * - Alert para información
 * - StatsGrid para estadísticas
 */
import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Shield, Key, Layers, Eye } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Alert } from '@/components/common/Alert';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { FilterCard, FilterGrid } from '@/components/layout/FilterCard';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { usePermissionsGrouped, usePermissionModules } from '../hooks/usePermissions';
import { ScopeLabels } from '../types/rbac.types';

export const PermisosTab = () => {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data: permissionGroups, isLoading, error } = usePermissionsGrouped();
  const { data: modules } = usePermissionModules();

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (permissionGroups) {
      setExpandedModules(new Set(permissionGroups.map((g) => g.module)));
    }
  };

  const collapseAll = () => {
    setExpandedModules(new Set());
  };

  // Filtrar permisos
  const filteredGroups = permissionGroups
    ?.filter((group) => !moduleFilter || group.module === moduleFilter)
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter(
        (p) =>
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.code.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.permissions.length > 0);

  // Calcular estadísticas para StatsGrid
  const permissionStats: StatItem[] = useMemo(() => {
    const allPermissions = permissionGroups?.flatMap((g) => g.permissions) || [];
    const scopeAll = allPermissions.filter((p) => p.scope === 'ALL').length;
    const _scopeTeam = allPermissions.filter((p) => p.scope === 'TEAM').length;
    const scopeOwn = allPermissions.filter((p) => p.scope === 'OWN').length;
    const totalModules = permissionGroups?.length || 0;

    return [
      {
        label: 'Total Permisos',
        value: allPermissions.length,
        icon: Key,
        iconColor: 'info' as const,
      },
      { label: 'Módulos', value: totalModules, icon: Layers, iconColor: 'info' as const },
      {
        label: 'Alcance Global',
        value: scopeAll,
        icon: Shield,
        iconColor: 'success' as const,
        description: 'Acceso a todos',
      },
      {
        label: 'Alcance Propio',
        value: scopeOwn,
        icon: Eye,
        iconColor: 'gray' as const,
        description: 'Solo propios',
      },
    ];
  }, [permissionGroups]);

  // Contar filtros activos
  const activeFiltersCount = [moduleFilter !== ''].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearch('');
    setModuleFilter('');
  };

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar los permisos. Intente de nuevo."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const isEmpty = !filteredGroups || filteredGroups.length === 0;

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {isLoading ? (
        <StatsGridSkeleton columns={4} />
      ) : (
        <StatsGrid stats={permissionStats} columns={4} moduleColor="purple" />
      )}

      {/* Filtros */}
      <FilterCard
        searchPlaceholder="Buscar permisos..."
        searchValue={search}
        onSearchChange={setSearch}
        collapsible
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={activeFiltersCount > 0 || !!search}
        onClearFilters={handleClearFilters}
      >
        <FilterGrid columns={3}>
          <Select
            label="Módulo"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos los módulos' },
              ...(modules?.map((m) => ({ value: m.value, label: m.label })) || []),
            ]}
          />
        </FilterGrid>
      </FilterCard>

      {/* Info */}
      <Alert
        variant="info"
        message="Los permisos son gestionados por el sistema y no pueden ser creados o eliminados manualmente. Puedes asignarlos a roles o cargos desde sus respectivas secciones."
      />

      {/* Controles de expandir/colapsar */}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={expandAll}>
          Expandir todo
        </Button>
        <Button variant="ghost" size="sm" onClick={collapseAll}>
          Colapsar todo
        </Button>
      </div>

      {/* Lista de permisos agrupados */}
      {isEmpty ? (
        <Card>
          <EmptyState
            icon={<Key className="h-12 w-12" />}
            title="Sin permisos"
            description="No se encontraron permisos con los filtros aplicados."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {filteredGroups?.map((group) => {
            const isExpanded = expandedModules.has(group.module);

            return (
              <div
                key={group.module}
                className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                {/* Header del módulo */}
                <button
                  onClick={() => toggleModule(group.module)}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <Shield className="h-5 w-5 text-purple-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {group.module_name}
                  </span>
                  <Badge variant="gray" size="sm">
                    {group.permissions.length} permisos
                  </Badge>
                </button>

                {/* Permisos del módulo */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {group.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {permission.name}
                              </span>
                              <Badge
                                variant={
                                  permission.scope === 'ALL'
                                    ? 'primary'
                                    : permission.scope === 'TEAM'
                                      ? 'info'
                                      : 'success'
                                }
                                size="sm"
                              >
                                {ScopeLabels[permission.scope] || permission.scope}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                {permission.code}
                              </code>
                            </div>
                            {permission.description && (
                              <p className="text-sm text-gray-500 mt-1">{permission.description}</p>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {permission.action_display || permission.action}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};
