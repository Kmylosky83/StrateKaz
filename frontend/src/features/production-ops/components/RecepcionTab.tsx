/**
 * Tab de Recepción de Materia Prima - Production Ops
 *
 * Usa componentes del Design System (@/components/common)
 */
import React, { useState } from 'react';
import { Card, Badge, Button } from '@/components/common';
import { Plus, Search, Filter } from 'lucide-react';
import { useRecepciones } from '../hooks/useProductionOps';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const RecepcionTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data: recepcionesData, isLoading } = useRecepciones({
    page,
    page_size: 10,
    search: searchTerm,
  });

  const getEstadoBadgeVariant = (color?: string): 'success' | 'warning' | 'danger' | 'info' | 'gray' => {
    const colorMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
      '#28A745': 'success',
      '#FFC107': 'warning',
      '#DC3545': 'danger',
      '#17A2B8': 'info',
      '#6C757D': 'gray',
    };
    return colorMap[color || '#6C757D'] || 'gray';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recepciones de Materia Prima
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestión de recepción de huesos, sebo, grasa y subproductos cárnicos
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Recepción
          </Button>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, proveedor..."
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

      {/* Tabla de Recepciones */}
      <Card>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
        ) : !recepcionesData?.results?.length ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay recepciones registradas
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proveedor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Peso Neto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {recepcionesData.results.map((recepcion) => (
                    <tr key={recepcion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{recepcion.codigo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {format(new Date(recepcion.fecha), 'PPP', { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{recepcion.proveedor_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{recepcion.tipo_recepcion_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {recepcion.peso_neto ? `${recepcion.peso_neto} KG` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getEstadoBadgeVariant(recepcion.estado_color)} size="sm">
                          {recepcion.estado_nombre}
                        </Badge>
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
                Mostrando {recepcionesData.results.length} de {recepcionesData.count} recepciones
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!recepcionesData.previous}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!recepcionesData.next}
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

export default RecepcionTab;
