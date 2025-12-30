/**
 * Tab de Recepción de Materia Prima - Production Ops
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { useRecepciones } from '../hooks/useProductionOps';
import { Badge } from '@/components/ui/badge';
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

  const getEstadoColor = (color?: string) => {
    const colorMap: Record<string, string> = {
      '#28A745': 'bg-green-100 text-green-800',
      '#FFC107': 'bg-yellow-100 text-yellow-800',
      '#DC3545': 'bg-red-100 text-red-800',
      '#17A2B8': 'bg-blue-100 text-blue-800',
      '#6C757D': 'bg-gray-100 text-gray-800',
    };
    return colorMap[color || '#6C757D'] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recepciones de Materia Prima</CardTitle>
              <CardDescription>
                Gestión de recepción de huesos, sebo, grasa y subproductos cárnicos
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Recepción
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, proveedor..."
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

      {/* Tabla de Recepciones */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : !recepcionesData?.results?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay recepciones registradas
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Código</th>
                      <th className="text-left p-4 font-medium">Fecha</th>
                      <th className="text-left p-4 font-medium">Proveedor</th>
                      <th className="text-left p-4 font-medium">Tipo</th>
                      <th className="text-left p-4 font-medium">Peso Neto</th>
                      <th className="text-left p-4 font-medium">Estado</th>
                      <th className="text-right p-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recepcionesData.results.map((recepcion) => (
                      <tr key={recepcion.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4 font-mono text-sm">{recepcion.codigo}</td>
                        <td className="p-4">
                          {format(new Date(recepcion.fecha), 'PPP', { locale: es })}
                        </td>
                        <td className="p-4">{recepcion.proveedor_nombre}</td>
                        <td className="p-4">{recepcion.tipo_recepcion_nombre}</td>
                        <td className="p-4">
                          {recepcion.peso_neto ? `${recepcion.peso_neto} KG` : '-'}
                        </td>
                        <td className="p-4">
                          <Badge className={getEstadoColor(recepcion.estado_color)}>
                            {recepcion.estado_nombre}
                          </Badge>
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
                  Mostrando {recepcionesData.results.length} de {recepcionesData.count} recepciones
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!recepcionesData.previous}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default RecepcionTab;
