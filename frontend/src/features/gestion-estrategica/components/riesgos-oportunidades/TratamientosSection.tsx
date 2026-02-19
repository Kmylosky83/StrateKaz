/**
 * Sección Tratamientos - Planes de tratamiento y controles
 * Conectado a motor_riesgos API
 */
import { useState } from 'react';
import { Filter, ExternalLink } from 'lucide-react';
import { Badge, Button } from '@/components/common';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { useTratamientosEstrategicos } from '../../hooks/useRiesgosOportunidades';

interface TratamientosSectionProps {
  triggerNewForm?: number;
}

const ESTADO_BADGE: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
  pendiente: 'gray',
  en_proceso: 'warning',
  completado: 'success',
  cancelado: 'danger',
};

const TIPO_LABELS: Record<string, string> = {
  evitar: 'Evitar',
  mitigar: 'Mitigar',
  transferir: 'Transferir',
  aceptar: 'Aceptar',
};

export function TratamientosSection({ triggerNewForm }: TratamientosSectionProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useTratamientosEstrategicos(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  const tratamientos = data?.results || [];

  return (
    <div className="space-y-6">
      <DataTableCard
        title="Planes de Tratamiento de Riesgos"
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
        isEmpty={tratamientos.length === 0}
        isLoading={isLoading}
        emptyMessage="No hay planes de tratamiento registrados. Cree tratamientos desde el módulo de Gestión de Riesgos."
      >
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estrategia
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filters.tipo || ''}
                  onChange={(e) =>
                    setFilters((prev) => {
                      const next = { ...prev };
                      if (e.target.value) next.tipo = e.target.value;
                      else delete next.tipo;
                      return next;
                    })
                  }
                >
                  <option value="">Todas</option>
                  <option value="evitar">Evitar</option>
                  <option value="mitigar">Mitigar</option>
                  <option value="transferir">Transferir</option>
                  <option value="aceptar">Aceptar</option>
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
                  Riesgo Asociado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Descripción
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estrategia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Responsable
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Avance
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {tratamientos.map((tratamiento) => (
                <tr
                  key={tratamiento.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {tratamiento.riesgo_nombre || `Riesgo #${tratamiento.riesgo}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {tratamiento.descripcion}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="primary" size="sm">
                      {TIPO_LABELS[tratamiento.tipo] || tratamiento.tipo}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {tratamiento.responsable_detail
                        ? `${tratamiento.responsable_detail.first_name} ${tratamiento.responsable_detail.last_name}`
                        : 'Sin asignar'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-20">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            tratamiento.porcentaje_avance >= 80
                              ? 'bg-green-500'
                              : tratamiento.porcentaje_avance >= 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${tratamiento.porcentaje_avance}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500 w-8">
                        {tratamiento.porcentaje_avance}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={ESTADO_BADGE[tratamiento.estado] || 'gray'}>
                      {tratamiento.estado.replace(/_/g, ' ')}
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

export default TratamientosSection;
