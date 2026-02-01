/**
 * Página: Dashboard Gerencial - Balanced Scorecard
 *
 * Dashboard gerencial con 5 perspectivas BSC:
 * - General (consolidado)
 * - Financiera
 * - Cliente
 * - Procesos Internos
 * - Aprendizaje y Crecimiento
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
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockKPIsPorPerspectiva = {
  general: [
    { id: 1, nombre: 'EBITDA', valor: 18.5, meta: 15.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 23.4 },
    { id: 2, nombre: 'Satisfacción Cliente', valor: 4.2, meta: 4.5, unidad: '/5', semaforo: 'amarillo', tendencia: 'descendente', variacion: -5.2 },
    { id: 3, nombre: 'Eficiencia Operacional', valor: 82.0, meta: 85.0, unidad: '%', semaforo: 'amarillo', tendencia: 'estable', variacion: 0.5 },
    { id: 4, nombre: 'Índice de Capacitación', valor: 92.0, meta: 90.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 8.2 },
  ],
  financiera: [
    { id: 5, nombre: 'EBITDA', valor: 18.5, meta: 15.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 23.4 },
    { id: 6, nombre: 'ROE', valor: 22.3, meta: 20.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 11.5 },
    { id: 7, nombre: 'Liquidez Corriente', valor: 1.8, meta: 1.5, unidad: 'ratio', semaforo: 'verde', tendencia: 'ascendente', variacion: 20.0 },
    { id: 8, nombre: 'Margen Bruto', valor: 35.2, meta: 32.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 10.0 },
    { id: 9, nombre: 'Rotación de Cartera', valor: 45.0, meta: 60.0, unidad: 'días', semaforo: 'amarillo', tendencia: 'descendente', variacion: -25.0 },
    { id: 10, nombre: 'Endeudamiento', valor: 42.0, meta: 50.0, unidad: '%', semaforo: 'verde', tendencia: 'descendente', variacion: -16.0 },
  ],
  cliente: [
    { id: 11, nombre: 'Satisfacción del Cliente', valor: 4.2, meta: 4.5, unidad: '/5', semaforo: 'amarillo', tendencia: 'descendente', variacion: -5.2 },
    { id: 12, nombre: 'NPS', valor: 65.0, meta: 70.0, unidad: 'score', semaforo: 'amarillo', tendencia: 'estable', variacion: 0.0 },
    { id: 13, nombre: 'Retención de Clientes', valor: 88.0, meta: 85.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 3.5 },
    { id: 14, nombre: 'Tiempo de Respuesta', valor: 2.5, meta: 3.0, unidad: 'horas', semaforo: 'verde', tendencia: 'descendente', variacion: -16.7 },
    { id: 15, nombre: 'Quejas Resueltas', valor: 92.0, meta: 95.0, unidad: '%', semaforo: 'amarillo', tendencia: 'ascendente', variacion: 2.2 },
  ],
  procesos: [
    { id: 16, nombre: 'Eficiencia Operacional', valor: 82.0, meta: 85.0, unidad: '%', semaforo: 'amarillo', tendencia: 'estable', variacion: 0.5 },
    { id: 17, nombre: 'Índice de Calidad', valor: 96.5, meta: 95.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 1.6 },
    { id: 18, nombre: 'Tiempo de Ciclo', valor: 4.2, meta: 5.0, unidad: 'días', semaforo: 'verde', tendencia: 'descendente', variacion: -16.0 },
    { id: 19, nombre: 'Cumplimiento Preoperacional', valor: 68.0, meta: 90.0, unidad: '%', semaforo: 'rojo', tendencia: 'descendente', variacion: -8.1 },
    { id: 20, nombre: 'Índice de Accidentalidad', valor: 2.3, meta: 2.5, unidad: 'IF', semaforo: 'verde', tendencia: 'descendente', variacion: -12.5 },
    { id: 21, nombre: 'Conformidad ISO', valor: 94.0, meta: 95.0, unidad: '%', semaforo: 'amarillo', tendencia: 'ascendente', variacion: 1.1 },
  ],
  aprendizaje: [
    { id: 22, nombre: 'Índice de Capacitación', valor: 92.0, meta: 90.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 8.2 },
    { id: 23, nombre: 'Satisfacción Laboral', valor: 4.3, meta: 4.0, unidad: '/5', semaforo: 'verde', tendencia: 'ascendente', variacion: 7.5 },
    { id: 24, nombre: 'Rotación de Personal', valor: 8.5, meta: 10.0, unidad: '%', semaforo: 'verde', tendencia: 'descendente', variacion: -15.0 },
    { id: 25, nombre: 'Inversión en Formación', valor: 3.2, meta: 3.0, unidad: '% ventas', semaforo: 'verde', tendencia: 'ascendente', variacion: 6.7 },
    { id: 26, nombre: 'Clima Organizacional', valor: 78.0, meta: 75.0, unidad: '%', semaforo: 'verde', tendencia: 'ascendente', variacion: 4.0 },
  ],
};

// ==================== UTILITY FUNCTIONS ====================

const getSemaforoColor = (color: string) => {
  const colors = {
    verde: 'bg-green-500',
    amarillo: 'bg-yellow-500',
    rojo: 'bg-red-500',
  };
  return colors[color as keyof typeof colors] || 'bg-gray-500';
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

const KPICard = ({ kpi }: { kpi: any }) => {
  const cumpleMeta = kpi.valor >= kpi.meta;
  const porcentajeCumplimiento = (kpi.valor / kpi.meta) * 100;

  return (
    <Card variant="bordered" padding="md">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn('w-3 h-3 rounded-full', getSemaforoColor(kpi.semaforo))}
              />
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {kpi.nombre}
              </h4>
            </div>
          </div>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
              getTendenciaColor(kpi.tendencia, kpi.variacion),
              kpi.variacion > 0
                ? 'bg-green-100'
                : kpi.variacion < 0
                ? 'bg-red-100'
                : 'bg-gray-100'
            )}
          >
            {getTendenciaIcon(kpi.tendencia)}
            <span>{Math.abs(kpi.variacion).toFixed(1)}%</span>
          </div>
        </div>

        {/* Valor y Meta */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {kpi.valor}
              <span className="text-sm font-normal text-gray-500 ml-1">
                {kpi.unidad}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              Meta: {kpi.meta} {kpi.unidad}
            </p>
          </div>
          <Badge
            variant={cumpleMeta ? 'success' : 'warning'}
            size="sm"
          >
            {porcentajeCumplimiento.toFixed(0)}%
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all', getSemaforoColor(kpi.semaforo))}
            style={{
              width: `${Math.min(porcentajeCumplimiento, 100)}%`,
            }}
          />
        </div>
      </div>
    </Card>
  );
};

