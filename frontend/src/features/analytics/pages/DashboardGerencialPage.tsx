/**
 * Página: Dashboard Gerencial - Balanced Scorecard
 *
 * Dashboard gerencial con 5 perspectivas BSC:
 * - General (consolidado)
 * - Financiera
 * - Cliente
 * - Procesos Internos
 * - Aprendizaje y Crecimiento
 *
 * Datos reales desde useKPISummaryByPerspectiva
 */
import { useState } from 'react';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Cog,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import { useKPISummaryByPerspectiva } from '../hooks/useAnalytics';

// ==================== UTILITY FUNCTIONS ====================

const getSemaforoColor = (color: string) => {
  const colors: Record<string, string> = {
    verde: 'bg-green-500',
    amarillo: 'bg-yellow-500',
    rojo: 'bg-red-500',
  };
  return colors[color] || 'bg-gray-500';
};

const getTendenciaIcon = (tendencia: string) => {
  if (tendencia === 'ascendente') return <ArrowUpRight className="w-4 h-4" />;
  if (tendencia === 'descendente') return <ArrowDownRight className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
};

const getTendenciaColor = (tendencia: string, variacion: number) => {
  if (tendencia === 'ascendente' && variacion > 0) return 'text-green-600';
  if (tendencia === 'descendente' && variacion < 0) return 'text-red-600';
  return 'text-gray-600';
};

// ==================== COMPONENTS ====================

const KPICard = ({ kpi }: { kpi: Record<string, unknown> }) => {
  const kpiData = kpi.kpi || kpi;
  const valor = kpi.ultimo_valor?.valor_numerico ?? kpi.valor ?? 0;
  const meta = kpi.meta_actual?.meta_esperada ?? kpi.meta ?? 0;
  const unidad = kpiData.unidad_medida || kpi.unidad || '';
  const semaforo = kpi.ultimo_valor?.color_semaforo || kpi.semaforo || 'verde';
  const tendencia = kpi.tendencia || 'estable';
  const variacion = kpi.porcentaje_cambio ?? kpi.variacion ?? 0;
  const cumpleMeta = meta > 0 ? valor >= meta : true;
  const porcentajeCumplimiento = meta > 0 ? (valor / meta) * 100 : 0;

  return (
    <Card variant="bordered" padding="md">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn('w-3 h-3 rounded-full', getSemaforoColor(semaforo))}
              />
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {kpiData.nombre || kpi.nombre}
              </h4>
            </div>
          </div>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
              getTendenciaColor(tendencia, variacion),
              variacion > 0
                ? 'bg-green-100'
                : variacion < 0
                ? 'bg-red-100'
                : 'bg-gray-100'
            )}
          >
            {getTendenciaIcon(tendencia)}
            <span>{Math.abs(variacion).toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof valor === 'number' ? valor.toLocaleString() : valor}
              <span className="text-sm font-normal text-gray-500 ml-1">
                {unidad}
              </span>
            </p>
            {meta > 0 && (
              <p className="text-xs text-gray-500">
                Meta: {meta} {unidad}
              </p>
            )}
          </div>
          {meta > 0 && (
            <Badge
              variant={cumpleMeta ? 'success' : 'warning'}
              size="sm"
            >
              {porcentajeCumplimiento.toFixed(0)}%
            </Badge>
          )}
        </div>

        {meta > 0 && (
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', getSemaforoColor(semaforo))}
              style={{
                width: `${Math.min(porcentajeCumplimiento, 100)}%`,
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

const PerspectivaSection = ({ kpis }: { kpis: unknown[] }) => {
  const kpisVerde = kpis.filter((k) => {
    const s = k.ultimo_valor?.color_semaforo || k.semaforo;
    return s === 'verde';
  }).length;
  const kpisAmarillo = kpis.filter((k) => {
    const s = k.ultimo_valor?.color_semaforo || k.semaforo;
    return s === 'amarillo';
  }).length;
  const kpisRojo = kpis.filter((k) => {
    const s = k.ultimo_valor?.color_semaforo || k.semaforo;
    return s === 'rojo';
  }).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Verde</p>
              <p className="text-xl font-bold text-green-600">{kpisVerde}</p>
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Minus className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Amarillo</p>
              <p className="text-xl font-bold text-yellow-600">{kpisAmarillo}</p>
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Rojo</p>
              <p className="text-xl font-bold text-red-600">{kpisRojo}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi: unknown) => (
          <KPICard key={kpi.id || kpi.kpi?.id} kpi={kpi} />
        ))}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function DashboardGerencialPage() {
  const [activeTab, setActiveTab] = useState('general');

  const { data: kpisData, isLoading, refetch, isFetching } =
    useKPISummaryByPerspectiva(activeTab);

  const kpis = Array.isArray(kpisData) ? kpisData : [];

  const tabs = [
    { id: 'general', label: 'General', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'financiera', label: 'Financiera', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'cliente', label: 'Cliente', icon: <Users className="w-4 h-4" /> },
    { id: 'procesos', label: 'Procesos', icon: <Cog className="w-4 h-4" /> },
    { id: 'aprendizaje', label: 'Aprendizaje', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  const getTitulo = () => {
    const titulos: Record<string, string> = {
      general: 'Vista General - Balanced Scorecard',
      financiera: 'Perspectiva Financiera',
      cliente: 'Perspectiva del Cliente',
      procesos: 'Perspectiva de Procesos Internos',
      aprendizaje: 'Perspectiva de Aprendizaje y Crecimiento',
    };
    return titulos[activeTab] || 'Dashboard';
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Gerencial - BSC"
        description="Balanced Scorecard con indicadores por perspectiva estratégica"
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Actualizar
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {getTitulo()}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Spinner size="lg" />
          </div>
        ) : kpis.length === 0 ? (
          <EmptyState
            icon={<LayoutDashboard className="w-12 h-12" />}
            title="Sin indicadores en esta perspectiva"
            description="Configure KPIs y asígnelos a la perspectiva BSC correspondiente"
          />
        ) : (
          <PerspectivaSection kpis={kpis} />
        )}
      </div>
    </div>
  );
}
