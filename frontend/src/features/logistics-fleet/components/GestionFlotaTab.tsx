/**
 * Tab de Gestion de Flota
 * Vehiculos, Documentos PESV, Costos y Mantenimientos
 */
import { useState } from 'react';
import { useVehiculos, useDashboardFlota, useVehiculosVencidos } from '../hooks/useLogisticsFleet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  DollarSign,
  FileText,
  Plus,
  Search,
} from 'lucide-react';

export function GestionFlotaTab() {
  const [search, setSearch] = useState('');

  // Queries
  const { data: dashboard, isLoading: loadingDashboard } = useDashboardFlota();
  const { data: vehiculosVencidos, isLoading: loadingVencidos } = useVehiculosVencidos();
  const { data: vehiculosData, isLoading: loadingVehiculos } = useVehiculos({
    search,
    is_active: true,
  });

  const vehiculos = vehiculosData?.results || [];

  return (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehiculos</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingDashboard ? '...' : dashboard?.total_vehiculos || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingDashboard ? '...' : dashboard?.vehiculos_disponibles || 0} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Mantenimiento</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingDashboard ? '...' : dashboard?.vehiculos_mantenimiento || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingDashboard ? '...' : dashboard?.mantenimientos_pendientes || 0} programados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos por Vencer</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loadingDashboard ? '...' : dashboard?.documentos_por_vencer || 0}
            </div>
            <p className="text-xs text-muted-foreground">Proximos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loadingDashboard ? '...' : dashboard?.documentos_vencidos || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requieren atencion inmediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas PESV - Documentos Vencidos */}
      {!loadingVencidos && vehiculosVencidos && vehiculosVencidos.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alerta PESV - Documentos Vencidos</AlertTitle>
          <AlertDescription>
            {vehiculosVencidos.length} vehiculo(s) con documentos vencidos. Estos vehiculos NO
            pueden operar segun Resolucion 40595/2022.
            <div className="mt-2 space-y-1">
              {vehiculosVencidos.slice(0, 3).map((v) => (
                <div key={v.id} className="text-sm">
                  <span className="font-medium">{v.placa}</span> - {v.marca} {v.modelo}
                </div>
              ))}
              {vehiculosVencidos.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  Y {vehiculosVencidos.length - 3} mas...
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Vehiculos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vehiculos de la Flota</CardTitle>
              <CardDescription>Gestion completa de vehiculos y documentos PESV</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Vehiculo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busqueda */}
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por placa, marca, modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Tabla */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Vehiculo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>SOAT</TableHead>
                  <TableHead>Tecnomecanica</TableHead>
                  <TableHead>Disponibilidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingVehiculos ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Cargando vehiculos...
                    </TableCell>
                  </TableRow>
                ) : vehiculos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No se encontraron vehiculos
                    </TableCell>
                  </TableRow>
                ) : (
                  vehiculos.map((vehiculo) => (
                    <TableRow key={vehiculo.id}>
                      <TableCell className="font-medium">{vehiculo.placa}</TableCell>
                      <TableCell>
                        {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
                      </TableCell>
                      <TableCell>{vehiculo.tipo_nombre}</TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: vehiculo.estado_color || '#6c757d',
                            color: 'white',
                          }}
                        >
                          {vehiculo.estado_nombre}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vehiculo.fecha_soat ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {new Date(vehiculo.fecha_soat).toLocaleDateString('es-CO')}
                            </span>
                            {vehiculo.dias_hasta_vencimiento_soat !== undefined && (
                              <Badge
                                variant={
                                  vehiculo.dias_hasta_vencimiento_soat < 0
                                    ? 'destructive'
                                    : vehiculo.dias_hasta_vencimiento_soat <= 30
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {vehiculo.dias_hasta_vencimiento_soat < 0
                                  ? `Vencido ${Math.abs(vehiculo.dias_hasta_vencimiento_soat)}d`
                                  : `${vehiculo.dias_hasta_vencimiento_soat}d`}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin registro</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vehiculo.fecha_tecnomecanica ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {new Date(vehiculo.fecha_tecnomecanica).toLocaleDateString('es-CO')}
                            </span>
                            {vehiculo.dias_hasta_vencimiento_tecnomecanica !== undefined && (
                              <Badge
                                variant={
                                  vehiculo.dias_hasta_vencimiento_tecnomecanica < 0
                                    ? 'destructive'
                                    : vehiculo.dias_hasta_vencimiento_tecnomecanica <= 30
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {vehiculo.dias_hasta_vencimiento_tecnomecanica < 0
                                  ? `Vencido ${Math.abs(
                                      vehiculo.dias_hasta_vencimiento_tecnomecanica
                                    )}d`
                                  : `${vehiculo.dias_hasta_vencimiento_tecnomecanica}d`}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin registro</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vehiculo.disponible_para_operar ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Disponible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            No Disponible
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Secciones adicionales (simplificadas) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Wrench className="mr-2 h-4 w-4" />
              Mantenimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gestion de mantenimientos preventivos y correctivos
            </p>
            <Button variant="outline" className="mt-4 w-full">
              Ver Mantenimientos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <DollarSign className="mr-2 h-4 w-4" />
              Costos de Operacion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Control de costos variables (combustible, peajes, etc.)
            </p>
            <Button variant="outline" className="mt-4 w-full">
              Ver Costos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileText className="mr-2 h-4 w-4" />
              Verificaciones PESV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Inspecciones preoperacionales diarias segun Res. 40595/2022
            </p>
            <Button variant="outline" className="mt-4 w-full">
              Ver Verificaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
