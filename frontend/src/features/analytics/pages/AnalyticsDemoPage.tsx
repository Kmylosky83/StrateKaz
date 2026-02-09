/**
 * AnalyticsDemoPage - Demostración de Componentes Analytics Enterprise
 * Página showcase con todos los componentes de visualización avanzada
 *
 * Sistema de Gestión StrateKaz - Analytics Enterprise Edition
 */
import { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, Badge } from '@/components/common';
import { Tabs } from '@/components/common/Tabs';
import {
  BarChart3,
  Radar,
  TrendingUp,
  Calendar,
  GitBranch,
  Gauge,
  Grid3x3,
  Sparkles,
} from 'lucide-react';

import {
  BSCRadarChart,
  KPITrendPrediction,
  KPIHeatmapCalendar,
  KPICorrelationMatrix,
  KPISankeyFlow,
  KPIGaugeAdvanced,
  generateSankeyFromBSC,
} from '../components';

import type { BSCPerspectiveData } from '../components/charts/BSCRadarChart';
import type { KPITrendData } from '../components/charts/KPITrendPrediction';
import type { DailyKPIValue } from '../components/charts/KPIHeatmapCalendar';
import type { KPIDataSeries } from '../components/charts/KPICorrelationMatrix';
import type { KPIGaugeData } from '../components/charts/KPIGaugeAdvanced';

// ==================== DATOS DE DEMOSTRACIÓN ====================

// Datos para BSC Radar
const bscData: BSCPerspectiveData[] = [
  {
    perspective: 'FINANCIERA',
    label: 'Financiera',
    currentValue: 85,
    targetValue: 90,
    previousValue: 78,
    projectedValue: 92,
    kpiCount: 8,
    kpisInGreen: 5,
    kpisInYellow: 2,
    kpisInRed: 1,
  },
  {
    perspective: 'CLIENTES',
    label: 'Clientes',
    currentValue: 72,
    targetValue: 85,
    previousValue: 68,
    projectedValue: 78,
    kpiCount: 6,
    kpisInGreen: 3,
    kpisInYellow: 2,
    kpisInRed: 1,
  },
  {
    perspective: 'PROCESOS',
    label: 'Procesos',
    currentValue: 88,
    targetValue: 90,
    previousValue: 82,
    projectedValue: 91,
    kpiCount: 10,
    kpisInGreen: 7,
    kpisInYellow: 2,
    kpisInRed: 1,
  },
  {
    perspective: 'APRENDIZAJE',
    label: 'Aprendizaje',
    currentValue: 65,
    targetValue: 80,
    previousValue: 60,
    projectedValue: 72,
    kpiCount: 5,
    kpisInGreen: 2,
    kpisInYellow: 2,
    kpisInRed: 1,
  },
];

// Datos para Tendencias con Predicción
const trendKPIData: KPITrendData = {
  id: 1,
  name: 'Índice de Satisfacción del Cliente (NPS)',
  unit: '%',
  targetValue: 85,
  warningThreshold: 70,
  criticalThreshold: 50,
  trendType: 'MAYOR_MEJOR',
  measurements: [
    { period: 'Ene', value: 62, date: '2024-01-31' },
    { period: 'Feb', value: 65, date: '2024-02-29' },
    { period: 'Mar', value: 68, date: '2024-03-31' },
    { period: 'Abr', value: 64, date: '2024-04-30' },
    { period: 'May', value: 72, date: '2024-05-31' },
    { period: 'Jun', value: 75, date: '2024-06-30' },
    { period: 'Jul', value: 73, date: '2024-07-31' },
    { period: 'Ago', value: 78, date: '2024-08-31' },
    { period: 'Sep', value: 80, date: '2024-09-30' },
    { period: 'Oct', value: 82, date: '2024-10-31' },
    { period: 'Nov', value: 79, date: '2024-11-30' },
    { period: 'Dic', value: 84, date: '2024-12-31' },
  ],
};

// Datos para Heatmap Calendar
const generateHeatmapData = (): DailyKPIValue[] => {
  const data: DailyKPIValue[] = [];
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date(2024, 11, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Generar valores con patrones realistas
    const dayOfWeek = d.getDay();
    const month = d.getMonth();

    // Menos actividad los fines de semana
    const baseValue = dayOfWeek === 0 || dayOfWeek === 6 ? 20 : 60;

    // Más actividad en ciertos meses
    const monthMultiplier = [0.8, 0.9, 1.0, 1.1, 1.2, 1.0, 0.7, 0.8, 1.1, 1.2, 1.3, 0.9][month];

    // Agregar variabilidad
    const randomFactor = 0.5 + Math.random();

    const value = Math.round(baseValue * monthMultiplier * randomFactor);

    data.push({
      date: d.toISOString().split('T')[0],
      value: Math.min(100, Math.max(0, value)),
    });
  }

  return data;
};

