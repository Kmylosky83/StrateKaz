/**
 * Sección Riesgos - Listado estratégico de riesgos organizacionales
 * Conectado a motor_riesgos API (ISO 31000 / ISO 9001:2015 Cláusula 6.1)
 *
 * Estados backend: identificado, en_analisis, en_tratamiento, monitoreado, cerrado
 * Tipos backend: estrategico, operativo, financiero, cumplimiento, tecnologico, reputacional, sst, ambiental
 */
import { useState } from 'react';
import { Filter, ExternalLink } from 'lucide-react';
import { Badge, Button } from '@/components/common';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { useRiesgosEstrategicos } from '../../hooks/useRiesgosOportunidades';

interface RiesgosSectionProps {
  triggerNewForm?: number;
}

const ESTADO_BADGE: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
  identificado: 'gray',
  en_analisis: 'primary',
  en_tratamiento: 'warning',
  monitoreado: 'success',
  cerrado: 'gray',
};

const NIVEL_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
  bajo: 'success',
  moderado: 'warning',
  alto: 'danger',
  critico: 'danger',
};

function getNivelLabel(nivel: number): string {
  if (nivel <= 4) return 'Bajo';
  if (nivel <= 9) return 'Moderado';
  if (nivel <= 14) return 'Alto';
  return 'Crítico';
}

function getNivelKey(nivel: number): string {
  if (nivel <= 4) return 'bajo';
  if (nivel <= 9) return 'moderado';
  if (nivel <= 14) return 'alto';
  return 'critico';
}

export function RiesgosSection({ triggerNewForm }: RiesgosSectionProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useRiesgosEstrategicos(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  const riesgos = data?.results || [];

  return (
    <div className="space-y-6">
      <DataTableCard
        title="Registro de Riesgos Organizacionales"
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
              onClick={() => window.open('/riesgos/procesos', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Gestión Completa
            </Button>
          </div>
        }
        isEmpty={riesgos.length === 0}
        isLoading={isLoading}
        emptyMessage="No hay riesgos registrados. Acceda al módulo de Gestión de Riesgos para crear nuevos registros."
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
                  <option value="identificado">Identificado</option>
                  <option value="en_analisis">En Análisis</option>
                  <option value="en_tratamiento">En Tratamiento</option>
                  <option value="monitoreado">Monitoreado</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
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
                  <option value="">Todos</option>
                  <option value="estrategico">Estratégico</option>
                  <option value="operativo">Operativo</option>
                  <option value="financiero">Financiero</option>
                  <option value="cumplimiento">Cumplimiento</option>
                  <option value="tecnologico">Tecnológico</option>
                  <option value="reputacional">Reputacional</option>
                  <option value="sst">SST</option>
                  <option value="ambiental">Ambiental</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({})}
                  className="w-full"
                >
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
                  Riesgo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Responsable
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nivel Inherente
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nivel Residual
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Reducción
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {riesgos.map((riesgo) => (
                <tr
                  key={riesgo.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-500">{riesgo.codigo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {riesgo.nombre}
                      </p>
                      {riesgo.categoria_nombre && (
                        <p className="text-xs text-gray-500">{riesgo.categoria_nombre}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {riesgo.tipo_display}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {riesgo.responsable_nombre || 'Sin asignar'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={NIVEL_BADGE[getNivelKey(riesgo.nivel_inherente)] || 'gray'}
                      size="sm"
                    >
                      {getNivelLabel(riesgo.nivel_inherente)} ({riesgo.nivel_inherente})
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={NIVEL_BADGE[getNivelKey(riesgo.nivel_residual)] || 'gray'}
                      size="sm"
                    >
                      {getNivelLabel(riesgo.nivel_residual)} ({riesgo.nivel_residual})
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-sm font-semibold ${
                        riesgo.reduccion_riesgo_porcentaje >= 50
                          ? 'text-green-600 dark:text-green-400'
                          : riesgo.reduccion_riesgo_porcentaje >= 25
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {riesgo.reduccion_riesgo_porcentaje}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={ESTADO_BADGE[riesgo.estado] || 'gray'}>
                      {riesgo.estado_display}
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

export default RiesgosSection;
