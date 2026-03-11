/**
 * Página: Planificación del Sistema HSEQ
 *
 * Sistema completo de planificación estratégica con 4 subsecciones:
 * - Plan de Trabajo Anual
 * - Objetivos del Sistema
 * - Programas de Gestión
 * - Seguimiento de Cronograma
 */
import { useState, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  Calendar,
  Target,
  Briefcase,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import {
  KpiCard,
  KpiCardGrid,
  SectionToolbar,
  StatusBadge,
  ConfirmDialog,
} from '@/components/common';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import { cn } from '@/utils/cn';
import {
  usePlanesTrabajo,
  useActividadesPlan,
  useObjetivosSistema,
  useProgramasGestion,
  useDashboardPlanificacion,
  useDeleteActividadPlan,
  useDeleteObjetivo,
  useDeletePrograma,
} from '../hooks/usePlanificacion';
import type { ActividadPlan, ObjetivoSistema, ProgramaGestion } from '../hooks/usePlanificacion';
import ActividadPlanFormModal from '../components/ActividadPlanFormModal';
import ObjetivoSistemaFormModal from '../components/ObjetivoSistemaFormModal';
import ProgramaGestionFormModal from '../components/ProgramaGestionFormModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================== PROGRESS COMPONENT ====================

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const Progress = ({
  value,
  max = 100,
  className,
  showLabel = false,
  variant = 'default',
}: ProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantColors = {
    default: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
  };

  const getVariant = (): 'default' | 'success' | 'warning' | 'danger' => {
    if (variant !== 'default') return variant;
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const currentVariant = getVariant();

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', variantColors[currentVariant])}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};

// ==================== UTILITY FUNCTIONS ====================

const getBadgeVariant = (cumplimiento: number): 'success' | 'primary' | 'warning' | 'danger' => {
  if (cumplimiento >= 90) return 'success';
  if (cumplimiento >= 70) return 'primary';
  if (cumplimiento >= 50) return 'warning';
  return 'danger';
};

const getCumplimientoLabel = (cumplimiento: number): string => {
  if (cumplimiento >= 90) return 'EXCELENTE';
  if (cumplimiento >= 70) return 'BUENO';
  if (cumplimiento >= 50) return 'ACEPTABLE';
  return 'DEFICIENTE';
};

const formatPrioridad = (prioridad: string): string => {
  const prioridadMap: Record<string, string> = {
    CRITICA: 'Crítica',
    ALTA: 'Alta',
    MEDIA: 'Media',
    BAJA: 'Baja',
  };
  return prioridadMap[prioridad] || prioridad;
};

// ==================== PLAN TRABAJO SECTION ====================

interface PlanTrabajoSectionProps {
  planId: number | null;
}

const PlanTrabajoSection = ({ planId }: PlanTrabajoSectionProps) => {
  const { data: actividades, isLoading } = useActividadesPlan(planId || 0);
  const deleteMutation = useDeleteActividadPlan();

  const [selectedItem, setSelectedItem] = useState<ActividadPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item: ActividadPlan) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };
  const handleDelete = () => {
    if (deleteId && planId) {
      deleteMutation.mutate({ id: deleteId, planId }, { onSuccess: () => setDeleteId(null) });
    }
  };

  if (!planId) {
    return (
      <EmptyState
        icon={<Calendar className="w-16 h-16" />}
        title="Seleccione un Plan de Trabajo"
        description="Seleccione un plan de trabajo para ver sus actividades"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!actividades || actividades.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Calendar className="w-16 h-16" />}
          title="No hay actividades registradas"
          description="Comience creando actividades para el plan de trabajo anual"
          action={{ label: 'Crear Actividad', onClick: handleNew }}
        />
        <ActividadPlanFormModal
          item={null}
          planId={planId}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  const stats = {
    total: actividades.length,
    completadas: actividades.filter((a) => a.estado === 'COMPLETADA').length,
    enProceso: actividades.filter((a) => a.estado === 'EN_PROCESO').length,
    pendientes: actividades.filter((a) => a.estado === 'PENDIENTE').length,
    vencidas: actividades.filter((a) => a.estado === 'VENCIDA').length,
  };

  const avanceGlobal = stats.total > 0 ? (stats.completadas / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Actividades"
          value={stats.total}
          icon={<Activity className="w-5 h-5" />}
          color="primary"
          description={
            <div className="mt-2">
              <Progress value={avanceGlobal} showLabel />
            </div>
          }
        />
        <KpiCard
          label="Completadas"
          value={stats.completadas}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
          description={`${stats.total > 0 ? ((stats.completadas / stats.total) * 100).toFixed(1) : 0}% del total`}
        />
        <KpiCard
          label="En Proceso"
          value={stats.enProceso}
          icon={<Clock className="w-5 h-5" />}
          color="primary"
          description="En ejecución actualmente"
        />
        <KpiCard
          label="Vencidas"
          value={stats.vencidas}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          description="Requieren atención inmediata"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Actividades Programadas"
        primaryAction={canCreate ? { label: 'Nueva Actividad', onClick: handleNew } : undefined}
      />

      {/* Activities Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actividad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Programada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {actividades.map((actividad) => (
                <tr key={actividad.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {actividad.codigo_actividad}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{actividad.nombre}</p>
                      {actividad.descripcion && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {actividad.descripcion}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatStatusLabel(actividad.tipo_actividad)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {actividad.responsable_nombre || 'No asignado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(actividad.fecha_fin_programada), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={actividad.estado} preset="proceso" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Progress value={actividad.porcentaje_avance} className="w-20" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[3rem]">
                        {actividad.porcentaje_avance}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        actividad.prioridad === 'CRITICA'
                          ? 'danger'
                          : actividad.prioridad === 'ALTA'
                            ? 'warning'
                            : 'info'
                      }
                      size="sm"
                    >
                      {formatPrioridad(actividad.prioridad)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(actividad)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(actividad.id)}>
                        <Trash2 className="w-4 h-4 text-danger-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal CRUD */}
      <ActividadPlanFormModal
        item={selectedItem}
        planId={planId}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Actividad"
        message="¿Está seguro de eliminar esta actividad? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== OBJETIVOS SECTION ====================

interface ObjetivosSectionProps {
  planId: number | null;
}

const ObjetivosSection = ({ planId }: ObjetivosSectionProps) => {
  const { data: objetivos, isLoading } = useObjetivosSistema(planId || 0);
  const deleteMutation = useDeleteObjetivo();

  const [selectedItem, setSelectedItem] = useState<ObjetivoSistema | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item: ObjetivoSistema) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };
  const handleDelete = () => {
    if (deleteId && planId) {
      deleteMutation.mutate({ id: deleteId, planId }, { onSuccess: () => setDeleteId(null) });
    }
  };

  if (!planId) {
    return (
      <EmptyState
        icon={<Target className="w-16 h-16" />}
        title="Seleccione un Plan de Trabajo"
        description="Seleccione un plan de trabajo para ver sus objetivos"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!objetivos || objetivos.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Target className="w-16 h-16" />}
          title="No hay objetivos definidos"
          description="Comience definiendo los objetivos estratégicos del sistema HSEQ"
          action={{ label: 'Crear Objetivo', onClick: handleNew }}
        />
        <ObjetivoSistemaFormModal
          item={null}
          planId={planId}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  const stats = {
    total: objetivos.length,
    sst: objetivos.filter((o) => o.categoria === 'SST').length,
    ambiental: objetivos.filter((o) => o.categoria === 'AMBIENTAL').length,
    calidad: objetivos.filter((o) => o.categoria === 'CALIDAD').length,
    estrategico: objetivos.filter((o) => o.categoria === 'ESTRATEGICO').length,
    cumplimientoPromedio:
      objetivos.length > 0
        ? objetivos.reduce((acc, obj) => acc + obj.porcentaje_cumplimiento, 0) / objetivos.length
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid columns={5}>
        <KpiCard label="Total Objetivos" value={stats.total} color="gray" />
        <KpiCard label="SST" value={stats.sst} color="blue" />
        <KpiCard label="Ambiental" value={stats.ambiental} color="green" />
        <KpiCard label="Calidad" value={stats.calidad} color="purple" />
        <KpiCard
          label="Cumplimiento"
          value={`${stats.cumplimientoPromedio.toFixed(1)}%`}
          valueColor={
            stats.cumplimientoPromedio >= 90
              ? 'success'
              : stats.cumplimientoPromedio >= 70
                ? 'primary'
                : stats.cumplimientoPromedio >= 50
                  ? 'warning'
                  : 'danger'
          }
          description={
            <Badge variant={getBadgeVariant(stats.cumplimientoPromedio)} size="sm" className="mt-1">
              {getCumplimientoLabel(stats.cumplimientoPromedio)}
            </Badge>
          }
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Objetivos del Sistema"
        primaryAction={canCreate ? { label: 'Nuevo Objetivo', onClick: handleNew } : undefined}
      />

      {/* Objectives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {objetivos.map((objetivo) => (
          <Card key={objetivo.id} variant="bordered" padding="md">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={objetivo.categoria} preset="default" />
                    <Badge variant="gray" size="sm">
                      {formatStatusLabel(objetivo.tipo_objetivo)}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {objetivo.codigo_objetivo}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-snug">
                    {objetivo.descripcion}
                  </h4>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Responsable</p>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">
                    {objetivo.responsable_nombre || 'No asignado'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Indicador</p>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">
                    {objetivo.indicador_medicion}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Cumplimiento</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {objetivo.porcentaje_cumplimiento}%
                  </span>
                </div>
                <Progress value={objetivo.porcentaje_cumplimiento} showLabel={false} />
                {objetivo.meta_numerica && (
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      Meta: {objetivo.meta_numerica} {objetivo.unidad_medida}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Actual: {objetivo.valor_actual || 0} {objetivo.unidad_medida}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <Badge variant={getBadgeVariant(objetivo.porcentaje_cumplimiento)} size="sm">
                  {getCumplimientoLabel(objetivo.porcentaje_cumplimiento)}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(objetivo)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(objetivo.id)}>
                    <Trash2 className="w-4 h-4 text-danger-600" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal CRUD */}
      <ObjetivoSistemaFormModal
        item={selectedItem}
        planId={planId}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Objetivo"
        message="¿Está seguro de eliminar este objetivo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== PROGRAMAS SECTION ====================

interface ProgramasSectionProps {
  planId: number | null;
}

const ProgramasSection = ({ planId }: ProgramasSectionProps) => {
  const { data: programas, isLoading } = useProgramasGestion(planId || 0);
  const deleteMutation = useDeletePrograma();

  const [selectedItem, setSelectedItem] = useState<ProgramaGestion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleNew = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item: ProgramaGestion) => {
    setSelectedItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalOpen(false);
  };
  const handleDelete = () => {
    if (deleteId && planId) {
      deleteMutation.mutate({ id: deleteId, planId }, { onSuccess: () => setDeleteId(null) });
    }
  };

  if (!planId) {
    return (
      <EmptyState
        icon={<Briefcase className="w-16 h-16" />}
        title="Seleccione un Plan de Trabajo"
        description="Seleccione un plan de trabajo para ver sus programas de gestión"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!programas || programas.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Briefcase className="w-16 h-16" />}
          title="No hay programas registrados"
          description="Comience creando programas de gestión específicos para el sistema HSEQ"
          action={{ label: 'Crear Programa', onClick: handleNew }}
        />
        <ProgramaGestionFormModal
          item={null}
          planId={planId}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      </>
    );
  }

  const stats = {
    total: programas.length,
    enEjecucion: programas.filter((p) => p.estado === 'EN_EJECUCION').length,
    completados: programas.filter((p) => p.estado === 'COMPLETADO').length,
    avancePromedio:
      programas.length > 0
        ? programas.reduce((acc, prog) => acc + prog.porcentaje_avance, 0) / programas.length
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Programas"
          value={stats.total}
          icon={<Briefcase className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="En Ejecución"
          value={stats.enEjecucion}
          icon={<Activity className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Completados"
          value={stats.completados}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Avance Promedio"
          value={`${stats.avancePromedio.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="primary"
        />
      </KpiCardGrid>

      {/* Actions */}
      <SectionToolbar
        title="Programas de Gestión"
        primaryAction={canCreate ? { label: 'Nuevo Programa', onClick: handleNew } : undefined}
      />

      {/* Programs Grid */}
      <div className="grid grid-cols-1 gap-6">
        {programas.map((programa) => (
          <Card key={programa.id} variant="bordered" padding="md">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {programa.nombre}
                    </h4>
                    <StatusBadge status={programa.estado} preset="proceso" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{programa.descripcion}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="gray" size="sm">
                      {programa.codigo_programa}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {formatStatusLabel(programa.tipo_programa)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {programa.responsable_nombre || 'No asignado'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Período</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(programa.fecha_inicio), 'MMM yyyy', { locale: es })} -{' '}
                    {format(new Date(programa.fecha_fin), 'MMM yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Actividades</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {programa.actividades_completadas} / {programa.numero_actividades}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Presupuesto</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {programa.presupuesto
                      ? new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                        }).format(programa.presupuesto)
                      : 'No definido'}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Avance del Programa
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {programa.porcentaje_avance}%
                  </span>
                </div>
                <Progress value={programa.porcentaje_avance} showLabel={false} />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => handleEdit(programa)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4 text-danger-600" />}
                  onClick={() => setDeleteId(programa.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal CRUD */}
      <ProgramaGestionFormModal
        item={selectedItem}
        planId={planId}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Programa"
        message="¿Está seguro de eliminar este programa? Esto eliminará también sus actividades asociadas."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ==================== SEGUIMIENTO SECTION ====================

interface SeguimientoSectionProps {
  planId: number | null;
}

const SeguimientoSection = ({ planId }: SeguimientoSectionProps) => {
  const { data: dashboardData, isLoading } = useDashboardPlanificacion(planId || 0);

  if (!planId) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-16 h-16" />}
        title="Seleccione un Plan de Trabajo"
        description="Seleccione un plan de trabajo para ver el seguimiento del cronograma"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-16 h-16" />}
        title="No hay datos disponibles"
        description="No se encontraron datos de seguimiento para este plan"
      />
    );
  }

  const { resumen, objetivos, programas, presupuesto, actividades_proximas, actividades_vencidas } =
    dashboardData;

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <SectionToolbar
        title="Dashboard de Planificación"
        subtitle="Seguimiento integral del plan de trabajo anual"
        primaryAction={canCreate ? { label: 'Descargar Reporte', onClick: () => {} } : undefined}
      />

      {/* Main KPIs */}
      <KpiCardGrid>
        <KpiCard
          label="Avance Global"
          value={`${resumen.porcentaje_avance_global.toFixed(1)}%`}
          color="gray"
          description={
            <div className="space-y-2">
              <Progress value={resumen.porcentaje_avance_global} className="mt-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {resumen.actividades_completadas} de {resumen.total_actividades} actividades
              </p>
            </div>
          }
        />
        <KpiCard
          label="Cumplimiento Cronograma"
          value={`${resumen.porcentaje_cumplimiento_cronograma.toFixed(1)}%`}
          color="primary"
          description={
            <Badge
              variant={getBadgeVariant(resumen.porcentaje_cumplimiento_cronograma)}
              className="mt-1"
            >
              {getCumplimientoLabel(resumen.porcentaje_cumplimiento_cronograma)}
            </Badge>
          }
        />
        <KpiCard
          label="Objetivos Logrados"
          value={`${objetivos.completados} / ${objetivos.total}`}
          color="success"
          description={
            <div className="space-y-2">
              <Progress
                value={objetivos.total > 0 ? (objetivos.completados / objetivos.total) * 100 : 0}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cumplimiento promedio: {objetivos.cumplimiento_promedio.toFixed(1)}%
              </p>
            </div>
          }
        />
        <KpiCard
          label="Ejecución Presupuestal"
          value={`${presupuesto.porcentaje_ejecucion.toFixed(1)}%`}
          color="primary"
          description={
            <div className="space-y-2">
              <Progress value={presupuesto.porcentaje_ejecucion} className="mt-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ejecutado:{' '}
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0,
                }).format(presupuesto.ejecutado)}
              </p>
            </div>
          }
        />
      </KpiCardGrid>

      {/* Activities Summary */}
      <KpiCardGrid>
        <KpiCard
          label="Completadas"
          value={resumen.actividades_completadas}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="En Proceso"
          value={resumen.actividades_en_proceso}
          icon={<Activity className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Pendientes"
          value={resumen.actividades_pendientes}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Vencidas"
          value={resumen.actividades_vencidas}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
        />
      </KpiCardGrid>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Próximas Actividades */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning-600" />
              Actividades Próximas
            </h4>
            <Badge variant="warning">{actividades_proximas?.length || 0}</Badge>
          </div>
          {actividades_proximas && actividades_proximas.length > 0 ? (
            <div className="space-y-3">
              {actividades_proximas.slice(0, 5).map((actividad) => (
                <div
                  key={actividad.id}
                  className="flex items-start gap-3 p-3 bg-warning-50 dark:bg-warning-900/10 rounded-lg"
                >
                  <Calendar className="w-4 h-4 text-warning-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {actividad.nombre}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Vence:{' '}
                      {format(new Date(actividad.fecha_fin_programada), 'dd/MM/yyyy', {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No hay actividades próximas a vencer
            </p>
          )}
        </Card>

        {/* Actividades Vencidas */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
              Actividades Vencidas
            </h4>
            <Badge variant="danger">{actividades_vencidas?.length || 0}</Badge>
          </div>
          {actividades_vencidas && actividades_vencidas.length > 0 ? (
            <div className="space-y-3">
              {actividades_vencidas.slice(0, 5).map((actividad) => (
                <div
                  key={actividad.id}
                  className="flex items-start gap-3 p-3 bg-danger-50 dark:bg-danger-900/10 rounded-lg"
                >
                  <AlertTriangle className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {actividad.nombre}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Venció:{' '}
                      {format(new Date(actividad.fecha_fin_programada), 'dd/MM/yyyy', {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No hay actividades vencidas
            </p>
          )}
        </Card>
      </div>

      {/* Programs Status */}
      <Card variant="bordered" padding="md">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Estado de Programas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Programas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {programas.total}
            </p>
          </div>
          <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">En Ejecución</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
              {programas.en_ejecucion}
            </p>
          </div>
          <div className="text-center p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completados</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
              {programas.completados}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Avance Promedio de Programas
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {programas.avance_promedio.toFixed(1)}%
            </span>
          </div>
          <Progress value={programas.avance_promedio} />
        </div>
      </Card>
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================

export default function PlanificacionSistemaPage() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.HSEQ_MANAGEMENT, Sections.INSPECCIONES, 'create');

  const [activeTab, setActiveTab] = useState('plan-trabajo');
  const { data: planes } = usePlanesTrabajo({ año: new Date().getFullYear() });

  // Get first active plan as default
  const defaultPlan = useMemo(() => {
    if (!planes || planes.length === 0) return null;
    return planes.find((p) => p.estado === 'EN_EJECUCION') || planes[0];
  }, [planes]);

  const tabs = [
    {
      id: 'plan-trabajo',
      label: 'Plan de Trabajo Anual',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'objetivos',
      label: 'Objetivos del Sistema',
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: 'programas',
      label: 'Programas de Gestión',
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: 'seguimiento',
      label: 'Seguimiento de Cronograma',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Planificación del Sistema"
        description="Gestión estratégica de planes de trabajo, objetivos, programas y seguimiento del sistema HSEQ"
      />

      {/* Plan Selector */}
      {defaultPlan && (
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {defaultPlan.nombre}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {defaultPlan.codigo} • Año {defaultPlan.año}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Avance Global</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {defaultPlan.porcentaje_avance}%
                </p>
              </div>
              <StatusBadge status={defaultPlan.estado} preset="proceso" />
            </div>
          </div>
          <Progress value={defaultPlan.porcentaje_avance} className="mt-4" />
        </Card>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'plan-trabajo' && <PlanTrabajoSection planId={defaultPlan?.id || null} />}
        {activeTab === 'objetivos' && <ObjetivosSection planId={defaultPlan?.id || null} />}
        {activeTab === 'programas' && <ProgramasSection planId={defaultPlan?.id || null} />}
        {activeTab === 'seguimiento' && <SeguimientoSection planId={defaultPlan?.id || null} />}
      </div>
    </div>
  );
}
