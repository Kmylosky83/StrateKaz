/**
 * DashboardTab - Dashboard Analytics del proceso de Seleccion y Contratacion
 * Vista general con KPIs, distribuciones y metricas clave
 *
 * Datos del endpoint: /api/mi-equipo/seleccion/estadisticas/
 * + hooks locales para contratos por vencer y afiliaciones
 */
import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { cn } from '@/utils/cn';
import {
  Briefcase,
  Users,
  MessageSquare,
  ClipboardCheck,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Shield,
  UserCheck,
  Hourglass,
  Target,
} from 'lucide-react';
import {
  useProcesoSeleccionEstadisticas,
  useContratosPorVencer,
  useAfiliaciones,
} from '../../hooks/useSeleccionContratacion';

// ============================================================================
// Componentes auxiliares
// ============================================================================

interface KPICardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description?: string;
  trend?: string;
}

const KPICard = ({ label, value, icon: Icon, color, bg, description, trend }: KPICardProps) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-3">
    <div className={cn('p-2.5 rounded-lg shrink-0', bg)}>
      <Icon size={20} className={color} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {description && <p className="text-[10px] text-gray-400 mt-1">{description}</p>}
      {trend && (
        <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 flex items-center gap-0.5">
          <TrendingUp size={8} />
          {trend}
        </p>
      )}
    </div>
  </div>
);

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

const ProgressBar = ({ label, value, total, color }: ProgressBarProps) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {value} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Componente Principal
// ============================================================================

export const DashboardTab = () => {
  const { data: stats, isLoading: statsLoading } = useProcesoSeleccionEstadisticas();
  const { data: porVencerData } = useContratosPorVencer(30);
  const { data: afiliacionesData } = useAfiliaciones({ page_size: 200 });

  const porVencer = porVencerData?.results || [];
  const afiliaciones = useMemo(() => afiliacionesData?.results || [], [afiliacionesData]);

  // Calcular metricas de afiliaciones
  const afiliacionStats = useMemo(
    () => ({
      total: afiliaciones.length,
      pendientes: afiliaciones.filter((a) => a.estado === 'pendiente' || a.estado === 'en_proceso')
        .length,
      afiliados: afiliaciones.filter((a) => a.estado === 'afiliado').length,
    }),
    [afiliaciones]
  );

  if (statsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No hay datos disponibles</p>
      </Card>
    );
  }

  const tasaContratacion =
    stats.candidatos_total > 0
      ? Math.round((stats.candidatos_contratados / stats.candidatos_total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Vacantes Abiertas"
          value={stats.vacantes_abiertas}
          icon={Briefcase}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-900/20"
          description={`${stats.vacantes_total} total`}
        />
        <KPICard
          label="Candidatos en Proceso"
          value={stats.candidatos_en_proceso}
          icon={Users}
          color="text-violet-600 dark:text-violet-400"
          bg="bg-violet-50 dark:bg-violet-900/20"
          description={`${stats.candidatos_total} total`}
        />
        <KPICard
          label="Contratados"
          value={stats.candidatos_contratados}
          icon={UserCheck}
          color="text-green-600 dark:text-green-400"
          bg="bg-green-50 dark:bg-green-900/20"
          description={`Tasa: ${tasaContratacion}%`}
        />
        <KPICard
          label="Tiempo Promedio"
          value={`${stats.tiempo_promedio_contratacion}d`}
          icon={Clock}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-50 dark:bg-amber-900/20"
          description="Dias para contratar"
        />
      </div>

      {/* Fila 2: Pipeline + Entrevistas/Pruebas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline de candidatos */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            <Target size={16} />
            Pipeline de Candidatos
          </h3>
          <div className="space-y-3">
            <ProgressBar
              label="En proceso (postulado/preseleccionado/en evaluacion)"
              value={stats.candidatos_en_proceso}
              total={stats.candidatos_total}
              color="bg-blue-500"
            />
            <ProgressBar
              label="Aprobados"
              value={stats.candidatos_aprobados}
              total={stats.candidatos_total}
              color="bg-green-500"
            />
            <ProgressBar
              label="Contratados"
              value={stats.candidatos_contratados}
              total={stats.candidatos_total}
              color="bg-emerald-500"
            />
            <ProgressBar
              label="Rechazados"
              value={stats.candidatos_rechazados}
              total={stats.candidatos_total}
              color="bg-red-400"
            />
          </div>
        </Card>

        {/* Actividad: Entrevistas y Pruebas */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            <ClipboardCheck size={16} />
            Actividad de Evaluacion
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <MessageSquare size={20} className="mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.entrevistas_programadas}
              </p>
              <p className="text-[10px] text-gray-500">Entrevistas programadas</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <CheckCircle size={20} className="mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.entrevistas_realizadas}
              </p>
              <p className="text-[10px] text-gray-500">Entrevistas realizadas</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <Hourglass size={20} className="mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.pruebas_pendientes}
              </p>
              <p className="text-[10px] text-gray-500">Pruebas pendientes</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <Shield size={20} className="mx-auto text-violet-500 mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {afiliacionStats.afiliados}
              </p>
              <p className="text-[10px] text-gray-500">Afiliaciones completadas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fila 3: Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contratos por vencer */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            Contratos por Vencer (30 dias)
            {porVencer.length > 0 && <Badge variant="warning">{porVencer.length}</Badge>}
          </h3>
          {porVencer.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">
              No hay contratos por vencer en los proximos 30 dias
            </p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {porVencer.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 text-xs"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {c.colaborador_nombre}
                    </p>
                    <p className="text-gray-500">
                      {c.numero_contrato} - {c.tipo_contrato_nombre}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">
                      {c.dias_para_vencer != null ? `${c.dias_para_vencer}d` : '-'}
                    </p>
                    {c.fecha_fin && (
                      <p className="text-gray-400">
                        {new Date(c.fecha_fin).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Afiliaciones pendientes */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
            <Shield size={16} className="text-blue-500" />
            Resumen de Afiliaciones SS
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {afiliacionStats.total}
              </p>
              <p className="text-[10px] text-gray-500">Total</p>
            </div>
            <div className="text-center py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <p className="text-xl font-bold text-amber-600">{afiliacionStats.pendientes}</p>
              <p className="text-[10px] text-gray-500">Pendientes</p>
            </div>
            <div className="text-center py-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-xl font-bold text-green-600">{afiliacionStats.afiliados}</p>
              <p className="text-[10px] text-gray-500">Afiliados</p>
            </div>
          </div>
          {afiliacionStats.pendientes > 0 && (
            <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
              <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle size={10} />
                {afiliacionStats.pendientes} afiliacion{afiliacionStats.pendientes > 1 ? 'es' : ''}{' '}
                pendiente{afiliacionStats.pendientes > 1 ? 's' : ''} de completar
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
