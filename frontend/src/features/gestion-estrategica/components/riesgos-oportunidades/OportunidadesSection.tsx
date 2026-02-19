/**
 * Sección Oportunidades - Listado estratégico de oportunidades organizacionales
 * Conectado a motor_riesgos API (ISO 9001:2015 Cláusula 6.1)
 */
import { useState } from 'react';
import { Filter, ExternalLink } from 'lucide-react';
import { Badge, Button } from '@/components/common';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { useOportunidadesEstrategicas } from '../../hooks/useRiesgosOportunidades';

interface OportunidadesSectionProps {
  triggerNewForm?: number;
}

const ESTADO_BADGE: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
  identificada: 'gray',
  en_evaluacion: 'warning',
  en_implementacion: 'primary',
  implementada: 'success',
  descartada: 'gray',
};

export function OportunidadesSection({ triggerNewForm }: OportunidadesSectionProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useOportunidadesEstrategicas(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  const oportunidades = data?.results || [];

  return (
    <div className="space-y-6">
      <DataTableCard
        title="Registro de Oportunidades de Mejora"
        headerActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/riesgos/riesgos-procesos', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Gestión Completa
            </Button>
          </div>
        }
        isEmpty={oportunidades.length === 0}
        isLoading={isLoading}
        emptyMessage="No hay oportunidades registradas. Acceda al módulo de Gestión de Riesgos para identificar oportunidades."
      >
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.estado || ''}
                  onChange={(e) =>
                    setFilters((prev) => {
                      const next = { ...prev };
                      if (e.target.value) next.estado = e.target.value;
                      else delete next.estado;
                      return next;
                    })
                  }
                >
                  <option value="">Todos</option>
                  <option value="identificada">Identificada</option>
                  <option value="en_evaluacion">En Evaluación</option>
                  <option value="en_implementacion">En Implementación</option>
                  <option value="implementada">Implementada</option>
                  <option value="descartada">Descartada</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={() => setFilters({})} className="w-full">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Oportunidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Beneficio Esperado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Responsable
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Prioridad
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((oportunidad) => (
                <tr
                  key={oportunidad.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-500">{oportunidad.codigo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{oportunidad.nombre}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{oportunidad.descripcion}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {oportunidad.beneficio_esperado || '-'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {oportunidad.responsable_detail
                        ? `${oportunidad.responsable_detail.first_name} ${oportunidad.responsable_detail.last_name}`
                        : 'Sin asignar'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={
                        oportunidad.prioridad === 'alta'
                          ? 'danger'
                          : oportunidad.prioridad === 'media'
                          ? 'warning'
                          : 'gray'
                      }
                      size="sm"
                    >
                      {oportunidad.prioridad || '-'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={ESTADO_BADGE[oportunidad.estado] || 'gray'}>
                      {oportunidad.estado.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableCard>
    </div>
  );
}

export default OportunidadesSection;
