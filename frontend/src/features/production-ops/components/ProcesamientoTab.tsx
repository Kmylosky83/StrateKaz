/**
 * Tab de Procesamiento - Production Ops
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { useOrdenesProduccion } from '../hooks/useProductionOps';
import { Badge } from '@/components/ui/badge';
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

  const getPrioridadBadge = (prioridad: number) => {
    const prioridadMap: Record<number, { label: string; className: string }> = {
      1: { label: 'Crítica', className: 'bg-red-100 text-red-800' },
      2: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
      3: { label: 'Media', className: 'bg-yellow-100 text-yellow-800' },
      4: { label: 'Baja', className: 'bg-blue-100 text-blue-800' },
      5: { label: 'Muy Baja', className: 'bg-gray-100 text-gray-800' },
    };
    const { label, className } = prioridadMap[prioridad] || prioridadMap[3];
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Órdenes de Producción</CardTitle>
              <CardDescription>
                Gestión de lotes de procesamiento y control de calidad en proceso
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, tipo de proceso..."
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
        </CardContent>
      </Card>

      {/* Tabla de Órdenes */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : !ordenesData?.results?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay órdenes de producción registradas
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Código</th>
                      <th className="text-left p-4 font-medium">Fecha Programada</th>
                      <th className="text-left p-4 font-medium">Tipo Proceso</th>
                      <th className="text-left p-4 font-medium">Línea</th>
                      <th className="text-left p-4 font-medium">Prioridad</th>
                      <th className="text-left p-4 font-medium">Estado</th>
                      <th className="text-left p-4 font-medium">Progreso</th>
                      <th className="text-right p-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ordenesData.results.map((orden) => (
                      <tr key={orden.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4 font-mono text-sm">{orden.codigo}</td>
                        <td className="p-4">
                          {format(new Date(orden.fecha_programada), 'PPP', { locale: es })}
                        </td>
                        <td className="p-4">{orden.tipo_proceso_nombre}</td>
                        <td className="p-4">{orden.linea_produccion_nombre}</td>
                        <td className="p-4">{getPrioridadBadge(orden.prioridad)}</td>
                        <td className="p-4">
                          <Badge>{orden.estado_nombre}</Badge>
                        </td>
                        <td className="p-4">
                          {orden.porcentaje_completado
                            ? `${parseFloat(orden.porcentaje_completado).toFixed(0)}%`
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

              {/* Paginación */}
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
    </div>
  );
};

export default ProcesamientoTab;
