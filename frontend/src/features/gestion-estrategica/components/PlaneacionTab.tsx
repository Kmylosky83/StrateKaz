/**
 * Tab de Planeación Estratégica
 *
 * Secciones (desde BD - tab 'planeacion'):
 * - objetivos_bsc: Objetivos por perspectiva BSC + vinculación ISO
 * - mapa_estrategico: Mapa Estratégico visual interactivo con React Flow
 * - kpis: Indicadores de desempeño con metas y semáforos
 * - gestion_cambio: Gestión de cambios organizacionales
 *
 * NOTA: Las secciones de Contexto (Stakeholders, DOFA, PESTEL, Porter, TOWS)
 * están en el tab 'contexto' y se manejan en ContextoTab.tsx
 *
 * Usa Design System:
 * - StatsGrid para métricas del plan
 * - DataSection para encabezado de sección con icono y acciones
 * - Card para contenedores
 * - Badge para etiquetas BSC/ISO
 * - Button para acciones
 * - EmptyState para estados vacíos
 * - MapaEstrategicoCanvas para visualización interactiva del mapa (React Flow)
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
  Calendar,
  FileCheck,
  Percent,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState } from '@/components/common';
import { StatsGrid } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DataSection } from '@/components/data-display';
import { useActivePlan, useObjectives, useApprovePlan } from '../hooks/useStrategic';
import { PlanFormModal } from './modals/PlanFormModal';
import { ObjectiveFormModal } from './modals/ObjectiveFormModal';
import type { StrategicPlan, StrategicObjective } from '../types/strategic.types';
import { MapaEstrategicoCanvas } from './mapa-estrategico';
import { GestionCambioTab } from './GestionCambioTab';
import { KPIsTab } from './kpis';

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
// SECCIÓN: MAPA ESTRATÉGICO (Vista 1: Cards de Información)
// =============================================================================
interface MapaEstrategicoSectionProps {
  plan: StrategicPlan | null;
  onEditPlan: () => void;
  onCreatePlan: () => void;
  onApprovePlan: () => void;
  isApproving?: boolean;
  isLoading?: boolean;
}

/**
 * Calcula los stats para el StatsGrid del plan estratégico
 */
const getPlanStats = (plan: StrategicPlan): StatItem[] => {
  const progress = plan.progress || 0;
  const isApproved = !!plan.approved_by;

  // Calcular días restantes
  const endDate = new Date(plan.end_date);
  const today = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return [
    {
      label: 'Progreso',
      value: `${progress}%`,
      icon: Percent,
      iconColor: progress >= 75 ? 'success' : progress >= 50 ? 'info' : 'warning',
      description: progress >= 75 ? 'Avance excelente' : progress >= 50 ? 'En buen camino' : 'Requiere atención',
    },
    {
      label: 'Período',
      value: plan.period_type_display || 'N/A',
      icon: Calendar,
      iconColor: 'primary',
      description: `${new Date(plan.start_date).toLocaleDateString('es-CO')} - ${new Date(plan.end_date).toLocaleDateString('es-CO')}`,
    },
    {
      label: 'Estado',
      value: isApproved ? 'Aprobado' : 'Pendiente',
      icon: isApproved ? FileCheck : Clock,
      iconColor: isApproved ? 'success' : 'warning',
      description: isApproved ? 'Plan aprobado y activo' : 'Pendiente de aprobación',
    },
    {
      label: 'Tiempo Restante',
      value: daysRemaining > 0 ? `${daysRemaining} días` : 'Finalizado',
      icon: Clock,
      iconColor: daysRemaining > 90 ? 'success' : daysRemaining > 30 ? 'info' : 'warning',
      description: daysRemaining > 0 ? 'Para completar el plan' : 'El período ha finalizado',
    },
  ];
};

