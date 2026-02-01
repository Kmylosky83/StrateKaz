/**
 * Página: Audit System Dashboard Principal
 *
 * Dashboard principal del sistema de auditoría con:
 * - Estadísticas de logs, notificaciones, alertas y tareas
 * - Actividad reciente del sistema
 * - Alertas críticas activas
 * - Accesos rápidos a módulos
 */
import {
  Shield,
  Bell,
  AlertTriangle,
  CheckSquare,
  Activity,
  FileText,
  Settings,
  TrendingUp,
  Clock,
  Users,
  Database,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import { useNavigate } from 'react-router-dom';
import { useAuditSystemStats, useActividadReciente, useAlertasPendientes } from '../hooks/useAuditSystem';

// ==================== MOCK DATA ====================

const mockStats = {
  logs_hoy: 1247,
  notificaciones_sin_leer: 18,
  alertas_pendientes: 12,
  alertas_criticas: 3,
  tareas_vencidas: 5,
  tareas_hoy: 8,
  eventos_semana: 14,
};

const mockActividadReciente = [
  {
    id: 1,
    tipo: 'alerta' as const,
    titulo: 'Alerta de Vencimiento',
    descripcion: 'Licencia de conducir del conductor Juan Pérez vence en 5 días',
    usuario: 'Sistema',
    fecha: '2024-12-30 14:30',
    severidad: 'critical' as const,
  },
  {
    id: 2,
    tipo: 'log' as const,
    titulo: 'Cambio en Registro',
    descripcion: 'María García modificó el registro de vehículo ABC-123',
    usuario: 'María García',
    fecha: '2024-12-30 13:15',
  },
  {
    id: 3,
    tipo: 'tarea' as const,
    titulo: 'Tarea Completada',
    descripcion: 'Se completó la inspección de seguridad mensual',
    usuario: 'Carlos López',
    fecha: '2024-12-30 12:00',
    prioridad: 'alta' as const,
  },
  {
    id: 4,
    tipo: 'notificacion' as const,
    titulo: 'Nueva Notificación',
    descripcion: 'Se generó nuevo reporte de accidentalidad mensual',
    usuario: 'Sistema',
    fecha: '2024-12-30 10:45',
  },
];

const mockAlertasCriticas = [
  {
    id: 1,
    titulo: 'Vencimiento SOAT Vehículo',
    descripcion: 'El SOAT del vehículo XYZ-789 vence mañana',
    severidad: 'critical' as const,
    fecha: '2024-12-30',
    responsable: 'Pedro Martínez',
  },
  {
    id: 2,
    titulo: 'Certificado ISO 9001 Próximo a Vencer',
    descripcion: 'El certificado ISO 9001 vence en 15 días',
    severidad: 'danger' as const,
    fecha: '2024-12-29',
    responsable: 'Ana Rodríguez',
  },
  {
    id: 3,
    titulo: 'Capacitación SST Pendiente',
    descripcion: '12 trabajadores sin capacitación SST anual',
    severidad: 'warning' as const,
    fecha: '2024-12-28',
    responsable: 'Luis Fernández',
  },
];

// ==================== UTILITY FUNCTIONS ====================

const getSeveridadColor = (severidad: string) => {
  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    danger: 'bg-orange-100 text-orange-800 border-orange-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return colors[severidad as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getTipoIcon = (tipo: string) => {
  const icons = {
    log: Database,
    notificacion: Bell,
    alerta: AlertTriangle,
    tarea: CheckSquare,
  };
  const Icon = icons[tipo as keyof typeof icons] || Activity;
  return <Icon className="w-4 h-4" />;
};

// ==================== MAIN COMPONENT ====================

export default function AuditSystemPage() {
  const navigate = useNavigate();

  // Use mock data for now
  const stats = mockStats;
  const actividades = mockActividadReciente;
  const alertasCriticas = mockAlertasCriticas;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sistema de Auditoría"
        description="Monitoreo de logs, notificaciones, alertas y tareas del sistema"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Settings className="w-4 h-4" />}
              onClick={() => navigate('/auditoria/logs')}
            >
              Configuración
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Activity className="w-4 h-4" />}
              onClick={() => navigate('/auditoria/logs')}
            >
              Ver Logs
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Logs Hoy</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.logs_hoy.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Eventos registrados
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Database className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Notificaciones</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">
                {stats.notificaciones_sin_leer}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Sin leer
              </p>
            </div>
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Bell className="w-7 h-7 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alertas Pendientes</p>
              <p className="text-3xl font-bold text-warning-600 mt-1">
                {stats.alertas_pendientes}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.alertas_criticas} críticas
              </p>
            </div>
            <div className="w-14 h-14 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tareas Vencidas</p>
              <p className="text-3xl font-bold text-danger-600 mt-1">
                {stats.tareas_vencidas}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.tareas_hoy} programadas hoy
              </p>
            </div>
            <div className="w-14 h-14 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-7 h-7 text-danger-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad Reciente */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actividad Reciente
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auditoria/logs')}
            >
              Ver todo
            </Button>
          </div>

          <div className="space-y-3">
            {actividades.map((actividad) => (
              <Card key={actividad.id} variant="bordered" padding="sm">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    actividad.tipo === 'alerta' && 'bg-orange-100 text-orange-600',
                    actividad.tipo === 'log' && 'bg-blue-100 text-blue-600',
                    actividad.tipo === 'notificacion' && 'bg-purple-100 text-purple-600',
                    actividad.tipo === 'tarea' && 'bg-green-100 text-green-600',
                  )}>
                    {getTipoIcon(actividad.tipo)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {actividad.titulo}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {actividad.descripcion}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            <Users className="w-3 h-3 inline mr-1" />
                            {actividad.usuario}
                          </span>
                          <span className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {actividad.fecha}
                          </span>
                        </div>
                      </div>

                      {actividad.severidad && (
                        <Badge
                          variant={
                            actividad.severidad === 'critical' ? 'danger' :
                            actividad.severidad === 'warning' ? 'warning' : 'info'
                          }
                          size="sm"
                        >
                          {actividad.severidad}
                        </Badge>
                      )}

                      {actividad.prioridad && (
                        <Badge
                          variant={actividad.prioridad === 'alta' ? 'danger' : 'gray'}
                          size="sm"
                        >
                          {actividad.prioridad}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Alertas Críticas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Alertas Críticas
            </h3>
            <Badge variant="danger" size="sm">
              {alertasCriticas.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {alertasCriticas.map((alerta) => (
              <Card
                key={alerta.id}
                variant="bordered"
                padding="sm"
                className={cn('border-l-4', getSeveridadColor(alerta.severidad))}
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={cn(
                      'w-5 h-5 flex-shrink-0 mt-0.5',
                      alerta.severidad === 'critical' && 'text-red-600',
                      alerta.severidad === 'danger' && 'text-orange-600',
                      alerta.severidad === 'warning' && 'text-yellow-600',
                    )} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {alerta.titulo}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {alerta.descripcion}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          variant={
                            alerta.severidad === 'critical' ? 'danger' :
                            alerta.severidad === 'danger' ? 'warning' : 'info'
                          }
                          size="sm"
                        >
                          {alerta.severidad}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {alerta.responsable}
                        </span>
                        <span className="text-xs text-gray-500">{alerta.fecha}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Atender
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      Escalar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate('/auditoria/alertas')}
          >
            Ver todas las alertas
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card variant="bordered" padding="md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Accesos Rápidos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Database className="w-5 h-5" />}
            onClick={() => navigate('/auditoria/logs')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Logs del Sistema</div>
              <div className="text-xs text-gray-500">Accesos, cambios, consultas</div>
            </div>
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<Bell className="w-5 h-5" />}
            onClick={() => navigate('/auditoria/notificaciones')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Notificaciones</div>
              <div className="text-xs text-gray-500">{stats.notificaciones_sin_leer} sin leer</div>
            </div>
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<AlertTriangle className="w-5 h-5" />}
            onClick={() => navigate('/auditoria/alertas')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Alertas</div>
              <div className="text-xs text-gray-500">{stats.alertas_criticas} críticas</div>
            </div>
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<CheckSquare className="w-5 h-5" />}
            onClick={() => navigate('/auditoria/tareas')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Tareas</div>
              <div className="text-xs text-gray-500">{stats.tareas_hoy} programadas hoy</div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}
