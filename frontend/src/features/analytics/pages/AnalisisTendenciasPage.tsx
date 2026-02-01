/**
 * Página: Análisis y Tendencias
 *
 * Análisis comparativo de KPIs y detección de tendencias con 3 tabs:
 * - Análisis
 * - Tendencias
 * - Anomalías
 */
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  LineChart,
  Eye,
  Plus,
  Search,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockAnalisis = [
  {
    id: 1,
    kpi_codigo: 'KPI-SST-001',
    kpi_nombre: 'Índice de Frecuencia',
    periodo_analizado: '2024-12',
    tipo_analisis: 'vs_meta',
    valor_actual: 2.8,
    valor_comparacion: 2.5,
    variacion_absoluta: 0.3,
    variacion_porcentual: 12.0,
    direccion: 'deterioro',
    cumple_meta: false,
    interpretacion: 'El IF está por encima de la meta esperada en un 12%',
  },
  {
    id: 2,
    kpi_codigo: 'KPI-FIN-001',
    kpi_nombre: 'EBITDA Mensual',
    periodo_analizado: '2024-12',
    tipo_analisis: 'vs_periodo_anterior',
    valor_actual: 16.5,
    valor_comparacion: 14.2,
    variacion_absoluta: 2.3,
    variacion_porcentual: 16.2,
    direccion: 'mejora',
    cumple_meta: true,
    interpretacion: 'El EBITDA ha mejorado 16.2% respecto al mes anterior',
  },
  {
    id: 3,
    kpi_codigo: 'KPI-OP-001',
    kpi_nombre: 'Eficiencia Operacional',
    periodo_analizado: '2024-12',
    tipo_analisis: 'vs_meta',
    valor_actual: 87.5,
    valor_comparacion: 85.0,
    variacion_absoluta: 2.5,
    variacion_porcentual: 2.9,
    direccion: 'mejora',
    cumple_meta: true,
    interpretacion: 'La eficiencia operacional supera la meta en 2.9%',
  },
];

const mockTendencias = [
  {
    id: 1,
    kpi_codigo: 'KPI-SST-001',
    kpi_nombre: 'Índice de Frecuencia',
    periodo_inicio: '2024-01',
    periodo_fin: '2024-12',
    tipo_tendencia: 'lineal',
    puntos_datos: [
      { periodo: '2024-01', valor: 3.2 },
      { periodo: '2024-02', valor: 3.0 },
      { periodo: '2024-03', valor: 2.9 },
      { periodo: '2024-04', valor: 3.1 },
      { periodo: '2024-05', valor: 2.7 },
      { periodo: '2024-06', valor: 2.6 },
      { periodo: '2024-07', valor: 2.8 },
      { periodo: '2024-08', valor: 2.5 },
      { periodo: '2024-09', valor: 2.7 },
      { periodo: '2024-10', valor: 2.4 },
      { periodo: '2024-11', valor: 2.6 },
      { periodo: '2024-12', valor: 2.8 },
    ],
    pendiente: -0.03,
    r_cuadrado: 0.72,
    proyeccion_siguiente: 2.6,
    confianza_proyeccion: 72,
    interpretacion: 'Tendencia descendente leve con R² = 0.72',
  },
  {
    id: 2,
    kpi_codigo: 'KPI-FIN-001',
    kpi_nombre: 'EBITDA Mensual',
    periodo_inicio: '2024-01',
    periodo_fin: '2024-12',
    tipo_tendencia: 'lineal',
    puntos_datos: [
      { periodo: '2024-01', valor: 12.5 },
      { periodo: '2024-02', valor: 13.2 },
      { periodo: '2024-03', valor: 13.8 },
      { periodo: '2024-04', valor: 14.1 },
      { periodo: '2024-05', valor: 14.5 },
      { periodo: '2024-06', valor: 15.0 },
      { periodo: '2024-07', valor: 15.3 },
      { periodo: '2024-08', valor: 14.8 },
      { periodo: '2024-09', valor: 15.5 },
      { periodo: '2024-10', valor: 15.8 },
      { periodo: '2024-11', valor: 16.2 },
      { periodo: '2024-12', valor: 16.5 },
    ],
    pendiente: 0.31,
    r_cuadrado: 0.94,
    proyeccion_siguiente: 16.8,
    confianza_proyeccion: 94,
    interpretacion: 'Tendencia ascendente fuerte con R² = 0.94',
  },
];

const mockAnomalias = [
  {
    id: 1,
    kpi_codigo: 'KPI-SST-001',
    kpi_nombre: 'Índice de Frecuencia',
    fecha_deteccion: '2024-12-15',
    periodo_anomalia: '2024-12',
    tipo_anomalia: 'cambio_brusco',
    severidad: 'media',
    descripcion: 'Incremento inesperado de 15% respecto al promedio de 3 meses',
    valor_kpi: 2.8,
    valor_esperado: 2.4,
    desviacion: 0.4,
    revisada: false,
  },
  {
    id: 2,
    kpi_codigo: 'KPI-OP-002',
    kpi_nombre: 'Tiempo Promedio de Producción',
    fecha_deteccion: '2024-12-10',
    periodo_anomalia: '2024-12',
    tipo_anomalia: 'outlier',
    severidad: 'alta',
    descripcion: 'Valor fuera de 2 desviaciones estándar del promedio histórico',
    valor_kpi: 8.5,
    valor_esperado: 6.2,
    desviacion: 2.3,
    revisada: true,
    fecha_revision: '2024-12-11',
    observaciones_revision: 'Se identificó falla en equipo principal. Acción correctiva generada.',
  },
  {
    id: 3,
    kpi_codigo: 'KPI-COM-003',
    kpi_nombre: 'NPS Cliente',
    fecha_deteccion: '2024-12-08',
    periodo_anomalia: '2024-11',
    tipo_anomalia: 'patron_inusual',
    severidad: 'baja',
    descripcion: 'Patrón atípico de respuestas en encuesta',
    valor_kpi: 7.2,
    valor_esperado: 8.1,
    desviacion: 0.9,
    revisada: false,
  },
];