const MapaEstrategicoSection = ({
  plan,
  onEditPlan,
  onCreatePlan,
  onApprovePlan,
  isApproving,
  isLoading,
}: MapaEstrategicoSectionProps) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
          ))}
        </div>
        <div className="h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
      </div>
    );
  }

  // Empty state - sin plan (con CTA)
  if (!plan) {
    return (
      <div className="space-y-6">
        {/* DataSection header incluso sin plan */}
        <DataSection
          title="Mapa Estratégico"
          description="Visualización interactiva del plan estratégico de la organización"
          icon={Map}
          iconVariant="purple"
          action={
            <Button variant="primary" size="sm" onClick={onCreatePlan}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Plan
            </Button>
          }
        >
          <EmptyState
            icon={<Target className="h-12 w-12" />}
            title="Sin Plan Estratégico"
            description="No hay un plan estratégico activo. Crea uno para definir los objetivos y metas de tu organización."
            action={{
              label: 'Crear Primer Plan',
              onClick: onCreatePlan,
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        </DataSection>
      </div>
    );
  }

  // Plan activo - Canvas interactivo con React Flow
  const stats = getPlanStats(plan);

  return (
    <div className="space-y-6">
      {/* 1. StatsGrid con métricas del plan */}
      <StatsGrid stats={stats} columns={4} moduleColor="purple" />

      {/* 2. Header con info del plan y acciones */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Map className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(plan.start_date).toLocaleDateString('es-CO')} -{' '}
                  {new Date(plan.end_date).toLocaleDateString('es-CO')} | {plan.period_type_display}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={plan.approved_by ? 'success' : 'warning'} size="lg">
                {plan.approved_by ? 'Aprobado' : 'Pendiente Aprobación'}
              </Badge>
              {!plan.approved_by && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onApprovePlan}
                  disabled={isApproving}
                  isLoading={isApproving}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprobar Plan
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={onEditPlan}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Plan
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Canvas interactivo del Mapa Estratégico */}
      <MapaEstrategicoCanvas planId={plan.id} height={650} />

      {/* 4. Footer con última actualización */}
      {plan.updated_at && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
          Última actualización: {new Date(plan.updated_at).toLocaleString('es-CO')}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// SECCIÓN: OBJETIVOS BSC (Vista 2B: Lista CRUD con StatsGrid)
// =============================================================================
interface ObjetivosBscSectionProps {
  objectives: StrategicObjective[];
  onAddObjective: () => void;
  onEditObjective: (objective: StrategicObjective) => void;
  isLoading?: boolean;
}

/**
 * Calcula estadísticas de objetivos para el StatsGrid
 */
const getObjectivesStats = (objectives: StrategicObjective[]): StatItem[] => {
  const total = objectives.length;
  const completados = objectives.filter((o) => o.status === 'COMPLETADO').length;
  const enProgreso = objectives.filter((o) => o.status === 'EN_PROGRESO').length;
  const retrasados = objectives.filter((o) => o.status === 'RETRASADO').length;

  // Calcular progreso promedio
  const progresoPromedio =
    total > 0 ? Math.round(objectives.reduce((sum, o) => sum + (o.progress || 0), 0) / total) : 0;

  return [
    {
      label: 'Total Objetivos',
      value: total,
      icon: Target,
      iconColor: 'primary',
      description: 'Objetivos estratégicos definidos',
    },
    {
      label: 'Completados',
      value: completados,
      icon: CheckCircle2,
      iconColor: 'success',
      description: `${total > 0 ? Math.round((completados / total) * 100) : 0}% del total`,
    },
    {
      label: 'En Progreso',
      value: enProgreso,
      icon: TrendingUp,
      iconColor: 'info',
      description: 'Objetivos activos actualmente',
    },
    {
      label: 'Progreso Promedio',
      value: `${progresoPromedio}%`,
      icon: Percent,
      iconColor: progresoPromedio >= 75 ? 'success' : progresoPromedio >= 50 ? 'info' : 'warning',
      description: retrasados > 0 ? `${retrasados} retrasado${retrasados > 1 ? 's' : ''}` : 'Sin retrasos',
    },
  ];
};

const ObjetivosBscSection = ({
  objectives,
  onAddObjective,
  onEditObjective,
  isLoading,
}: ObjetivosBscSectionProps) => {
  // Agrupar objetivos por perspectiva BSC
  const objectivesByPerspective = Object.keys(BSC_CONFIG).reduce(
    (acc, key) => {
      acc[key] = objectives.filter((obj) => obj.bsc_perspective === key);
      return acc;
    },
    {} as Record<string, StrategicObjective[]>
  );

  // Stats para el StatsGrid
  const stats = getObjectivesStats(objectives);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle"
            />
          ))}
        </div>
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. StatsGrid con métricas de objetivos */}
      <StatsGrid stats={stats} columns={4} moduleColor="purple" />

      {/* 2. DataSection header con descripción y acción */}
      <DataSection
        title="Objetivos por Perspectiva BSC"
        description="Gestiona los objetivos estratégicos organizados según las cuatro perspectivas del Balanced Scorecard"
        icon={Target}
        iconVariant="purple"
        action={
          <Button variant="primary" size="sm" onClick={onAddObjective}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Objetivo
          </Button>
        }
      >
        {/* 3. Empty state si no hay objetivos */}
        {objectives.length === 0 ? (
          <EmptyState
            icon={<Target className="h-12 w-12" />}
            title="Sin Objetivos Estratégicos"
            description="No hay objetivos definidos. Crea el primer objetivo para comenzar a medir el desempeño estratégico."
            action={{
              label: 'Crear Primer Objetivo',
              onClick: onAddObjective,
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        ) : (
          /* 4. Grid de perspectivas BSC con objetivos */
          <div className="space-y-6">
            {Object.entries(BSC_CONFIG).map(([key, config]) => {
              const perspectiveObjectives = objectivesByPerspective[key] || [];
              const Icon = config.icon;

              return (
                <Card key={key}>
                  <div className="p-6">
                    {/* Header de perspectiva */}
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

                    {/* Lista de objetivos */}
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

                                  {/* Normas ISO vinculadas (dinámico) */}
                                  {objective.normas_iso_detail &&
                                    objective.normas_iso_detail.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {objective.normas_iso_detail.map((norma) => (
                                          <Badge key={norma.id} variant="primary" size="sm">
                                            {norma.code}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}

                                  {/* Barra de progreso */}
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {objective.current_value || 0} /{' '}
                                        {objective.target_value || 100} {objective.unit || '%'}
                                      </span>
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {objective.progress || 0}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                      <div
                                        className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${objective.progress || 0}%` }}
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
        )}
      </DataSection>
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
 * Códigos de sección de Planeación Estratégica (deben coincidir con BD)
 * NOTA: Las secciones de Contexto (Stakeholders, DOFA, PESTEL, Porter, TOWS)
 * están en el tab 'contexto' y se manejan en ContextoTab.tsx
 */
const SECTION_KEYS = {
  // Secciones de Planeación Estratégica
  OBJETIVOS_BSC: 'objetivos_bsc',
  MAPA_ESTRATEGICO: 'mapa_estrategico',
  KPIS: 'kpis',
  GESTION_CAMBIO: 'gestion_cambio',
} as const;

export const PlaneacionTab = ({ activeSection, triggerNewForm }: PlaneacionTabProps) => {
  const { data: plan, isLoading: planLoading } = useActivePlan();
  const { data: objectivesData } = useObjectives(
    plan?.id ? { plan: plan.id } : undefined
  );
  const approvePlanMutation = useApprovePlan();

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

  const handleCreatePlan = () => {
    setShowPlanModal(true);
  };

  const handleApprovePlan = () => {
    if (plan?.id) {
      approvePlanMutation.mutate(plan.id);
    }
  };

  // Renderizar sección según activeSection
  // Cada sección maneja su propio loading/empty state internamente
  const renderSection = () => {
    // 1. Mapa Estratégico (Vista 1: Cards de Información)
    // Esta sección maneja su propio estado vacío y loading
    if (activeSection === SECTION_KEYS.MAPA_ESTRATEGICO || !activeSection) {
      return (
        <MapaEstrategicoSection
          plan={plan ?? null}
          onEditPlan={handleEditPlan}
          onCreatePlan={handleCreatePlan}
          onApprovePlan={handleApprovePlan}
          isApproving={approvePlanMutation.isPending}
          isLoading={planLoading}
        />
      );
    }

    // 2. Objetivos BSC (Vista 2B: Lista CRUD con filtros)
    // Requiere plan activo para mostrar objetivos
    if (activeSection === SECTION_KEYS.OBJETIVOS_BSC) {
      // Si está cargando o no hay plan, el componente maneja internamente el estado
      if (!plan && !planLoading) {
        return (
          <DataSection
            title="Objetivos BSC"
            description="Objetivos estratégicos por perspectiva Balanced Scorecard"
            icon={Target}
            iconVariant="purple"
            action={
              <Button variant="primary" size="sm" onClick={handleCreatePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Plan
              </Button>
            }
          >
            <EmptyState
              icon={<Target className="h-12 w-12" />}
              title="Sin Plan Estratégico"
              description="Primero debes crear un plan estratégico para poder definir objetivos BSC."
              action={{
                label: 'Crear Plan Primero',
                onClick: handleCreatePlan,
                icon: <Plus className="h-4 w-4" />,
              }}
            />
          </DataSection>
        );
      }

      return (
        <ObjetivosBscSection
          objectives={objectives}
          onAddObjective={handleAddObjective}
          onEditObjective={handleEditObjective}
          isLoading={planLoading}
        />
      );
    }

    // 3. KPIs - Indicadores de desempeño con metas y semáforos
    if (activeSection === SECTION_KEYS.KPIS) {
      if (!plan) {
        return (
          <DataSection
            title="KPIs"
            description="Indicadores de desempeño con metas y semáforos de seguimiento"
            icon={Target}
            iconVariant="purple"
            action={
              <Button variant="primary" size="sm" onClick={handleCreatePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Plan
              </Button>
            }
          >
            <EmptyState
              icon={<Target className="h-12 w-12" />}
              title="Sin Plan Estratégico"
              description="Primero debes crear un plan estratégico con objetivos para poder definir KPIs."
              action={{
                label: 'Crear Plan Primero',
                onClick: handleCreatePlan,
                icon: <Plus className="h-4 w-4" />,
              }}
            />
          </DataSection>
        );
      }
      return <KPIsTab planId={plan.id} />;
    }

    // 4. Gestión del Cambio
    if (activeSection === SECTION_KEYS.GESTION_CAMBIO) {
      return <GestionCambioTab />;
    }

    // 5. Sección no encontrada - mostrar Objetivos BSC por defecto
    console.warn(
      `[PlaneacionTab] Sección "${activeSection}" no encontrada. ` +
        `Secciones disponibles: ${Object.values(SECTION_KEYS).join(', ')}`
    );
    return (
      <ObjetivosBscSection
        objectives={objectives}
        onAddObjective={handleAddObjective}
        onEditObjective={handleEditObjective}
        isLoading={planLoading}
      />
    );
  };

  return (
    <>
      <div className="space-y-6">{renderSection()}</div>

      {/* Modales */}
      <PlanFormModal
        plan={plan ?? null}
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
