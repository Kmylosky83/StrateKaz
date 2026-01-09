/**
 * OrganigramaToolbar - Barra de herramientas para el Organigrama
 *
 * Controles de zoom, vista, exportación, búsqueda y filtros
 */

import { useState } from 'react';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  ArrowDownUp,
  Download,
  Image,
  FileText,
  Expand,
  Minimize,
  Grid3X3,
  Network,
  LayoutList,
  Loader2,
} from 'lucide-react';
import { Button, Badge, Dropdown } from '@/components/common';
import type { DropdownItem } from '@/components/common/Dropdown';
import { Input } from '@/components/forms';
import type {
  ViewMode,
  ExportFormat,
  NivelJerarquico,
  OrganigramaFilters,
  OrganigramaStats,
} from '../../types/organigrama.types';
import { NIVEL_LABELS } from '../../types/organigrama.types';

interface OrganigramaToolbarProps {
  /** Modo de vista actual */
  viewMode: ViewMode;
  /** Cambiar modo de vista */
  onViewModeChange: (mode: ViewMode) => void;
  /** Dirección del layout */
  direction: 'TB' | 'LR';
  /** Cambiar dirección */
  onDirectionChange: () => void;
  /** Filtros actuales */
  filters: OrganigramaFilters;
  /** Actualizar filtros */
  onFiltersChange: (filters: Partial<OrganigramaFilters>) => void;
  /** Zoom in */
  onZoomIn: () => void;
  /** Zoom out */
  onZoomOut: () => void;
  /** Fit view */
  onFitView: () => void;
  /** Reset layout */
  onResetLayout: () => void;
  /** Exportar */
  onExport: (format: ExportFormat) => void;
  /** Expandir todos */
  onExpandAll: () => void;
  /** Colapsar todos */
  onCollapseAll: () => void;
  /** Estadísticas del organigrama */
  stats?: OrganigramaStats;
  /** Cargando datos */
  isLoading?: boolean;
  /** Exportando */
  isExporting?: boolean;
}

export const OrganigramaToolbar = ({
  viewMode,
  onViewModeChange,
  direction,
  onDirectionChange,
  filters,
  onFiltersChange,
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetLayout,
  onExport,
  onExpandAll,
  onCollapseAll,
  stats,
  isLoading,
  isExporting = false,
}: OrganigramaToolbarProps) => {
  const [searchValue, setSearchValue] = useState(filters.search);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Debounce search
    const timeout = setTimeout(() => {
      onFiltersChange({ search: value });
    }, 300);
    return () => clearTimeout(timeout);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ search: searchValue });
  };

  // Opciones de modo de vista
  const viewModeOptions = [
    { value: 'areas' as ViewMode, label: 'Por Áreas', icon: <Grid3X3 className="h-4 w-4" /> },
    { value: 'cargos' as ViewMode, label: 'Por Cargos', icon: <Network className="h-4 w-4" /> },
    { value: 'compact' as ViewMode, label: 'Compacto', icon: <LayoutList className="h-4 w-4" /> },
  ];

  // Opciones de filtro por nivel
  const nivelOptions = [
    { value: 'all', label: 'Todos los niveles' },
    { value: 'ESTRATEGICO', label: 'Estratégico' },
    { value: 'TACTICO', label: 'Táctico' },
    { value: 'OPERATIVO', label: 'Operativo' },
    { value: 'APOYO', label: 'Apoyo' },
    { value: 'EXTERNO', label: 'Externo' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar área o cargo..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </form>

        {/* Separador */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

        {/* Modo de vista */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {viewModeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onViewModeChange(option.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${viewMode === option.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }
              `}
              title={option.label}
            >
              {option.icon}
              <span className="hidden md:inline">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Filtro por nivel (solo en modo cargos) */}
        {viewMode === 'cargos' && (
          <Dropdown
            trigger={
              <span className="flex items-center gap-1 text-sm">
                {filters.nivelJerarquico === 'all'
                  ? 'Todos los niveles'
                  : NIVEL_LABELS[filters.nivelJerarquico as NivelJerarquico]}
              </span>
            }
            items={nivelOptions.map((option) => ({
              label: option.label,
              onClick: () => onFiltersChange({
                nivelJerarquico: option.value as NivelJerarquico | 'all',
              }),
            }))}
          />
        )}

        {/* Separador */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

        {/* Controles de zoom */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            title="Acercar"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            title="Alejar"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFitView}
            title="Ajustar vista"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDirectionChange}
            title={direction === 'TB' ? 'Cambiar a horizontal' : 'Cambiar a vertical'}
          >
            <ArrowDownUp className={`h-4 w-4 ${direction === 'LR' ? 'rotate-90' : ''}`} />
          </Button>
        </div>

        {/* Separador */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

        {/* Expandir/Colapsar */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpandAll}
            title="Expandir todo"
          >
            <Expand className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCollapseAll}
            title="Colapsar todo"
          >
            <Minimize className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetLayout}
            title="Restablecer layout"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Separador */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

        {/* Exportar */}
        <Dropdown
          trigger={
            <span className="flex items-center gap-2">
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
            </span>
          }
          items={[
            {
              label: 'Exportar como PNG',
              icon: <Image className="h-4 w-4" />,
              onClick: () => onExport('png'),
              disabled: isExporting,
            },
            {
              label: 'Exportar como PDF',
              icon: <FileText className="h-4 w-4" />,
              onClick: () => onExport('pdf'),
              disabled: isExporting,
            },
          ]}
          disabled={isExporting}
        />

        {/* Estadísticas */}
        {stats && !isLoading && (
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <Badge variant="gray" size="sm">
              {stats.areas_activas} áreas
            </Badge>
            <Badge variant="gray" size="sm">
              {stats.cargos_activos} cargos
            </Badge>
            <Badge variant="gray" size="sm">
              {stats.total_usuarios} usuarios
            </Badge>
          </div>
        )}
      </div>

      {/* Leyenda de colores (en modo cargos) */}
      {viewMode === 'cargos' && (
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">Niveles:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Estratégico</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Táctico</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Operativo</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Apoyo</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Externo</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganigramaToolbar;
