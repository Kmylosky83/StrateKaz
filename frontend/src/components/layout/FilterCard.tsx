import { useState, ReactNode } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { cn } from '@/utils/cn';

export interface FilterCardProps {
  /** Placeholder del buscador principal */
  searchPlaceholder?: string;
  /** Valor del buscador */
  searchValue?: string;
  /** Callback cuando cambia el buscador */
  onSearchChange?: (value: string) => void;
  /** Si los filtros avanzados son colapsables */
  collapsible?: boolean;
  /** Si los filtros están expandidos inicialmente (solo si collapsible=true) */
  defaultExpanded?: boolean;
  /** Contenido de los filtros avanzados */
  children?: ReactNode;
  /** Número de filtros activos (para mostrar badge) */
  activeFiltersCount?: number;
  /** Callback para limpiar filtros */
  onClearFilters?: () => void;
  /** Si hay filtros activos para mostrar el botón de limpiar */
  hasActiveFilters?: boolean;
  /** Título de la sección (solo para modo no colapsable) */
  title?: string;
  /** Clases adicionales */
  className?: string;
}

/**
 * FilterCard - Componente reutilizable para filtros de página
 *
 * Dos modos de operación:
 *
 * 1. Colapsable (collapsible=true):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [🔍 Buscar...                    ] [Filtros (3)] [X]       │
 * ├─────────────────────────────────────────────────────────────┤
 * │ [Filtro 1] [Filtro 2] [Filtro 3] [Filtro 4]                │
 * └─────────────────────────────────────────────────────────────┘
 *
 * 2. Siempre visible (collapsible=false):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Filtros                                    [Limpiar Filtros]│
 * ├─────────────────────────────────────────────────────────────┤
 * │ [Filtro 1] [Filtro 2] [Filtro 3] [Filtro 4]                │
 * └─────────────────────────────────────────────────────────────┘
 */
export function FilterCard({
  searchPlaceholder = 'Buscar...',
  searchValue = '',
  onSearchChange,
  collapsible = false,
  defaultExpanded = false,
  children,
  activeFiltersCount = 0,
  onClearFilters,
  hasActiveFilters = false,
  title = 'Filtros',
  className,
}: FilterCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Modo colapsable
  if (collapsible) {
    return (
      <Card className={className}>
        <div className="p-4 space-y-4">
          {/* Barra de búsqueda y botón de filtros */}
          <div className="flex items-center gap-3">
            {/* Buscador principal */}
            <div className="flex-1">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Botón de filtros */}
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                  {activeFiltersCount}
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {/* Botón limpiar */}
            {hasActiveFilters && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filtros expandibles */}
          {isExpanded && children && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {children}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Modo siempre visible
  return (
    <Card className={className}>
      <div className="p-4">
        {/* Header con título y botón limpiar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          {onClearFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Limpiar Filtros
            </Button>
          )}
        </div>

        {/* Contenido de filtros */}
        {children}
      </div>
    </Card>
  );
}

/**
 * FilterGrid - Grid responsivo para organizar filtros
 */
export interface FilterGridProps {
  children: ReactNode;
  /** Número de columnas en pantallas grandes */
  columns?: 3 | 4 | 5 | 6;
  className?: string;
}

export function FilterGrid({ children, columns = 4, className }: FilterGridProps) {
  const colsClass = {
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  };

  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 gap-4',
        colsClass[columns],
        className
      )}
    >
      {children}
    </div>
  );
}
