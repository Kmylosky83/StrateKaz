/**
 * Fila de tab en el árbol de permisos
 */
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import { DynamicIcon } from '@/components/common';
import { cn } from '@/lib/utils';
import type { TabRowProps } from './types';

export const TabRow = ({
  tab,
  isExpanded,
  selectionState,
  onToggle,
  onToggleAll,
  children,
}: TabRowProps) => {
  const hasNoSections = tab.sections.filter((s) => s.is_enabled).length === 0;

  return (
    <div>
      {/* Fila del tab */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2 pl-12 transition-colors',
          hasNoSections
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50',
          isExpanded && !hasNoSections && 'bg-gray-100 dark:bg-gray-700/50'
        )}
        onClick={() => !hasNoSections && onToggle()}
      >
        {/* Chevron */}
        <div className="w-5 h-5 flex items-center justify-center text-gray-400">
          {!hasNoSections ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : null}
        </div>

        {/* Icono del tab */}
        <DynamicIcon name={tab.icon} className="h-4 w-4 text-gray-500" size={16} />

        {/* Nombre del tab */}
        <div className="flex-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">{tab.name}</span>
          <span className="text-xs text-gray-400 ml-2">
            ({tab.enabled_sections_count} secciones)
          </span>
        </div>

        {/* Indicador de selección */}
        {!hasNoSections && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleAll();
            }}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
              selectionState === 'all'
                ? 'bg-purple-600 border-purple-600 text-white'
                : selectionState === 'partial'
                  ? 'bg-purple-200 border-purple-400 dark:bg-purple-800 dark:border-purple-600'
                  : 'border-gray-300 dark:border-gray-600'
            )}
          >
            {selectionState === 'all' && <Check className="h-3 w-3" />}
            {selectionState === 'partial' && (
              <div className="w-1.5 h-1.5 bg-purple-600 rounded-sm" />
            )}
          </button>
        )}
      </div>

      {/* Secciones del tab (expandido) */}
      {isExpanded && !hasNoSections && (
        <div className="bg-white dark:bg-gray-900/50">{children}</div>
      )}
    </div>
  );
};