const heatmapData = generateHeatmapData();

// Datos para Matriz de Correlaciones
const correlationKPIs: KPIDataSeries[] = [
  {
    id: 1,
    name: 'Satisfacción Cliente',
    shortName: 'NPS',
    perspective: 'CLIENTES',
    values: [62, 65, 68, 64, 72, 75, 73, 78, 80, 82, 79, 84],
  },
  {
    id: 2,
    name: 'Ingresos Mensuales',
    shortName: 'Ingresos',
    perspective: 'FINANCIERA',
    values: [100, 105, 108, 102, 115, 120, 118, 125, 130, 135, 128, 140],
  },
  {
    id: 3,
    name: 'Tiempo de Respuesta',
    shortName: 'T. Resp',
    perspective: 'PROCESOS',
    values: [48, 45, 42, 44, 38, 35, 36, 32, 30, 28, 31, 25],
  },
  {
    id: 4,
    name: 'Capacitación',
    shortName: 'Capacit.',
    perspective: 'APRENDIZAJE',
    values: [70, 72, 75, 73, 78, 82, 80, 85, 88, 90, 87, 92],
  },
  {
    id: 5,
    name: 'Retención Clientes',
    shortName: 'Retención',
    perspective: 'CLIENTES',
    values: [85, 86, 87, 85, 88, 90, 89, 91, 92, 93, 91, 94],
  },
  {
    id: 6,
    name: 'Costos Operativos',
    shortName: 'Costos',
    perspective: 'FINANCIERA',
    values: [50, 48, 47, 49, 45, 42, 43, 40, 38, 36, 39, 35],
  },
  {
    id: 7,
    name: 'Eficiencia Procesos',
    shortName: 'Eficiencia',
    perspective: 'PROCESOS',
    values: [75, 77, 80, 78, 82, 85, 84, 88, 90, 92, 89, 95],
  },
  {
    id: 8,
    name: 'Innovación',
    shortName: 'Innovación',
    perspective: 'APRENDIZAJE',
    values: [60, 62, 65, 63, 68, 72, 70, 75, 78, 80, 77, 82],
  },
];

// Datos para Sankey Flow
const bscStructure = {
  perspectives: [
    {
      id: 'financiera',
      name: 'Perspectiva Financiera',
      objectives: [
        {
          id: 'obj1',
          name: 'Aumentar Rentabilidad',
          kpis: [
            { id: 'kpi1', name: 'EBITDA', value: 85 },
            { id: 'kpi2', name: 'ROE', value: 72 },
            { id: 'kpi3', name: 'Margen Neto', value: 68 },
          ],
        },
        {
          id: 'obj2',
          name: 'Optimizar Costos',
          kpis: [
            { id: 'kpi4', name: 'Reducción Costos', value: 90 },
            { id: 'kpi5', name: 'Eficiencia Gasto', value: 78 },
          ],
        },
      ],
    },
    {
      id: 'clientes',
      name: 'Perspectiva Clientes',
      objectives: [
        {
          id: 'obj3',
          name: 'Mejorar Satisfacción',
          kpis: [
            { id: 'kpi6', name: 'NPS', value: 82 },
            { id: 'kpi7', name: 'Retención', value: 88 },
          ],
        },
        {
          id: 'obj4',
          name: 'Expandir Mercado',
          kpis: [
            { id: 'kpi8', name: 'Nuevos Clientes', value: 65 },
            { id: 'kpi9', name: 'Cuota Mercado', value: 55 },
          ],
        },
      ],
    },
    {
      id: 'procesos',
      name: 'Perspectiva Procesos',
      objectives: [
        {
          id: 'obj5',
          name: 'Excelencia Operacional',
          kpis: [
            { id: 'kpi10', name: 'Eficiencia', value: 92 },
            { id: 'kpi11', name: 'Calidad', value: 95 },
            { id: 'kpi12', name: 'Tiempo Ciclo', value: 85 },
          ],
        },
      ],
    },
    {
      id: 'aprendizaje',
      name: 'Perspectiva Aprendizaje',
      objectives: [
        {
          id: 'obj6',
          name: 'Desarrollo Talento',
          kpis: [
            { id: 'kpi13', name: 'Capacitación', value: 88 },
            { id: 'kpi14', name: 'Clima Laboral', value: 75 },
          ],
        },
      ],
    },
  ],
};

const { nodes: sankeyNodes, links: sankeyLinks } = generateSankeyFromBSC(bscStructure);

