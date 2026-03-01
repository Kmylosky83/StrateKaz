/**
 * KPIsTabPro - Tab de KPIs con Analytics Enterprise
 * Sistema de Gestión StrateKaz - Sprint 4 - Analytics Pro Edition
 */
import { useState, Suspense, lazy } from 'react';
import {
  Target,
  TrendingUp,
  BarChart3,
  Plus,
  Gauge,
  Box,
  GitBranch,
  Sparkles,
  Layout,
} from 'lucide-react';
import { Tabs, EmptyState, Spinner, Card, Button } from '@/components/common';
import type { Tab } from '@/components/common';
import { Select } from '@/components/forms/Select';
import { useObjectives } from '../../hooks/useStrategic';
import { useKPIs } from '../../hooks/useKPIs';
import { KPITable } from './KPITable';
import { KPIFormModal } from '../modals/KPIFormModal';
import { KPIMeasurementFormModal } from '../modals/KPIMeasurementFormModal';
import type { KPIObjetivo } from '../../types/kpi.types';

// Lazy load analytics components para mejor performance
const KPIDashboard = lazy(() =>
  import('./KPIDashboard').then((m) => ({ default: m.KPIDashboard }))
);
const KPIDashboardPro = lazy(() =>
  import('./analytics/KPIDashboardPro').then((m) => ({ default: m.KPIDashboardPro }))
);
const KPIGaugeChart = lazy(() =>
  import('./analytics/KPIGaugeChart').then((m) => ({ default: m.KPIGaugeChart }))
);
const KPIScatter3D = lazy(() =>
  import('./analytics/KPIScatter3D').then((m) => ({ default: m.KPIScatter3D }))
);
const KPITreemap = lazy(() =>
  import('./analytics/KPITreemap').then((m) => ({ default: m.KPITreemap }))
);
const KPIProgressChart = lazy(() =>
  import('./KPIProgressChart').then((m) => ({ default: m.KPIProgressChart }))
);

interface KPIsTabProProps {
  planId: number;
}

type TabType =
  | 'dashboard_basic'
  | 'dashboard_pro'
  | 'tabla'
  | 'gauges'
  | 'charts'
  | '3d'
  | 'hierarchy';

const TABS: Tab[] = [
  { id: 'dashboard_basic', label: 'Dashboard Clásico', icon: Layout },
  { id: 'dashboard_pro', label: 'Dashboard Enterprise', icon: Sparkles },
  { id: 'tabla', label: 'Tabla', icon: BarChart3 },
  { id: 'gauges', label: 'Velocímetros', icon: Gauge },
  { id: 'charts', label: 'Gráficos', icon: TrendingUp },
  { id: '3d', label: 'Vista 3D', icon: Box },
  { id: 'hierarchy', label: 'Jerarquía', icon: GitBranch },
];

