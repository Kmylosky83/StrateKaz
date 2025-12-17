/**
 * Tab de Planeación Estratégica
 *
 * Secciones dinámicas desde BD (TabSection.code):
 * - mapa_estrategico: Mapa Estratégico visual
 * - objetivos_bsc: Objetivos por perspectiva BSC + vinculación ISO
 *
 * Usa Design System:
 * - Card para contenedores
 * - Badge para etiquetas BSC/ISO
 * - Button para acciones
 * - Progress bar para objetivos
 * - EmptyState para estados vacíos
 */
import { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Edit,
  Map,
  TrendingUp,
  Users,
  Cog,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Upload,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState } from '@/components/common';
import { useActivePlan, useObjectives } from '../hooks/useStrategic';
import { PlanFormModal } from './modals/PlanFormModal';
import { ObjectiveFormModal } from './modals/ObjectiveFormModal';
import type { StrategicPlan, StrategicObjective } from '../types/strategic.types';

// =============================================================================
// CONFIGURACIÓN DE VISUALIZACIÓN (UI Config - válido hardcodear)
// =============================================================================

const BSC_CONFIG = {
  FINANCIERA: {
    label: 'Financiera',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    borderColor: 'border-green-500',
  },
  CLIENTES: {
    label: 'Clientes',
    icon: Users,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    borderColor: 'border-blue-500',
  },
  PROCESOS: {
    label: 'Procesos Internos',
    icon: Cog,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    borderColor: 'border-orange-500',
  },
  APRENDIZAJE: {
    label: 'Aprendizaje y Crecimiento',
    icon: GraduationCap,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    borderColor: 'border-purple-500',
  },
};

const STATUS_CONFIG = {
  PENDIENTE: { icon: Clock, color: 'gray', label: 'Pendiente' },
  EN_PROGRESO: { icon: TrendingUp, color: 'info', label: 'En Progreso' },
  COMPLETADO: { icon: CheckCircle2, color: 'success', label: 'Completado' },
  CANCELADO: { icon: XCircle, color: 'danger', label: 'Cancelado' },
  RETRASADO: { icon: AlertCircle, color: 'warning', label: 'Retrasado' },
};

// =============================================================================
// SECCIÓN: MAPA ESTRATÉGICO
// =============================================================================
interface MapaEstrategicoSectionProps {
  plan: StrategicPlan;
  onEditPlan: () => void;
}