// ==================== UTILITY FUNCTIONS ====================

const getDireccionIcon = (direccion: string) => {
  if (direccion === 'mejora') return <TrendingUp className="w-5 h-5 text-success-600" />;
  if (direccion === 'deterioro') return <TrendingDown className="w-5 h-5 text-danger-600" />;
  return <Minus className="w-5 h-5 text-gray-400" />;
};

const getSeveridadColor = (severidad: string) => {
  const colors = {
    baja: 'bg-blue-100 text-blue-800',
    media: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800',
  };
  return colors[severidad as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// ==================== SECTIONS ====================

const AnalisisSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const analisis = mockAnalisis;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar análisis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Generar Análisis
        </Button>
      </div>

      {/* Grid de Análisis */}
      <div className="grid grid-cols-1 gap-4">
        {analisis.map((item) => (
          <Card key={item.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {item.kpi_nombre}
                    </h4>
                    {getDireccionIcon(item.direccion)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{item.kpi_codigo} - {item.periodo_analizado}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.cumple_meta ? (
                    <Badge variant="success" size="sm">
                      <Target className="w-3 h-3 mr-1" />
                      Meta Cumplida
                    </Badge>
                  ) : (
                    <Badge variant="danger" size="sm">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Meta No Cumplida
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Valor Actual</label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {item.valor_actual}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Comparación</label>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-300 mt-1">
                    {item.valor_comparacion}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Variación Abs.</label>
                  <p className={cn(
                    "text-2xl font-bold mt-1",
                    item.direccion === 'mejora' ? 'text-success-600' : 'text-danger-600'
                  )}>
                    {item.variacion_absoluta > 0 ? '+' : ''}{item.variacion_absoluta}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Variación %</label>
                  <p className={cn(
                    "text-2xl font-bold mt-1",
                    item.direccion === 'mejora' ? 'text-success-600' : 'text-danger-600'
                  )}>
                    {item.variacion_porcentual > 0 ? '+' : ''}{item.variacion_porcentual}%
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Interpretación:</span> {item.interpretacion}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const TendenciasSection = () => {
  const tendencias = mockTendencias;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Análisis de Tendencias
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Calcular Tendencia
        </Button>
      </div>

      {/* Grid de Tendencias */}
      <div className="grid grid-cols-1 gap-4">
        {tendencias.map((tendencia) => (
          <Card key={tendencia.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    {tendencia.kpi_nombre}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {tendencia.kpi_codigo} - {tendencia.periodo_inicio} a {tendencia.periodo_fin}
                  </p>
                </div>
                <Badge variant="info" size="sm">
                  {tendencia.tipo_tendencia}
                </Badge>
              </div>

              {/* Gráfico simulado con barras */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-end justify-between gap-1 h-32">
                  {tendencia.puntos_datos.slice(-12).map((punto, idx) => {
                    const maxValue = Math.max(...tendencia.puntos_datos.map(p => p.valor));
                    const height = (punto.valor / maxValue) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-primary-500 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${punto.periodo}: ${punto.valor}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{tendencia.periodo_inicio}</span>
                  <span>{tendencia.periodo_fin}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Pendiente</label>
                  <p className={cn(
                    "text-lg font-bold mt-1",
                    tendencia.pendiente > 0 ? 'text-success-600' : 'text-danger-600'
                  )}>
                    {tendencia.pendiente > 0 ? '+' : ''}{tendencia.pendiente}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">R²</label>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {tendencia.r_cuadrado}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Proyección</label>
                  <p className="text-lg font-bold text-primary-600 mt-1">
                    {tendencia.proyeccion_siguiente}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Confianza</label>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {tendencia.confianza_proyeccion}%
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <span className="font-medium">Interpretación:</span> {tendencia.interpretacion}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const AnomaliasSection = () => {
  const anomalias = mockAnomalias;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Anomalías</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {anomalias.length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes de Revisión</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {anomalias.filter(a => !a.revisada).length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Revisadas</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {anomalias.filter(a => a.revisada).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Lista de Anomalías */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  KPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo Anomalía
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Severidad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor Detectado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor Esperado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {anomalias.map((anomalia) => (
                <tr
                  key={anomalia.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {anomalia.kpi_nombre}
                      </p>
                      <p className="text-xs text-gray-500">{anomalia.kpi_codigo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {anomalia.periodo_anomalia}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="gray" size="sm">
                      {anomalia.tipo_anomalia.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="gray"
                      size="sm"
                      className={getSeveridadColor(anomalia.severidad)}
                    >
                      {anomalia.severidad}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                    {anomalia.valor_kpi}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                    {anomalia.valor_esperado}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {anomalia.revisada ? (
                      <Badge variant="success" size="sm">
                        Revisada
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Pendiente
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!anomalia.revisada && (
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function AnalisisTendenciasPage() {
  const [activeTab, setActiveTab] = useState('analisis');

  const tabs = [
    { id: 'analisis', label: 'Análisis', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'tendencias', label: 'Tendencias', icon: <LineChart className="w-4 h-4" /> },
    { id: 'anomalias', label: 'Anomalías', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Análisis y Tendencias"
        description="Análisis comparativo de KPIs, cálculo de tendencias y detección de anomalías"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'analisis' && <AnalisisSection />}
        {activeTab === 'tendencias' && <TendenciasSection />}
        {activeTab === 'anomalias' && <AnomaliasSection />}
      </div>
    </div>
  );
}
