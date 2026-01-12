/**
 * Fila de módulo en el árbol de permisos
 */
import { ChevronRight, ChevronDown, AlertTriangle, Check, Shield } from 'lucide-react';
import { DynamicIcon } from '@/components/common';
import { cn } from '@/lib/utils';
import type { ModuleRowProps } from './types';

export const ModuleRow = ({
  module,
  isExpanded,
  selectionState,
  sectionsCount,
  onToggle,
  onToggleAll,
  children,
}: ModuleRowProps) => {
  const hasNoSections = sectionsCount === 0;
  const hasTabs = module.tabs.filter((t) => t.is_enabled).length > 0;

  return (
    <div className={cn(hasNoSections && 'opacity-60')}>
      {/* Fila del módulo */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 transition-colors',
          hasNoSections
            ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800/30'
            : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50',
          isExpanded && !hasNoSections && 'bg-gray-50 dark:bg-gray-800/50'
        )}
        onClick={() => !hasNoSections && onToggle()}
      >
        {/* Chevron */}
        <div className="w-5 h-5 flex items-center justify-center text-gray-400">
          {!hasNoSections && hasTabs ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : hasNoSections ? (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          ) : null}
        </div>

        {/* Icono del módulo */}
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            hasNoSections
              ? 'bg-gray-200 dark:bg-gray-700'
              : 'bg-purple-100 dark:bg-purple-900/30'
          )}
        >
          {module.icon ? (
            <DynamicIcon
              name={module.icon}
              className={cn(
                'h-4 w-4',
                hasNoSections
                  ? 'text-gray-400'
                  : 'text-purple-600 dark:text-purple-400'
              )}
              size={16}
            />
          ) : (
            <Shield
              className={cn(
                'h-4 w-4',
                hasNoSections
                  ? 'text-gray-400'
                  : 'text-purple-600 dark:text-purple-400'
              )}
            />
          )}
        </div>

        {/* Nombre del módulo */}
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">{module.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {hasNoSections ? (
              <span className="text-yellow-600 dark:text-yellow-400">
                Sin secciones configuradas
              </span>
            ) : (
              `${module.enabled_tabs_count} tabs, ${sectionsCount} secciones`
            )}
          </div>
        </div>

        {/* Indicador de selección */}
        {!hasNoSections && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleAll();
            }}
            className={cn(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
              selectionState === 'all'
                ? 'bg-purple-600 border-purple-600 text-white'
                : selectionState === 'partial'
                  ? 'bg-purple-200 border-purple-400 dark:bg-purple-800 dark:border-purple-600'
                  : 'border-gray-300 dark:border-gray-600'
            )}
          >
            {selectionState === 'all' && <Check className="h-3 w-3" />}
            {selectionState === 'partial' && (
              <div className="w-2 h-2 bg-purple-600 rounded-full" />
            )}
          </button>
        )}
      </div>

      {/* Tabs del módulo (expandido) */}
      {isExpanded && !hasNoSections && (
        <div className="bg-gray-50/50 dark:bg-gray-800/25">{children}</div>
      )}
    </div>
  );
};
