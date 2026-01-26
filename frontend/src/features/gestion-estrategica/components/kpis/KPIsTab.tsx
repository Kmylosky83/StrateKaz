/**
 * Tab de KPIs y Seguimiento con selector de objetivo
 * Sistema de Gestión StrateKaz - Sprint 4
 */
import { useState, useMemo } from 'react';
import { Target, TrendingUp, BarChart3, Plus } from 'lucide-react';
import { Tabs, EmptyState, Spinner, Card, Button } from '@/components/common';
import type { Tab } from '@/components/common';
import { Select } from '@/components/forms/Select';
import { useObjectives } from '../../hooks/useStrategic';
import { useKPIs, useKPIMeasurements } from '../../hooks/useKPIs';
import { KPIDashboard } from './KPIDashboard';
import { KPITable } from './KPITable';
import { KPIProgressChart } from './KPIProgressChart';
import { KPIFormModal } from '../modals/KPIFormModal';
import { KPIMeasurementFormModal } from '../modals/KPIMeasurementFormModal';
import type { KPIObjetivo } from '../../types/kpi.types';

interface KPIsTabProps {
  planId: number;
}

type TabType = 'dashboard' | 'tabla' | 'graficos';

const TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tabla', label: 'Tabla' },
  { id: 'graficos', label: 'Gráficos' },
];

export function KPIsTab({ planId }: KPIsTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(null);
  const [kpiFormOpen, setKpiFormOpen] = useState(false);
  const [measurementFormOpen, setMeasurementFormOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<KPIObjetivo | null>(null);

  // Cargar objetivos del plan
  const { data: objectivesData, isLoading: objectivesLoading } = useObjectives({
    plan: planId,
    is_active: true,
  });

  // Cargar KPIs del objetivo seleccionado
  const { data: kpisData, isLoading: kpisLoading } = useKPIs(
    selectedObjectiveId ? { objective: selectedObjectiveId, is_active: true } : undefined
  );

  const objectives = objectivesData?.results || [];
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
    setActiveTab('graficos');
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
        icon={Target}
        title="No hay objetivos estratégicos"
        description="Primero debes crear objetivos estratégicos para poder definir KPIs"
      />
    );
  }

  // Si no hay objetivo seleccionado
  if (!selectedObjectiveId) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
              <Target className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Selecciona un Objetivo Estratégico
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Elige un objetivo para ver y gestionar sus KPIs de seguimiento
            </p>
            <div className="max-w-md mx-auto">
              <Select
                value={selectedObjectiveId || ''}
                onChange={(e) => setSelectedObjectiveId(Number(e.target.value))}
              >
                <option value="">Seleccionar objetivo...</option>
                {objectives.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.code} - {obj.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const selectedObjective = objectives.find((o) => o.id === selectedObjectiveId);

  return (
    <div className="space-y-6">
      {/* Selector de Objetivo */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <Select
              value={selectedObjectiveId}
              onChange={(e) => {
                setSelectedObjectiveId(Number(e.target.value));
                setActiveTab('dashboard');
              }}
              className="flex-1 max-w-xl"
            >
              {objectives.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.code} - {obj.name}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={handleCreateKPI} variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo KPI
          </Button>
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
        <>
          {activeTab === 'dashboard' && (
            <KPIDashboard
              objectiveId={selectedObjectiveId}
              onSelectKPI={handleViewChart}
              onCreateKPI={handleCreateKPI}
            />
          )}

          {activeTab === 'tabla' && (
            <KPITable
              kpis={kpis}
              onEdit={handleEditKPI}
              onAddMeasurement={handleAddMeasurement}
              onViewChart={handleViewChart}
            />
          )}

          {activeTab === 'graficos' && (
            <ChartsGrid
              kpis={kpis}
              selectedKPI={selectedKPI}
            />
          )}
        </>
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
        <KPIChartWrapper key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

// =============================================================================
// KPI CHART WRAPPER
// =============================================================================

interface KPIChartWrapperProps {
  kpi: KPIObjetivo;
}

function KPIChartWrapper({ kpi }: KPIChartWrapperProps) {
  const { data: measurementsData, isLoading } = useKPIMeasurements(kpi.id);

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  const measurements = measurementsData?.results || [];

  return <KPIProgressChart kpi={kpi} measurements={measurements} />;
}
