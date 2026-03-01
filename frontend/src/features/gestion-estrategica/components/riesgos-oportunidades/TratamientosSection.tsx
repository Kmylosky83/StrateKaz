/**
 * Sección Tratamientos - Planes de tratamiento y controles
 * Conectado a motor_riesgos API (ISO 31000)
 *
 * Estados backend: pendiente, en_curso, completado, cancelado
 * Campos backend: riesgo_codigo, riesgo_nombre, tipo, tipo_display, descripcion,
 *                 control_propuesto, responsable_nombre, fecha_implementacion,
 *                 estado, estado_display, efectividad
 */
import { useState } from 'react';
import { Filter, ExternalLink } from 'lucide-react';
import { Badge, Button } from '@/components/common';
import { Select } from '@/components/forms';
import { DataTableCard } from '@/components/layout/DataTableCard';
import { useTratamientosEstrategicos } from '../../hooks/useRiesgosOportunidades';

interface TratamientosSectionProps {
  triggerNewForm?: number;
}

const ESTADO_BADGE: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'gray'> = {
  pendiente: 'gray',
  en_curso: 'warning',
  completado: 'success',
  cancelado: 'danger',
};

const TIPO_LABELS: Record<string, string> = {
  evitar: 'Evitar',
  mitigar: 'Mitigar',
  transferir: 'Transferir',
  aceptar: 'Aceptar',
};

const EFECTIVIDAD_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
  alta: 'success',
  Alta: 'success',
  media: 'warning',
  Media: 'warning',
  baja: 'danger',
  Baja: 'danger',
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
              onClick={() => window.open('/riesgos/procesos', '_blank')}
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
              <Select
                label="Estado"
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
                <option value="en_curso">En Curso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </Select>
              <Select
                label="Estrategia"
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
              </Select>
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
                  Riesgo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Control Propuesto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estrategia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Responsable
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha Impl.
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Efectividad
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
                    <div>
                      <span className="text-xs font-mono text-gray-500">
                        {tratamiento.riesgo_codigo}
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tratamiento.riesgo_nombre || `Riesgo #${tratamiento.riesgo}`}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {tratamiento.control_propuesto || tratamiento.descripcion}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="primary" size="sm">
                      {tratamiento.tipo_display ||
                        TIPO_LABELS[tratamiento.tipo] ||
                        tratamiento.tipo}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {tratamiento.responsable_nombre || 'Sin asignar'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {tratamiento.fecha_implementacion
                        ? new Date(tratamiento.fecha_implementacion).toLocaleDateString('es-CO')
                        : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tratamiento.efectividad ? (
                      <Badge
                        variant={EFECTIVIDAD_BADGE[tratamiento.efectividad] || 'gray'}
                        size="sm"
                      >
                        {tratamiento.efectividad}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">Sin evaluar</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={ESTADO_BADGE[tratamiento.estado] || 'gray'}>
                      {tratamiento.estado_display}
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
