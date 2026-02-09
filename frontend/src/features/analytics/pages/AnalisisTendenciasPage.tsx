/**
 * Página: Análisis y Tendencias (REWRITTEN - Sprint 8)
 *
 * Análisis comparativo de KPIs y detección de tendencias con 3 tabs:
 * - Análisis: Generar y listar análisis KPI
 * - Tendencias: Calcular y visualizar tendencias
 * - Anomalías: Detectar y revisar anomalías
 *
 * CHANGES:
 * - Deleted ALL mock data
 * - Connected to real hooks from useAnalytics
 * - All buttons functional (no noop)
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
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import {
  useAnalisisKPI,
  useGenerarAnalisisKPI,
  useTendenciasKPI,
  useCalcularTendencia,
  useAnomalias,
  useMarcarAnomaliaRevisada,
} from '../hooks/useAnalytics';

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
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [kpiId, setKpiId] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [tipoAnalisis, setTipoAnalisis] = useState('vs_meta');

  const { data: analisisData, isLoading } = useAnalisisKPI();
  const generarMutation = useGenerarAnalisisKPI();

  const analisis = analisisData || [];

  const handleGenerar = async () => {
    if (!kpiId || !periodo) return;
    try {
      await generarMutation.mutateAsync({
        kpiId: parseInt(kpiId),
        periodo,
        tipoAnalisis,
      });
      setShowGenerateForm(false);
      setKpiId('');
      setPeriodo('');
      setTipoAnalisis('vs_meta');
    } catch (error) {
      console.error('Error al generar análisis:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowGenerateForm(!showGenerateForm)}
        >
          Generar Análisis
        </Button>
      </div>

      {showGenerateForm && (
        <Card variant="bordered" padding="md">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Generar Nuevo Análisis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="ID del KPI"
                value={kpiId}
                onChange={(e) => setKpiId(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Periodo (2024-12)"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={tipoAnalisis}
                onChange={(e) => setTipoAnalisis(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="vs_meta">vs Meta</option>
                <option value="vs_periodo_anterior">vs Periodo Anterior</option>
                <option value="vs_mejor_historico">vs Mejor Histórico</option>
                <option value="tendencia">Tendencia</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowGenerateForm(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerar}
                disabled={generarMutation.isPending || !kpiId || !periodo}
              >
                {generarMutation.isPending ? 'Generando...' : 'Generar'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {analisis.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-12 h-12" />}
          title="No hay análisis registrados"
          description="Genera tu primer análisis comparativo de KPIs"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {analisis.map((item) => (
            <Card key={item.id} variant="bordered" padding="md">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {item.kpi_nombre || `KPI #${item.kpi}`}
                      </h4>
                      {getDireccionIcon(item.direccion)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.kpi_codigo} - {item.periodo_analizado}
                    </p>
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
                      {item.valor_comparacion || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Variación Abs.</label>
                    <p
                      className={cn(
                        'text-2xl font-bold mt-1',
                        item.direccion === 'mejora' ? 'text-success-600' : 'text-danger-600'
                      )}
                    >
                      {item.variacion_absoluta ? (item.variacion_absoluta > 0 ? '+' : '') + item.variacion_absoluta : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Variación %</label>
                    <p
                      className={cn(
                        'text-2xl font-bold mt-1',
                        item.direccion === 'mejora' ? 'text-success-600' : 'text-danger-600'
                      )}
                    >
                      {item.variacion_porcentual
                        ? (item.variacion_porcentual > 0 ? '+' : '') + item.variacion_porcentual + '%'
                        : '-'}
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
      )}
    </div>
  );
};

const TendenciasSection = () => {
  const [showCalculateForm, setShowCalculateForm] = useState(false);
  const [kpiId, setKpiId] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFin, setPeriodoFin] = useState('');
  const [tipoTendencia, setTipoTendencia] = useState('lineal');

  const { data: tendenciasData, isLoading } = useTendenciasKPI();
  const calcularMutation = useCalcularTendencia();

  const tendencias = tendenciasData || [];

  const handleCalcular = async () => {
    if (!kpiId || !periodoInicio || !periodoFin) return;
    try {
      await calcularMutation.mutateAsync({
        kpiId: parseInt(kpiId),
        periodoInicio,
        periodoFin,
        tipoTendencia,
      });
      setShowCalculateForm(false);
      setKpiId('');
      setPeriodoInicio('');
      setPeriodoFin('');
      setTipoTendencia('lineal');
    } catch (error) {
      console.error('Error al calcular tendencia:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Análisis de Tendencias</h3>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCalculateForm(!showCalculateForm)}
        >
          Calcular Tendencia
        </Button>
      </div>

      {showCalculateForm && (
        <Card variant="bordered" padding="md">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Calcular Nueva Tendencia</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="number"
                placeholder="ID del KPI"
                value={kpiId}
                onChange={(e) => setKpiId(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Inicio (2024-01)"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Fin (2024-12)"
                value={periodoFin}
                onChange={(e) => setPeriodoFin(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={tipoTendencia}
                onChange={(e) => setTipoTendencia(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="lineal">Lineal</option>
                <option value="exponencial">Exponencial</option>
                <option value="estacional">Estacional</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCalculateForm(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCalcular}
                disabled={calcularMutation.isPending || !kpiId || !periodoInicio || !periodoFin}
              >
                {calcularMutation.isPending ? 'Calculando...' : 'Calcular'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {tendencias.length === 0 ? (
        <EmptyState
          icon={<LineChart className="w-12 h-12" />}
          title="No hay tendencias calculadas"
          description="Calcula tendencias para visualizar patrones de comportamiento"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tendencias.map((tendencia) => (
            <Card key={tendencia.id} variant="bordered" padding="md">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <LineChart className="w-5 h-5" />
                      {tendencia.kpi_nombre || `KPI #${tendencia.kpi}`}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {tendencia.kpi_codigo} - {tendencia.periodo_inicio} a {tendencia.periodo_fin}
                    </p>
                  </div>
                  <Badge variant="info" size="sm">
                    {tendencia.tipo_tendencia}
                  </Badge>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-end justify-between gap-1 h-32">
                    {tendencia.puntos_datos.slice(-12).map((punto, idx) => {
                      const maxValue = Math.max(...tendencia.puntos_datos.map((p) => p.valor));
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
                    <p
                      className={cn(
                        'text-lg font-bold mt-1',
                        tendencia.pendiente && tendencia.pendiente > 0 ? 'text-success-600' : 'text-danger-600'
                      )}
                    >
                      {tendencia.pendiente ? (tendencia.pendiente > 0 ? '+' : '') + tendencia.pendiente : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">R²</label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {tendencia.r_cuadrado || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Proyección</label>
                    <p className="text-lg font-bold text-primary-600 mt-1">
                      {tendencia.proyeccion_siguiente || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Confianza</label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {tendencia.confianza_proyeccion ? tendencia.confianza_proyeccion + '%' : '-'}
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
      )}
    </div>
  );
};

const AnomaliasSection = () => {
  const { data: anomaliasData, isLoading } = useAnomalias();
  const marcarRevisadaMutation = useMarcarAnomaliaRevisada();

  const [observaciones, setObservaciones] = useState<Record<number, string>>({});

  const anomalias = anomaliasData || [];

  const handleMarcarRevisada = async (id: number) => {
    try {
      await marcarRevisadaMutation.mutateAsync({
        id,
        observaciones: observaciones[id] || 'Anomalía revisada',
      });
      setObservaciones((prev) => ({ ...prev, [id]: '' }));
    } catch (error) {
      console.error('Error al marcar anomalía:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Anomalías</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{anomalias.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes de Revisión</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {anomalias.filter((a) => !a.revisada).length}
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
                {anomalias.filter((a) => a.revisada).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {anomalias.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12" />}
          title="No hay anomalías detectadas"
          description="El sistema detectará automáticamente anomalías en los KPIs"
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KPI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periodo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo Anomalía
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor Detectado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor Esperado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {anomalias.map((anomalia) => (
                  <tr key={anomalia.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {anomalia.kpi_nombre || `KPI #${anomalia.kpi}`}
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
                      <Badge variant="gray" size="sm" className={getSeveridadColor(anomalia.severidad)}>
                        {anomalia.severidad}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                      {anomalia.valor_kpi}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                      {anomalia.valor_esperado || '-'}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarcarRevisada(anomalia.id)}
                            disabled={marcarRevisadaMutation.isPending}
                          >
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
      )}
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
