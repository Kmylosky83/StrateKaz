/**
 * MonitoreoPage - Metricas y monitoreo del Workflow Engine
 *
 * Conectada a APIs reales:
 * - /api/workflows/monitoreo/metricas/dashboard/
 * - /api/workflows/ejecucion/instancias/ (estadisticas)
 * - /api/workflows/ejecucion/tareas/ (estadisticas)
 */
import {
  BarChart3,
  ArrowLeft,
  TrendingUp,
  Clock,
  Activity,
  Download,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  EmptyState,
  Spinner,
  KpiCard,
  KpiCardGrid,
  KpiCardSkeleton,
} from '@/components/common';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/layout';
import {
  useMonitoreoDashboard,
  useInstancias,
  useEstadisticasTareas,
  useEstadisticasInstancias,
} from '../hooks/useWorkflows';

// ============================================================
// PAGINA PRINCIPAL
// ============================================================

export default function MonitoreoPage() {
  const navigate = useNavigate();

  // Queries
  const { data: dashboard, isLoading: loadingDashboard } = useMonitoreoDashboard();
  const { data: statsInstancias, isLoading: loadingInstancias } = useEstadisticasInstancias();
  const { data: statsTareas, isLoading: loadingTareas } = useEstadisticasTareas();
  const { data: instanciasRecientes } = useInstancias({ estado: 'EN_PROCESO' });

  const isLoading = loadingDashboard || loadingInstancias || loadingTareas;
  const instancias = instanciasRecientes?.results ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoreo y Metricas"
        description="Analisis de rendimiento, tiempos y cumplimiento de SLAs"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      {isLoading ? (
        <KpiCardGrid columns={4}>
          {[1, 2, 3, 4].map((i) => <KpiCardSkeleton key={i} />)}
        </KpiCardGrid>
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            title="Flujos Activos"
            value={statsInstancias?.activas ?? 0}
            icon="Activity"
            color="purple"
          />
          <KpiCard
            title="Tareas Pendientes"
            value={statsTareas?.pendientes ?? 0}
            icon="Clock"
            color="orange"
          />
          <KpiCard
            title="Completadas Hoy"
            value={statsTareas?.completadas_hoy ?? 0}
            icon="CheckCircle2"
            color="green"
          />
          <KpiCard
            title="Tareas Vencidas"
            value={statsTareas?.vencidas ?? 0}
            icon="AlertTriangle"
            color="red"
          />
        </KpiCardGrid>
      )}

      {/* Resumen de Instancias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estadisticas generales */}
        <Card>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Resumen de Flujos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estado general de instancias de flujo
            </p>
          </div>
          <div className="p-5 space-y-4">
            <StatBar
              label="Activas"
              value={statsInstancias?.activas ?? 0}
              total={statsInstancias?.total ?? 1}
              color="bg-blue-500"
            />
            <StatBar
              label="Completadas"
              value={statsInstancias?.completadas ?? 0}
              total={statsInstancias?.total ?? 1}
              color="bg-green-500"
            />
            <StatBar
              label="Canceladas"
              value={statsInstancias?.canceladas ?? 0}
              total={statsInstancias?.total ?? 1}
              color="bg-red-500"
            />
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total de flujos</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {statsInstancias?.total ?? 0}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Cumplimiento SLA */}
        <Card>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cumplimiento de SLAs
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estado de tareas respecto a tiempos limite
            </p>
          </div>
          <div className="p-5 space-y-3">
            <SLACard
              label="Dentro de SLA"
              description="Completadas a tiempo"
              value={statsTareas ? Math.max(0, (statsTareas.completadas_hoy ?? 0)) : 0}
              color="green"
            />
            <SLACard
              label="En Proceso"
              description="Dentro de plazo"
              value={statsTareas?.en_progreso ?? 0}
              color="yellow"
            />
            <SLACard
              label="Fuera de SLA"
              description="Vencidas"
              value={statsTareas?.vencidas ?? 0}
              color="red"
            />
          </div>
        </Card>
      </div>

      {/* Instancias en Proceso */}
      <Card>
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Flujos en Proceso
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Instancias de flujo actualmente en ejecucion
          </p>
        </div>
        <div className="overflow-x-auto">
          {instancias.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<GitBranch className="h-10 w-10" />}
                title="Sin flujos activos"
                description="No hay instancias de flujo en proceso actualmente"
              />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Flujo
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Plantilla
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Prioridad
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Progreso
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Inicio
                  </th>
                </tr>
              </thead>
              <tbody>
                {instancias.slice(0, 10).map((inst) => (
                  <tr
                    key={inst.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                          {inst.titulo}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{inst.codigo_instancia}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {inst.plantilla_detail?.nombre ?? '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        inst.estado === 'EN_PROCESO'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : inst.estado === 'COMPLETADO'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {inst.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        inst.prioridad === 'URGENTE'
                          ? 'bg-red-100 text-red-700'
                          : inst.prioridad === 'ALTA'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {inst.prioridad}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${inst.progreso_porcentaje ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {inst.progreso_porcentaje ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(inst.fecha_inicio).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

interface StatBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

const StatBar = ({ label, value, total, color }: StatBarProps) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{value} ({pct}%)</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

interface SLACardProps {
  label: string;
  description: string;
  value: number;
  color: 'green' | 'yellow' | 'red';
}

const SLACard = ({ label, description, value, color }: SLACardProps) => {
  const colorMap = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };
  const valueColorMap = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${colorMap[color]}`}>
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <div className={`text-2xl font-bold ${valueColorMap[color]}`}>{value}</div>
    </div>
  );
};
