/**
 * Dashboard de Portafolios y Programas
 * Muestra estadísticas generales del portafolio de proyectos
 */
import {
  Briefcase,
  FolderKanban,
  TrendingUp,
  AlertCircle,
  DollarSign,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';
import { Card, Badge } from '@/components/common';
import { useProyectosDashboard } from '../../hooks/useProyectos';
import { usePortafolios } from '../../hooks/usePortafolios';
import { useProgramas } from '../../hooks/usePortafolios';

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

const KPICard = ({ title, value, description, icon, trend, color = 'purple' }: KPICardProps) => {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
            <div className={`text-${color}-600 dark:text-${color}-400`}>{icon}</div>
          </div>
          {trend && (
            <div
              className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
    </Card>
  );
};

export const PortafolioDashboard = () => {
  const { data: dashboardData, isLoading: dashboardLoading } = useProyectosDashboard();
  const { data: portafoliosData, isLoading: portafoliosLoading } = usePortafolios({
    is_active: true,
  });
  const { data: programasData, isLoading: programasLoading } = useProgramas({ is_active: true });

  const isLoading = dashboardLoading || portafoliosLoading || programasLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <div className="p-6 animate-pulse">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const portafolios = portafoliosData?.results || [];
  const programas = programasData?.results || [];
  const stats = dashboardData;

  return (
    <div className="space-y-6">
      {/* Resumen de Portafolios y Programas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Portafolios Activos"
          value={stats?.portafolios_activos || 0}
          description={`${stats?.total_portafolios || 0} total`}
          icon={<Briefcase className="h-6 w-6" />}
          color="purple"
        />
        <KPICard
          title="Programas Activos"
          value={stats?.programas_activos || 0}
          description={`${stats?.total_programas || 0} total`}
          icon={<FolderKanban className="h-6 w-6" />}
          color="blue"
        />
        <KPICard
          title="Total Proyectos"
          value={stats?.total_proyectos || 0}
          description="Proyectos en cartera"
          icon={<Target className="h-6 w-6" />}
          color="indigo"
        />
        <KPICard
          title="Progreso Promedio"
          value={`${stats?.progreso_promedio || 0}%`}
          description="Completitud general"
          icon={<TrendingUp className="h-6 w-6" />}
          color="green"
        />
      </div>

      {/* Estado de los Proyectos */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Estado de Proyectos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  En Ejecución
                </span>
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.en_ejecucion || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completados
                </span>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.completados || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Propuestos
                </span>
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.propuestos || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Atrasados
                </span>
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.proyectos_atrasados || 0}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Salud del Portafolio */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Salud del Portafolio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Proyectos en Verde
                  </span>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {stats?.proyectos_verde || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats?.total_proyectos
                  ? Math.round(
                      ((stats?.proyectos_verde || 0) / stats.total_proyectos) * 100
                    )
                  : 0}
                % del total
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Proyectos en Amarillo
                  </span>
                </div>
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                {stats?.proyectos_amarillo || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats?.total_proyectos
                  ? Math.round(
                      ((stats?.proyectos_amarillo || 0) / stats.total_proyectos) * 100
                    )
                  : 0}
                % del total
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Proyectos en Rojo
                  </span>
                </div>
              </div>
              <p className="text-3xl font-bold text-red-600">
                {stats?.proyectos_rojo || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats?.total_proyectos
                  ? Math.round(
                      ((stats?.proyectos_rojo || 0) / stats.total_proyectos) * 100
                    )
                  : 0}
                % del total
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Presupuesto */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Presupuesto del Portafolio
        </h3>
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Presupuesto Total
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${stats?.presupuesto_total || '0'}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ejecutado
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  ${stats?.presupuesto_ejecutado || '0'}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Disponible
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${stats?.presupuesto_disponible || '0'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Porcentaje de Ejecución
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {stats?.porcentaje_ejecucion || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${stats?.porcentaje_ejecucion || 0}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Por Prioridad */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Proyectos por Prioridad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <Badge variant="danger" size="sm" className="mb-2">
                Crítica
              </Badge>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.criticos || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <Badge variant="warning" size="sm" className="mb-2">
                Alta
              </Badge>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.alta_prioridad || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <Badge variant="info" size="sm" className="mb-2">
                Media
              </Badge>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.media_prioridad || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <Badge variant="gray" size="sm" className="mb-2">
                Baja
              </Badge>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.baja_prioridad || 0}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