const MapaEstrategicoSection = ({ plan, onEditPlan }: MapaEstrategicoSectionProps) => {
  return (
    <div className="space-y-6">
      {/* Header del Plan */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {plan.name}
                </h2>
                <Badge variant={plan.approved_by ? 'success' : 'warning'}>
                  {plan.approved_by ? 'Aprobado' : 'Pendiente Aprobación'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(plan.start_date).toLocaleDateString()} -{' '}
                {new Date(plan.end_date).toLocaleDateString()} | {plan.period_type_display}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={onEditPlan}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Plan
            </Button>
          </div>

          {/* Progress general */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progreso General
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {plan.progress || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${plan.progress || 0}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Mapa Estratégico Visual */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Map className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Mapa Estratégico
              </h3>
            </div>
            <Button variant="secondary" size="sm" onClick={onEditPlan}>
              <Upload className="h-4 w-4 mr-2" />
              Actualizar Imagen
            </Button>
          </div>

          {plan.strategic_map_image ? (
            <img
              src={plan.strategic_map_image}
              alt="Mapa Estratégico"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Map className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No hay mapa estratégico cargado
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Edita el plan para subir una imagen del mapa estratégico
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// =============================================================================
// SECCIÓN: OBJETIVOS BSC
// =============================================================================
interface ObjetivosBscSectionProps {
  objectives: StrategicObjective[];
  onAddObjective: () => void;
  onEditObjective: (objective: StrategicObjective) => void;
}

const ObjetivosBscSection = ({
  objectives,
  onAddObjective,
  onEditObjective,
}: ObjetivosBscSectionProps) => {
  // Agrupar objetivos por perspectiva BSC
  const objectivesByPerspective = Object.keys(BSC_CONFIG).reduce(
    (acc, key) => {
      acc[key] = objectives.filter((obj) => obj.bsc_perspective === key);
      return acc;
    },
    {} as Record<string, StrategicObjective[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Objetivos Estratégicos
          </h2>
          <Badge variant="gray">{objectives.length} objetivos</Badge>
        </div>
        <Button variant="primary" size="sm" onClick={onAddObjective}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Objetivo
        </Button>
      </div>

      {/* Objetivos por perspectiva BSC */}
      {Object.entries(BSC_CONFIG).map(([key, config]) => {
        const perspectiveObjectives = objectivesByPerspective[key] || [];
        const Icon = config.icon;

        return (
          <Card key={key}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {config.label}
                  </h3>
                  <Badge variant="gray" size="sm">
                    {perspectiveObjectives.length}
                  </Badge>
                </div>
              </div>

              {perspectiveObjectives.length > 0 ? (
                <div className="space-y-4">
                  {perspectiveObjectives.map((objective) => {
                    const statusConfig =
                      STATUS_CONFIG[objective.status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = statusConfig?.icon || Clock;

                    return (
                      <div
                        key={objective.id}
                        className={`p-4 rounded-lg border-l-4 ${config.borderColor} bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer`}
                        onClick={() => onEditObjective(objective)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                {objective.code}
                              </span>
                              <Badge
                                variant={
                                  statusConfig?.color as
                                    | 'gray'
                                    | 'info'
                                    | 'success'
                                    | 'danger'
                                    | 'warning'
                                }
                                size="sm"
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig?.label}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                              {objective.name}
                            </h4>

                            {/* ISO Standards */}
                            {objective.iso_standards_display &&
                              objective.iso_standards_display.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {objective.iso_standards_display.map((std, idx) => (
                                    <Badge key={idx} variant="primary" size="sm">
                                      {std}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                            {/* Progress */}
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {objective.current_value || 0} / {objective.target_value || 0}{' '}
                                  {objective.unit}
                                </span>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {objective.progress}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${objective.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay objetivos en esta perspectiva
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface PlaneacionTabProps {
  /** Código de la sección activa (desde API/DynamicSections) */
  activeSection?: string;
  triggerNewForm?: number;
}

/**
 * Códigos de sección (deben coincidir con BD)
 */
const SECTION_KEYS = {
  MAPA_ESTRATEGICO: 'mapa_estrategico',
  OBJETIVOS_BSC: 'objetivos_bsc',
} as const;

export const PlaneacionTab = ({ activeSection, triggerNewForm }: PlaneacionTabProps) => {
  const { data: plan, isLoading: planLoading } = useActivePlan();
  const { data: objectivesData, isLoading: objectivesLoading } = useObjectives(
    plan?.id ? { plan: plan.id } : undefined
  );

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<StrategicObjective | null>(null);

  // Trigger desde el header para abrir modal de nuevo plan
  useEffect(() => {
    if (triggerNewForm && triggerNewForm > 0) {
      setShowPlanModal(true);
    }
  }, [triggerNewForm]);

  const objectives = objectivesData?.results || [];

  const handleEditObjective = (objective: StrategicObjective) => {
    setSelectedObjective(objective);
    setShowObjectiveModal(true);
  };

  const handleAddObjective = () => {
    setSelectedObjective(null);
    setShowObjectiveModal(true);
  };

  const handleEditPlan = () => {
    setShowPlanModal(true);
  };

  const isLoading = planLoading || objectivesLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        </Card>
      </div>
    );
  }

  // Empty state - sin plan
  if (!plan) {
    return (
      <>
        <EmptyState
          icon={<Target className="h-12 w-12" />}
          title="Sin Plan Estratégico"
          description="No hay un plan estratégico activo. Usa el botón 'Nuevo Plan' en la parte superior para comenzar."
        />
        <PlanFormModal
          plan={null}
          isOpen={showPlanModal}
          onClose={() => setShowPlanModal(false)}
        />
      </>
    );
  }

  // Renderizar sección según activeSection
  const renderSection = () => {
    switch (activeSection) {
      case SECTION_KEYS.MAPA_ESTRATEGICO:
        return <MapaEstrategicoSection plan={plan} onEditPlan={handleEditPlan} />;

      case SECTION_KEYS.OBJETIVOS_BSC:
        return (
          <ObjetivosBscSection
            objectives={objectives}
            onAddObjective={handleAddObjective}
            onEditObjective={handleEditObjective}
          />
        );

      default:
        // Si no hay sección activa, mostrar Mapa Estratégico por defecto
        if (activeSection) {
          console.warn(
            `[PlaneacionTab] Sección "${activeSection}" no encontrada en SECTION_KEYS. ` +
            `Secciones disponibles: ${Object.values(SECTION_KEYS).join(', ')}`
          );
        }
        return <MapaEstrategicoSection plan={plan} onEditPlan={handleEditPlan} />;
    }
  };

  return (
    <>
      <div className="space-y-6">{renderSection()}</div>

      {/* Modales */}
      <PlanFormModal
        plan={plan}
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
      />

      {plan && (
        <ObjectiveFormModal
          objective={selectedObjective}
          planId={plan.id}
          isOpen={showObjectiveModal}
          onClose={() => {
            setShowObjectiveModal(false);
            setSelectedObjective(null);
          }}
        />
      )}
    </>
  );
};
