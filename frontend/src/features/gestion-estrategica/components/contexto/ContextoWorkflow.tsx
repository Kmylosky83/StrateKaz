/**
 * ContextoWorkflow - Vista Workflow Completa para Contexto Organizacional
 * Sistema de Gestión StrateKaz
 *
 * Integra:
 * 1. Selector de Análisis DOFA
 * 2. Tabs para cambiar entre vistas:
 *    - Matriz DOFA (DOFAMatrix)
 *    - Estrategias TOWS (TOWSMatrix)
 *    - PESTEL (futuro)
 *    - Porter (futuro)
 * 3. Modales de formularios
 *
 * Usa Design System:
 * - PageTabs para navegación principal
 * - SectionHeader para header con acciones
 * - Modales para crear/editar
 */

import { useState, useEffect } from 'react';
import { Plus, FileSearch, Target, Zap, BarChart3, TrendingUp } from 'lucide-react';
import { PageTabs, type Tab } from '@/components/layout/PageTabs';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { EmptyState } from '@/components/common/EmptyState';
import { useAnalisisDofa } from '../../hooks/useContexto';
import { DOFAMatrix } from './DOFAMatrix';
import { TOWSMatrix } from './TOWSMatrix';
import { AnalisisDofaFormModal } from '../modals/AnalisisDofaFormModal';
import { AnalisisPestelFormModal } from '../modals/AnalisisPestelFormModal';
import { FuerzaPorterFormModal } from '../modals/FuerzaPorterFormModal';
import type { AnalisisDOFA } from '../../types/contexto.types';

// ============================================================================
// TABS
// ============================================================================

const CONTEXTO_TABS: Tab[] = [
  {
    id: 'dofa',
    label: 'Matriz DOFA',
    icon: FileSearch,
    description: 'Análisis interno y externo',
  },
  {
    id: 'tows',
    label: 'Estrategias TOWS',
    icon: Target,
    description: 'Estrategias cruzadas',
  },
  {
    id: 'pestel',
    label: 'PESTEL',
    icon: BarChart3,
    description: 'Factores externos',
  },
  {
    id: 'porter',
    label: '5 Fuerzas Porter',
    icon: TrendingUp,
    description: 'Análisis competitivo',
  },
];

type TabType = 'dofa' | 'tows' | 'pestel' | 'porter';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface ContextoWorkflowProps {
  /** ID del análisis DOFA pre-seleccionado */
  initialAnalisisId?: number;
  /** Tab inicial activo */
  initialTab?: TabType;
}

