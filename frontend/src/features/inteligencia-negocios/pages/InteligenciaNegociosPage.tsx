/**
 * Pagina principal del Modulo 6 - Inteligencia de Negocios
 *
 * Analisis avanzado y toma de decisiones:
 * - Dashboards ejecutivos
 * - Reportes automatizados
 * - Analytics predictivo
 * - Business Intelligence
 *
 * Usa Design System:
 * - PageHeader para encabezado
 * - StatsGrid para metricas
 * - Card para modulos
 */
import {
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  Database,
  PieChart,
  Activity,
  LineChart,
  Table2
} from 'lucide-react';
import { PageHeader, StatsGrid } from '@/components/layout';
import { Card, Badge } from '@/components/common';
import type { StatItem } from '@/components/layout';
import { Link } from 'react-router-dom';

// Submodulos de Inteligencia de Negocios
const subModulos = [
  {
    id: 'dashboards',
    name: 'Dashboards',
    description: 'KPIs y metricas en tiempo real para toma de decisiones',
    icon: BarChart3,
    href: '/inteligencia/dashboards',
    color: 'purple',
  },
  {
    id: 'reportes',
    name: 'Reportes',
    description: 'Reportes operativos, financieros y de cumplimiento',
    icon: FileSpreadsheet,
    href: '/inteligencia/reportes',
    color: 'blue',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Analisis de tendencias y modelos predictivos',
    icon: TrendingUp,
    href: '/inteligencia/analytics',
    color: 'green',
  },
  {
    id: 'data-warehouse',
    name: 'Data Warehouse',
    description: 'Cubos OLAP, ETL y almacen de datos historicos',
    icon: Database,
    href: '/inteligencia/data-warehouse',
    color: 'orange',
  },
];

const statsItems: StatItem[] = [
  {
    label: 'KPIs Activos',
    value: '0',
    icon: PieChart,
    iconColor: 'primary',
  },
  {
    label: 'Reportes Generados',
    value: '0',
    icon: FileSpreadsheet,
    iconColor: 'info',
  },
  {
    label: 'Alertas Configuradas',
    value: '0',
    icon: Activity,
    iconColor: 'warning',
  },
  {
    label: 'Modelos Predictivos',
    value: '0',
    icon: LineChart,
    iconColor: 'success',
  },
];

export const InteligenciaNegociosPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Inteligencia de Negocios"
        description="Analisis avanzado, reportes y toma de decisiones basada en datos"
        actions={
          <Badge variant="secondary" size="lg">
            Modulo 6
          </Badge>
        }
      />

      {/* Stats */}
      <StatsGrid stats={statsItems} columns={4} macroprocessColor="purple" />

      {/* Submodulos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subModulos.map((modulo) => {
          const Icon = modulo.icon;
          return (
            <Link key={modulo.id} to={modulo.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg bg-${modulo.color}-100 dark:bg-${modulo.color}-900/30`}>
                      <Icon className={`h-6 w-6 text-${modulo.color}-600 dark:text-${modulo.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {modulo.name}
                      </h3>
                      <Badge variant="gray" size="sm">
                        Proximamente
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {modulo.description}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Info Card */}
      <Card>
        <div className="p-6 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-purple-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Decisiones Basadas en Datos
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Este modulo proporcionara herramientas avanzadas de analisis para transformar
            los datos operativos en insights accionables para la alta direccion.
          </p>
        </div>
      </Card>

      {/* Preview de Dashboard */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Vista Previa - Dashboard Ejecutivo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Distribucion por Origen
                </span>
              </div>
              <div className="h-32 flex items-center justify-center text-gray-400">
                <Table2 className="h-12 w-12 opacity-30" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <LineChart className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Tendencia Mensual
                </span>
              </div>
              <div className="h-32 flex items-center justify-center text-gray-400">
                <LineChart className="h-12 w-12 opacity-30" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Comparativo Anual
                </span>
              </div>
              <div className="h-32 flex items-center justify-center text-gray-400">
                <BarChart3 className="h-12 w-12 opacity-30" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InteligenciaNegociosPage;
