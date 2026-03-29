/**
 * Página: Audit System Dashboard Principal
 *
 * Dashboard principal del sistema de auditoría con:
 * - Estadísticas de logs, notificaciones, alertas y tareas
 * - Actividad reciente (logs de acceso y cambio reales)
 * - Alertas pendientes reales
 * - Accesos rápidos a módulos
 */
import {
  Bell,
  AlertTriangle,
  CheckSquare,
  Activity,
  Settings,
  Clock,
  Database,
  LogIn,
  LogOut,
  Edit3,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import { Card, Button, Badge, Spinner, EmptyState } from '@/components/common';
import { cn } from '@/utils/cn';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import { useNavigate } from 'react-router-dom';
import {
  useLogsAcceso,
  useLogsCambio,
  useAlertasPendientes,
  useNotificacionesNoLeidas,
  useTareasVencidas,
} from '../hooks/useAuditSystem';

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

const getTipoEventoIcon = (tipo: string) => {
  if (tipo === 'login') return <LogIn className="w-4 h-4" />;
  if (tipo === 'logout') return <LogOut className="w-4 h-4" />;
  if (tipo === 'login_fallido') return <AlertTriangle className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
};

// ==================== MAIN COMPONENT ====================

export default function AuditSystemPage() {
  const navigate = useNavigate();

  const { data: logsAcceso, isLoading: loadingAcceso } = useLogsAcceso({ page_size: 5 });
  const { data: logsCambio, isLoading: loadingCambio } = useLogsCambio({ page_size: 5 });
  const { data: alertasPendientes, isLoading: loadingAlertas } = useAlertasPendientes();
  const { data: notificacionesNoLeidas } = useNotificacionesNoLeidas();
  const { data: tareasVencidas } = useTareasVencidas();

  const logsHoy = (logsAcceso?.length || 0) + (logsCambio?.length || 0);
  const isLoading = loadingAcceso || loadingCambio || loadingAlertas;

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
              <p className="text-sm text-gray-600 dark:text-gray-400">Logs Recientes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{logsHoy}</p>
              <p className="text-xs text-gray-500 mt-1">Eventos registrados</p>
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
                {notificacionesNoLeidas?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Sin leer</p>
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
                {alertasPendientes?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {alertasPendientes?.filter((a) => a.severidad === 'critical').length || 0} críticas
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
                {tareasVencidas?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
            </div>
            <div className="w-14 h-14 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-7 h-7 text-danger-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad Reciente — Logs reales */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actividad Reciente
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auditoria/logs')}>
              Ver todo
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Logs de Acceso */}
              {logsAcceso && logsAcceso.length > 0
                ? logsAcceso.slice(0, 3).map((log) => (
                    <Card key={`acceso-${log.id}`} variant="bordered" padding="sm">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            log.fue_exitoso
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-red-100 text-red-600'
                          )}
                        >
                          {getTipoEventoIcon(log.tipo_evento)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatStatusLabel(log.tipo_evento)}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {log.usuario_nombre || 'Usuario desconocido'} — {log.ip_address}
                                {log.navegador ? ` (${log.navegador})` : ''}
                              </p>
                              <span className="text-xs text-gray-500">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {format(new Date(log.fecha), 'PPp', { locale: es })}
                              </span>
                            </div>
                            <Badge variant={log.fue_exitoso ? 'success' : 'danger'} size="sm">
                              {log.fue_exitoso ? 'Exitoso' : 'Fallido'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                : null}

              {/* Logs de Cambio */}
              {logsCambio && logsCambio.length > 0
                ? logsCambio.slice(0, 3).map((log) => (
                    <Card key={`cambio-${log.id}`} variant="bordered" padding="sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-100 text-purple-600">
                          <Edit3 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatStatusLabel(log.accion)}: {log.object_repr}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {log.usuario_nombre || 'Sistema'}
                                {log.content_type_nombre ? ` — ${log.content_type_nombre}` : ''}
                              </p>
                              <span className="text-xs text-gray-500">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {format(new Date(log.fecha), 'PPp', { locale: es })}
                              </span>
                            </div>
                            <Badge variant="gray" size="sm">
                              {formatStatusLabel(log.accion)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                : null}

              {(!logsAcceso || logsAcceso.length === 0) &&
                (!logsCambio || logsCambio.length === 0) && (
                  <EmptyState
                    title="Sin actividad reciente"
                    description="No se han registrado eventos de auditoría aún. Los logs se generarán automáticamente con el uso del sistema."
                    icon={<Activity size={40} />}
                  />
                )}
            </div>
          )}
        </div>

        {/* Alertas Pendientes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Alertas Pendientes
            </h3>
            <Badge variant="danger" size="sm">
              {alertasPendientes?.length || 0}
            </Badge>
          </div>

          {loadingAlertas ? (
            <div className="flex items-center justify-center py-6">
              <Spinner size="md" />
            </div>
          ) : alertasPendientes && alertasPendientes.length > 0 ? (
            <div className="space-y-3">
              {alertasPendientes.slice(0, 5).map((alerta) => (
                <Card
                  key={alerta.id}
                  variant="bordered"
                  padding="sm"
                  className={cn('border-l-4', getSeveridadColor(alerta.severidad))}
                >
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className={cn(
                          'w-5 h-5 flex-shrink-0 mt-0.5',
                          alerta.severidad === 'critical' && 'text-red-600',
                          alerta.severidad === 'danger' && 'text-orange-600',
                          alerta.severidad === 'warning' && 'text-yellow-600'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {alerta.titulo}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {alerta.mensaje}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant={
                              alerta.severidad === 'critical'
                                ? 'danger'
                                : alerta.severidad === 'danger'
                                  ? 'warning'
                                  : 'info'
                            }
                            size="sm"
                          >
                            {formatStatusLabel(alerta.severidad)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(alerta.created_at), 'PP', { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin alertas pendientes"
              description="No hay alertas que requieran atención"
              icon={<AlertTriangle size={40} />}
            />
          )}

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
              <div className="text-xs text-gray-500">
                {notificacionesNoLeidas?.length || 0} sin leer
              </div>
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
              <div className="text-xs text-gray-500">
                {alertasPendientes?.filter((a) => a.severidad === 'critical').length || 0} críticas
              </div>
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
              <div className="text-xs text-gray-500">{tareasVencidas?.length || 0} vencidas</div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}