// Datos para Gauges Avanzados
const gaugeKPIs: KPIGaugeData[] = [
  {
    id: 1,
    name: 'EBITDA',
    unit: '%',
    currentValue: 18.5,
    targetValue: 15,
    warningThreshold: 10,
    criticalThreshold: 5,
    trendType: 'MAYOR_MEJOR',
    historicalValues: [12, 13, 14, 15, 16, 17, 18, 18.5],
    projectedValue: 20,
    lastPeriodValue: 17,
  },
  {
    id: 2,
    name: 'NPS Score',
    unit: 'pts',
    currentValue: 72,
    targetValue: 80,
    warningThreshold: 60,
    criticalThreshold: 40,
    trendType: 'MAYOR_MEJOR',
    historicalValues: [55, 58, 62, 65, 68, 70, 72],
    projectedValue: 78,
    lastPeriodValue: 70,
  },
  {
    id: 3,
    name: 'Tiempo Respuesta',
    unit: 'hrs',
    currentValue: 2.5,
    targetValue: 2,
    maxValue: 8,
    warningThreshold: 4,
    criticalThreshold: 6,
    trendType: 'MENOR_MEJOR',
    historicalValues: [5, 4.5, 4, 3.5, 3, 2.8, 2.5],
    projectedValue: 2.2,
    lastPeriodValue: 2.8,
  },
  {
    id: 4,
    name: 'Eficiencia',
    unit: '%',
    currentValue: 88,
    targetValue: 90,
    warningThreshold: 75,
    criticalThreshold: 60,
    trendType: 'MAYOR_MEJOR',
    historicalValues: [78, 80, 82, 84, 85, 86, 88],
    projectedValue: 91,
    lastPeriodValue: 86,
  },
];

// ==================== COMPONENTE PRINCIPAL ====================

