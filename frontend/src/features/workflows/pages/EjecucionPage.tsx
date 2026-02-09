/**
 * EjecucionPage - Bandeja de trabajo y gestion de tareas del workflow
 *
 * Conectada a APIs reales:
 * - /api/workflows/ejecucion/tareas/mis_tareas/
 * - /api/workflows/ejecucion/tareas/estadisticas/
 * - /api/workflows/ejecucion/instancias/iniciar_flujo/
 */
import { useState } from 'react';
import {
  Play,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Filter,
  GitBranch,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Badge,
  EmptyState,
  Spinner,
  StatusBadge,
  KpiCard,
  KpiCardGrid,
  KpiCardSkeleton,
} from '@/components/common';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/layout';
import {
  useMisTareas,
  useEstadisticasTareas,
  useCompletarTarea,
  useRechazarTarea,
  usePlantillasActivas,
  useIniciarFlujo,
} from '../hooks/useWorkflows';
import type { TareaActiva, EstadoTarea, Prioridad } from '../types/workflow.types';

// ============================================================
// UTILIDADES
// ============================================================

const prioridadConfig: Record<Prioridad, { label: string; color: string }> = {
  BAJA: { label: 'Baja', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  ALTA: { label: 'Alta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  URGENTE: { label: 'Urgente', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

type TabType = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';

// ============================================================
// TARJETA DE TAREA
// ============================================================

interface TareaCardProps {
  tarea: TareaActiva;
  onCompletar: (id: number) => void;
  onRechazar: (id: number) => void;
}

const TareaCard = ({ tarea, onCompletar, onRechazar }: TareaCardProps) => {
  const isOverdue = tarea.esta_vencida;
  const prioridad = prioridadConfig[tarea.instancia_detail?.prioridad as Prioridad] ?? prioridadConfig.NORMAL;

  return (
    <Card className={`hover:shadow-md transition-shadow ${
      tarea.estado === 'EN_PROGRESO' ? 'border-l-4 border-l-blue-500' : ''
    } ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge status={tarea.estado} />
              <StatusBadge status={tarea.tipo_tarea} />
              {isOverdue && (
                <Badge variant="red" size="sm">Vencida</Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {tarea.nombre_tarea}
            </h3>
            {tarea.descripcion && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {tarea.descripcion}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {tarea.asignado_a_detail && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {tarea.asignado_a_detail.first_name} {tarea.asignado_a_detail.last_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Vence: {formatDate(tarea.fecha_vencimiento)}
              </span>
              <span className="flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5" />
                {tarea.codigo_tarea}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${prioridad.color}`}>
                {prioridad.label}
              </span>
            </div>
          </div>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            {tarea.estado !== 'COMPLETADA' && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onCompletar(tarea.id)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Completar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRechazar(tarea.id)}
                >
                  Rechazar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================================
// PAGINA PRINCIPAL
// ============================================================

export default function EjecucionPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('PENDIENTE');

  // Queries
  const { data: tareasData, isLoading: loadingTareas } = useMisTareas(activeTab);
  const { data: stats, isLoading: loadingStats } = useEstadisticasTareas();
  const { data: plantillasActivas } = usePlantillasActivas();

  // Mutations
  const completarMutation = useCompletarTarea();
  const rechazarMutation = useRechazarTarea();
  const iniciarFlujoMutation = useIniciarFlujo();

  const tareas = tareasData?.tareas ?? [];

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'PENDIENTE', label: 'Pendientes', count: stats?.pendientes },
    { id: 'EN_PROGRESO', label: 'En Proceso', count: stats?.en_progreso },
    { id: 'COMPLETADA', label: 'Completadas', count: stats?.completadas_hoy },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ejecucion y Tareas"
        description="Bandeja de trabajo y gestion de tareas pendientes"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      {loadingStats ? (
        <KpiCardGrid columns={4}>
          {[1, 2, 3, 4].map((i) => <KpiCardSkeleton key={i} />)}
        </KpiCardGrid>
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            title="Pendientes"
            value={stats?.pendientes ?? 0}
            icon="Clock"
            color="orange"
          />
          <KpiCard
            title="En Proceso"
            value={stats?.en_progreso ?? 0}
            icon="Play"
            color="blue"
          />
          <KpiCard
            title="Completadas Hoy"
            value={stats?.completadas_hoy ?? 0}
            icon="CheckCircle2"
            color="green"
          />
          <KpiCard
            title="Vencidas"
            value={stats?.vencidas ?? 0}
            icon="AlertCircle"
            color="red"
          />
        </KpiCardGrid>
      )}

      {/* Iniciar Flujo Rapido */}
      {plantillasActivas && (plantillasActivas as unknown[]).length > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Iniciar Flujo
            </h3>
            <div className="flex flex-wrap gap-2">
              {(plantillasActivas as Array<{ id: number; nombre: string; codigo: string }>).slice(0, 5).map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  size="sm"
                  onClick={() => iniciarFlujoMutation.mutate({
                    plantilla_id: p.id,
                    titulo: `${p.nombre} - ${new Date().toLocaleDateString('es-CO')}`,
                  })}
                  disabled={iniciarFlujoMutation.isPending}
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  {p.nombre}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Lista de tareas */}
      <Card>
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bandeja de Trabajo</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Tareas asignadas y procesos en ejecucion</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
                {tab.count != null && (
                  <Badge variant={activeTab === tab.id ? 'purple' : 'gray'} size="sm">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-3">
          {loadingTareas ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : tareas.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-12 w-12" />}
              title="Sin tareas"
              description={`No hay tareas ${activeTab === 'PENDIENTE' ? 'pendientes' : activeTab === 'EN_PROGRESO' ? 'en proceso' : 'completadas hoy'}`}
            />
          ) : (
            tareas.map((tarea) => (
              <TareaCard
                key={tarea.id}
                tarea={tarea}
                onCompletar={(id) => completarMutation.mutate({ id, data: {} })}
                onRechazar={(id) => rechazarMutation.mutate({
                  id,
                  data: { motivo_rechazo: 'Rechazado desde bandeja' },
                })}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
