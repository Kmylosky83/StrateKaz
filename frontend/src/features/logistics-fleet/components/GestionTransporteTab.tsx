/**
 * Tab de Gestion de Transporte
 * Rutas, Conductores, Programaciones, Despachos y Manifiestos
 *
 * Usa componentes del Design System (@/components/common)
 */
import { useState } from 'react';
import {
  useRutas,
  useConductores,
  useProgramaciones,
  useDespachos,
  useConductoresLicenciaVencida,
} from '../hooks/useLogisticsFleet';
import { Card, Badge, Button, Alert, Tabs } from '@/components/common';
import {
  MapPin,
  User,
  Calendar,
  Package,
  FileText,
  AlertTriangle,
  Plus,
  Search,
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

  const tabs = [
    { id: 'programaciones', label: 'Programaciones', icon: <Calendar className="h-4 w-4" /> },
    { id: 'rutas', label: 'Rutas', icon: <MapPin className="h-4 w-4" /> },
    { id: 'conductores', label: 'Conductores', icon: <User className="h-4 w-4" /> },
    { id: 'despachos', label: 'Despachos', icon: <Package className="h-4 w-4" /> },
    { id: 'manifiestos', label: 'Manifiestos', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Alertas - Conductores con Licencia Vencida */}
      {!loadingConductoresVencidos &&
        conductoresVencidos &&
        conductoresVencidos.length > 0 && (
          <Alert variant="error">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-200">
                  Alerta PESV - Licencias de Conducción Vencidas
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {conductoresVencidos.length} conductor(es) con licencia vencida. Estos conductores
                  NO pueden operar según Resolución 40595/2022.
                </p>
                <div className="mt-2 space-y-1">
                  {conductoresVencidos.slice(0, 3).map((c) => (
                    <div key={c.id} className="text-sm text-red-600 dark:text-red-300">
                      <span className="font-medium">{c.nombre_completo}</span> - CC{' '}
                      {c.documento_identidad}
                    </div>
                  ))}
                  {conductoresVencidos.length > 3 && (
                    <div className="text-sm text-red-500 dark:text-red-400">
                      Y {conductoresVencidos.length - 3} más...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Alert>
        )}

      {/* Sub-tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeSubTab}
        onChange={setActiveSubTab}
        variant="pills"
      />

      {/* Tab: Programaciones */}
      {activeSubTab === 'programaciones' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Programación de Rutas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Asignación de vehículos y conductores a rutas
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Programación
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ruta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conductor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hora Salida</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {loadingProgramaciones ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Cargando programaciones...
                    </td>
                  </tr>
                ) : programaciones.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron programaciones
                    </td>
                  </tr>
                ) : (
                  programaciones.map((prog) => (
                    <tr key={prog.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{prog.codigo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{prog.ruta_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{prog.conductor_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(prog.fecha_programada).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{prog.hora_salida_programada}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            EstadoProgramacionColors[prog.estado] === 'green' ? 'green' :
                            EstadoProgramacionColors[prog.estado] === 'yellow' ? 'yellow' :
                            EstadoProgramacionColors[prog.estado] === 'red' ? 'red' : 'gray'
                          }
                          size="sm"
                        >
                          {prog.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Rutas */}
      {activeSubTab === 'rutas' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Rutas Predefinidas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestión de rutas de recolección y entrega
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Ruta
            </Button>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, nombre, ciudad..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="max-w-sm flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Origen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Destino</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Distancia (km)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiempo (min)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {loadingRutas ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Cargando rutas...
                    </td>
                  </tr>
                ) : rutas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron rutas
                    </td>
                  </tr>
                ) : (
                  rutas.map((ruta) => (
                    <tr key={ruta.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{ruta.codigo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{ruta.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {ruta.origen_nombre}, {ruta.origen_ciudad}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {ruta.destino_nombre}, {ruta.destino_ciudad}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{ruta.distancia_km}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{ruta.tiempo_estimado_minutos}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Conductores */}
      {activeSubTab === 'conductores' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Conductores
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestión de conductores y licencias
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Conductor
            </Button>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, documento..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="max-w-sm flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Documento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Licencia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vencimiento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {loadingConductores ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Cargando conductores...
                    </td>
                  </tr>
                ) : conductores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron conductores
                    </td>
                  </tr>
                ) : (
                  conductores.map((conductor) => (
                    <tr key={conductor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{conductor.nombre_completo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {conductor.tipo_documento} {conductor.documento_identidad}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{conductor.licencia_conduccion}</td>
                      <td className="px-4 py-3">
                        <Badge variant="gray" size="sm">{conductor.categoria_licencia}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(conductor.fecha_vencimiento_licencia).toLocaleDateString('es-CO')}
                          </span>
                          {conductor.licencia_vigente === false && (
                            <Badge variant="red" size="sm">Vencida</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={conductor.es_empleado ? 'blue' : 'gray'} size="sm">
                          {conductor.es_empleado ? 'Empleado' : 'Tercero'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Despachos */}
      {activeSubTab === 'despachos' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Despachos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control de despachos y entregas
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Despacho
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Peso (kg)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Declarado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Entrega</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {loadingDespachos ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Cargando despachos...
                    </td>
                  </tr>
                ) : despachos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron despachos
                    </td>
                  </tr>
                ) : (
                  despachos.map((despacho) => (
                    <tr key={despacho.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{despacho.codigo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{despacho.cliente_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{despacho.peso_total_kg}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        ${new Intl.NumberFormat('es-CO').format(despacho.valor_declarado)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(despacho.fecha_entrega_estimada).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="gray" size="sm">{despacho.estado_nombre}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Manifiestos */}
      {activeSubTab === 'manifiestos' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Manifiestos de Carga
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Documentos RNDC para transporte de mercancía
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Manifiesto
            </Button>
          </div>

          <div className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Gestión de manifiestos de carga RNDC</p>
              <Button variant="secondary" className="mt-4">
                Ver Manifiestos
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
