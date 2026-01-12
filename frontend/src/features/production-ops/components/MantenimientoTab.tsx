/**
 * Tab de Mantenimiento - Production Ops
 *
 * Usa componentes del Design System (@/components/common)
 */
import React, { useState } from 'react';
import { Card, Badge, Button, Tabs } from '@/components/common';
import { Plus, Search, Filter, AlertTriangle } from 'lucide-react';
import { useActivosProduccion, useOrdenesTrabajo } from '../hooks/useProductionOps';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MantenimientoTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [subTab, setSubTab] = useState('activos');

  const { data: activosData, isLoading: loadingActivos } = useActivosProduccion({
    page,
    page_size: 10,
    search: searchTerm,
  });

  const { data: ordenesData, isLoading: loadingOrdenes } = useOrdenesTrabajo({
    page,
    page_size: 10,
    search: searchTerm,
  });

  const getEstadoActivoVariant = (estado: string): 'green' | 'yellow' | 'red' | 'gray' => {
    const estadoMap: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
      OPERATIVO: 'green',
      EN_MANTENIMIENTO: 'yellow',
      FUERA_SERVICIO: 'red',
      DADO_DE_BAJA: 'gray',
    };
    return estadoMap[estado] || 'gray';
  };

  const getEstadoOrdenVariant = (estado: string): 'blue' | 'yellow' | 'green' | 'gray' => {
    const estadoMap: Record<string, 'blue' | 'yellow' | 'green' | 'gray'> = {
      ABIERTA: 'blue',
      EN_PROCESO: 'yellow',
      COMPLETADA: 'green',
      CANCELADA: 'gray',
    };
    return estadoMap[estado] || 'gray';
  };

  const tabs = [
    { id: 'activos', label: 'Activos de Producción' },
    { id: 'ordenes', label: 'Órdenes de Trabajo' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Mantenimiento de Equipos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestión de activos, órdenes de trabajo, calibraciones y paradas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Registrar Parada
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva OT
            </Button>
          </div>
        </div>
      </Card>

      <Tabs
        tabs={tabs}
        activeTab={subTab}
        onChange={setSubTab}
        variant="pills"
      />

      {/* Tab: Activos */}
      {subTab === 'activos' && (
        <Card>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar activos..."
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

          {loadingActivos ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
          ) : !activosData?.results?.length ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay activos registrados
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Próximo Mantenimiento</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {activosData.results.map((activo) => (
                      <tr key={activo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{activo.codigo}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{activo.nombre}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{activo.tipo_activo_nombre}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getEstadoActivoVariant(activo.estado)} size="sm">
                            {activo.estado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {activo.fecha_proximo_mantenimiento
                            ? format(new Date(activo.fecha_proximo_mantenimiento), 'PPP', { locale: es })
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

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {activosData.results.length} de {activosData.count} activos
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!activosData.previous}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!activosData.next}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Órdenes de Trabajo */}
      {subTab === 'ordenes' && (
        <Card>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar órdenes de trabajo..."
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

          {loadingOrdenes ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
          ) : !ordenesData?.results?.length ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay órdenes de trabajo registradas
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código OT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prioridad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asignado a</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {ordenesData.results.map((orden) => (
                      <tr key={orden.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{orden.codigo}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{orden.activo_codigo}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{orden.tipo_mantenimiento_nombre}</td>
                        <td className="px-4 py-3">
                          <Badge variant="gray" size="sm">Prioridad {orden.prioridad}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getEstadoOrdenVariant(orden.estado)} size="sm">
                            {orden.estado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{orden.asignado_a_nombre || '-'}</td>
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
      )}
    </div>
  );
};

export default MantenimientoTab;
