/**
 * Sección: Módulos del Sistema
 *
 * Muestra módulos con árbol expandible de tabs y secciones.
 * Consume GET /api/core/system-modules/tree/ para árbol completo.
 * Toggle: módulos, tabs y secciones con endpoints independientes.
 */
import { useState } from 'react';
import { ChevronDown, ChevronRight, Blocks, Layout, PanelTop } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Switch } from '@/components/forms/Switch';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useModuleTree,
  useToggleModule,
  useToggleTab,
  useToggleSection,
} from '../hooks/useConfigAdmin';
import type { SystemModuleTree, ModuleTab } from '../types/config-admin.types';

export const ModulosSection = () => {
  const { data: treeData, isLoading } = useModuleTree();
  const toggleModule = useToggleModule();
  const toggleTab = useToggleTab();
  const toggleSection = useToggleSection();
  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.MODULOS, 'edit');
  const { color: moduleColor } = useModuleColor('configuracion_plataforma');
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  const toggleExpand = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const modules = treeData?.modules ?? [];
  const isPending = toggleModule.isPending || toggleTab.isPending || toggleSection.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!modules.length) {
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Activa o desactiva módulos, pestañas y secciones. Los elementos core no pueden
          desactivarse.
        </p>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {treeData?.enabled_modules ?? 0} de {treeData?.total_modules ?? 0} activos
        </span>
      </div>

      <div className="space-y-3">
        {modules.map((mod) => (
          <ModuleCard
            key={mod.id}
            module={mod}
            isExpanded={expandedModules.has(mod.id)}
            onToggleExpand={() => toggleExpand(mod.id)}
            onToggleModule={() => toggleModule.mutate({ id: mod.id, is_enabled: !mod.is_enabled })}
            onToggleTab={(tabId: number, enabled: boolean) =>
              toggleTab.mutate({ id: tabId, is_enabled: enabled })
            }
            onToggleSection={(sectionId: number, enabled: boolean) =>
              toggleSection.mutate({ id: sectionId, is_enabled: enabled })
            }
            canEdit={canEdit}
            isPending={isPending}
            moduleColor={moduleColor}
          />
        ))}
      </div>
    </div>
  );
};

// ── Module Card ──

interface ModuleCardProps {
  module: SystemModuleTree;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleModule: () => void;
  onToggleTab: (tabId: number, enabled: boolean) => void;
  onToggleSection: (sectionId: number, enabled: boolean) => void;
  canEdit: boolean;
  isPending: boolean;
  moduleColor: string;
}

const ModuleCard = ({
  module: mod,
  isExpanded,
  onToggleExpand,
  onToggleModule,
  onToggleTab,
  onToggleSection,
  canEdit,
  isPending,
  moduleColor,
}: ModuleCardProps) => {
  const hasTabs = mod.tabs && mod.tabs.length > 0;

  return (
    <Card className="overflow-hidden">
      {/* Header del módulo */}
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Expand button */}
          {hasTabs ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-7" />
          )}

          {/* Icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${moduleColor}15` }}
          >
            <DynamicIcon name={mod.icon} size={20} style={{ color: moduleColor }} />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {mod.name}
              </h4>
              {mod.is_core && (
                <Badge variant="info" size="sm">
                  Core
                </Badge>
              )}
              {hasTabs && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {mod.enabled_tabs_count}/{mod.total_tabs_count} pestañas
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
              {mod.description}
            </p>
          </div>
        </div>

        <Switch
          checked={mod.is_enabled}
          onChange={onToggleModule}
          disabled={mod.is_core || !canEdit || isPending}
          size="sm"
        />
      </div>

      {/* Tabs expandidos */}
      {isExpanded && hasTabs && mod.is_enabled && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
          {mod.tabs.map((tab) => (
            <TabRow
              key={tab.id}
              tab={tab}
              onToggleTab={onToggleTab}
              onToggleSection={onToggleSection}
              canEdit={canEdit}
              isPending={isPending}
              moduleColor={moduleColor}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

// ── Tab Row ──

interface TabRowProps {
  tab: ModuleTab;
  onToggleTab: (tabId: number, enabled: boolean) => void;
  onToggleSection: (sectionId: number, enabled: boolean) => void;
  canEdit: boolean;
  isPending: boolean;
  moduleColor: string;
}

const TabRow = ({
  tab,
  onToggleTab,
  onToggleSection,
  canEdit,
  isPending,
  moduleColor,
}: TabRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasSections = tab.sections && tab.sections.length > 0;

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      {/* Tab header */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 pl-16">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {hasSections ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {expanded ? (
                <ChevronDown size={14} className="text-gray-400" />
              ) : (
                <ChevronRight size={14} className="text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <Layout size={14} style={{ color: moduleColor }} className="flex-shrink-0 opacity-60" />

          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{tab.name}</span>

          {tab.is_core && (
            <Badge variant="neutral" size="sm">
              Core
            </Badge>
          )}

          {hasSections && (
            <span className="text-xs text-gray-400">
              {tab.enabled_section_count}/{tab.section_count}
            </span>
          )}
        </div>

        <Switch
          checked={tab.is_enabled}
          onChange={() => onToggleTab(tab.id, !tab.is_enabled)}
          disabled={tab.is_core || !canEdit || isPending}
          size="sm"
        />
      </div>

      {/* Sections */}
      {expanded && hasSections && tab.is_enabled && (
        <div className="pb-1">
          {tab.sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between gap-3 px-4 py-1.5 pl-24"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <PanelTop size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {section.name}
                </span>
                {section.is_core && (
                  <Badge variant="neutral" size="sm">
                    Core
                  </Badge>
                )}
              </div>

              <Switch
                checked={section.is_enabled}
                onChange={() => onToggleSection(section.id, !section.is_enabled)}
                disabled={section.is_core || !canEdit || isPending}
                size="sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