export const ContextoWorkflow = ({ initialAnalisisId, initialTab = 'dofa' }: ContextoWorkflowProps) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedAnalisisId, setSelectedAnalisisId] = useState<number | null>(
    initialAnalisisId || null
  );
  const [isNewAnalisisModalOpen, setIsNewAnalisisModalOpen] = useState(false);
  const [isNewPestelModalOpen, setIsNewPestelModalOpen] = useState(false);
  const [isNewPorterModalOpen, setIsNewPorterModalOpen] = useState(false);

  // Cargar lista de análisis DOFA
  const { data: analisisData, isLoading } = useAnalisisDofa({}, 1, 50);

  // Auto-seleccionar el análisis más reciente si no hay uno seleccionado
  useEffect(() => {
    if (!selectedAnalisisId && analisisData?.results && analisisData.results.length > 0) {
      // Seleccionar el análisis vigente más reciente, o el primero
      const vigente = analisisData.results.find((a) => a.estado === 'vigente');
      const selected = vigente || analisisData.results[0];
      setSelectedAnalisisId(selected.id);
    }
  }, [analisisData, selectedAnalisisId]);

  const selectedAnalisis = analisisData?.results.find((a) => a.id === selectedAnalisisId);

  // Opciones para el selector
  const analisisOptions =
    analisisData?.results.map((a) => ({
      value: a.id.toString(),
      label: `${a.nombre} (${a.periodo}) - ${a.estado_display}`,
    })) || [];

  const handleNewAnalisisSuccess = (newAnalisis: AnalisisDOFA) => {
    setSelectedAnalisisId(newAnalisis.id);
    setIsNewAnalisisModalOpen(false);
  };

  const renderTabContent = () => {
    if (!selectedAnalisisId) {
      return (
        <EmptyState
          icon={FileSearch}
          title="No hay análisis DOFA seleccionado"
          description="Crea un nuevo análisis DOFA para comenzar"
          action={{
            label: 'Crear Análisis DOFA',
            onClick: () => setIsNewAnalisisModalOpen(true),
            icon: Plus,
          }}
        />
      );
    }

    switch (activeTab) {
      case 'dofa':
        return <DOFAMatrix analisisId={selectedAnalisisId} />;

      case 'tows':
        return <TOWSMatrix analisisId={selectedAnalisisId} />;

      case 'pestel':
        return (
          <EmptyState
            icon={BarChart3}
            title="Análisis PESTEL"
            description="Sección en desarrollo. Pronto podrás analizar factores políticos, económicos, sociales, tecnológicos, ecológicos y legales."
            action={{
              label: 'Crear Análisis PESTEL',
              onClick: () => setIsNewPestelModalOpen(true),
              icon: Plus,
            }}
          />
        );

      case 'porter':
        return (
          <EmptyState
            icon={TrendingUp}
            title="5 Fuerzas de Porter"
            description="Sección en desarrollo. Pronto podrás analizar la rivalidad competitiva, amenaza de nuevos entrantes, productos sustitutos, poder de proveedores y poder de clientes."
            action={{
              label: 'Crear Análisis Porter',
              onClick: () => setIsNewPorterModalOpen(true),
              icon: Plus,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con selector de análisis */}
      <SectionHeader
        title="Contexto Organizacional"
        description="Análisis estratégico: DOFA, TOWS, PESTEL y 5 Fuerzas de Porter"
        icon={Zap}
      >
        <div className="flex items-center gap-3">
          <div className="w-80">
            <Select
              value={selectedAnalisisId?.toString() || ''}
              onChange={(e) => setSelectedAnalisisId(Number(e.target.value))}
              options={analisisOptions}
              placeholder="Selecciona un análisis..."
              disabled={isLoading || analisisOptions.length === 0}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewAnalisisModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Análisis
          </Button>
        </div>
      </SectionHeader>

      {/* Información del análisis seleccionado */}
      {selectedAnalisis && (
        <Alert variant="info" icon={FileSearch}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{selectedAnalisis.nombre}</p>
              <p className="text-sm mt-1">
                Período: {selectedAnalisis.periodo} | Estado: {selectedAnalisis.estado_display}
                {selectedAnalisis.responsable_nombre && ` | Responsable: ${selectedAnalisis.responsable_nombre}`}
              </p>
            </div>
            {selectedAnalisis.total_factores !== undefined && (
              <div className="text-right">
                <p className="text-2xl font-bold">{selectedAnalisis.total_factores}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Factores DOFA</p>
              </div>
            )}
          </div>
        </Alert>
      )}

      {/* Tabs de navegación */}
      <PageTabs
        tabs={CONTEXTO_TABS}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as TabType)}
      >
        {/* Contenido del tab activo */}
        {renderTabContent()}
      </PageTabs>

      {/* Modales */}
      <AnalisisDofaFormModal
        analisis={null}
        isOpen={isNewAnalisisModalOpen}
        onClose={() => setIsNewAnalisisModalOpen(false)}
        onSuccess={handleNewAnalisisSuccess}
      />

      <AnalisisPestelFormModal
        analisis={null}
        isOpen={isNewPestelModalOpen}
        onClose={() => setIsNewPestelModalOpen(false)}
      />

      <FuerzaPorterFormModal
        fuerza={null}
        isOpen={isNewPorterModalOpen}
        onClose={() => setIsNewPorterModalOpen(false)}
      />
    </div>
  );
};
