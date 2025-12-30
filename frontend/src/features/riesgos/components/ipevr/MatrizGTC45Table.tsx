/**
 * MatrizGTC45Table - Tabla interactiva de Matriz IPEVR
 */
import { useState } from 'react';
import { cn } from '@/utils/cn';
import { ChevronDown, ChevronUp, Filter, Eye } from 'lucide-react';
import { NivelRiesgoIndicator } from './NivelRiesgoIndicator';
import type { MatrizIPEVR, InterpretacionNR, Aceptabilidad } from '../../types';

interface MatrizGTC45TableProps {
  matrices: MatrizIPEVR[];
  onRowClick?: (matriz: MatrizIPEVR) => void;
  isLoading?: boolean;
  className?: string;
}

type SortField = 'area' | 'cargo' | 'nivel_riesgo' | 'fecha_valoracion';
type SortDirection = 'asc' | 'desc';

const INTERPRETACION_NR_COLORS: Record<InterpretacionNR, string> = {
  I: 'bg-red-100',
  II: 'bg-orange-100',
  III: 'bg-yellow-50',
  IV: 'bg-green-50',
};

export function MatrizGTC45Table({
  matrices,
  onRowClick,
  isLoading,
  className,
}: MatrizGTC45TableProps) {
  const [sortField, setSortField] = useState<SortField>('nivel_riesgo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterArea, setFilterArea] = useState<string>('');
  const [filterCargo, setFilterCargo] = useState<string>('');

  // Obtener areas y cargos unicos para filtros
  const areas = [...new Set(matrices.map((m) => m.area))].sort();
  const cargos = [...new Set(matrices.map((m) => m.cargo))].sort();

  // Filtrar y ordenar
  const filteredMatrices = matrices
    .filter((m) => {
      if (filterArea && m.area !== filterArea) return false;
      if (filterCargo && m.cargo !== filterCargo) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'area':
          comparison = a.area.localeCompare(b.area);
          break;
        case 'cargo':
          comparison = a.cargo.localeCompare(b.cargo);
          break;
        case 'nivel_riesgo':
          comparison = a.nivel_riesgo - b.nivel_riesgo;
          break;
        case 'fecha_valoracion':
          comparison = new Date(a.fecha_valoracion).getTime() - new Date(b.fecha_valoracion).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (isLoading) {
    return (
      <div className={cn('rounded-lg border', className)}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando matriz IPEVR...
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Filtros */}
      <div className="p-4 border-b flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="">Todas las areas</option>
          {areas.map((area) => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
        <select
          value={filterCargo}
          onChange={(e) => setFilterCargo(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="">Todos los cargos</option>
          {cargos.map((cargo) => (
            <option key={cargo} value={cargo}>{cargo}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredMatrices.length} de {matrices.length} registros
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th
                className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted"
                onClick={() => handleSort('area')}
              >
                <div className="flex items-center gap-1">
                  Area <SortIcon field="area" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted"
                onClick={() => handleSort('cargo')}
              >
                <div className="flex items-center gap-1">
                  Cargo <SortIcon field="cargo" />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium">Peligro</th>
              <th className="px-4 py-3 text-center font-medium">ND</th>
              <th className="px-4 py-3 text-center font-medium">NE</th>
              <th className="px-4 py-3 text-center font-medium">NP</th>
              <th className="px-4 py-3 text-center font-medium">NC</th>
              <th
                className="px-4 py-3 text-center font-medium cursor-pointer hover:bg-muted"
                onClick={() => handleSort('nivel_riesgo')}
              >
                <div className="flex items-center justify-center gap-1">
                  NR <SortIcon field="nivel_riesgo" />
                </div>
              </th>
              <th className="px-4 py-3 text-center font-medium">Nivel</th>
              <th className="px-4 py-3 text-center font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatrices.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              filteredMatrices.map((matriz) => (
                <tr
                  key={matriz.id}
                  className={cn(
                    'border-t hover:bg-muted/30 cursor-pointer transition-colors',
                    INTERPRETACION_NR_COLORS[matriz.interpretacion_nr as InterpretacionNR]
                  )}
                  onClick={() => onRowClick?.(matriz)}
                >
                  <td className="px-4 py-3">{matriz.area}</td>
                  <td className="px-4 py-3">{matriz.cargo}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate" title={matriz.peligro_nombre}>
                      {matriz.peligro_nombre}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {matriz.peligro_clasificacion}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono">{matriz.nivel_deficiencia}</td>
                  <td className="px-4 py-3 text-center font-mono">{matriz.nivel_exposicion}</td>
                  <td className="px-4 py-3 text-center font-mono font-medium">{matriz.nivel_probabilidad}</td>
                  <td className="px-4 py-3 text-center font-mono">{matriz.nivel_consecuencia}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold">{matriz.nivel_riesgo}</td>
                  <td className="px-4 py-3 text-center">
                    <NivelRiesgoIndicator
                      interpretacionNR={matriz.interpretacion_nr as InterpretacionNR}
                      nivelRiesgo={matriz.nivel_riesgo}
                      aceptabilidad={matriz.aceptabilidad as Aceptabilidad}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="p-1 rounded hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.(matriz);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MatrizGTC45Table;
