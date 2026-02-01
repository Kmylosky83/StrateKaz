import { BarChart3, ArrowLeft, TrendingUp, TrendingDown, Clock, Activity, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/layout';

// Mock data for charts
const workflowMetrics = [
  { name: 'Compras', total: 145, completed: 120, pending: 18, overdue: 7, avgTime: '2.3 días' },
  { name: 'Aprobaciones', total: 89, completed: 76, pending: 10, overdue: 3, avgTime: '1.8 días' },
  { name: 'Calidad', total: 67, completed: 58, pending: 7, overdue: 2, avgTime: '3.1 días' },
  { name: 'Proveedores', total: 54, completed: 45, pending: 8, overdue: 1, avgTime: '2.7 días' },
];

const kpis = [
  { label: 'Flujos Activos', value: '24', icon: Activity, color: 'purple', trend: '+12%', trendUp: true },
  { label: 'Tasa de Completitud', value: '94.5%', icon: TrendingUp, color: 'green', trend: '+8%', trendUp: true },
  { label: 'Tiempo Promedio', value: '2.4 días', icon: Clock, color: 'blue', trend: '-15%', trendUp: false },
  { label: 'Cumplimiento SLA', value: '91.2%', icon: BarChart3, color: 'orange', trend: '+5%', trendUp: true },
];

export default function MonitoreoPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Monitoreo y Métricas"
        description="Análisis de rendimiento, tiempos y cumplimiento de SLAs"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 bg-${kpi.color}-100 dark:bg-${kpi.color}-900/30 rounded-lg`}>
                  <Icon className={`h-5 w-5 text-${kpi.color}-600 dark:text-${kpi.color}-400`} />
                </div>
                <div className={`flex items-center text-sm ${kpi.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trendUp ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  <span>{kpi.trend}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{kpi.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Workflow Metrics Table */}
      <Card>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Métricas por Flujo de Trabajo</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Resumen de actividad y rendimiento por tipo de flujo</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Flujo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Total</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Completadas</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Pendientes</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Vencidas</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Tiempo Prom.</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Tasa Éxito</th>
              </tr>
            </thead>
            <tbody>
              {workflowMetrics.map((metric, index) => {
                const successRate = ((metric.completed / metric.total) * 100).toFixed(1);
                return (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{metric.name}</td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{metric.total}</td>
                    <td className="py-3 px-4 text-center text-green-600">{metric.completed}</td>
                    <td className="py-3 px-4 text-center text-blue-600">{metric.pending}</td>
                    <td className="py-3 px-4 text-center text-red-600">{metric.overdue}</td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{metric.avgTime}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-medium ${
                        parseFloat(successRate) >= 90 ? 'text-green-600' :
                        parseFloat(successRate) >= 80 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {successRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SLA Compliance */}
      <Card>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cumplimiento de SLAs</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Análisis de cumplimiento de acuerdos de nivel de servicio</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Dentro de SLA</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas a tiempo</p>
            </div>
            <div className="text-2xl font-bold text-green-600">87%</div>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">En Riesgo</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Próximas a vencer</p>
            </div>
            <div className="text-2xl font-bold text-yellow-600">9%</div>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Fuera de SLA</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
            </div>
            <div className="text-2xl font-bold text-red-600">4%</div>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Métricas y Análisis de Rendimiento
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Dashboard en tiempo real con KPIs principales</li>
                <li>Análisis de tiempos promedio por flujo y paso</li>
                <li>Identificación de cuellos de botella y áreas de mejora</li>
                <li>Seguimiento de cumplimiento de SLAs</li>
                <li>Reportes exportables en PDF y Excel</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
