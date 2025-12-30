/**
 * Página: Analytics Dashboard Principal
 *
 * Dashboard principal de Business Intelligence con:
 * - KPIs resumen
 * - Últimos valores de indicadores principales
 * - Alertas pendientes
 * - Acciones rápidas
 */
import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Settings,
  FileText,
  LayoutDashboard,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import { useNavigate } from 'react-router-dom';

// ==================== MOCK DATA ====================

const mockStats = {
  total_kpis: 48,
  kpis_activos: 45,
  kpis_verde: 32,
  kpis_amarillo: 9,
  kpis_rojo: 4,
  alertas_pendientes: 7,
  acciones_pendientes: 12,
  mediciones_mes: 156,
};

const mockKPISummary = [
  {
    id: 1,
    codigo: 'KPI-SST-001',
    nombre: 'Índice de Frecuencia de Accidentalidad',
    categoria: 'sst',
    ultimo_valor: 2.3,
    meta: 2.5,
    unidad: 'IF',
    color_semaforo: 'verde',
    tendencia: 'descendente',
    variacion: -12.5,
  },
  {
    id: 2,
    codigo: 'KPI-FIN-001',
    nombre: 'EBITDA Mensual',
    categoria: 'financiero',
    ultimo_valor: 18.5,
    meta: 15.0,
    unidad: '%',
    color_semaforo: 'verde',
    tendencia: 'ascendente',
    variacion: 23.4,
  },
  {
    id: 3,
    codigo: 'KPI-OP-001',
    nombre: 'Eficiencia Operacional',
    categoria: 'operacional',
    ultimo_valor: 82.0,
    meta: 85.0,
    unidad: '%',
    color_semaforo: 'amarillo',
    tendencia: 'estable',
    variacion: 0.5,
  },
  {
    id: 4,
    codigo: 'KPI-COM-001',
    nombre: 'Satisfacción del Cliente',
    categoria: 'comercial',
    ultimo_valor: 4.2,
    meta: 4.5,
    unidad: '/5',
    color_semaforo: 'amarillo',
    tendencia: 'descendente',
    variacion: -5.2,
  },
  {
    id: 5,
    codigo: 'KPI-PESV-001',
    nombre: 'Cumplimiento Inspección Preoperacional',
    categoria: 'pesv',
    ultimo_valor: 68.0,
    meta: 90.0,
    unidad: '%',
    color_semaforo: 'rojo',
    tendencia: 'descendente',
    variacion: -8.1,
  },
  {
    id: 6,
    codigo: 'KPI-CAL-001',
    nombre: 'No Conformidades Proceso',
    categoria: 'calidad',
    ultimo_valor: 12.0,
    meta: 8.0,
    unidad: 'NC',
    color_semaforo: 'rojo',
    tendencia: 'ascendente',
    variacion: 33.3,
  },
];

const mockAlertas = [
  {
    id: 1,
    kpi_nombre: 'Cumplimiento Inspección Preoperacional',
    tipo: 'umbral_rojo',
    descripcion: 'El indicador ha caído al 68%, por debajo del umbral mínimo de 80%',
    severidad: 'alta',
    fecha: '2024-12-28',
  },
  {
    id: 2,
    kpi_nombre: 'No Conformidades Proceso',
    tipo: 'tendencia_negativa',
    descripcion: 'Se ha detectado un incremento del 33% en las no conformidades',
    severidad: 'alta',
    fecha: '2024-12-27',
  },
  {
    id: 3,
    kpi_nombre: 'Rotación de Personal',
    tipo: 'meta_no_cumplida',
    descripcion: 'No se cumplió la meta del periodo trimestral',
    severidad: 'media',
    fecha: '2024-12-26',
  },
];

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