export default function AnalyticsDemoPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Vista General', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'bsc', label: 'BSC Radar', icon: <Radar className="w-4 h-4" /> },
    { id: 'trends', label: 'Tendencias', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'heatmap', label: 'Calendario', icon: <Calendar className="w-4 h-4" /> },
    { id: 'correlations', label: 'Correlaciones', icon: <Grid3x3 className="w-4 h-4" /> },
    { id: 'sankey', label: 'Flujo BSC', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'gauges', label: 'Gauges', icon: <Gauge className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics Enterprise Demo"
        description="Demostración de componentes avanzados de visualización para Inteligencia de Negocios"
        actions={
          <Badge variant="info" size="lg">
            <Sparkles className="w-4 h-4 mr-1" />
            Powered by ECharts + Simple Statistics
          </Badge>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {/* Vista General */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gaugeKPIs.map((kpi) => (
                <KPIGaugeAdvanced key={kpi.id} kpi={kpi} size="sm" showPrediction showTrend />
              ))}
            </div>

            {/* BSC Radar + Tendencias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BSCRadarChart
                data={bscData}
                title="Balanced Scorecard"
                showProjection
                showPrevious
                height={400}
              />
              <KPITrendPrediction kpi={trendKPIData} projectionPeriods={3} height={350} />
            </div>

            {/* Heatmap */}
            <KPIHeatmapCalendar
              data={heatmapData}
              year={2024}
              title="Actividad de Mediciones 2024"
              colorScheme="green"
              valueLabel="Mediciones"
              unit="registros"
              height={180}
            />
          </div>
        )}

        {/* BSC Radar */}
        {activeTab === 'bsc' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Balanced Scorecard - Vista Completa</h3>
              <p className="text-sm text-gray-500 mb-6">
                Visualización de las 4 perspectivas del BSC con comparación de valores actuales,
                metas, período anterior y proyecciones.
              </p>
              <BSCRadarChart
                data={bscData}
                title="Perspectivas del Balanced Scorecard"
                showProjection
                showPrevious
                showLegend
                height={500}
                onPerspectiveClick={() => {}}
              />
            </Card>
          </div>
        )}

        {/* Tendencias */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Análisis de Tendencias con Predicción</h3>
              <p className="text-sm text-gray-500 mb-6">
                Regresión lineal y polinomial para proyectar valores futuros. El R² indica qué tan
                bien se ajusta el modelo a los datos históricos.
              </p>
              <KPITrendPrediction
                kpi={trendKPIData}
                regressionType="linear"
                projectionPeriods={6}
                showConfidenceInterval
                showAnnotations
                height={500}
              />
            </Card>

            {/* Segundo KPI de ejemplo */}
            <Card className="p-6">
              <KPITrendPrediction
                kpi={{
                  ...trendKPIData,
                  id: 2,
                  name: 'Eficiencia Operacional',
                  trendType: 'MAYOR_MEJOR',
                  targetValue: 95,
                  warningThreshold: 80,
                  criticalThreshold: 70,
                  measurements: [
                    { period: 'Ene', value: 75, date: '2024-01-31' },
                    { period: 'Feb', value: 78, date: '2024-02-29' },
                    { period: 'Mar', value: 80, date: '2024-03-31' },
                    { period: 'Abr', value: 79, date: '2024-04-30' },
                    { period: 'May', value: 82, date: '2024-05-31' },
                    { period: 'Jun', value: 85, date: '2024-06-30' },
                    { period: 'Jul', value: 84, date: '2024-07-31' },
                    { period: 'Ago', value: 87, date: '2024-08-31' },
                    { period: 'Sep', value: 88, date: '2024-09-30' },
                    { period: 'Oct', value: 90, date: '2024-10-31' },
                    { period: 'Nov', value: 89, date: '2024-11-30' },
                    { period: 'Dic', value: 91, date: '2024-12-31' },
                  ],
                }}
                projectionPeriods={4}
                height={450}
              />
            </Card>
          </div>
        )}

        {/* Heatmap Calendar */}
        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Mapa de Calor - Actividad Anual</h3>
              <p className="text-sm text-gray-500 mb-6">
                Visualización tipo GitHub de la actividad de mediciones durante el año. Los colores
                más intensos indican mayor actividad.
              </p>
            </Card>

            {/* Diferentes esquemas de color */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <KPIHeatmapCalendar
                data={heatmapData}
                year={2024}
                title="Esquema Verde (Default)"
                colorScheme="green"
                valueLabel="Actividad"
                height={180}
              />
              <KPIHeatmapCalendar
                data={heatmapData}
                year={2024}
                title="Esquema Azul"
                colorScheme="blue"
                valueLabel="Actividad"
                height={180}
              />
              <KPIHeatmapCalendar
                data={heatmapData}
                year={2024}
                title="Esquema Púrpura"
                colorScheme="purple"
                valueLabel="Actividad"
                height={180}
              />
              <KPIHeatmapCalendar
                data={heatmapData}
                year={2024}
                title="Esquema Semáforo"
                colorScheme="semaforo"
                valueLabel="Cumplimiento"
                unit="%"
                height={180}
              />
            </div>
          </div>
        )}

        {/* Correlaciones */}
        {activeTab === 'correlations' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Matriz de Correlaciones entre KPIs</h3>
              <p className="text-sm text-gray-500 mb-6">
                Análisis estadístico de relaciones entre indicadores usando el coeficiente de
                correlación de Pearson. Valores cercanos a +1 o -1 indican relaciones fuertes.
              </p>
              <KPICorrelationMatrix
                kpis={correlationKPIs}
                title="Correlación entre Indicadores Clave"
                showValues
                threshold={0.1}
                height={550}
                onCellClick={() => {}}
              />
            </Card>
          </div>
        )}

        {/* Sankey Flow */}
        {activeTab === 'sankey' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Flujo Estratégico BSC</h3>
              <p className="text-sm text-gray-500 mb-6">
                Diagrama Sankey que visualiza las relaciones causa-efecto entre perspectivas,
                objetivos estratégicos y KPIs. El grosor de las líneas representa la fuerza de la
                relación.
              </p>
              <KPISankeyFlow
                nodes={sankeyNodes}
                links={sankeyLinks}
                title="Mapa de Relaciones Estratégicas"
                orientation="horizontal"
                height={600}
                onNodeClick={() => {}}
              />
            </Card>
          </div>
        )}

        {/* Gauges */}
        {activeTab === 'gauges' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Velocímetros Avanzados</h3>
              <p className="text-sm text-gray-500 mb-6">
                Gauges enterprise con múltiples capas de información: valor actual, meta, tendencia,
                predicción y progreso hacia el objetivo.
              </p>
            </Card>

            {/* Grid de Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {gaugeKPIs.map((kpi) => (
                <KPIGaugeAdvanced
                  key={kpi.id}
                  kpi={kpi}
                  size="md"
                  showPrediction
                  showTrend
                  showProgress
                  animated
                />
              ))}
            </div>

            {/* Gauges grandes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <KPIGaugeAdvanced
                kpi={gaugeKPIs[0]}
                size="lg"
                showPrediction
                showTrend
                showProgress
              />
              <KPIGaugeAdvanced
                kpi={gaugeKPIs[1]}
                size="lg"
                showPrediction
                showTrend
                showProgress
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer con info técnica */}
      <Card className="p-6 bg-gray-50 dark:bg-gray-800">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Información Técnica</h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-900 dark:text-white">Librerías de Visualización:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Apache ECharts v6.0</li>
              <li>• echarts-for-react v3.0</li>
              <li>• echarts-stat v1.2</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">Análisis Estadístico:</strong>
            <ul className="mt-1 space-y-1">
              <li>• simple-statistics v7.8</li>
              <li>• Regresión lineal/polinomial</li>
              <li>• Correlación de Pearson</li>
            </ul>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">Características:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Análisis predictivo</li>
              <li>• Proyecciones con R²</li>
              <li>• Animaciones fluidas</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
