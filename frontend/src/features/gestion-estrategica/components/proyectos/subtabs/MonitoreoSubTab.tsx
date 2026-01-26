/**
 * SubTab de Ejecución y Monitoreo
 * Gestión de proyectos en ejecución y monitoreo
 */
import { Card, Badge, Button, EmptyState } from '@/components/common';
import { useProyectos } from '../../../hooks/useProyectos';
import {
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Target,
} from 'lucide-react';

export const MonitoreoSubTab = () => {
  const { data: proyectosEjecucion, isLoading: loadingEjecucion } = useProyectos({
    estado: 'EJECUCION',
    is_active: true,
  });

  const { data: proyectosMonitoreo, isLoading: loadingMonitoreo } = useProyectos({
    estado: 'MONITOREO',
    is_active: true,
  });

  const isLoading = loadingEjecucion || loadingMonitoreo;
  const proyectos = [
    ...(proyectosEjecucion?.results || []),
    ...(proyectosMonitoreo?.results || []),
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <div className="p-6 animate-pulse-subtle">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Ejecución y Monitoreo
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Proyectos en ejecución y control - Seguimiento de KPIs y desempeño
          </p>
        </div>
      </div>

      {/* Métricas de Control */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Métricas de Control (EVM)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Planned Value (PV)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor planificado</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Earned Value (EV)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor ganado</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Actual Cost (AC)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Costo real</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">CPI / SPI</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Índices de desempeño</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Proyectos */}
      {proyectos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {proyectos.map((proyecto) => (
            <Card key={proyecto.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {proyecto.name}
                      </h3>
                      <Badge variant="info" size="sm">
                        {proyecto.code}
                      </Badge>
                      <Badge
                        variant={
                          proyecto.health_status === 'VERDE'
                            ? 'success'
                            : proyecto.health_status === 'AMARILLO'
                              ? 'warning'
                              : 'danger'
                        }
                        size="sm"
                      >
                        {proyecto.health_status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Ver Dashboard
                  </Button>
                </div>

                {/* Progreso General */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progreso General
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {proyecto.progreso_general || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        proyecto.health_status === 'VERDE'
                          ? 'bg-green-600'
                          : proyecto.health_status === 'AMARILLO'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                      }`}
                      style={{ width: `${proyecto.progreso_general || 0}%` }}
                    />
                  </div>
                </div>

                {/* Dimensiones de Progreso */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Alcance:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${proyecto.progreso_alcance || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{proyecto.progreso_alcance || 0}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Tiempo:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-green-600 h-1.5 rounded-full"
                          style={{ width: `${proyecto.progreso_tiempo || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{proyecto.progreso_tiempo || 0}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Costo:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{ width: `${proyecto.progreso_costo || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{proyecto.progreso_costo || 0}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Calidad:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-orange-600 h-1.5 rounded-full"
                          style={{ width: `${proyecto.progreso_calidad || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{proyecto.progreso_calidad || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{proyecto.hitos_count || 0} hitos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Fin:{' '}
                      {proyecto.fecha_fin_prevista
                        ? new Date(proyecto.fecha_fin_prevista).toLocaleDateString('es-CO')
                        : 'Sin definir'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>
                      ${proyecto.presupuesto_ejecutado || '0'} / $
                      {proyecto.presupuesto_estimado || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Activity className="h-12 w-12" />}
          title="No hay proyectos en ejecución"
          description="Los proyectos pasarán a esta fase desde planificación"
        />
      )}
    </div>
  );
};
