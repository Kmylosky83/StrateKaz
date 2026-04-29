/**
 * EjecucionPage - Bandeja de trabajo y gestión de instancias
 *
 * Tabs:
 * 1. Bandeja de Trabajo - Tabla de tareas pendientes con acción "Resolver"
 * 2. Instancias - Tabla de instancias de flujo con "Iniciar Flujo"
 *
 * Modals integrados: TareaFormModal, IniciarFlujoModal, ConfirmDialog (cancelar)
 */
import { useState } from 'react';
import { Play, ArrowLeft, CheckCircle2, User, GitBranch, XCircle } from 'lucide-react';
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
  ConfirmDialog,
} from '@/components/common';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/layout';
import TareaFormModal from '../components/TareaFormModal';
import IniciarFlujoModal from '../components/IniciarFlujoModal';
import {
  useMisTareas,
  useEstadisticasTareas,
  useEstadisticasInstancias,
  useInstancias,
} from '../hooks/useWorkflows';
import type {
  TareaActiva,
  InstanciaFlujo,
  EstadoTarea,
  EstadoInstancia,
  Prioridad,
} from '../types/workflow.types';

// ============================================================
// UTILIDADES
// ============================================================

const prioridadLabels: Record<Prioridad, string> = {
  BAJA: 'Baja',
  NORMAL: 'Normal',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

const estadoInstanciaLabels: Record<EstadoInstancia, string> = {
  INICIADO: 'Iniciado',
  EN_PROCESO: 'En Proceso',
  PAUSADO: 'Pausado',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

const tipoTareaLabels: Record<string, string> = {
  APROBACION: 'Aprobación',
  REVISION: 'Revisión',
  FORMULARIO: 'Formulario',
  NOTIFICACION: 'Notificación',
  FIRMA: 'Firma',
  SISTEMA: 'Sistema',
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

type ActiveTabType = 'bandeja' | 'instancias';

// ============================================================
// PAGINA PRINCIPAL
// ============================================================

export default function EjecucionPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTabType>('bandeja');
  const [tareaFilter, setTareaFilter] = useState<EstadoTarea | ''>('');
  const [instanciaFilter, setInstanciaFilter] = useState<EstadoInstancia | ''>('');

  // Modals
  const [selectedTarea, setSelectedTarea] = useState<TareaActiva | null>(null);
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [showIniciarFlujoModal, setShowIniciarFlujoModal] = useState(false);
  const [cancellingInstancia, setCancellingInstancia] = useState<InstanciaFlujo | null>(null);

  // Queries
  const { data: misTareasData, isLoading: loadingMisTareas } = useMisTareas(
    tareaFilter || undefined
  );
  const { data: statsTareas, isLoading: loadingStatsTareas } = useEstadisticasTareas();
  const { data: statsInstancias, isLoading: loadingStatsInstancias } = useEstadisticasInstancias();
  const { data: instanciasData, isLoading: loadingInstancias } = useInstancias(
    instanciaFilter ? { estado: instanciaFilter } : undefined
  );

  const misTareas = misTareasData?.tareas ?? [];
  const instancias = Array.isArray(instanciasData)
    ? instanciasData
    : (instanciasData?.results ?? []);

  const loadingStats = loadingStatsTareas || loadingStatsInstancias;

  const handleResolverTarea = (tarea: TareaActiva) => {
    setSelectedTarea(tarea);
    setShowTareaModal(true);
  };

  const tabs = [
    {
      id: 'bandeja' as const,
      label: 'Bandeja de Trabajo',
      count: statsTareas ? statsTareas.pendientes + statsTareas.en_progreso : undefined,
    },
    {
      id: 'instancias' as const,
      label: 'Instancias',
      count: statsInstancias?.activas,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ejecución y Tareas"
        description="Bandeja de trabajo, gestión de tareas e instancias de flujo"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button variant="primary" onClick={() => setShowIniciarFlujoModal(true)}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar Flujo
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      {loadingStats ? (
        <KpiCardGrid columns={4}>
          {[1, 2, 3, 4].map((i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </KpiCardGrid>
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            label="Instancias Activas"
            value={statsInstancias?.activas ?? 0}
            icon={<Play className="h-5 w-5" />}
            color="purple"
          />
          <KpiCard
            label="Tareas Pendientes"
            value={statsTareas?.pendientes ?? 0}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="orange"
          />
          <KpiCard
            label="Completadas Hoy"
            value={statsTareas?.completadas_hoy ?? 0}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="green"
          />
          <KpiCard
            label="Vencidas"
            value={statsTareas?.vencidas ?? 0}
            icon={<XCircle className="h-5 w-5" />}
            color="red"
          />
        </KpiCardGrid>
      )}

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.count != null && (
                  <Badge
                    variant={activeTab === tab.id ? 'purple' : 'gray'}
                    size="sm"
                    className="ml-2"
                  >
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* ---- TAB: Bandeja de Trabajo ---- */}
        {activeTab === 'bandeja' && (
          <div>
            {/* Filtro de estado de tarea */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Filtrar:</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: '', label: 'Todas' },
                  { value: 'PENDIENTE', label: 'Pendientes' },
                  { value: 'EN_PROGRESO', label: 'En Progreso' },
                  { value: 'COMPLETADA', label: 'Completadas' },
                ].map((f) => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={tareaFilter === f.value ? 'secondary' : 'ghost'}
                    onClick={() => setTareaFilter(f.value as EstadoTarea | '')}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tabla de tareas */}
            {loadingMisTareas ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : misTareas.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<CheckCircle2 className="h-12 w-12" />}
                  title="Sin tareas"
                  description="No tienes tareas asignadas con los filtros seleccionados."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Tarea
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Instancia
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Tipo
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Prioridad
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Vencimiento
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {misTareas.map((tarea) => (
                      <tr
                        key={tarea.id}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          tarea.esta_vencida ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                              {tarea.nombre_tarea}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">{tarea.codigo_tarea}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
                            {tarea.instancia_detail?.titulo ?? '-'}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge
                            status={tarea.tipo_tarea}
                            label={tipoTareaLabels[tarea.tipo_tarea] || tarea.tipo_tarea}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge
                            status={tarea.instancia_detail?.prioridad ?? 'NORMAL'}
                            preset="prioridad"
                            label={
                              prioridadLabels[tarea.instancia_detail?.prioridad as Prioridad] ??
                              'Normal'
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <StatusBadge status={tarea.estado} />
                            {tarea.esta_vencida && (
                              <Badge variant="red" size="sm">
                                Vencida
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(tarea.fecha_vencimiento)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tarea.estado !== 'COMPLETADA' && tarea.estado !== 'RECHAZADA' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleResolverTarea(tarea)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Resolver
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---- TAB: Instancias ---- */}
        {activeTab === 'instancias' && (
          <div>
            {/* Filtro de estado */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">Filtrar:</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: '', label: 'Todas' },
                  { value: 'INICIADO', label: 'Iniciadas' },
                  { value: 'EN_PROCESO', label: 'En Proceso' },
                  { value: 'COMPLETADO', label: 'Completadas' },
                  { value: 'CANCELADO', label: 'Canceladas' },
                ].map((f) => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={instanciaFilter === f.value ? 'secondary' : 'ghost'}
                    onClick={() => setInstanciaFilter(f.value as EstadoInstancia | '')}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tabla de instancias */}
            {loadingInstancias ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : instancias.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<GitBranch className="h-12 w-12" />}
                  title="Sin instancias"
                  description="No hay instancias de flujo con los filtros seleccionados."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Código
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Título
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Plantilla
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Progreso
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Prioridad
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Inicio
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {instancias.map((inst) => (
                      <tr
                        key={inst.id}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          inst.esta_vencida ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="text-xs text-gray-500 font-mono">
                            {inst.codigo_instancia}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                              {inst.titulo}
                            </p>
                            {inst.responsable_actual_detail && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <User className="h-3 w-3" />
                                {inst.responsable_actual_detail.first_name}{' '}
                                {inst.responsable_actual_detail.last_name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {inst.plantilla_detail?.nombre ?? '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <StatusBadge
                              status={inst.estado}
                              label={estadoInstanciaLabels[inst.estado]}
                            />
                            {inst.esta_vencida && (
                              <Badge variant="red" size="sm">
                                Vencida
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full transition-all"
                                style={{ width: `${inst.progreso_porcentaje ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 w-8 text-right">
                              {inst.progreso_porcentaje ?? 0}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge
                            status={inst.prioridad}
                            preset="prioridad"
                            label={prioridadLabels[inst.prioridad]}
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(inst.fecha_inicio)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {(inst.estado === 'INICIADO' || inst.estado === 'EN_PROCESO') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCancellingInstancia(inst)}
                              >
                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal: Resolver Tarea */}
      <TareaFormModal
        tarea={selectedTarea}
        isOpen={showTareaModal}
        onClose={() => {
          setShowTareaModal(false);
          setSelectedTarea(null);
        }}
      />

      {/* Modal: Iniciar Flujo */}
      <IniciarFlujoModal
        isOpen={showIniciarFlujoModal}
        onClose={() => setShowIniciarFlujoModal(false)}
      />

      {/* Confirm: Cancelar Instancia */}
      <ConfirmDialog
        isOpen={!!cancellingInstancia}
        onClose={() => setCancellingInstancia(null)}
        onConfirm={() => {
          // Cancelar instancia se haría via una API específica
          // Por ahora solo cerramos el dialog
          setCancellingInstancia(null);
        }}
        title="Cancelar Flujo"
        message={
          <>
            ¿Estás seguro de cancelar el flujo <strong>{cancellingInstancia?.titulo}</strong>? Las
            tareas pendientes serán canceladas automáticamente.
          </>
        }
        confirmText="Cancelar Flujo"
        variant="danger"
      />
    </div>
  );
}
