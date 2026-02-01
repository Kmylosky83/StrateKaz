/**
 * Multi-selector de roles con chips
 */
import { useState, useMemo } from 'react';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Spinner } from '@/components/common/Spinner';
import { Search, X, Lock } from 'lucide-react';
import { useRoles } from '../hooks/useRoles';

interface RoleSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  excludeSystem?: boolean;
  disabled?: boolean;
}

export const RoleSelector = ({
  selectedIds,
  onChange,
  excludeSystem = false,
  disabled = false,
}: RoleSelectorProps) => {
  const { data: rolesData, isLoading } = useRoles({ is_active: true });
  const [search, setSearch] = useState('');

  const roles = useMemo(() => {
    if (!rolesData?.results) return [];
    return excludeSystem ? rolesData.results.filter((r) => !r.is_system) : rolesData.results;
  }, [rolesData, excludeSystem]);

  const selectedRoles = useMemo(() => {
    return roles.filter((r) => selectedIds.includes(r.id));
  }, [roles, selectedIds]);

  const availableRoles = useMemo(() => {
    const filtered = roles.filter((r) => !selectedIds.includes(r.id));
    if (!search) return filtered;

    return filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [roles, selectedIds, search]);

  const addRole = (roleId: number) => {
    if (disabled) return;
    onChange([...selectedIds, roleId]);
    setSearch('');
  };

  const removeRole = (roleId: number) => {
    if (disabled) return;
    onChange(selectedIds.filter((id) => id !== roleId));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Roles seleccionados */}
      {selectedRoles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedRoles.map((role) => (
            <Badge
              key={role.id}
              variant={role.is_system ? 'gray' : 'purple'}
              className="flex items-center gap-1 px-3 py-1"
            >
              {role.is_system && <Lock className="h-3 w-3" />}
              <span>{role.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeRole(role.id)}
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Buscador */}
      {!disabled && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Lista de roles disponibles */}
      {!disabled && search && availableRoles.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
          {availableRoles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => addRole(role.id)}
              className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{role.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{role.code}</div>
                </div>
                {role.is_system && (
                  <Badge variant="gray" size="sm">
                    <Lock className="h-3 w-3 mr-1" />
                    Sistema
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {!disabled && search && availableRoles.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No se encontraron roles
        </div>
      )}
    </div>
  );
};
