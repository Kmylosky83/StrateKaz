/**
 * PlanificacionSistemaPage — Planificación del Sistema de Gestión
 * 5 tabs: Planes de Trabajo, Actividades, Objetivos BSC, Programas, Cronograma Gantt
 * MODULE_CODE = 'sistema_gestion'
 */
import { useState } from 'react';
import {
  CalendarDays,
  ListChecks,
  Target,
  LayoutGrid,
  GanttChartSquare,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  PlayCircle,
  XCircle,
  TrendingUp,
  Clock,
  ClipboardList,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Tabs,
  Card,
  Button,
  EmptyState,
  Spinner,
  KpiCard,
  KpiCardGrid,
  SectionToolbar,
  StatusBadge,
  Badge,
  Progress,
  ConfirmDialog,
} from '@/components/common';
import { Select } from '@/components/forms';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  usePlanesTrabajoQuery,
  useDeletePlanTrabajo,
  useAprobarPlanTrabajo,
  useCambiarEstadoPlanTrabajo,
  useActividadesPlanQuery,
  useDeleteActividadPlan,
  useObjetivosSistemaQuery,
  useDeleteObjetivoSistema,
  useProgramasGestionQuery,
  useDeleteProgramaGestion,
  useActividadesPorPlanQuery,
} from '../hooks/usePlanificacionSistema';

import { PlanTrabajoFormModal } from '../components/planificacion-sistema/PlanTrabajoFormModal';
import { ActividadPlanFormModal } from '../components/planificacion-sistema/ActividadPlanFormModal';
import { ObjetivoSistemaFormModal } from '../components/planificacion-sistema/ObjetivoSistemaFormModal';
import { ProgramaGestionFormModal } from '../components/planificacion-sistema/ProgramaGestionFormModal';
import { GanttTimeline } from '../components/planificacion-sistema/GanttTimeline';

import type {
  PlanTrabajoAnual,
  ActividadPlan,
  ObjetivoSistema,
  ProgramaGestion,
  EstadoPlanTrabajo,
  PerspectivaBSC,
} from '../types/planificacion-sistema.types';

const MODULE_CODE = 'sistema_gestion';
void MODULE_CODE;

// ==================== UTILITY FUNCTIONS ====================

const getEstadoPlanColor = (estado: string): 'default' | 'success' | 'warning' | 'danger' => {
  switch (estado) {
    case 'APROBADO':
    case 'EN_EJECUCION':
      return 'success';
    case 'EN_REVISION':
      return 'warning';
    case 'CANCELADO':
      return 'danger';
    case 'CERRADO':
      return 'default';
    default:
      return 'default';
  }
};

const getEstadoActividadColor = (estado: string): 'default' | 'success' | 'warning' | 'danger' => {
  switch (estado) {
    case 'COMPLETADA':
      return 'success';
    case 'EN_PROCESO':
      return 'warning';
    case 'RETRASADA':
    case 'CANCELADA':
      return 'danger';
    default:
      return 'default';
  }
};

const getEstadoObjetivoColor = (estado: string): 'default' | 'success' | 'warning' | 'danger' => {
  switch (estado) {
    case 'CUMPLIDO':
      return 'success';
    case 'EN_SEGUIMIENTO':
      return 'warning';
    case 'NO_CUMPLIDO':
    case 'CANCELADO':
      return 'danger';
    default:
      return 'default';
  }
};

const PERSPECTIVA_LABELS: Record<PerspectivaBSC, string> = {
  FINANCIERA: 'Financiera',
  CLIENTES: 'Clientes',
  PROCESOS: 'Procesos',
  APRENDIZAJE: 'Aprendizaje',
};

