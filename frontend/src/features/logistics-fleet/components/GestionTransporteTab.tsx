/**
 * Tab de Gestion de Transporte
 * Rutas, Conductores, Programaciones, Despachos y Manifiestos
 */
import { useState } from 'react';
import {
  useRutas,
  useConductores,
  useProgramaciones,
  useDespachos,
  useConductoresLicenciaVencida,
} from '../hooks/useLogisticsFleet';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  User,
  Calendar,
  Package,
  FileText,
  AlertTriangle,
  Plus,
  Search,
  Clock,
} from 'lucide-react';
import { EstadoProgramacionColors } from '../types/logistics-fleet.types';

export function GestionTransporteTab() {
  const [search, setSearch] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('programaciones');

  // Queries
  const { data: conductoresVencidos, isLoading: loadingConductoresVencidos } =
    useConductoresLicenciaVencida();
  const { data: rutasData, isLoading: loadingRutas } = useRutas({ is_active: true });
  const { data: conductoresData, isLoading: loadingConductores } = useConductores({
    is_active: true,
  });
  const { data: programacionesData, isLoading: loadingProgramaciones } = useProgramaciones({});
  const { data: despachosData, isLoading: loadingDespachos } = useDespachos({});

  const rutas = rutasData?.results || [];
  const conductores = conductoresData?.results || [];
  const programaciones = programacionesData?.results || [];
  const despachos = despachosData?.results || [];

  return (
    <div className="space-y-6">
      {/* Alertas - Conductores con Licencia Vencida */}
      {!loadingConductoresVencidos &&
        conductoresVencidos &&
        conductoresVencidos.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Alerta PESV - Licencias de Conduccion Vencidas</AlertTitle>
            <AlertDescription>
              {conductoresVencidos.length} conductor(es) con licencia vencida. Estos conductores
              NO pueden operar segun Resolucion 40595/2022.
              <div className="mt-2 space-y-1">
                {conductoresVencidos.slice(0, 3).map((c) => (
                  <div key={c.id} className="text-sm">
                    <span className="font-medium">{c.nombre_completo}</span> - CC{' '}
                    {c.documento_identidad}
                  </div>
                ))}
                {conductoresVencidos.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    Y {conductoresVencidos.length - 3} mas...
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="programaciones">
            <Calendar className="mr-2 h-4 w-4" />
            Programaciones
          </TabsTrigger>
          <TabsTrigger value="rutas">
            <MapPin className="mr-2 h-4 w-4" />
            Rutas
          </TabsTrigger>
          <TabsTrigger value="conductores">
            <User className="mr-2 h-4 w-4" />
            Conductores
          </TabsTrigger>
          <TabsTrigger value="despachos">
            <Package className="mr-2 h-4 w-4" />
            Despachos
          </TabsTrigger>
          <TabsTrigger value="manifiestos">
            <FileText className="mr-2 h-4 w-4" />
            Manifiestos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Programaciones */}
        <TabsContent value="programaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Programacion de Rutas</CardTitle>
                  <CardDescription>Asignacion de vehiculos y conductores a rutas</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Programacion
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora Salida</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingProgramaciones ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Cargando programaciones...
                        </TableCell>
                      </TableRow>
                    ) : programaciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No se encontraron programaciones
                        </TableCell>
                      </TableRow>
                    ) : (
                      programaciones.map((prog) => (
                        <TableRow key={prog.id}>
                          <TableCell className="font-medium">{prog.codigo}</TableCell>
                          <TableCell>{prog.ruta_nombre}</TableCell>
                          <TableCell>{prog.conductor_nombre}</TableCell>
                          <TableCell>
                            {new Date(prog.fecha_programada).toLocaleDateString('es-CO')}
                          </TableCell>
                          <TableCell>{prog.hora_salida_programada}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`bg-${
                                EstadoProgramacionColors[prog.estado]
                              }-50 text-${EstadoProgramacionColors[prog.estado]}-700`}
                            >
                              {prog.estado}
                            </Badge>
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
        </TabsContent>

        {/* Tab: Rutas */}
        <TabsContent value="rutas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rutas Predefinidas</CardTitle>
                  <CardDescription>Gestion de rutas de recoleccion y entrega</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Ruta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por codigo, nombre, ciudad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Distancia (km)</TableHead>
                      <TableHead>Tiempo (min)</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingRutas ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Cargando rutas...
                        </TableCell>
                      </TableRow>
                    ) : rutas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No se encontraron rutas
                        </TableCell>
                      </TableRow>
                    ) : (
                      rutas.map((ruta) => (
                        <TableRow key={ruta.id}>
                          <TableCell className="font-medium">{ruta.codigo}</TableCell>
                          <TableCell>{ruta.nombre}</TableCell>
                          <TableCell>
                            {ruta.origen_nombre}, {ruta.origen_ciudad}
                          </TableCell>
                          <TableCell>
                            {ruta.destino_nombre}, {ruta.destino_ciudad}
                          </TableCell>
                          <TableCell>{ruta.distancia_km}</TableCell>
                          <TableCell>{ruta.tiempo_estimado_minutos}</TableCell>
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
        </TabsContent>

        {/* Tab: Conductores */}
        <TabsContent value="conductores" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conductores</CardTitle>
                  <CardDescription>Gestion de conductores y licencias</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Conductor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, documento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Licencia</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingConductores ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Cargando conductores...
                        </TableCell>
                      </TableRow>
                    ) : conductores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No se encontraron conductores
                        </TableCell>
                      </TableRow>
                    ) : (
                      conductores.map((conductor) => (
                        <TableRow key={conductor.id}>
                          <TableCell className="font-medium">{conductor.nombre_completo}</TableCell>
                          <TableCell>
                            {conductor.tipo_documento} {conductor.documento_identidad}
                          </TableCell>
                          <TableCell>{conductor.licencia_conduccion}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{conductor.categoria_licencia}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {new Date(conductor.fecha_vencimiento_licencia).toLocaleDateString(
                                  'es-CO'
                                )}
                              </span>
                              {conductor.licencia_vigente === false && (
                                <Badge variant="destructive">Vencida</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={conductor.es_empleado ? 'default' : 'outline'}>
                              {conductor.es_empleado ? 'Empleado' : 'Tercero'}
                            </Badge>
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
        </TabsContent>

        {/* Tab: Despachos */}
        <TabsContent value="despachos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Despachos</CardTitle>
                  <CardDescription>Control de despachos y entregas</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Despacho
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Peso (kg)</TableHead>
                      <TableHead>Valor Declarado</TableHead>
                      <TableHead>Fecha Entrega</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDespachos ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Cargando despachos...
                        </TableCell>
                      </TableRow>
                    ) : despachos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No se encontraron despachos
                        </TableCell>
                      </TableRow>
                    ) : (
                      despachos.map((despacho) => (
                        <TableRow key={despacho.id}>
                          <TableCell className="font-medium">{despacho.codigo}</TableCell>
                          <TableCell>{despacho.cliente_nombre}</TableCell>
                          <TableCell>{despacho.peso_total_kg}</TableCell>
                          <TableCell>
                            ${new Intl.NumberFormat('es-CO').format(despacho.valor_declarado)}
                          </TableCell>
                          <TableCell>
                            {new Date(despacho.fecha_entrega_estimada).toLocaleDateString('es-CO')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{despacho.estado_nombre}</Badge>
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
        </TabsContent>

        {/* Tab: Manifiestos */}
        <TabsContent value="manifiestos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manifiestos de Carga</CardTitle>
                  <CardDescription>Documentos RNDC para transporte de mercancia</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Manifiesto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Gestion de manifiestos de carga RNDC</p>
                  <Button variant="outline" className="mt-4">
                    Ver Manifiestos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
