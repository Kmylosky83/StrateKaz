/**
 * Página: Gestión de Tareas y Calendario
 *
 * Gestión de tareas con tabs:
 * 1. Mis Tareas - Lista de tareas asignadas al usuario
 * 2. Calendario - Vista de calendario con eventos
 * 3. Recordatorios - Lista de recordatorios programados
 * 4. Todas - Todas las tareas con filtros
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
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockTareas = [
  {
    id: 1,
    codigo: 'TSK-2024-001',
    titulo: 'Revisión Plan de Emergencia',
    descripcion: 'Actualizar el plan de emergencia según nuevas normativas',
    estado: 'en_progreso',
    prioridad: 'alta',
    asignado_a_nombre: 'Juan Pérez',
    fecha_limite: '2025-01-05',
    porcentaje_avance: 60,
    tags: ['SST', 'Emergencias'],
  },
  {
    id: 2,
    codigo: 'TSK-2024-002',
    titulo: 'Inspección Vehículos',
    descripcion: 'Realizar inspección trimestral de la flota vehicular',
    estado: 'pendiente',
    prioridad: 'normal',
    asignado_a_nombre: 'María García',
    fecha_limite: '2025-01-03',
    porcentaje_avance: 0,
    tags: ['PESV', 'Flota'],
  },
  {
    id: 3,
    codigo: 'TSK-2024-003',
    titulo: 'Auditoría Interna ISO 9001',
    descripcion: 'Ejecutar auditoría interna del sistema de gestión de calidad',
    estado: 'vencida',
    prioridad: 'urgente',
    asignado_a_nombre: 'Carlos López',
    fecha_limite: '2024-12-28',
    porcentaje_avance: 25,
    tags: ['ISO', 'Calidad'],
  },
];

const mockEventos = [
  {
    id: 1,
    titulo: 'Capacitación SST',
    tipo_evento: 'capacitacion',
    fecha_inicio: '2025-01-02 09:00',
    fecha_fin: '2025-01-02 12:00',
    ubicacion: 'Sala de Conferencias',
    participantes_nombres: ['Juan Pérez', 'María García', 'Ana Rodríguez'],
    color: '#3b82f6',
  },
  {
    id: 2,
    titulo: 'Reunión Comité PESV',
    tipo_evento: 'reunion',
    fecha_inicio: '2025-01-03 14:00',
    fecha_fin: '2025-01-03 16:00',
    ubicacion: 'Oficina Principal',
    participantes_nombres: ['Pedro Martínez', 'Luis Fernández'],
    color: '#10b981',
  },
  {
    id: 3,
    titulo: 'Auditoría Externa',
    tipo_evento: 'auditoria',
    fecha_inicio: '2025-01-05 08:00',
    fecha_fin: '2025-01-05 17:00',
    ubicacion: 'Planta de Producción',
    participantes_nombres: ['Carlos López', 'Ana Rodríguez'],
    color: '#f59e0b',
  },
];

const mockRecordatorios = [
  {
    id: 1,
    titulo: 'Backup Semanal',
    tipo_repeticion: 'semanal',
    dias_semana: [1], // Lunes
    hora_recordatorio: '22:00',
    activo: true,
    proxima_ejecucion: '2025-01-06 22:00',
  },
  {
    id: 2,
    titulo: 'Reporte Mensual de Indicadores',
    tipo_repeticion: 'mensual',
    dia_mes: 1,
    hora_recordatorio: '08:00',
    activo: true,
    proxima_ejecucion: '2025-02-01 08:00',
  },
];

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

const getPrioridadColor = (prioridad: string) => {
  const colors = {
    baja: 'text-green-600',
    normal: 'text-blue-600',
    alta: 'text-orange-600',
    urgente: 'text-red-600',
  };
  return colors[prioridad as keyof typeof colors] || 'text-gray-600';
};

// ==================== COMPONENTS ====================

function MisTareasTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mis Tareas
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {mockTareas.filter(t => t.estado !== 'completada').length} tareas activas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Tarea
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {mockTareas.map((tarea) => (
          <Card key={tarea.id} variant="bordered" padding="md">
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                tarea.estado === 'completada' && 'bg-green-100 text-green-600',
                tarea.estado === 'en_progreso' && 'bg-blue-100 text-blue-600',
                tarea.estado === 'vencida' && 'bg-red-100 text-red-600',
                tarea.estado === 'pendiente' && 'bg-gray-100 text-gray-600',
              )}>
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
                      <Badge variant="gray" size="sm">{tarea.codigo}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {tarea.descripcion}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="gray" size="sm" className={getEstadoColor(tarea.estado)}>
                      {tarea.estado.replace('_', ' ')}
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
                        tarea.porcentaje_avance === 100 ? 'bg-green-500' :
                        tarea.porcentaje_avance >= 50 ? 'bg-blue-500' : 'bg-gray-400'
                      )}
                      style={{ width: `${tarea.porcentaje_avance}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {tarea.asignado_a_nombre}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {tarea.fecha_limite}
                    </span>
                    {tarea.tags.map((tag) => (
                      <Badge key={tag} variant="gray" size="sm">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {tarea.estado !== 'completada' && (
                      <Button variant="primary" size="sm" leftIcon={<CheckCircle className="w-4 h-4" />}>
                        Completar
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
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
  const [selectedDate] = useState(new Date(2025, 0, 1)); // Enero 2025

  // Simple calendar grid (simplified version)
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Calendario de Eventos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card variant="bordered" padding="md">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2">
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
                const hasEvent = mockEventos.some(e =>
                  new Date(e.fecha_inicio).getDate() === day
                );
                return (
                  <div
                    key={day}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg text-sm cursor-pointer transition-colors',
                      hasEvent && 'bg-primary-50 text-primary-700 font-medium',
                      !hasEvent && 'hover:bg-gray-100 dark:hover:bg-gray-800',
                      day === new Date().getDate() && 'ring-2 ring-primary-500'
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
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Próximos Eventos
          </h4>
          {mockEventos.map((evento) => (
            <Card key={evento.id} variant="bordered" padding="sm">
              <div className="flex items-start gap-3">
                <div
                  className="w-1 h-full rounded-full"
                  style={{ backgroundColor: evento.color }}
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    {evento.titulo}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(evento.fecha_inicio).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Badge variant="gray" size="sm">{evento.tipo_evento}</Badge>
                    <span>{evento.ubicacion}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordatoriosTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recordatorios Programados
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {mockRecordatorios.filter(r => r.activo).length} recordatorios activos
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Recordatorio
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {mockRecordatorios.map((recordatorio) => (
          <Card key={recordatorio.id} variant="bordered" padding="md">
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                recordatorio.activo ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              )}>
                <Bell className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {recordatorio.titulo}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {recordatorio.tipo_repeticion === 'semanal' &&
                        `Cada lunes a las ${recordatorio.hora_recordatorio}`}
                      {recordatorio.tipo_repeticion === 'mensual' &&
                        `Día ${recordatorio.dia_mes} de cada mes a las ${recordatorio.hora_recordatorio}`}
                    </p>
                  </div>
                  <Badge variant={recordatorio.activo ? 'success' : 'gray'} size="sm">
                    {recordatorio.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Próxima ejecución: {recordatorio.proxima_ejecucion}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      {recordatorio.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button variant="ghost" size="sm">Editar</Button>
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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Todas las Tareas
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Vista completa con filtros avanzados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros Avanzados
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Tarea
          </Button>
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
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Tarea
                </th>
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
              {mockTareas.map((tarea) => (
                <tr key={tarea.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-sm">{tarea.codigo}</td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {tarea.titulo}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {tarea.descripcion.slice(0, 50)}...
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">{tarea.asignado_a_nombre}</td>
                  <td className="py-3 px-4">
                    <Badge variant="gray" size="sm" className={getEstadoColor(tarea.estado)}>
                      {tarea.estado.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Flag className={cn('w-4 h-4', getPrioridadColor(tarea.prioridad))} />
                  </td>
                  <td className="py-3 px-4 text-sm">{tarea.fecha_limite}</td>
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Tareas"
        description="Organización y seguimiento de tareas, eventos y recordatorios"
        actions={
          <div className="flex gap-2">
            <Badge variant="warning" size="lg">
              {mockTareas.filter(t => t.estado === 'vencida').length} vencidas
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