const PERSPECTIVA_COLORS: Record<PerspectivaBSC, string> = {
  FINANCIERA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  CLIENTES: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PROCESOS: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  APRENDIZAJE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

// ==================== PLANES DE TRABAJO SECTION ====================

interface PlanesSectionProps {
  onOpenModal: (item?: PlanTrabajoAnual) => void;
}

const PlanesTrabajoSection = ({ onOpenModal }: PlanesSectionProps) => {
  const { data, isLoading } = usePlanesTrabajoQuery();
  const deleteMutation = useDeletePlanTrabajo();
  const aprobarMutation = useAprobarPlanTrabajo();
  const cambiarEstadoMutation = useCambiarEstadoPlanTrabajo();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const planes = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (planes.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="w-16 h-16" />}
        title="No hay planes de trabajo registrados"
        description="Comience creando el plan de trabajo anual del sistema de gestión"
        action={{
          label: 'Nuevo Plan',
          onClick: () => onOpenModal(),
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  const stats = {
    total: planes.length,
    aprobados: planes.filter((p) => p.estado === 'APROBADO').length,
    enEjecucion: planes.filter((p) => p.estado === 'EN_EJECUCION').length,
    completados: planes.filter((p) => p.estado === 'CERRADO').length,
  };

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Planes"
          value={stats.total}
          icon={<CalendarDays className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Aprobados"
          value={stats.aprobados}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="En Ejecución"
          value={stats.enEjecucion}
          icon={<PlayCircle className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Cerrados"
          value={stats.completados}
          icon={<BookOpen className="w-5 h-5" />}
          color="default"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Planes de Trabajo Anuales"
        primaryAction={{ label: 'Nuevo Plan', onClick: () => onOpenModal() }}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Período
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Avance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Responsable
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actividades
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {planes.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {plan.codigo}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
                    <p className="truncate" title={plan.nombre}>
                      {plan.nombre}
                    </p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {plan.periodo}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge status={plan.estado} variant={getEstadoPlanColor(plan.estado)} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Progress value={plan.porcentaje_avance ?? 0} className="w-20" />
                      <span className="text-xs text-gray-500">{plan.porcentaje_avance ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {plan.responsable_nombre ?? 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.actividades_resumen?.completadas ?? 0}
                      </span>
                      <span>/</span>
                      <span>{plan.total_actividades ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {plan.estado === 'BORRADOR' || plan.estado === 'EN_REVISION' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Aprobar plan"
                          onClick={() => aprobarMutation.mutate(plan.id)}
                          disabled={aprobarMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      ) : null}
                      {plan.estado === 'APROBADO' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Iniciar ejecución"
                          onClick={() =>
                            cambiarEstadoMutation.mutate({
                              id: plan.id,
                              estado: 'EN_EJECUCION' as EstadoPlanTrabajo,
                            })
                          }
                          disabled={cambiarEstadoMutation.isPending}
                        >
                          <PlayCircle className="w-4 h-4 text-blue-600" />
                        </Button>
                      ) : null}
                      {plan.estado === 'EN_EJECUCION' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Cerrar plan"
                          onClick={() =>
                            cambiarEstadoMutation.mutate({
                              id: plan.id,
                              estado: 'CERRADO' as EstadoPlanTrabajo,
                            })
                          }
                          disabled={cambiarEstadoMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 text-gray-600" />
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => onOpenModal(plan)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(plan.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Plan de Trabajo"
        message="¿Está seguro de eliminar este plan de trabajo? Esta acción eliminará también las actividades, objetivos y programas asociados."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== ACTIVIDADES SECTION ====================

interface ActividadesProps {
  onOpenModal: (item?: ActividadPlan) => void;
}

const ActividadesPlanSection = ({ onOpenModal }: ActividadesProps) => {
  const [planFiltro, setPlanFiltro] = useState<string>('');
  const { data: planesData } = usePlanesTrabajoQuery({ page_size: 100 });
  const { data, isLoading } = useActividadesPlanQuery(
    planFiltro ? { plan_trabajo: Number(planFiltro) } : undefined
  );
  const deleteMutation = useDeleteActividadPlan();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const actividades = data?.results ?? [];
  const planes = planesData?.results ?? [];

  const planOptions = [
    { value: '', label: 'Todos los planes' },
    ...planes.map((p) => ({ value: String(p.id), label: `${p.codigo} — ${p.nombre}` })),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const stats = {
    total: actividades.length,
    enProceso: actividades.filter((a) => a.estado === 'EN_PROCESO').length,
    completadas: actividades.filter((a) => a.estado === 'COMPLETADA').length,
    retrasadas: actividades.filter((a) => a.estado === 'RETRASADA').length,
  };

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Actividades"
          value={stats.total}
          icon={<ListChecks className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="En Proceso"
          value={stats.enProceso}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Completadas"
          value={stats.completadas}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Retrasadas"
          value={stats.retrasadas}
          icon={<XCircle className="w-5 h-5" />}
          color="danger"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Actividades del Plan"
        primaryAction={{ label: 'Nueva Actividad', onClick: () => onOpenModal() }}
      >
        <Select
          value={planFiltro}
          onChange={(e) => setPlanFiltro(e.target.value)}
          options={planOptions}
          className="w-64"
        />
      </SectionToolbar>

      {actividades.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="w-16 h-16" />}
          title="No hay actividades registradas"
          description="Las actividades aparecerán aquí al crearlas dentro de un plan de trabajo"
          action={{
            label: 'Nueva Actividad',
            onClick: () => onOpenModal(),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    F. Inicio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    F. Fin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Avance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Responsable
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {actividades.map((actividad) => (
                  <tr key={actividad.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {actividad.codigo}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
                      <p className="truncate" title={actividad.nombre}>
                        {actividad.nombre}
                      </p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant="default">{formatStatusLabel(actividad.tipo_actividad)}</Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {actividad.fecha_programada_inicio
                        ? format(new Date(actividad.fecha_programada_inicio), 'dd/MM/yyyy', {
                            locale: es,
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {actividad.fecha_programada_fin
                        ? format(new Date(actividad.fecha_programada_fin), 'dd/MM/yyyy', {
                            locale: es,
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={parseFloat(actividad.porcentaje_avance ?? '0')}
                          className="w-20"
                        />
                        <span className="text-xs text-gray-500">
                          {parseFloat(actividad.porcentaje_avance ?? '0')}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={actividad.estado}
                        variant={getEstadoActividadColor(actividad.estado)}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {actividad.responsable_nombre ?? 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onOpenModal(actividad)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(actividad.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Actividad"
        message="¿Está seguro de eliminar esta actividad? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== OBJETIVOS SISTEMA SECTION ====================

interface ObjetivosProps {
  onOpenModal: (item?: ObjetivoSistema) => void;
}

const ObjetivosSistemaSection = ({ onOpenModal }: ObjetivosProps) => {
  const [planFiltro, setPlanFiltro] = useState<string>('');
  const { data: planesData } = usePlanesTrabajoQuery({ page_size: 100 });
  const { data, isLoading } = useObjetivosSistemaQuery(
    planFiltro ? { plan_trabajo: Number(planFiltro) } : undefined
  );
  const deleteMutation = useDeleteObjetivoSistema();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const objetivos = data?.results ?? [];
  const planes = planesData?.results ?? [];

  const planOptions = [
    { value: '', label: 'Todos los planes' },
    ...planes.map((p) => ({ value: String(p.id), label: `${p.codigo} — ${p.nombre}` })),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const stats = {
    financiera: objetivos.filter((o) => o.perspectiva_bsc === 'FINANCIERA').length,
    clientes: objetivos.filter((o) => o.perspectiva_bsc === 'CLIENTES').length,
    procesos: objetivos.filter((o) => o.perspectiva_bsc === 'PROCESOS').length,
    aprendizaje: objetivos.filter((o) => o.perspectiva_bsc === 'APRENDIZAJE').length,
  };

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Perspectiva Financiera"
          value={stats.financiera}
          icon={<BarChart3 className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Perspectiva Clientes"
          value={stats.clientes}
          icon={<Target className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Perspectiva Procesos"
          value={stats.procesos}
          icon={<TrendingUp className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Aprendizaje y Crecimiento"
          value={stats.aprendizaje}
          icon={<BookOpen className="w-5 h-5" />}
          color="default"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Objetivos del Sistema"
        primaryAction={{ label: 'Nuevo Objetivo', onClick: () => onOpenModal() }}
      >
        <Select
          value={planFiltro}
          onChange={(e) => setPlanFiltro(e.target.value)}
          options={planOptions}
          className="w-64"
        />
      </SectionToolbar>

      {objetivos.length === 0 ? (
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="No hay objetivos del sistema registrados"
          description="Defina los objetivos estratégicos del sistema de gestión vinculados al Balanced Scorecard"
          action={{
            label: 'Nuevo Objetivo',
            onClick: () => onOpenModal(),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Perspectiva BSC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Meta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Cumplimiento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {objetivos.map((objetivo) => (
                  <tr key={objetivo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {objetivo.codigo}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
                      <p className="truncate" title={objetivo.nombre}>
                        {objetivo.nombre}
                      </p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          PERSPECTIVA_COLORS[objetivo.perspectiva_bsc as PerspectivaBSC] ??
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {PERSPECTIVA_LABELS[objetivo.perspectiva_bsc as PerspectivaBSC] ??
                          objetivo.perspectiva_bsc}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant="default">{formatStatusLabel(objetivo.tipo_objetivo)}</Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {objetivo.meta_cuantitativa
                        ? `${objetivo.meta_cuantitativa} ${objetivo.unidad_medida ?? ''}`
                        : objetivo.meta_descripcion?.substring(0, 30) + '...'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={parseFloat(objetivo.porcentaje_cumplimiento ?? '0')}
                          className="w-20"
                        />
                        <span className="text-xs text-gray-500">
                          {parseFloat(objetivo.porcentaje_cumplimiento ?? '0')}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={objetivo.estado}
                        variant={getEstadoObjetivoColor(objetivo.estado)}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onOpenModal(objetivo)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(objetivo.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Objetivo del Sistema"
        message="¿Está seguro de eliminar este objetivo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== PROGRAMAS DE GESTIÓN SECTION ====================

interface ProgramasProps {
  onOpenModal: (item?: ProgramaGestion) => void;
}

const ProgramasGestionSection = ({ onOpenModal }: ProgramasProps) => {
  const [planFiltro, setPlanFiltro] = useState<string>('');
  const { data: planesData } = usePlanesTrabajoQuery({ page_size: 100 });
  const { data, isLoading } = useProgramasGestionQuery(
    planFiltro ? { plan_trabajo: Number(planFiltro) } : undefined
  );
  const deleteMutation = useDeleteProgramaGestion();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const programas = data?.results ?? [];
  const planes = planesData?.results ?? [];

  const planOptions = [
    { value: '', label: 'Todos los planes' },
    ...planes.map((p) => ({ value: String(p.id), label: `${p.codigo} — ${p.nombre}` })),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const stats = {
    total: programas.length,
    enEjecucion: programas.filter((p) => p.estado === 'EN_EJECUCION').length,
    completados: programas.filter((p) => p.estado === 'COMPLETADO').length,
  };

  return (
    <div className="space-y-6">
      <KpiCardGrid>
        <KpiCard
          label="Total Programas"
          value={stats.total}
          icon={<LayoutGrid className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="En Ejecución"
          value={stats.enEjecucion}
          icon={<PlayCircle className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Completados"
          value={stats.completados}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Planificados"
          value={programas.filter((p) => p.estado === 'PLANIFICADO').length}
          icon={<ClipboardList className="w-5 h-5" />}
          color="default"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Programas de Gestión"
        primaryAction={{ label: 'Nuevo Programa', onClick: () => onOpenModal() }}
      >
        <Select
          value={planFiltro}
          onChange={(e) => setPlanFiltro(e.target.value)}
          options={planOptions}
          className="w-64"
        />
      </SectionToolbar>

      {programas.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="w-16 h-16" />}
          title="No hay programas de gestión registrados"
          description="Cree programas de gestión como PVE, capacitaciones, inspecciones y otros"
          action={{
            label: 'Nuevo Programa',
            onClick: () => onOpenModal(),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Responsable
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actividades
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Avance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {programas.map((programa) => (
                  <tr key={programa.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {programa.codigo}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
                      <p className="truncate" title={programa.nombre}>
                        {programa.nombre}
                      </p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant="default">{formatStatusLabel(programa.tipo_programa)}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {programa.responsable_nombre ?? 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {programa.actividades_completadas ?? 0}
                        </span>
                        <span>/</span>
                        <span>{programa.total_actividades ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={parseFloat(programa.porcentaje_avance ?? '0')}
                          className="w-20"
                        />
                        <span className="text-xs text-gray-500">
                          {parseFloat(programa.porcentaje_avance ?? '0')}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={programa.estado}
                        variant={getEstadoPlanColor(programa.estado)}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onOpenModal(programa)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(programa.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Eliminar Programa de Gestión"
        message="¿Está seguro de eliminar este programa? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
};

// ==================== CRONOGRAMA GANTT SECTION ====================

const CronogramaGanttSection = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('');
  const { data: planesData, isLoading: loadingPlanes } = usePlanesTrabajoQuery({ page_size: 100 });
  const { data: actividades, isLoading: loadingActividades } = useActividadesPorPlanQuery(
    selectedPlanId !== '' ? selectedPlanId : null
  );

  const planes = planesData?.results ?? [];
  const planOptions = planes.map((p) => ({
    value: String(p.id),
    label: `${p.codigo} — ${p.nombre} (${p.periodo})`,
  }));

  const selectedPlan = planes.find((p) => p.id === selectedPlanId);
  const actividadesList = Array.isArray(actividades) ? actividades : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cronograma de Actividades
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Vista Gantt del plan de trabajo seleccionado
          </p>
        </div>
        <div className="w-80">
          {loadingPlanes ? (
            <Spinner size="small" />
          ) : (
            <Select
              value={selectedPlanId !== '' ? String(selectedPlanId) : ''}
              onChange={(e) => setSelectedPlanId(e.target.value ? Number(e.target.value) : '')}
              options={planOptions}
              placeholder="Seleccionar plan para ver cronograma..."
            />
          )}
        </div>
      </div>

      {selectedPlanId === '' ? (
        <Card className="py-16">
          <div className="flex flex-col items-center text-gray-400 dark:text-gray-600">
            <GanttChartSquare className="w-16 h-16 mb-4" />
            <p className="text-sm">Seleccione un plan de trabajo para visualizar el cronograma</p>
          </div>
        </Card>
      ) : loadingActividades ? (
        <Card className="py-16 flex items-center justify-center">
          <Spinner />
        </Card>
      ) : (
        <Card>
          <div className="p-6">
            {selectedPlan && (
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedPlan.codigo}
                    </span>{' '}
                    — {selectedPlan.nombre}
                  </div>
                  <div>
                    Período:{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedPlan.periodo}
                    </span>
                  </div>
                  <div>
                    Avance:{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedPlan.porcentaje_avance ?? 0}%
                    </span>
                  </div>
                  <div>
                    Total actividades:{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {actividadesList.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <GanttTimeline
              actividades={actividadesList}
              planFechaInicio={selectedPlan?.fecha_inicio}
              planFechaFin={selectedPlan?.fecha_fin}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== MAIN PAGE ====================

export const PlanificacionSistemaPage = () => {
  const [activeTab, setActiveTab] = useState('planes');

  // Modales state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [actividadModalOpen, setActividadModalOpen] = useState(false);
  const [objetivoModalOpen, setObjetivoModalOpen] = useState(false);
  const [programaModalOpen, setProgramaModalOpen] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<PlanTrabajoAnual | null>(null);
  const [selectedActividad, setSelectedActividad] = useState<ActividadPlan | null>(null);
  const [selectedObjetivo, setSelectedObjetivo] = useState<ObjetivoSistema | null>(null);
  const [selectedPrograma, setSelectedPrograma] = useState<ProgramaGestion | null>(null);

  const tabs = [
    {
      id: 'planes',
      label: 'Planes de Trabajo',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'actividades',
      label: 'Actividades',
      icon: <ListChecks className="w-4 h-4" />,
    },
    {
      id: 'objetivos',
      label: 'Objetivos BSC',
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: 'programas',
      label: 'Programas',
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      id: 'cronograma',
      label: 'Cronograma',
      icon: <GanttChartSquare className="w-4 h-4" />,
    },
  ];

  // Handlers plan
  const handleOpenPlanModal = (item?: PlanTrabajoAnual) => {
    setSelectedPlan(item ?? null);
    setPlanModalOpen(true);
  };
  const handleClosePlanModal = () => {
    setSelectedPlan(null);
    setPlanModalOpen(false);
  };

  // Handlers actividad
  const handleOpenActividadModal = (item?: ActividadPlan) => {
    setSelectedActividad(item ?? null);
    setActividadModalOpen(true);
  };
  const handleCloseActividadModal = () => {
    setSelectedActividad(null);
    setActividadModalOpen(false);
  };

  // Handlers objetivo
  const handleOpenObjetivoModal = (item?: ObjetivoSistema) => {
    setSelectedObjetivo(item ?? null);
    setObjetivoModalOpen(true);
  };
  const handleCloseObjetivoModal = () => {
    setSelectedObjetivo(null);
    setObjetivoModalOpen(false);
  };

  // Handlers programa
  const handleOpenProgramaModal = (item?: ProgramaGestion) => {
    setSelectedPrograma(item ?? null);
    setProgramaModalOpen(true);
  };
  const handleCloseProgramaModal = () => {
    setSelectedPrograma(null);
    setProgramaModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Planificación del Sistema"
        description="Planes de trabajo anuales, actividades, objetivos BSC, programas de gestión y cronograma"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'planes' && <PlanesTrabajoSection onOpenModal={handleOpenPlanModal} />}
        {activeTab === 'actividades' && (
          <ActividadesPlanSection onOpenModal={handleOpenActividadModal} />
        )}
        {activeTab === 'objetivos' && (
          <ObjetivosSistemaSection onOpenModal={handleOpenObjetivoModal} />
        )}
        {activeTab === 'programas' && (
          <ProgramasGestionSection onOpenModal={handleOpenProgramaModal} />
        )}
        {activeTab === 'cronograma' && <CronogramaGanttSection />}
      </div>

      {/* Modals */}
      <PlanTrabajoFormModal
        item={selectedPlan}
        isOpen={planModalOpen}
        onClose={handleClosePlanModal}
      />

      <ActividadPlanFormModal
        item={selectedActividad}
        isOpen={actividadModalOpen}
        onClose={handleCloseActividadModal}
      />

      <ObjetivoSistemaFormModal
        item={selectedObjetivo}
        isOpen={objetivoModalOpen}
        onClose={handleCloseObjetivoModal}
      />

      <ProgramaGestionFormModal
        item={selectedPrograma}
        isOpen={programaModalOpen}
        onClose={handleCloseProgramaModal}
      />
    </div>
  );
};

export default PlanificacionSistemaPage;
