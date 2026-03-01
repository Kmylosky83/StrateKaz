/**
 * Componente de Filtros para Normas Legales
 *
 * Filtros disponibles:
 * - Búsqueda por texto (número, título)
 * - Tipo de norma (Decreto, Ley, Resolución, etc.)
 * - Sistema de gestión (SST, Ambiental, Calidad, PESV)
 * - Vigencia (vigente/derogada)
 * - Año
 */
import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import type { NormasListParams } from '../../api/normasApi';
import type { SistemaGestion } from '../../types/matrizLegal';
import { useTiposNorma } from '../../hooks/useNormasLegales';

interface NormaFiltersProps {
  filters: NormasListParams;
  onFiltersChange: (filters: NormasListParams) => void;
  showAdvancedFilters?: boolean;
}

const SISTEMAS: Array<{ value: SistemaGestion; label: string; color: string }> = [
  { value: 'SST', label: 'SST', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'Ambiental', label: 'Ambiental', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'Calidad', label: 'Calidad', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'PESV', label: 'PESV', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
];

export const NormaFilters = ({
  filters,
  onFiltersChange,
  showAdvancedFilters = true,
}: NormaFiltersProps) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const { data: tiposNorma } = useTiposNorma();

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: localSearch });
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleSistemaToggle = (sistema: SistemaGestion) => {
    const key = `aplica_${sistema.toLowerCase()}` as keyof NormasListParams;
    const newValue = !filters[key];

    onFiltersChange({
      ...filters,
      [key]: newValue || undefined,
    });
  };

  const handleTipoNormaChange = (tipoId: string) => {
    onFiltersChange({
      ...filters,
      tipo_norma: tipoId ? parseInt(tipoId) : undefined,
    });
  };

  const handleVigenciaChange = (vigente: boolean | undefined) => {
    onFiltersChange({
      ...filters,
      vigente,
    });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onFiltersChange({});
  };

  const activeFiltersCount = [
    filters.tipo_norma,
    filters.vigente,
    filters.aplica_sst,
    filters.aplica_ambiental,
    filters.aplica_calidad,
    filters.aplica_pesv,
    filters.anio,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0 || (filters.search && filters.search.length > 0);

  return (
    <div className="space-y-4">
      {/* Barra principal de búsqueda */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Buscar por número, título, entidad emisora..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        {showAdvancedFilters && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="primary" size="sm" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            leftIcon={<X className="h-4 w-4" />}
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Filtros rápidos por sistema (siempre visibles) */}
      <div className="flex flex-wrap gap-2">
        {SISTEMAS.map((sistema) => {
          const key = `aplica_${sistema.value.toLowerCase()}` as keyof NormasListParams;
          const isActive = filters[key];

          return (
            <Button
              key={sistema.value}
              variant="outline"
              size="sm"
              onClick={() => handleSistemaToggle(sistema.value)}
              className={isActive ? `${sistema.color} border-current shadow-sm` : ''}
            >
              {sistema.label}
            </Button>
          );
        })}
      </div>

      {/* Filtros avanzados (colapsables) */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de Norma */}
            <Select
              label="Tipo de Norma"
              value={filters.tipo_norma || ''}
              onChange={(e) => handleTipoNormaChange(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {tiposNorma?.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre} ({tipo.codigo})
                </option>
              ))}
            </Select>

            {/* Vigencia */}
            <Select
              label="Vigencia"
              value={filters.vigente === undefined ? '' : filters.vigente ? 'true' : 'false'}
              onChange={(e) =>
                handleVigenciaChange(
                  e.target.value === '' ? undefined : e.target.value === 'true'
                )
              }
            >
              <option value="">Todas</option>
              <option value="true">Vigentes</option>
              <option value="false">Derogadas</option>
            </Select>

            {/* Año */}
            <Input
              label="Año"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              placeholder="Ej: 2024"
              value={filters.anio || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  anio: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>

          {/* Resumen de filtros activos */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Filtros activos ({activeFiltersCount + (filters.search ? 1 : 0)})
                </span>
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Limpiar todos
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
