/**
 * Página: Indicadores por Área
 *
 * Vista de KPIs organizados por 8 categorías con datos reales.
 * Conecta a useCatalogosKPIPorCategoria + modales de registro e historial.
 */
import { useState } from 'react';
import {
  Shield,
  Truck,
  Leaf,
  Award,
  DollarSign,
  Settings,
  Users,
  TrendingUp,
  Plus,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Target,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import { useCatalogosKPIPorCategoria } from '../hooks/useAnalytics';
import { ValorKPIFormModal } from '../components/ValorKPIFormModal';
import { HistorialValoresModal } from '../components/HistorialValoresModal';
import type { CatalogoKPI } from '../types';

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

// ==================== COMPONENTS ====================

interface KPIListItemProps {
  kpi: any;
  onRegistrarValor: (kpi: CatalogoKPI) => void;
  onVerHistorial: (kpi: CatalogoKPI) => void;
}

const KPIListItem = ({ kpi, onRegistrarValor, onVerHistorial }: KPIListItemProps) => {
  const kpiData = kpi.kpi || kpi;
  const ultimoValor = kpi.ultimo_valor?.valor_numerico ?? kpi.ultimo_valor ?? 0;
  const meta = kpi.meta_actual?.meta_esperada ?? kpi.meta ?? 0;
  const unidad = kpiData.unidad_medida || kpi.unidad || '';
  const semaforo = kpi.ultimo_valor?.color_semaforo || kpi.semaforo || 'verde';
  const tendencia = kpi.tendencia || 'estable';
  const variacion = kpi.porcentaje_cambio ?? kpi.variacion ?? 0;
  const fecha = kpi.ultimo_valor?.fecha_medicion || kpi.fecha || '';
  const porcentajeCumplimiento = meta > 0 ? (ultimoValor / meta) * 100 : 0;

  return (
    <Card variant="bordered" padding="md">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('w-3 h-3 rounded-full', getSemaforoColor(semaforo))} />
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {kpiData.nombre || kpi.nombre}
              </h4>
            </div>
            <p className="text-xs text-gray-500">{kpiData.codigo || kpi.codigo}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof ultimoValor === 'number' ? ultimoValor.toLocaleString() : ultimoValor}
              <span className="text-sm font-normal text-gray-500 ml-1">{unidad}</span>
            </p>
            {meta > 0 && (
              <p className="text-xs text-gray-500">
                Meta: {meta} {unidad}
              </p>
            )}
          </div>

          <div className="text-right">
            <div
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium mb-1',
                variacion > 0
                  ? 'bg-green-100 text-green-700'
                  : variacion < 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
              )}
            >
              {getTendenciaIcon(tendencia)}
              <span>{Math.abs(variacion).toFixed(1)}%</span>
            </div>
            {fecha && (
              <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3" />
                {fecha}
              </p>
            )}
          </div>
        </div>

        {meta > 0 && (
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', getSemaforoColor(semaforo))}
              style={{ width: `${Math.min(porcentajeCumplimiento, 100)}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Plus className="w-3 h-3" />}
            onClick={() => onRegistrarValor(kpiData)}
          >
            Registrar Valor
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<History className="w-3 h-3" />}
            onClick={() => onVerHistorial(kpiData)}
          >
            Historial
          </Button>
        </div>
      </div>
    </Card>
  );
};

const CategoriaSection = ({
  kpis,
  onRegistrarValor,
  onVerHistorial,
}: {
  kpis: any[];
  onRegistrarValor: (kpi: CatalogoKPI) => void;
  onVerHistorial: (kpi: CatalogoKPI) => void;
}) => {
  const countBySemaforo = (color: string) =>
    kpis.filter((k) => {
      const s = k.ultimo_valor?.color_semaforo || k.semaforo;
      return s === color;
    }).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total KPIs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{kpis.length}</p>
            </div>
          </div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Verde</p>
              <p className="text-xl font-bold text-green-600">{countBySemaforo('verde')}</p>
            </div>
          </div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Amarillo</p>
              <p className="text-xl font-bold text-yellow-600">{countBySemaforo('amarillo')}</p>
            </div>
          </div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Rojo</p>
              <p className="text-xl font-bold text-red-600">{countBySemaforo('rojo')}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kpis.map((kpi: any) => (
          <KPIListItem
            key={kpi.id || kpi.kpi?.id}
            kpi={kpi}
            onRegistrarValor={onRegistrarValor}
            onVerHistorial={onVerHistorial}
          />
        ))}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function IndicadoresAreaPage() {
  const [activeTab, setActiveTab] = useState('sst');
  const [selectedKPI, setSelectedKPI] = useState<CatalogoKPI | null>(null);
  const [showValorModal, setShowValorModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);

  const { data: kpisData, isLoading } = useCatalogosKPIPorCategoria(activeTab);
  const kpis = Array.isArray(kpisData) ? kpisData : [];

  const tabs = [
    { id: 'sst', label: 'SST', icon: <Shield className="w-4 h-4" /> },
    { id: 'pesv', label: 'PESV', icon: <Truck className="w-4 h-4" /> },
    { id: 'ambiental', label: 'Ambiental', icon: <Leaf className="w-4 h-4" /> },
    { id: 'calidad', label: 'Calidad', icon: <Award className="w-4 h-4" /> },
    { id: 'financiero', label: 'Financiero', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'operacional', label: 'Operacional', icon: <Settings className="w-4 h-4" /> },
    { id: 'rrhh', label: 'RRHH', icon: <Users className="w-4 h-4" /> },
    { id: 'comercial', label: 'Comercial', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const getTitulo = () => {
    const titulos: Record<string, string> = {
      sst: 'Seguridad y Salud en el Trabajo',
      pesv: 'Plan Estratégico de Seguridad Vial',
      ambiental: 'Gestión Ambiental',
      calidad: 'Calidad',
      financiero: 'Financiero',
      operacional: 'Operacional',
      rrhh: 'Recursos Humanos',
      comercial: 'Comercial',
    };
    return titulos[activeTab] || 'Indicadores';
  };

  const handleRegistrarValor = (kpi: CatalogoKPI) => {
    setSelectedKPI(kpi);
    setShowValorModal(true);
  };

  const handleVerHistorial = (kpi: CatalogoKPI) => {
    setSelectedKPI(kpi);
    setShowHistorialModal(true);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Indicadores por Área"
        description="KPIs organizados por categoría funcional y área de negocio"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              if (kpis.length > 0) {
                const firstKpi = kpis[0].kpi || kpis[0];
                handleRegistrarValor(firstKpi);
              }
            }}
            disabled={kpis.length === 0}
          >
            Registrar Valores
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{getTitulo()}</h2>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Spinner size="lg" />
          </div>
        ) : kpis.length === 0 ? (
          <EmptyState
            icon={<Target className="w-12 h-12" />}
            title="Sin indicadores en esta categoría"
            description="Configure KPIs desde la sección de configuración de indicadores"
          />
        ) : (
          <CategoriaSection
            kpis={kpis}
            onRegistrarValor={handleRegistrarValor}
            onVerHistorial={handleVerHistorial}
          />
        )}
      </div>

      {/* Modales */}
      <ValorKPIFormModal
        kpi={selectedKPI}
        isOpen={showValorModal}
        onClose={() => {
          setShowValorModal(false);
          setSelectedKPI(null);
        }}
      />

      <HistorialValoresModal
        kpi={selectedKPI}
        isOpen={showHistorialModal}
        onClose={() => {
          setShowHistorialModal(false);
          setSelectedKPI(null);
        }}
      />
    </div>
  );
}
