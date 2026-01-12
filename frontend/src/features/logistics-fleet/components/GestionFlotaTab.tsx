/**
 * Tab de Gestion de Flota
 * Vehiculos, Documentos PESV, Costos y Mantenimientos
 *
 * Usa componentes del Design System (@/components/common)
 */
import { useState } from 'react';
import { useVehiculos, useDashboardFlota, useVehiculosVencidos } from '../hooks/useLogisticsFleet';
import { Card, Badge, Button, Alert } from '@/components/common';
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
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Vehículos</span>
            <Truck className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {loadingDashboard ? '...' : dashboard?.total_vehiculos || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {loadingDashboard ? '...' : dashboard?.vehiculos_disponibles || 0} disponibles
          </p>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">En Mantenimiento</span>
            <Wrench className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {loadingDashboard ? '...' : dashboard?.vehiculos_mantenimiento || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {loadingDashboard ? '...' : dashboard?.mantenimientos_pendientes || 0} programados
          </p>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Documentos por Vencer</span>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {loadingDashboard ? '...' : dashboard?.documentos_por_vencer || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Próximos 30 días</p>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Documentos Vencidos</span>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {loadingDashboard ? '...' : dashboard?.documentos_vencidos || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Requieren atención inmediata</p>
        </Card>
      </div>

      {/* Alertas PESV - Documentos Vencidos */}
      {!loadingVencidos && vehiculosVencidos && vehiculosVencidos.length > 0 && (
        <Alert variant="error">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                Alerta PESV - Documentos Vencidos
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {vehiculosVencidos.length} vehículo(s) con documentos vencidos. Estos vehículos NO
                pueden operar según Resolución 40595/2022.
              </p>
              <div className="mt-2 space-y-1">
                {vehiculosVencidos.slice(0, 3).map((v) => (
                  <div key={v.id} className="text-sm text-red-600 dark:text-red-300">
                    <span className="font-medium">{v.placa}</span> - {v.marca} {v.modelo}
                  </div>
                ))}
                {vehiculosVencidos.length > 3 && (
                  <div className="text-sm text-red-500 dark:text-red-400">
                    Y {vehiculosVencidos.length - 3} más...
                  </div>
                )}
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Lista de Vehículos */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Vehículos de la Flota
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestión completa de vehículos y documentos PESV
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Vehículo
          </Button>
        </div>

        {/* Búsqueda */}
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, marca, modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Placa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehículo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">SOAT</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tecnomecánica</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disponibilidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loadingVehiculos ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Cargando vehículos...
                  </td>
                </tr>
              ) : vehiculos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron vehículos
                  </td>
                </tr>
              ) : (
                vehiculos.map((vehiculo) => (
                  <tr key={vehiculo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{vehiculo.placa}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{vehiculo.tipo_nombre}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: vehiculo.estado_color || '#6c757d' }}
                      >
                        {vehiculo.estado_nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {vehiculo.fecha_soat ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(vehiculo.fecha_soat).toLocaleDateString('es-CO')}
                          </span>
                          {vehiculo.dias_hasta_vencimiento_soat !== undefined && (
                            <Badge
                              variant={
                                vehiculo.dias_hasta_vencimiento_soat < 0
                                  ? 'red'
                                  : vehiculo.dias_hasta_vencimiento_soat <= 30
                                  ? 'yellow'
                                  : 'gray'
                              }
                              size="sm"
                            >
                              {vehiculo.dias_hasta_vencimiento_soat < 0
                                ? `Vencido ${Math.abs(vehiculo.dias_hasta_vencimiento_soat)}d`
                                : `${vehiculo.dias_hasta_vencimiento_soat}d`}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Sin registro</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {vehiculo.fecha_tecnomecanica ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(vehiculo.fecha_tecnomecanica).toLocaleDateString('es-CO')}
                          </span>
                          {vehiculo.dias_hasta_vencimiento_tecnomecanica !== undefined && (
                            <Badge
                              variant={
                                vehiculo.dias_hasta_vencimiento_tecnomecanica < 0
                                  ? 'red'
                                  : vehiculo.dias_hasta_vencimiento_tecnomecanica <= 30
                                  ? 'yellow'
                                  : 'gray'
                              }
                              size="sm"
                            >
                              {vehiculo.dias_hasta_vencimiento_tecnomecanica < 0
                                ? `Vencido ${Math.abs(vehiculo.dias_hasta_vencimiento_tecnomecanica)}d`
                                : `${vehiculo.dias_hasta_vencimiento_tecnomecanica}d`}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Sin registro</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {vehiculo.disponible_para_operar ? (
                        <Badge variant="green" size="sm">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Disponible
                        </Badge>
                      ) : (
                        <Badge variant="red" size="sm">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          No Disponible
                        </Badge>
                      )}
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

      {/* Secciones adicionales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Mantenimientos
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestión de mantenimientos preventivos y correctivos
          </p>
          <Button variant="secondary" className="mt-4 w-full">
            Ver Mantenimientos
          </Button>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Costos de Operación
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Control de costos variables (combustible, peajes, etc.)
          </p>
          <Button variant="secondary" className="mt-4 w-full">
            Ver Costos
          </Button>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Verificaciones PESV
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Inspecciones preoperacionales diarias según Res. 40595/2022
          </p>
          <Button variant="secondary" className="mt-4 w-full">
            Ver Verificaciones
          </Button>
        </Card>
      </div>
    </div>
  );
}
