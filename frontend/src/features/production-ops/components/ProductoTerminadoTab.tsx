/**
 * Tab de Producto Terminado - Production Ops
 *
 * Usa componentes del Design System (@/components/common)
 */
import React, { useState } from 'react';
import { Card, Badge, Button, Tabs } from '@/components/common';
import { Plus, Search, Filter, CheckCircle, Package } from 'lucide-react';
import { useStocks, useLiberaciones } from '../hooks/useProductionOps';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProductoTerminadoTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [subTab, setSubTab] = useState('stock');

  const { data: stocksData, isLoading: loadingStocks } = useStocks({
    page,
    page_size: 10,
    search: searchTerm,
  });

  const { data: liberacionesData, isLoading: loadingLiberaciones } = useLiberaciones({
    page,
    page_size: 10,
    search: searchTerm,
  });

  const getResultadoVariant = (resultado: string): 'yellow' | 'green' | 'blue' | 'red' | 'gray' => {
    const resultadoMap: Record<string, 'yellow' | 'green' | 'blue' | 'red' | 'gray'> = {
      PENDIENTE: 'yellow',
      APROBADO: 'green',
      APROBADO_CON_OBSERVACIONES: 'blue',
      RECHAZADO: 'red',
    };
    return resultadoMap[resultado] || 'gray';
  };

  const tabs = [
    { id: 'stock', label: 'Stock de Producto', icon: <Package className="h-4 w-4" /> },
    { id: 'liberaciones', label: 'Liberaciones de Calidad', icon: <CheckCircle className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Producto Terminado
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestión de stock, liberaciones de calidad y certificados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              <CheckCircle className="h-4 w-4 mr-2" />
              Solicitar Liberación
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Stock
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

      {/* Tab: Stock */}
      {subTab === 'stock' && (
        <Card>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por lote, producto..."
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

          {loadingStocks ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
          ) : !stocksData?.results?.length ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay stock registrado
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lote PT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disponible</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Producción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vencimiento</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {stocksData.results.map((stock) => (
                      <tr key={stock.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{stock.codigo_lote_pt}</td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{stock.producto_nombre}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{stock.producto_codigo}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="gray" size="sm">
                            {stock.estado_lote_nombre}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                          {parseFloat(stock.cantidad_disponible).toFixed(2)} KG
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {format(new Date(stock.fecha_produccion), 'PPP', { locale: es })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {stock.fecha_vencimiento ? (
                            <span className={stock.esta_vencido ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                              {format(new Date(stock.fecha_vencimiento), 'PPP', { locale: es })}
                              {stock.esta_vencido && ' (Vencido)'}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
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
                  Mostrando {stocksData.results.length} de {stocksData.count} lotes
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!stocksData.previous}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!stocksData.next}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Liberaciones */}
      {subTab === 'liberaciones' && (
        <Card>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar liberaciones..."
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

          {loadingLiberaciones ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
          ) : !liberacionesData?.results?.length ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay liberaciones registradas
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lote</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Solicitud</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitado por</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resultado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aprobado por</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {liberacionesData.results.map((liberacion) => (
                      <tr key={liberacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                          {liberacion.stock_codigo_lote}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{liberacion.stock_producto_nombre}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {format(new Date(liberacion.fecha_solicitud), 'PPP', { locale: es })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{liberacion.solicitado_por_nombre}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getResultadoVariant(liberacion.resultado)} size="sm">
                            {liberacion.resultado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{liberacion.aprobado_por_nombre || '-'}</td>
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
                  Mostrando {liberacionesData.results.length} de {liberacionesData.count} liberaciones
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!liberacionesData.previous}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!liberacionesData.next}
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

export default ProductoTerminadoTab;
