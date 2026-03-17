/**
 * Sección: Módulos del Sistema
 *
 * Grid de cards con Switch toggle para activar/desactivar módulos.
 * Consume GET /api/core/system-modules/ y PATCH /{id}/toggle/.
 */
import { useMemo } from 'react';
import { Settings, Blocks } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Switch } from '@/components/forms/Switch';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { useSystemModules, useToggleModule } from '../hooks/useConfigAdmin';

export const ModulosSection = () => {
  const { data: modules, isLoading } = useSystemModules();
  const toggleMutation = useToggleModule();
  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.MODULOS, 'edit');
  const { color: moduleColor } = useModuleColor('configuracion_plataforma');

  const sortedModules = useMemo(() => {
    if (!modules) return [];
    return [...modules].sort((a, b) => a.orden - b.orden);
  }, [modules]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!sortedModules.length) {
    return (
      <EmptyState
        icon={<Blocks size={40} />}
        title="Sin módulos configurados"
        description="No se encontraron módulos del sistema."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Activa o desactiva los módulos disponibles en el sistema. Los módulos core no pueden
        desactivarse.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedModules.map((mod) => (
          <Card key={mod.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${moduleColor}15` }}
                >
                  <DynamicIcon name={mod.icon} size={20} style={{ color: moduleColor }} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {mod.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                    {mod.description}
                  </p>
                  {mod.is_core && (
                    <Badge variant="info" size="sm" className="mt-1">
                      Core
                    </Badge>
                  )}
                </div>
              </div>

              <Switch
                checked={mod.is_enabled}
                onChange={() => toggleMutation.mutate({ id: mod.id, is_enabled: !mod.is_enabled })}
                disabled={mod.is_core || !canEdit || toggleMutation.isPending}
                size="sm"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
