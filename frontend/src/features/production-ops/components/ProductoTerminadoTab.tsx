/**
 * Tab de Producto Terminado - Production Ops
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, CheckCircle, Package } from 'lucide-react';
import { useStocks, useLiberaciones } from '../hooks/useProductionOps';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const getResultadoColor = (resultado: string) => {
    const resultadoMap: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      APROBADO: 'bg-green-100 text-green-800',
      APROBADO_CON_OBSERVACIONES: 'bg-blue-100 text-blue-800',
      RECHAZADO: 'bg-red-100 text-red-800',
    };
    return resultadoMap[resultado] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Producto Terminado</CardTitle>
              <CardDescription>
                Gestión de stock, liberaciones de calidad y certificados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Solicitar Liberación
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Stock
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stock">
            <Package className="h-4 w-4 mr-2" />
            Stock de Producto
          </TabsTrigger>
          <TabsTrigger value="liberaciones">
            <CheckCircle className="h-4 w-4 mr-2" />
            Liberaciones de Calidad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por lote, producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {loadingStocks ? (
                <div className="text-center py-8">Cargando...</div>
              ) : !stocksData?.results?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay stock registrado
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Lote PT</th>
                          <th className="text-left p-4 font-medium">Producto</th>
                          <th className="text-left p-4 font-medium">Estado</th>
                          <th className="text-right p-4 font-medium">Disponible</th>
                          <th className="text-left p-4 font-medium">Fecha Producción</th>
                          <th className="text-left p-4 font-medium">Vencimiento</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {stocksData.results.map((stock) => (
                          <tr key={stock.id} className="hover:bg-muted/50 transition-colors">
                            <td className="p-4 font-mono text-sm">{stock.codigo_lote_pt}</td>
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{stock.producto_nombre}</div>
                                <div className="text-sm text-muted-foreground">
                                  {stock.producto_codigo}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={stock.estado_lote_color || ''}>
                                {stock.estado_lote_nombre}
                              </Badge>
                            </td>
                            <td className="p-4 text-right font-medium">
                              {parseFloat(stock.cantidad_disponible).toFixed(2)} KG
                            </td>
                            <td className="p-4">
                              {format(new Date(stock.fecha_produccion), 'PPP', { locale: es })}
                            </td>
                            <td className="p-4">
                              {stock.fecha_vencimiento ? (
                                <div
                                  className={
                                    stock.esta_vencido
                                      ? 'text-red-600 font-medium'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  {format(new Date(stock.fecha_vencimiento), 'PPP', {
                                    locale: es,
                                  })}
                                  {stock.esta_vencido && ' (Vencido)'}
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-4 text-right">
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
                    <div className="text-sm text-muted-foreground">
                      Mostrando {stocksData.results.length} de {stocksData.count} lotes
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!stocksData.previous}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liberaciones" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar liberaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {loadingLiberaciones ? (
                <div className="text-center py-8">Cargando...</div>
              ) : !liberacionesData?.results?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay liberaciones registradas
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Lote</th>
                          <th className="text-left p-4 font-medium">Producto</th>
                          <th className="text-left p-4 font-medium">Fecha Solicitud</th>
                          <th className="text-left p-4 font-medium">Solicitado por</th>
                          <th className="text-left p-4 font-medium">Resultado</th>
                          <th className="text-left p-4 font-medium">Aprobado por</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {liberacionesData.results.map((liberacion) => (
                          <tr key={liberacion.id} className="hover:bg-muted/50 transition-colors">
                            <td className="p-4 font-mono text-sm">
                              {liberacion.stock_codigo_lote}
                            </td>
                            <td className="p-4">{liberacion.stock_producto_nombre}</td>
                            <td className="p-4">
                              {format(new Date(liberacion.fecha_solicitud), 'PPP', {
                                locale: es,
                              })}
                            </td>
                            <td className="p-4">{liberacion.solicitado_por_nombre}</td>
                            <td className="p-4">
                              <Badge className={getResultadoColor(liberacion.resultado)}>
                                {liberacion.resultado}
                              </Badge>
                            </td>
                            <td className="p-4">{liberacion.aprobado_por_nombre || '-'}</td>
                            <td className="p-4 text-right">
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
                    <div className="text-sm text-muted-foreground">
                      Mostrando {liberacionesData.results.length} de {liberacionesData.count}{' '}
                      liberaciones
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!liberacionesData.previous}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductoTerminadoTab;