const PerspectivaSection = ({ titulo, kpis }: { titulo: string; kpis: any[] }) => {
  const kpisVerde = kpis.filter((k) => k.semaforo === 'verde').length;
  const kpisAmarillo = kpis.filter((k) => k.semaforo === 'amarillo').length;
  const kpisRojo = kpis.filter((k) => k.semaforo === 'rojo').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
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

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function DashboardGerencialPage() {
  const [activeTab, setActiveTab] = useState('general');

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
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Actualizar
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {getTitulo()}
        </h2>

        {activeTab === 'general' && (
          <PerspectivaSection
            titulo="Vista General"
            kpis={mockKPIsPorPerspectiva.general}
          />
        )}
        {activeTab === 'financiera' && (
          <PerspectivaSection
            titulo="Perspectiva Financiera"
            kpis={mockKPIsPorPerspectiva.financiera}
          />
        )}
        {activeTab === 'cliente' && (
          <PerspectivaSection
            titulo="Perspectiva del Cliente"
            kpis={mockKPIsPorPerspectiva.cliente}
          />
        )}
        {activeTab === 'procesos' && (
          <PerspectivaSection
            titulo="Perspectiva de Procesos"
            kpis={mockKPIsPorPerspectiva.procesos}
          />
        )}
        {activeTab === 'aprendizaje' && (
          <PerspectivaSection
            titulo="Perspectiva de Aprendizaje"
            kpis={mockKPIsPorPerspectiva.aprendizaje}
          />
        )}
      </div>
    </div>
  );
}
