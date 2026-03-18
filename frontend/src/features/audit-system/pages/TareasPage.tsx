/**
 * Página: Gestión de Tareas (REWRITTEN - Sprint 9)
 * 4 tabs: Mis Tareas, Calendario, Recordatorios, Todas
 * Connected to real hooks from useAuditSystem
 * Deleted ALL mock data
 */
import { useState } from 'react';
import {
  CheckSquare,
  Calendar as CalendarIcon,
  Clock,
  List,
  Plus,
  Filter,
  User,
  Flag,
  Tag,
  CheckCircle,
  Play,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import {
  Card,
  Button,
  Badge,
  Tabs,
  Spinner,
  EmptyState,
  KpiCardGrid,
  KpiCard,
} from '@/components/common';
import { cn } from '@/utils/cn';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useMisTareas,
  useTareas,
  useTareasVencidas,
  useResumenTareas,
  useCompletarTarea,
  useEventosPorMes,
  useRecordatorios,
} from '../hooks/useAuditSystem';
import type { PrioridadTarea } from '../types';

// ==================== UTILITY FUNCTIONS ====================

const getEstadoColor = (estado: string) => {
  const colors = {
    pendiente: 'bg-gray-100 text-gray-800',
    en_progreso: 'bg-blue-100 text-blue-800',
    completada: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800',
    vencida: 'bg-red-100 text-red-800',
  };
  return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getPrioridadColor = (prioridad: PrioridadTarea) => {
  const colors = {
    baja: 'text-green-600',
    normal: 'text-blue-600',
    alta: 'text-orange-600',
    urgente: 'text-red-600',
  };
  return colors[prioridad] || 'text-gray-600';
};

// ==================== COMPONENTS ====================

function MisTareasTab() {
  const { data: tareas, isLoading } = useMisTareas();
  const { data: resumen } = useResumenTareas();
  const completarMutation = useCompletarTarea();
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.AUDIT_SYSTEM, Sections.TAREAS, 'create');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tareas || tareas.length === 0) {
    return (
      <EmptyState
        title="No tienes tareas asignadas"
        description="Las tareas asignadas a ti aparecerán aquí"
        icon={<CheckSquare size={40} />}
      />
    );
  }

  const tareasActivas = tareas.filter((t) => t.estado !== 'completada' && t.estado !== 'cancelada');

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      {resumen && (
        <KpiCardGrid>
          <KpiCard
            title="Total Tareas"
            value={resumen.total}
            icon={<CheckSquare className="w-4 h-4" />}
          />
          <KpiCard
            title="Pendientes"
            value={resumen.pendientes}
            variant="warning"
            icon={<Clock className="w-4 h-4" />}
          />
          <KpiCard
            title="Vencidas"
            value={resumen.vencidas}
            variant="danger"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <KpiCard
            title="Completadas (mes)"
            value={resumen.completadas_mes}
            variant="success"
            icon={<CheckCircle className="w-4 h-4" />}
          />
        </KpiCardGrid>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mis Tareas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {tareasActivas.length} tareas activas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          {canCreate && (
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Nueva Tarea
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {tareas.map((tarea) => (
          <Card key={tarea.id} variant="bordered" padding="md">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  tarea.estado === 'completada' && 'bg-green-100 text-green-600',
                  tarea.estado === 'en_progreso' && 'bg-blue-100 text-blue-600',
                  tarea.estado === 'vencida' && 'bg-red-100 text-red-600',
                  tarea.estado === 'pendiente' && 'bg-gray-100 text-gray-600'
                )}
              >
                {tarea.estado === 'completada' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : tarea.estado === 'en_progreso' ? (
                  <Play className="w-5 h-5" />
                ) : (
                  <CheckSquare className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {tarea.titulo}
                      </h4>
                      <Badge variant="gray" size="sm">
                        {tarea.codigo}
                      </Badge>
                    </div>
                    {tarea.descripcion && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {tarea.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="gray" size="sm" className={getEstadoColor(tarea.estado)}>
                      {formatStatusLabel(tarea.estado)}
                    </Badge>
                    <Flag className={cn('w-4 h-4', getPrioridadColor(tarea.prioridad))} />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progreso</span>
                    <span>{tarea.porcentaje_avance}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        tarea.porcentaje_avance === 100
                          ? 'bg-green-500'
                          : tarea.porcentaje_avance >= 50
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                      )}
                      style={{ width: `${tarea.porcentaje_avance}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    {tarea.asignado_a_nombre && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {tarea.asignado_a_nombre}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(tarea.fecha_limite), 'PP', { locale: es })}
                    </span>
                    {tarea.tags && tarea.tags.length > 0 && (
                      <>
                        {tarea.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="gray" size="sm">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {tarea.estado !== 'completada' && tarea.estado !== 'cancelada' && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                        onClick={() => completarMutation.mutate({ id: tarea.id })}
                        loading={completarMutation.isPending}
                      >
                        Completar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<MessageSquare className="w-4 h-4" />}
                    >
                      Comentarios
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CalendarioTab() {
  const [currentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const { data: eventos, isLoading } = useEventosPorMes(currentYear, currentMonth);
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.AUDIT_SYSTEM, Sections.TAREAS, 'create');

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Calendario de Eventos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Evento
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card variant="bordered" padding="md">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasEvent = eventos?.some((e) => {
                  const eventDate = new Date(e.fecha_inicio);
                  return eventDate.getDate() === day;
                });
                return (
                  <div
                    key={day}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg text-sm cursor-pointer transition-colors',
                      hasEvent && 'bg-primary-50 text-primary-700 font-medium',
                      !hasEvent && 'hover:bg-gray-100 dark:hover:bg-gray-800',
                      day === new Date().getDate() &&
                        currentMonth === new Date().getMonth() + 1 &&
                        'ring-2 ring-primary-500'
                    )}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Events List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Próximos Eventos</h4>
          {eventos && eventos.length > 0 ? (
            eventos.slice(0, 5).map((evento) => (
              <Card key={evento.id} variant="bordered" padding="sm">
                <div className="flex items-start gap-3">
                  <div
                    className="w-1 h-full rounded-full"
                    style={{ backgroundColor: evento.color || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      {evento.titulo}
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {format(new Date(evento.fecha_inicio), 'PPp', { locale: es })}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Badge variant="gray" size="sm">
                        {formatStatusLabel(evento.tipo_evento)}
                      </Badge>
                      {evento.ubicacion && <span>{evento.ubicacion}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No hay eventos"
              description="No hay eventos programados este mes"
              icon={<CalendarIcon size={40} />}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function RecordatoriosTab() {
  const { data: recordatorios, isLoading } = useRecordatorios();
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.AUDIT_SYSTEM, Sections.TAREAS, 'create');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!recordatorios || recordatorios.length === 0) {
    return (
      <EmptyState
        title="No hay recordatorios"
        description="Crea un nuevo recordatorio para recibir notificaciones programadas"
        icon={<Bell size={40} />}
        action={canCreate ? { label: 'Nuevo Recordatorio', onClick: () => {} } : undefined}
      />
    );
  }

  const activos = recordatorios.filter((r) => r.activo);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recordatorios Programados
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {activos.length} recordatorios activos
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Recordatorio
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {recordatorios.map((recordatorio) => (
          <Card key={recordatorio.id} variant="bordered" padding="md">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  recordatorio.activo ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                )}
              >
                <Bell className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {recordatorio.titulo}
                    </h4>
                    {recordatorio.descripcion && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {recordatorio.descripcion}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {recordatorio.tipo_repeticion === 'semanal' &&
                        `Cada semana a las ${recordatorio.hora_recordatorio}`}
                      {recordatorio.tipo_repeticion === 'mensual' &&
                        `Día ${recordatorio.dia_mes} de cada mes a las ${recordatorio.hora_recordatorio}`}
                      {recordatorio.tipo_repeticion === 'diario' &&
                        `Todos los días a las ${recordatorio.hora_recordatorio}`}
                      {recordatorio.tipo_repeticion === 'una_vez' &&
                        `Una sola vez a las ${recordatorio.hora_recordatorio}`}
                    </p>
                  </div>
                  <Badge variant={recordatorio.activo ? 'success' : 'gray'} size="sm">
                    {recordatorio.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  {recordatorio.proxima_ejecucion && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Próxima ejecución:{' '}
                        {format(new Date(recordatorio.proxima_ejecucion), 'PPp', { locale: es })}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      {recordatorio.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TodasTab() {
  const { data: tareas, isLoading } = useTareas();
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.AUDIT_SYSTEM, Sections.TAREAS, 'create');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tareas || tareas.length === 0) {
    return (
      <EmptyState
        title="No hay tareas"
        description="Las tareas del sistema aparecerán aquí"
        icon={<List size={40} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Todas las Tareas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Vista completa con filtros avanzados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros Avanzados
          </Button>
          {canCreate && (
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Nueva Tarea
            </Button>
          )}
        </div>
      </div>

      <Card variant="bordered" padding="md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Código
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400"></th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Asignado a
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Estado
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Prioridad
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Vencimiento
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Progreso
                </th>
              </tr>
            </thead>
            <tbody>
              {tareas.map((tarea) => (
                <tr
                  key={tarea.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4 text-sm">{tarea.codigo}</td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {tarea.titulo}
                    </div>
                    {tarea.descripcion && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {tarea.descripcion.slice(0, 50)}...
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">{tarea.asignado_a_nombre || '-'}</td>
                  <td className="py-3 px-4">
                    <Badge variant="gray" size="sm" className={getEstadoColor(tarea.estado)}>
                      {formatStatusLabel(tarea.estado)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Flag className={cn('w-4 h-4', getPrioridadColor(tarea.prioridad))} />
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {format(new Date(tarea.fecha_limite), 'PP', { locale: es })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${tarea.porcentaje_avance}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 w-10">
                        {tarea.porcentaje_avance}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==================== TABS CONFIG ====================

const tabs = [
  { id: 'mis-tareas', label: 'Mis Tareas', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'calendario', label: 'Calendario', icon: <CalendarIcon className="w-4 h-4" /> },
  { id: 'recordatorios', label: 'Recordatorios', icon: <Bell className="w-4 h-4" /> },
  { id: 'todas', label: 'Todas', icon: <List className="w-4 h-4" /> },
];

// ==================== MAIN COMPONENT ====================

export default function TareasPage() {
  const [activeTab, setActiveTab] = useState('mis-tareas');
  const { data: vencidas } = useTareasVencidas();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Tareas"
        description="Organización y seguimiento de tareas, eventos y recordatorios"
        actions={
          <div className="flex gap-2">
            <Badge variant="warning" size="lg">
              {vencidas?.length || 0} vencidas
            </Badge>
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'mis-tareas' && <MisTareasTab />}
        {activeTab === 'calendario' && <CalendarioTab />}
        {activeTab === 'recordatorios' && <RecordatoriosTab />}
        {activeTab === 'todas' && <TodasTab />}
      </div>
    </div>
  );
}
