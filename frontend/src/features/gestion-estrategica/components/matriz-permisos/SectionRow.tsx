/**
 * Fila de sección en el árbol de permisos
 */
import { Check } from 'lucide-react';
import { DynamicIcon } from '@/components/common';
import { cn } from '@/lib/utils';
import type { SectionRowProps } from './types';

export const SectionRow = ({ section, isSelected, onToggle }: SectionRowProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 pl-20 cursor-pointer transition-colors',
        'hover:bg-gray-50 dark:hover:bg-gray-800/30',
        isSelected && 'bg-purple-50 dark:bg-purple-900/20'
      )}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
          isSelected
            ? 'bg-purple-600 border-purple-600 text-white'
            : 'border-gray-300 dark:border-gray-600'
        )}
      >
        {isSelected && <Check className="h-3 w-3" />}
      </div>

      {/* Icono de sección */}
      <DynamicIcon name={section.icon} className="h-4 w-4 text-gray-400" size={16} />

      {/* Nombre de la sección */}
      <span
        className={cn(
          'text-sm',
          isSelected
            ? 'text-purple-700 dark:text-purple-300 font-medium'
            : 'text-gray-600 dark:text-gray-400'
        )}
      >
        {section.name}
      </span>
    </div>
  );
};
