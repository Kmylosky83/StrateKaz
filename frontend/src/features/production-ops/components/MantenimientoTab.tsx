/**
 * Tab de Mantenimiento - Production Ops
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Wrench, AlertTriangle } from 'lucide-react';
import { useActivosProduccion, useOrdenesTrabajo } from '../hooks/useProductionOps';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const getEstadoActivoColor = (estado: string) => {
    const estadoMap: Record<string, string> = {
      OPERATIVO: 'bg-green-100 text-green-800',
      EN_MANTENIMIENTO: 'bg-yellow-100 text-yellow-800',
      FUERA_SERVICIO: 'bg-red-100 text-red-800',
      DADO_DE_BAJA: 'bg-gray-100 text-gray-800',
    };
    return estadoMap[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoOrdenColor = (estado: string) => {
    const estadoMap: Record<string, string> = {
      ABIERTA: 'bg-blue-100 text-blue-800',
      EN_PROCESO: 'bg-yellow-100 text-yellow-800',
      COMPLETADA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-gray-100 text-gray-800',
    };
    return estadoMap[estado] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mantenimiento de Equipos</CardTitle>
              <CardDescription>
                Gestión de activos, órdenes de trabajo, calibraciones y paradas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Registrar Parada
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva OT
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activos">Activos de Producción</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes de Trabajo</TabsTrigger>
        </TabsList>

        <TabsContent value="activos" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar activos..."
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

              {loadingActivos ? (
                <div className="text-center py-8">Cargando...</div>
              ) : !activosData?.results?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay activos registrados
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Código</th>
                          <th className="text-left p-4 font-medium">Nombre</th>
                          <th className="text-left p-4 font-medium">Tipo</th>
                          <th className="text-left p-4 font-medium">Estado</th>
                          <th className="text-left p-4 font-medium">Próximo Mantenimiento</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {activosData.results.map((activo) => (
                          <tr key={activo.id} className="hover:bg-muted/50 transition-colors">
                            <td className="p-4 font-mono text-sm">{activo.codigo}</td>
                            <td className="p-4">{activo.nombre}</td>
                            <td className="p-4">{activo.tipo_activo_nombre}</td>
                            <td className="p-4">
                              <Badge className={getEstadoActivoColor(activo.estado)}>
                                {activo.estado}
                              </Badge>
                            </td>
                            <td className="p-4">
                              {activo.fecha_proximo_mantenimiento
                                ? format(
                                    new Date(activo.fecha_proximo_mantenimiento),
                                    'PPP',
                                    { locale: es }
                                  )
                                : '-'}
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
                      Mostrando {activosData.results.length} de {activosData.count} activos
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!activosData.previous}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordenes" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar órdenes de trabajo..."
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

              {loadingOrdenes ? (
                <div className="text-center py-8">Cargando...</div>
              ) : !ordenesData?.results?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay órdenes de trabajo registradas
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Código OT</th>
                          <th className="text-left p-4 font-medium">Activo</th>
                          <th className="text-left p-4 font-medium">Tipo</th>
                          <th className="text-left p-4 font-medium">Prioridad</th>
                          <th className="text-left p-4 font-medium">Estado</th>
                          <th className="text-left p-4 font-medium">Asignado a</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {ordenesData.results.map((orden) => (
                          <tr key={orden.id} className="hover:bg-muted/50 transition-colors">
                            <td className="p-4 font-mono text-sm">{orden.codigo}</td>
                            <td className="p-4">{orden.activo_codigo}</td>
                            <td className="p-4">{orden.tipo_mantenimiento_nombre}</td>
                            <td className="p-4">
                              <Badge>Prioridad {orden.prioridad}</Badge>
                            </td>
                            <td className="p-4">
                              <Badge className={getEstadoOrdenColor(orden.estado)}>
                                {orden.estado}
                              </Badge>
                            </td>
                            <td className="p-4">{orden.asignado_a_nombre || '-'}</td>
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
                      Mostrando {ordenesData.results.length} de {ordenesData.count} órdenes
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!ordenesData.previous}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MantenimientoTab;
