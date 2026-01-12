/**
 * TabPermisosAcciones - Tab de permisos de acciones CRUD para el modal de cargo
 *
 * Componente auto-contenido que carga y guarda automáticamente los permisos del cargo.
 * Reutiliza hooks existentes de gestion-estrategica.
 */
import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, Shield, Save, RefreshCw } from 'lucide-react';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { cn } from '@/lib/utils';
import {
  usePermisosAgrupados,
  useCargoPermisos,
  useAsignarPermisosCargo,
} from '@/features/gestion-estrategica/hooks/useRolesPermisos';
import type { Permiso } from '@/features/gestion-estrategica/components/organizacion/roles/types';

interface TabPermisosAccionesProps {
  /** ID del cargo */
  cargoId: number;
  /** Nombre del cargo (para mostrar) */
  cargoName: string;
}

export const TabPermisosAcciones = ({
  cargoId,
  cargoName: _cargoName,
}: TabPermisosAccionesProps) => {
  // Estado local de selección
  const [localPermissionIds, setLocalPermissionIds] = useState<number[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Estado de expansión de módulos
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Queries
  const { data: permisosAgrupados, isLoading: isLoadingPermisos } = usePermisosAgrupados();
  const { data: cargoPermisos, isLoading: isLoadingCargo } = useCargoPermisos(cargoId);
  const saveMutation = useAsignarPermisosCargo();

  // Inicializar estado local desde servidor
  useEffect(() => {
    if (cargoPermisos?.permissions && !initialized) {
      setLocalPermissionIds(cargoPermisos.permissions.map((p) => p.id));
      setInitialized(true);
    }
  }, [cargoPermisos, initialized]);

  // Expandir todos los módulos por defecto
  useEffect(() => {
    if (permisosAgrupados && expandedModules.length === 0) {
      setExpandedModules(permisosAgrupados.map((g) => g.module));
    }
  }, [permisosAgrupados, expandedModules.length]);

  // Set de IDs para búsqueda rápida
  const selectedSet = useMemo(() => new Set(localPermissionIds), [localPermissionIds]);

  // Detectar si hay cambios sin guardar
  const hasChanges = useMemo(() => {
    if (!cargoPermisos?.permissions) return localPermissionIds.length > 0;
    const serverIds = cargoPermisos.permissions.map((p) => p.id);
    const serverSet = new Set(serverIds);
    if (serverSet.size !== selectedSet.size) return true;
    return localPermissionIds.some((id) => !serverSet.has(id));
  }, [localPermissionIds, cargoPermisos, selectedSet]);

  // Toggle módulo expandido
  const toggleModule = (module: string) => {
    setExpandedModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  };

  // Toggle permiso individual
  const togglePermiso = (permisoId: number) => {
    setLocalPermissionIds((prev) =>
      prev.includes(permisoId) ? prev.filter((id) => id !== permisoId) : [...prev, permisoId]
    );
  };

  // Toggle todos los permisos de un módulo
  const toggleModulePermisos = (permisos: Permiso[]) => {
    const permisoIds = permisos.map((p) => p.id);
    const allSelected = permisoIds.every((id) => selectedSet.has(id));

    if (allSelected) {
      setLocalPermissionIds((prev) => prev.filter((id) => !permisoIds.includes(id)));
    } else {
      setLocalPermissionIds((prev) => [...new Set([...prev, ...permisoIds])]);
    }
  };

  // Guardar cambios
  const handleSave = async () => {
    await saveMutation.mutateAsync({
      cargoId,
      permissionIds: localPermissionIds,
    });
  };

  // Revertir cambios
  const handleRevert = () => {
    if (cargoPermisos?.permissions) {
      setLocalPermissionIds(cargoPermisos.permissions.map((p) => p.id));
    } else {
      setLocalPermissionIds([]);
    }
  };

  // Estadísticas
  const stats = useMemo(() => {
    if (!permisosAgrupados) return { total: 0, selected: 0 };
    const total = permisosAgrupados.reduce((sum, g) => sum + g.permissions.length, 0);
    return { total, selected: localPermissionIds.length };
  }, [permisosAgrupados, localPermissionIds]);

  if (isLoadingPermisos || isLoadingCargo) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Spinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400 mt-3">Cargando permisos...</p>
      </div>
    );
  }

  if (!permisosAgrupados || permisosAgrupados.length === 0) {
    return (
      <Alert
        variant="warning"
        message="No hay permisos configurados en el sistema. Ejecute init_rbac para inicializar."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Barra de acciones */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {stats.selected} de {stats.total} permisos
          </span>
          {hasChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              (cambios sin guardar)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRevert}
              disabled={saveMutation.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Revertir
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            isLoading={saveMutation.isPending}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Guardar Permisos
          </Button>
        </div>
      </div>

      {/* Árbol de permisos */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {permisosAgrupados.map((grupo) => {
          const isExpanded = expandedModules.includes(grupo.module);
          const permisoIds = grupo.permissions.map((p) => p.id);
          const selectedCount = permisoIds.filter((id) => selectedSet.has(id)).length;
          const allSelected = selectedCount === grupo.permissions.length;
          const someSelected = selectedCount > 0 && !allSelected;

          return (
            <div
              key={grupo.module}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Header del módulo */}
              <div
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => toggleModule(grupo.module)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                )}

                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleModulePermisos(grupo.permissions);
                  }}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 flex-shrink-0"
                />

                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {grupo.label}
                </span>

                <span className="ml-auto text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {selectedCount} / {grupo.permissions.length}
                </span>
              </div>

              {/* Lista de permisos */}
              {isExpanded && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {grupo.permissions.map((permiso) => (
                    <label
                      key={permiso.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 pl-10 cursor-pointer',
                        'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSet.has(permiso.id)}
                        onChange={() => togglePermiso(permiso.id)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {permiso.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {permiso.code}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {saveMutation.isError && (
        <Alert variant="error" message="Error al guardar los permisos. Intenta de nuevo." />
      )}
      {saveMutation.isSuccess && (
        <Alert variant="success" message="Permisos guardados correctamente." />
      )}
    </div>
  );
};
