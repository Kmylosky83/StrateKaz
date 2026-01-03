/**
 * DataField - Campo individual de datos
 * Sistema de Gestión StrateKaz
 *
 * Muestra un par label/valor con estados vacíos y variantes de estilo.
 *
 * @example
 * ```tsx
 * // Básico
 * <DataField label="NIT" value="900123456-7" />
 *
 * // Con estilo bold
 * <DataField label="Razón Social" value="Mi Empresa" valueVariant="bold" />
 *
 * // Inline con icono
 * <DataField label="Teléfono" value="300 123 4567" icon={Phone} inline />
 *
 * // Campo vacío
 * <DataField label="Sitio Web" value={null} emptyText="No registrado" />
 * ```
 */
import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { LucideIcon, Minus } from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export type DataFieldValueVariant = 'default' | 'bold' | 'highlight' | 'muted';

export interface DataFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Etiqueta del campo */
  label: string;
  /** Valor a mostrar */
  value?: string | number | null | ReactNode;
  /** Texto cuando está vacío */
  emptyText?: string;
  /** Icono inline opcional */
  icon?: LucideIcon;
  /** Estilo del valor */
  valueVariant?: DataFieldValueVariant;
  /** Mostrar como una sola línea inline */
  inline?: boolean;
  /** Truncar valor largo */
  truncate?: boolean;
  /** Copiar al portapapeles al hacer clic */
  copyable?: boolean;
}

// ============================================================================
// ESTILOS
// ============================================================================

const valueVariants: Record<DataFieldValueVariant, string> = {
  default: 'text-gray-900 dark:text-gray-100',
  bold: 'font-semibold text-gray-900 dark:text-gray-100',
  highlight: 'font-medium text-purple-700 dark:text-purple-300',
  muted: 'text-gray-700 dark:text-gray-300',
};

// ============================================================================
// COMPONENTE
// ============================================================================

export const DataField = ({
  label,
  value,
  emptyText = 'No configurado',
  icon: Icon,
  valueVariant = 'default',
  inline = false,
  truncate = false,
  copyable = false,
  className,
  ...props
}: DataFieldProps) => {
  const isEmpty = value === null || value === undefined || value === '';

  // Handler para copiar
  const handleCopy = () => {
    if (copyable && !isEmpty && typeof value === 'string') {
      navigator.clipboard.writeText(value);
    }
  };

  // Variante inline (label y valor en la misma línea)
  if (inline) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3',
          copyable && !isEmpty && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-1 rounded transition-colors',
          className
        )}
        onClick={handleCopy}
        title={copyable && !isEmpty ? 'Clic para copiar' : undefined}
        {...props}
      >
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
          <span
            className={cn(
              'text-sm',
              isEmpty ? 'text-gray-400 dark:text-gray-500 italic' : valueVariants[valueVariant],
              truncate && 'truncate max-w-[200px]'
            )}
          >
            {isEmpty ? emptyText : value}
          </span>
        </div>
      </div>
    );
  }

  // Variante por defecto (label arriba, valor abajo)
  return (
    <div
      className={cn(
        'space-y-1',
        copyable && !isEmpty && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-1 rounded transition-colors',
        className
      )}
      onClick={handleCopy}
      title={copyable && !isEmpty ? 'Clic para copiar' : undefined}
      {...props}
    >
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
        {isEmpty ? (
          <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
            <Minus className="h-3.5 w-3.5" />
            <span className="text-sm italic">{emptyText}</span>
          </div>
        ) : (
          <p
            className={cn(
              'text-sm leading-relaxed',
              valueVariants[valueVariant],
              truncate && 'truncate'
            )}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
};

export default DataField;