const getCategoriaColor = (categoria: string) => {
  const colors = {
    sst: 'bg-orange-100 text-orange-800',
    pesv: 'bg-blue-100 text-blue-800',
    ambiental: 'bg-green-100 text-green-800',
    calidad: 'bg-purple-100 text-purple-800',
    financiero: 'bg-indigo-100 text-indigo-800',
    operacional: 'bg-cyan-100 text-cyan-800',
    rrhh: 'bg-pink-100 text-pink-800',
    comercial: 'bg-teal-100 text-teal-800',
  };
  return colors[categoria as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// ==================== MAIN COMPONENT ====================

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const stats = mockStats;
  const kpiSummary = mockKPISummary;
  const alertas = mockAlertas;

  const porcentajeVerde = (stats.kpis_verde / stats.kpis_activos) * 100;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics - Business Intelligence"
        description="Panel de control de indicadores clave de rendimiento y business intelligence"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Settings className="w-4 h-4" />}
              onClick={() => navigate('/analytics/configuracion')}
            >
              Configurar KPIs
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LayoutDashboard className="w-4 h-4" />}
              onClick={() => navigate('/analytics/dashboards')}
            >
              Dashboards
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PieChart className="w-4 h-4" />}
              onClick={() => navigate('/analytics/indicadores')}
            >
              Ver Indicadores
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total KPIs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total_kpis}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.kpis_activos} activos
              </p>
            </div>
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">KPIs en Verde</p>
              <p className="text-3xl font-bold text-success-600 mt-1">
                {stats.kpis_verde}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {porcentajeVerde.toFixed(0)}% del total
              </p>
            </div>
            <div className="w-14 h-14 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">KPIs en Rojo</p>
              <p className="text-3xl font-bold text-danger-600 mt-1">
                {stats.kpis_rojo}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Requieren atención
              </p>
            </div>
            <div className="w-14 h-14 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-7 h-7 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alertas Pendientes</p>
              <p className="text-3xl font-bold text-warning-600 mt-1">
                {stats.alertas_pendientes}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.acciones_pendientes} acciones abiertas
              </p>
            </div>
            <div className="w-14 h-14 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-warning-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPIs Principales */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Indicadores Principales
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/analytics/indicadores')}
            >
              Ver todos
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kpiSummary.map((kpi) => (
              <Card key={kpi.id} variant="bordered" padding="md">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full',
                            getSemaforoColor(kpi.color_semaforo)
                          )}
                        />
                        <Badge
                          variant="gray"
                          size="sm"
                          className={getCategoriaColor(kpi.categoria)}
                        >
                          {kpi.categoria.toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {kpi.nombre}
                      </h4>
                      <p className="text-xs text-gray-500">{kpi.codigo}</p>
                    </div>
                  </div>

                  {/* Valor y Meta */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {kpi.ultimo_valor}
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          {kpi.unidad}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Meta: {kpi.meta} {kpi.unidad}
                      </p>
                    </div>

                    {/* Tendencia */}
                    <div
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                        kpi.variacion > 0
                          ? 'bg-green-100 text-green-700'
                          : kpi.variacion < 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {getTendenciaIcon(kpi.tendencia)}
                      <span>{Math.abs(kpi.variacion).toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        getSemaforoColor(kpi.color_semaforo)
                      )}
                      style={{
                        width: `${Math.min((kpi.ultimo_valor / kpi.meta) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Alertas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Alertas Recientes
            </h3>
            <Badge variant="danger" size="sm">
              {alertas.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {alertas.map((alerta) => (
              <Card key={alerta.id} variant="bordered" padding="sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      className={cn(
                        'w-5 h-5 flex-shrink-0 mt-0.5',
                        alerta.severidad === 'alta'
                          ? 'text-red-600'
                          : alerta.severidad === 'media'
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {alerta.kpi_nombre}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {alerta.descripcion}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={
                            alerta.severidad === 'alta'
                              ? 'danger'
                              : alerta.severidad === 'media'
                              ? 'warning'
                              : 'info'
                          }
                          size="sm"
                        >
                          {alerta.severidad}
                        </Badge>
                        <span className="text-xs text-gray-500">{alerta.fecha}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-full">
            Ver todas las alertas
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card variant="bordered" padding="md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Settings className="w-5 h-5" />}
            onClick={() => navigate('/analytics/configuracion')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Configurar KPIs</div>
              <div className="text-xs text-gray-500">Catálogo, metas, semáforos</div>
            </div>
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<Activity className="w-5 h-5" />}
            onClick={() => navigate('/analytics/indicadores')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Registrar Valores</div>
              <div className="text-xs text-gray-500">Mediciones de KPIs</div>
            </div>
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<LayoutDashboard className="w-5 h-5" />}
            onClick={() => navigate('/analytics/dashboards')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Dashboards BSC</div>
              <div className="text-xs text-gray-500">4 perspectivas</div>
            </div>
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<FileText className="w-5 h-5" />}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Exportar Reportes</div>
              <div className="text-xs text-gray-500">Excel, PDF</div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}
