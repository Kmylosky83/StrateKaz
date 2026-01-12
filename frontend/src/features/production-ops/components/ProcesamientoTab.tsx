/**
 * Tab de Procesamiento - Production Ops
 *
 * Usa componentes del Design System (@/components/common)
 */
import React, { useState } from 'react';
import { Card, Badge, Button } from '@/components/common';
import { Plus, Search, Filter } from 'lucide-react';
import { useOrdenesProduccion } from '../hooks/useProductionOps';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProcesamientoTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data: ordenesData, isLoading } = useOrdenesProduccion({
    page,
    page_size: 10,
    search: searchTerm,
  });

  const getPrioridadBadgeVariant = (prioridad: number): 'red' | 'orange' | 'yellow' | 'blue' | 'gray' => {
    const prioridadMap: Record<number, 'red' | 'orange' | 'yellow' | 'blue' | 'gray'> = {
      1: 'red',
      2: 'orange',
      3: 'yellow',
      4: 'blue',
      5: 'gray',
    };
    return prioridadMap[prioridad] || 'gray';
  };

  const getPrioridadLabel = (prioridad: number): string => {
    const labelMap: Record<number, string> = {
      1: 'Crítica',
      2: 'Alta',
      3: 'Media',
      4: 'Baja',
      5: 'Muy Baja',
    };
    return labelMap[prioridad] || 'Media';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Órdenes de Producción
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestión de lotes de procesamiento y control de calidad en proceso
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden
          </Button>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, tipo de proceso..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full pl-9 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button variant="secondary">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Tabla de Órdenes */}
      <Card>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
        ) : !ordenesData?.results?.length ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay órdenes de producción registradas
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Programada</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo Proceso</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Línea</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prioridad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progreso</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {ordenesData.results.map((orden) => (
                    <tr key={orden.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{orden.codigo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {format(new Date(orden.fecha_programada), 'PPP', { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{orden.tipo_proceso_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{orden.linea_produccion_nombre}</td>
                      <td className="px-4 py-3">
                        <Badge variant={getPrioridadBadgeVariant(orden.prioridad)} size="sm">
                          {getPrioridadLabel(orden.prioridad)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="gray" size="sm">{orden.estado_nombre}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {orden.porcentaje_completado
                          ? `${parseFloat(orden.porcentaje_completado).toFixed(0)}%`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {ordenesData.results.length} de {ordenesData.count} órdenes
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!ordenesData.previous}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!ordenesData.next}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProcesamientoTab;
