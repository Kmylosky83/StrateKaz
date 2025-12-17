/**
 * Selector de permisos con vista de arbol agrupada por modulo
 */
import { useState, useMemo } from 'react';
import { Input } from '@/components/forms/Input';
import { Spinner } from '@/components/common/Spinner';
import { Search, ChevronRight, ChevronDown, Check, Minus } from 'lucide-react';
import { usePermissionsGrouped } from '../hooks/usePermissions';
import type { Permission } from '../types/rbac.types';

interface PermissionSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export const PermissionSelector = ({
  selectedIds,
  onChange,
  disabled = false,
}: PermissionSelectorProps) => {
  const { data: permissionGroups, isLoading } = usePermissionsGrouped();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  // Filtrar permisos por busqueda
  const filteredGroups = useMemo(() => {
    if (!permissionGroups) return [];
    if (!search) return permissionGroups;

    return permissionGroups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.code.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [permissionGroups, search]);

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

  const togglePermission = (permissionId: number) => {
    if (disabled) return;
    if (selectedIds.includes(permissionId)) {
      onChange(selectedIds.filter((id) => id !== permissionId));
    } else {
      onChange([...selectedIds, permissionId]);
    }
  };

  const toggleAllInModule = (permissions: Permission[]) => {
    if (disabled) return;
    const modulePermissionIds = permissions.map((p) => p.id);
    const allSelected = modulePermissionIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      onChange(selectedIds.filter((id) => !modulePermissionIds.includes(id)));
    } else {
      const newIds = [...selectedIds];
      modulePermissionIds.forEach((id) => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });
      onChange(newIds);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar permisos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de permisos agrupados */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
        {filteredGroups.map((group) => {
          const isExpanded = expandedModules.has(group.module);
          const modulePermissionIds = group.permissions.map((p) => p.id);
          const allSelected = modulePermissionIds.every((id) => selectedIds.includes(id));
          const someSelected = modulePermissionIds.some((id) => selectedIds.includes(id));

          return (
            <div
              key={group.module}
              className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
            >
              {/* Header del modulo */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <button
                  type="button"
                  onClick={() => toggleModule(group.module)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {group.module_name}
                  </span>
                  <span className="text-sm text-gray-500">({group.permissions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleAllInModule(group.permissions)}
                  disabled={disabled}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    disabled
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                      : allSelected
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : someSelected
                          ? 'bg-purple-100 border-purple-400'
                          : 'bg-white border-gray-300 hover:border-purple-400'
                  }`}
                >
                  {allSelected ? (
                    <Check className="h-3 w-3" />
                  ) : someSelected ? (
                    <Minus className="h-3 w-3 text-purple-600" />
                  ) : null}
                </button>
              </div>

              {/* Permisos del modulo */}
              {isExpanded && (
                <div className="p-2 space-y-1">
                  {group.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                      onClick={() => togglePermission(permission.id)}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          disabled
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                            : selectedIds.includes(permission.id)
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'bg-white border-gray-300 hover:border-purple-400'
                        }`}
                      >
                        {selectedIds.includes(permission.id) && <Check className="h-3 w-3" />}
                      </div>
                      <div className="ml-2 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {permission.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {permission.code}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="p-8 text-center text-gray-500">No se encontraron permisos</div>
        )}
      </div>

      {/* Resumen */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {selectedIds.length} permiso{selectedIds.length !== 1 ? 's' : ''} seleccionado
        {selectedIds.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
