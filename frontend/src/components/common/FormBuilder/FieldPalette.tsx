/**
 * FieldPalette - Paleta de 16 tipos de campo agrupados por categoria
 */
import { cn } from '@/utils/cn';
import { Plus } from 'lucide-react';
import {
  FIELD_TYPE_METADATA,
  FIELD_GROUPS,
  type TipoCampoFormulario,
  type FieldGroup,
} from './types';

interface FieldPaletteProps {
  onAddField: (tipo: TipoCampoFormulario) => void;
  disabled?: boolean;
}

const GROUP_COLORS: Record<FieldGroup, string> = {
  Texto: 'text-blue-600 dark:text-blue-400',
  Datos: 'text-emerald-600 dark:text-emerald-400',
  Seleccion: 'text-purple-600 dark:text-purple-400',
  Especial: 'text-orange-600 dark:text-orange-400',
};

export function FieldPalette({ onAddField, disabled }: FieldPaletteProps) {
  const fieldsByGroup = FIELD_GROUPS.map((group) => ({
    group,
    fields: (
      Object.entries(FIELD_TYPE_METADATA) as [
        TipoCampoFormulario,
        (typeof FIELD_TYPE_METADATA)[TipoCampoFormulario],
      ][]
    ).filter(([, meta]) => meta.group === group),
  }));

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1">
        Campos
      </p>
      {fieldsByGroup.map(({ group, fields }) => (
        <div key={group}>
          <p className={cn('text-xs font-medium mb-1.5 px-1', GROUP_COLORS[group])}>{group}</p>
          <div className="space-y-0.5">
            {fields.map(([tipo, meta]) => {
              const Icon = meta.icon;
              return (
                <button
                  key={tipo}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAddField(tipo)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm',
                    'hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors',
                    'group',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                  <span className="truncate text-gray-700 dark:text-gray-300 flex-1">
                    {meta.label}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
