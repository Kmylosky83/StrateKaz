/**
 * Tab de Contexto Organizacional - Motor de Riesgos
 * Sistema de Gestión StrateKaz
 *
 * Gestión completa del análisis de contexto organizacional:
 * - Análisis DOFA (Debilidades, Oportunidades, Fortalezas, Amenazas)
 * - Estrategias TOWS (Matriz de estrategias cruzadas)
 * - Análisis PESTEL (Entorno macro)
 * - 5 Fuerzas de Porter (Análisis competitivo)
 *
 * Conecta con backend/apps/motor_riesgos/contexto/
 */
import { useState } from 'react';
import {
  Target,
  Compass,
  Globe,
  TrendingUp,
  Plus,
  Download,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { MatrizDOFAVisual } from '../contexto/MatrizDOFAVisual';
import { EstrategiasTOWSGrid } from '../contexto/EstrategiasTOWSGrid';
import { PESTELChart } from '../contexto/PESTELChart';
import { PorterDiagram } from '../contexto/PorterDiagram';
import type {
  AnalisisDOFA,
  AnalisisPESTEL,
  AnalisisPorter,
  FactorDOFA,
  EstrategiaTOWS,
  FactorPESTEL,
  FuerzaPorter,
} from '../../types/contexto.types';

interface ContextoOrganizacionalTabProps {
  /** Código de la subsección activa (desde API/DynamicSections) */
  activeSection?: string;
}

// =============================================================================
// CONFIGURACIÓN DE SUBTABS
// =============================================================================

const SUBTAB_IDS = {
  DOFA: 'dofa',
  TOWS: 'tows',
  PESTEL: 'pestel',
  PORTER: 'porter',
} as const;

type SubtabId = (typeof SUBTAB_IDS)[keyof typeof SUBTAB_IDS];

const SUBTABS = [
  {
    id: SUBTAB_IDS.DOFA,
    label: 'Análisis DOFA',
    icon: <Target className="h-4 w-4" />,
  },
  {
    id: SUBTAB_IDS.TOWS,
    label: 'Estrategias TOWS',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    id: SUBTAB_IDS.PESTEL,
    label: 'Análisis PESTEL',
    icon: <Globe className="h-4 w-4" />,
  },
  {
    id: SUBTAB_IDS.PORTER,
    label: '5 Fuerzas Porter',
    icon: <Compass className="h-4 w-4" />,
  },
];

// =============================================================================
// MOCK DATA (Temporal - será reemplazado por hooks de API)
// =============================================================================

const MOCK_ANALISIS_DOFA: AnalisisDOFA | null = null;
const MOCK_ANALISIS_PESTEL: AnalisisPESTEL | null = null;
const MOCK_ANALISIS_PORTER: AnalisisPorter | null = null;

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const ContextoOrganizacionalTab = ({
  activeSection: _activeSection,
}: ContextoOrganizacionalTabProps) => {
  const [activeSubtab, setActiveSubtab] = useState<SubtabId>(SUBTAB_IDS.DOFA);

  // TODO: Reemplazar con hooks de API reales
  const analisisDofa = MOCK_ANALISIS_DOFA;
  const analisisPestel = MOCK_ANALISIS_PESTEL;
  const analisisPorter = MOCK_ANALISIS_PORTER;

  const _isLoading = false;
  const error = null;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCreateAnalisisDofa = () => {
    // TODO: Abrir modal de creación
  };

  const handleCreateAnalisisPestel = () => {
    // TODO: Abrir modal de creación
  };

  const handleCreateAnalisisPorter = () => {
    // TODO: Abrir modal de creación
  };

  const handleFactorDofaClick = (_factor: FactorDOFA) => {
    // TODO: Abrir modal de detalle/edición
  };

  const handleEstrategiaTowsClick = (_estrategia: EstrategiaTOWS) => {
    // TODO: Abrir modal de detalle/edición
  };

  const handleFactorPestelClick = (_factor: FactorPESTEL) => {
    // TODO: Abrir modal de detalle/edición
  };

  const handleFuerzaPorterClick = (_fuerza: FuerzaPorter) => {
    // TODO: Abrir modal de detalle/edición
  };

  const handleExportAnalisis = () => {
    // TODO: Implementar exportación a PDF/Excel
  };

  // =============================================================================
  // RENDER SECTIONS
  // =============================================================================

  const renderDOFASection = () => {
    if (!analisisDofa) {
      return (
        <Card>
          <EmptyState
            icon={<Target className="h-12 w-12" />}
            title="Sin Análisis DOFA"
            description="No hay un análisis DOFA vigente. Crea uno para identificar fortalezas, oportunidades, debilidades y amenazas de la organización."
            action={{
              label: 'Crear Análisis DOFA',
              onClick: handleCreateAnalisisDofa,
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        </Card>
      );
    }

    const factores = analisisDofa.factores || [];
    const _estrategias = analisisDofa.estrategias || [];

    return (
      <div className="space-y-6">
        {/* Header con información del análisis */}
        <Card padding="sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {analisisDofa.nombre}
                </h3>
                <Badge
                  variant={
                    analisisDofa.estado === 'vigente'
                      ? 'success'
                      : analisisDofa.estado === 'aprobado'
                        ? 'info'
                        : 'warning'
                  }
                >
                  {analisisDofa.estado}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Periodo: {analisisDofa.periodo}</span>
                <span>Fecha: {new Date(analisisDofa.fecha_analisis).toLocaleDateString()}</span>
                {analisisDofa.responsable_detail && (
                  <span>
                    Responsable: {analisisDofa.responsable_detail.first_name}{' '}
                    {analisisDofa.responsable_detail.last_name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAnalisis}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Exportar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateAnalisisDofa}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Nuevo Análisis
              </Button>
            </div>
          </div>
        </Card>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {factores.filter((f) => f.tipo === 'fortaleza').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fortalezas</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {factores.filter((f) => f.tipo === 'oportunidad').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Oportunidades</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {factores.filter((f) => f.tipo === 'debilidad').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Debilidades</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {factores.filter((f) => f.tipo === 'amenaza').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Amenazas</p>
            </div>
          </Card>
        </div>

        {/* Matriz DOFA Visual */}
        <Card>
          <div className="p-6">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Matriz DOFA
            </h4>
            <MatrizDOFAVisual factores={factores} onFactorClick={handleFactorDofaClick} />
          </div>
        </Card>

        {/* Observaciones */}
        {analisisDofa.observaciones && (
          <Card padding="sm">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Observaciones
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analisisDofa.observaciones}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderTOWSSection = () => {
    if (!analisisDofa) {
      return (
        <Card>
          <EmptyState
            icon={<TrendingUp className="h-12 w-12" />}
            title="Sin Estrategias TOWS"
            description="Las estrategias TOWS se generan a partir del análisis DOFA. Primero debes crear un análisis DOFA."
            action={{
              label: 'Ir a Análisis DOFA',
              onClick: () => setActiveSubtab(SUBTAB_IDS.DOFA),
              icon: <Target className="h-4 w-4" />,
            }}
          />
        </Card>
      );
    }

    const estrategias = analisisDofa.estrategias || [];

    if (estrategias.length === 0) {
      return (
        <Card>
          <EmptyState
            icon={<TrendingUp className="h-12 w-12" />}
            title="Sin Estrategias Definidas"
            description="No hay estrategias TOWS definidas para este análisis. Las estrategias TOWS cruzan los factores DOFA para generar acciones estratégicas."
            action={{
              label: 'Agregar Estrategia',
              onClick: () => {},
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <Card padding="sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Estrategias TOWS - {analisisDofa.nombre}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Matriz de estrategias cruzadas basadas en el análisis DOFA
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAnalisis}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Exportar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {}}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Nueva Estrategia
              </Button>
            </div>
          </div>
        </Card>

        {/* Grid de estrategias TOWS */}
        <Card>
          <div className="p-6">
            <EstrategiasTOWSGrid
              estrategias={estrategias}
              onEstrategiaClick={handleEstrategiaTowsClick}
            />
          </div>
        </Card>
      </div>
    );
  };

  const renderPESTELSection = () => {
    if (!analisisPestel) {
      return (
        <Card>
          <EmptyState
            icon={<Globe className="h-12 w-12" />}
            title="Sin Análisis PESTEL"
            description="No hay un análisis PESTEL vigente. Crea uno para evaluar factores Políticos, Económicos, Sociales, Tecnológicos, Ecológicos y Legales del entorno."
            action={{
              label: 'Crear Análisis PESTEL',
              onClick: handleCreateAnalisisPestel,
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        </Card>
      );
    }

    const factores = analisisPestel.factores || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <Card padding="sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {analisisPestel.nombre}
                </h3>
                <Badge
                  variant={
                    analisisPestel.estado === 'vigente'
                      ? 'success'
                      : analisisPestel.estado === 'aprobado'
                        ? 'info'
                        : 'warning'
                  }
                >
                  {analisisPestel.estado}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Periodo: {analisisPestel.periodo}</span>
                <span>Alcance: {analisisPestel.alcance_geografico}</span>
                <span>Factores: {factores.length}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAnalisis}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Exportar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateAnalisisPestel}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Nuevo Análisis
              </Button>
            </div>
          </div>
        </Card>

        {/* Estadísticas por tipo */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {['politico', 'economico', 'social', 'tecnologico', 'ecologico', 'legal'].map((tipo) => (
            <Card key={tipo} padding="sm">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {factores.filter((f) => f.tipo === tipo).length}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{tipo}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Gráfico PESTEL */}
        <Card>
          <div className="p-6">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Factores del Entorno
            </h4>
            <PESTELChart factores={factores} onFactorClick={handleFactorPestelClick} />
          </div>
        </Card>
      </div>
    );
  };

  const renderPorterSection = () => {
    if (!analisisPorter) {
      return (
        <Card>
          <EmptyState
            icon={<Compass className="h-12 w-12" />}
            title="Sin Análisis Porter"
            description="No hay un análisis de las 5 Fuerzas de Porter vigente. Crea uno para evaluar la competitividad del sector y posición estratégica de la organización."
            action={{
              label: 'Crear Análisis Porter',
              onClick: handleCreateAnalisisPorter,
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        </Card>
      );
    }

    const fuerzas = analisisPorter.fuerzas || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <Card padding="sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {analisisPorter.nombre}
                </h3>
                <Badge
                  variant={
                    analisisPorter.estado === 'vigente'
                      ? 'success'
                      : analisisPorter.estado === 'aprobado'
                        ? 'info'
                        : 'warning'
                  }
                >
                  {analisisPorter.estado}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Sector: {analisisPorter.sector_industria}</span>
                <span>Mercado: {analisisPorter.mercado_objetivo}</span>
                <span>Fuerzas evaluadas: {fuerzas.length}/5</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAnalisis}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Exportar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateAnalisisPorter}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Nuevo Análisis
              </Button>
            </div>
          </div>
        </Card>

        {/* Indicador de completitud */}
        {fuerzas.length < 5 && (
          <Card padding="sm" variant="bordered">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                El análisis está incompleto. Faltan {5 - fuerzas.length} fuerzas por evaluar.
              </p>
            </div>
          </Card>
        )}

        {/* Diagrama de Porter */}
        <Card>
          <div className="p-6">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-6">
              5 Fuerzas de Porter
            </h4>
            <PorterDiagram fuerzas={fuerzas} onFuerzaClick={handleFuerzaPorterClick} />
          </div>
        </Card>

        {/* Observaciones */}
        {analisisPorter.observaciones && (
          <Card padding="sm">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Conclusiones
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analisisPorter.observaciones}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // =============================================================================
  // RENDER PRINCIPAL
  // =============================================================================

  if (error) {
    return (
      <Card>
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title="Error al cargar análisis"
          description="No se pudo cargar la información del contexto organizacional. Por favor, intenta de nuevo."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subtabs */}
      <Tabs
        tabs={SUBTABS}
        activeTab={activeSubtab}
        onChange={(tabId) => setActiveSubtab(tabId as SubtabId)}
        variant="pills"
      />

      {/* Contenido dinámico según subtab activo */}
      {activeSubtab === SUBTAB_IDS.DOFA && renderDOFASection()}
      {activeSubtab === SUBTAB_IDS.TOWS && renderTOWSSection()}
      {activeSubtab === SUBTAB_IDS.PESTEL && renderPESTELSection()}
      {activeSubtab === SUBTAB_IDS.PORTER && renderPorterSection()}
    </div>
  );
};

export default ContextoOrganizacionalTab;