export function KPIsTabPro({ planId }: KPIsTabProProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard_pro');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(null);
  const [kpiFormOpen, setKpiFormOpen] = useState(false);
  const [measurementFormOpen, setMeasurementFormOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<KPIObjetivo | null>(null);

  // Cargar objetivos del plan
  const { data: objectivesData, isLoading: objectivesLoading } = useObjectives({
    plan: planId,
    is_active: true,
  });

  // Cargar KPIs del objetivo seleccionado o todos
  const { data: kpisData, isLoading: kpisLoading } = useKPIs(
    selectedObjectiveId ? { objective: selectedObjectiveId, is_active: true } : { is_active: true }
  );

  const objectives = Array.isArray(objectivesData) ? objectivesData : [];
  const kpis = kpisData?.results || [];

  // Handlers
  const handleCreateKPI = () => {
    setSelectedKPI(null);
    setKpiFormOpen(true);
  };

  const handleEditKPI = (kpi: KPIObjetivo) => {
    setSelectedKPI(kpi);
    setKpiFormOpen(true);
  };

  const handleAddMeasurement = (kpi: KPIObjetivo) => {
    setSelectedKPI(kpi);
    setMeasurementFormOpen(true);
  };

  const handleViewChart = (kpi: KPIObjetivo) => {
    setSelectedKPI(kpi);
    setActiveTab('charts');
  };

  // Si no hay objetivos
  if (objectivesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (objectives.length === 0) {
    return (
      <EmptyState
        icon={<Target className="h-12 w-12" />}
        title="No hay objetivos estratégicos"
        description="Primero debes crear objetivos estratégicos para poder definir KPIs"
      />
    );
  }

  const selectedObjective = selectedObjectiveId
    ? objectives.find((o) => o.id === selectedObjectiveId)
    : null;

  return (
    <div className="space-y-6">
      {/* Selector de Objetivo */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <Select
              value={selectedObjectiveId || 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedObjectiveId(value === 'all' ? null : Number(value));
                setActiveTab('dashboard_pro');
              }}
              className="flex-1 max-w-xl"
            >
              <option value="all">Todos los objetivos</option>
              {objectives.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.code} - {obj.name}
                </option>
              ))}
            </Select>
          </div>
          {selectedObjectiveId && (
            <Button onClick={handleCreateKPI} variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo KPI
            </Button>
          )}
        </div>
      </Card>

      {/* Tabs de Visualización */}
      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as TabType)}
      />

      {/* Contenido según Tab Activa */}
      {kpisLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          }
        >
          {activeTab === 'dashboard_basic' && (
            <KPIDashboard
              objectiveId={selectedObjectiveId || undefined}
              onSelectKPI={handleViewChart}
              onCreateKPI={handleCreateKPI}
            />
          )}

          {activeTab === 'dashboard_pro' && (
            <KPIDashboardPro planId={planId} objectiveId={selectedObjectiveId || undefined} />
          )}

          {activeTab === 'tabla' && (
            <KPITable
              kpis={kpis}
              onEdit={handleEditKPI}
              onAddMeasurement={handleAddMeasurement}
              onViewChart={handleViewChart}
            />
          )}

          {activeTab === 'gauges' && <GaugesGrid kpis={kpis} />}

          {activeTab === 'charts' && <ChartsGrid kpis={kpis} selectedKPI={selectedKPI} />}

          {activeTab === '3d' && (
            <KPIScatter3D
              kpis={kpis}
              xAxis="target"
              yAxis="value"
              zAxis="objective"
              colorBy="semaforo"
              height={700}
            />
          )}

          {activeTab === 'hierarchy' && (
            <KPITreemap objectives={objectives} kpis={kpis} colorBy="semaforo" />
          )}
        </Suspense>
      )}

      {/* Modales */}
      {selectedObjective && (
        <>
          <KPIFormModal
            kpi={selectedKPI}
            objectiveId={selectedObjective.id}
            isOpen={kpiFormOpen}
            onClose={() => {
              setKpiFormOpen(false);
              setSelectedKPI(null);
            }}
          />

          {selectedKPI && (
            <KPIMeasurementFormModal
              kpi={selectedKPI}
              isOpen={measurementFormOpen}
              onClose={() => {
                setMeasurementFormOpen(false);
                setSelectedKPI(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// GAUGES GRID
// =============================================================================

interface GaugesGridProps {
  kpis: KPIObjetivo[];
}

function GaugesGrid({ kpis }: GaugesGridProps) {
  if (kpis.length === 0) {
    return (
      <EmptyState
        icon={<Gauge className="h-12 w-12" />}
        title="No hay KPIs para mostrar"
        description="Crea KPIs y agrega mediciones para visualizar velocímetros"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi) => (
        <KPIGaugeChart key={kpi.id} kpi={kpi} size="md" showThresholds animated />
      ))}
    </div>
  );
}

// =============================================================================
// CHARTS GRID
// =============================================================================

interface ChartsGridProps {
  kpis: KPIObjetivo[];
  selectedKPI: KPIObjetivo | null;
}

function ChartsGrid({ kpis, selectedKPI }: ChartsGridProps) {
  if (kpis.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No hay KPIs para graficar"
        description="Crea KPIs y agrega mediciones para visualizar gráficos de progreso"
      />
    );
  }

  // Si hay un KPI seleccionado, mostrar solo ese
  const kpisToShow = selectedKPI ? [selectedKPI] : kpis;

  return (
    <div className="space-y-6">
      {kpisToShow.map((kpi) => (
        <Suspense
          key={kpi.id}
          fallback={
            <Card className="p-8">
              <div className="flex justify-center">
                <Spinner size="lg" />
              </div>
            </Card>
          }
        >
          <KPIProgressChart kpi={kpi} measurements={kpi.recent_measurements || []} />
        </Suspense>
      ))}
    </div>
  );
}
