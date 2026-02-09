/**
 * SectionToolbar - Barra de herramientas para secciones de datos
 *
 * Reemplaza el patrón duplicado en 20+ secciones HSEQ/Cumplimiento/Riesgos:
 *   <div className="flex items-center justify-between">
 *     <h3>Título</h3>
 *     <div className="flex items-center gap-2">
 *       <Button variant="outline" leftIcon={<Filter />}>Filtros</Button>
 *       <Button variant="outline" leftIcon={<Download />}>Exportar</Button>
 *       <Button variant="primary" leftIcon={<Plus />}>Nuevo X</Button>
 *     </div>
 *   </div>
 *
 * Uso:
 * ```tsx
 * <SectionToolbar
 *   title="Accidentes de Trabajo Registrados"
 *   onFilter={() => setShowFilters(!showFilters)}
 *   onExport={() => handleExport()}
 *   primaryAction={{ label: 'Nuevo Accidente', onClick: () => openModal() }}
 * />
 * ```
 */
import React from 'react';
import { Filter, Download, Plus, Search } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

export interface SectionToolbarAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
}

export interface SectionToolbarProps {
  /** Título de la sección */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Cantidad de resultados (se muestra junto al título) */
  count?: number;
  /** Handler para botón de filtros (si no se pasa, no se muestra) */
  onFilter?: () => void;
  /** Handler para botón de exportar (si no se pasa, no se muestra) */
  onExport?: () => void;
  /** Acción principal (botón primario, ej: "Nuevo Accidente") */
  primaryAction?: SectionToolbarAction;
  /** Acciones adicionales */
  extraActions?: SectionToolbarAction[];
  /** Mostrar campo de búsqueda */
  searchable?: boolean;
  /** Valor del campo de búsqueda */
  searchValue?: string;
  /** Placeholder del campo de búsqueda */
  searchPlaceholder?: string;
  /** Handler para cambio en búsqueda */
  onSearchChange?: (value: string) => void;
  /** Clases adicionales */
  className?: string;
}

export function SectionToolbar({
  title,
  subtitle,
  count,
  onFilter,
  onExport,
  primaryAction,
  extraActions,
  searchable = false,
  searchValue = '',
  searchPlaceholder = 'Buscar...',
  onSearchChange,
  className,
}: SectionToolbarProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3', className)}>
      {/* Left: Title + subtitle + count */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          {count !== undefined && (
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        {searchable && onSearchChange && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-48"
            />
          </div>
        )}

        {/* Filter */}
        {onFilter && (
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />} onClick={onFilter}>
            Filtros
          </Button>
        )}

        {/* Export */}
        {onExport && (
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={onExport}>
            Exportar
          </Button>
        )}

        {/* Extra actions */}
        {extraActions?.map((action, idx) => (
          <Button
            key={idx}
            variant={action.variant || 'outline'}
            size="sm"
            leftIcon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}

        {/* Primary action */}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'primary'}
            size="sm"
            leftIcon={primaryAction.icon || <Plus className="w-4 h-4" />}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
