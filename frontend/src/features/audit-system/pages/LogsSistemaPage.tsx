/**
 * Página: Logs del Sistema (REWRITTEN - Sprint 9)
 * 4 tabs: Configuración, Accesos, Cambios, Consultas
 * Connected to real hooks from useAuditSystem
 * Deleted ALL mock data
 */
import { useState } from 'react';
import {
  Settings,
  LogIn,
  FileEdit,
  Search,
  Download,
  Filter,
  Monitor,
  MapPin,
  Chrome,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import { Card, Button, Badge, Tabs, Spinner, EmptyState } from '@/components/common';
import { cn } from '@/utils/cn';
import {
  useConfiguracionesAuditoria,
  useLogsAcceso,
  useLogsCambio,
  useLogsConsulta,
} from '../hooks/useAuditSystem';

// ==================== COMPONENTS ====================

function ConfiguracionTab() {
  const { data: configuraciones, isLoading } = useConfiguracionesAuditoria();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!configuraciones || configuraciones.length === 0) {
    return (
      <EmptyState
        title="No hay configuraciones de auditoría"
        description="Crea una nueva configuración para empezar a auditar módulos"
        icon={Settings}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración de Auditoría
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Define qué módulos y modelos serán auditados
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
          Nueva Configuración
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {configuraciones.map((config) => (
          <Card key={config.id} variant="bordered" padding="md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                    {config.modulo} / {config.modelo}
                  </h4>
                  <Badge variant={config.is_active ? 'success' : 'gray'} size="sm">
                    {config.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm">
                    {config.auditar_creacion ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">Creación</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {config.auditar_modificacion ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">Modificación</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {config.auditar_eliminacion ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">Eliminación</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {config.auditar_consulta ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">Consulta</span>
                  </div>
                </div>

                {config.campos_sensibles && config.campos_sensibles.length > 0 && (
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      <strong>Campos sensibles:</strong> {config.campos_sensibles.join(', ')}
                    </span>
                    <span>
                      <strong>Retención:</strong> {config.dias_retencion} días
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AccesosTab() {
  const { data: logs, isLoading } = useLogsAcceso();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <EmptyState
        title="No hay logs de acceso"
        description="Los registros de login y logout aparecerán aquí"
        icon={LogIn}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Logs de Acceso</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Historial de login, logout y eventos de sesión
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {logs.map((log) => (
          <Card key={log.id} variant="bordered" padding="md">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  log.fue_exitoso ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                )}
              >
                {log.tipo_evento === 'login' || log.tipo_evento === 'login_fallido' ? (
                  <LogIn className="w-5 h-5" />
                ) : (
                  <LogIn className="w-5 h-5 rotate-180" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.usuario_nombre}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
                      {log.dispositivo && (
                        <span className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          {log.dispositivo}
                        </span>
                      )}
                      {log.navegador && (
                        <span className="flex items-center gap-1">
                          <Chrome className="w-3 h-3" />
                          {log.navegador}
                        </span>
                      )}
                      {log.ubicacion && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {log.ubicacion}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={log.fue_exitoso ? 'success' : 'danger'} size="sm">
                      {log.tipo_evento.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(log.fecha), 'PPp', { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <strong>IP:</strong> {log.ip_address}
                  {log.mensaje_error && (
                    <span className="ml-3 text-red-600">
                      <strong>Error:</strong> {log.mensaje_error}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CambiosTab() {
  const { data: logs, isLoading } = useLogsCambio();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <EmptyState
        title="No hay logs de cambios"
        description="Los cambios en registros aparecerán aquí"
        icon={FileEdit}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Logs de Cambios</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Historial de creación, modificación y eliminación de registros
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {logs.map((log) => (
          <Card key={log.id} variant="bordered" padding="md">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  log.accion === 'crear' && 'bg-green-100 text-green-600',
                  log.accion === 'modificar' && 'bg-blue-100 text-blue-600',
                  log.accion === 'eliminar' && 'bg-red-100 text-red-600'
                )}
              >
                <FileEdit className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.usuario_nombre}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {log.content_type_nombre || 'Registro'}: <strong>{log.object_repr}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant={
                        log.accion === 'crear'
                          ? 'success'
                          : log.accion === 'modificar'
                            ? 'info'
                            : 'danger'
                      }
                      size="sm"
                    >
                      {log.accion}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(log.fecha), 'PPp', { locale: es })}
                    </p>
                  </div>
                </div>

                {/* Cambios Diff */}
                {log.cambios && Object.keys(log.cambios).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    {Object.entries(log.cambios).map(([campo, valores]) => (
                      <div key={campo} className="text-xs">
                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {campo}:
                        </div>
                        <div className="flex items-center gap-2">
                          {valores.old !== null && (
                            <div className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                              <span className="font-mono">{JSON.stringify(valores.old)}</span>
                            </div>
                          )}
                          <span className="text-gray-400">→</span>
                          <div className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                            <span className="font-mono">{JSON.stringify(valores.new)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {log.ip_address && (
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>IP:</strong> {log.ip_address}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ConsultasTab() {
  const { data: logs, isLoading } = useLogsConsulta();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <EmptyState
        title="No hay logs de consultas"
        description="Las consultas y exportaciones aparecerán aquí"
        icon={Search}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Logs de Consultas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Historial de consultas, exportaciones y reportes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {logs.map((log) => (
          <Card key={log.id} variant="bordered" padding="md">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                {log.tipo_consulta === 'exportacion' ? (
                  <Download className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.usuario_nombre}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {log.modulo} / {log.modelo}
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge variant="info" size="sm">
                      {log.tipo_consulta}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(log.fecha), 'PPp', { locale: es })}
                    </p>
                  </div>
                </div>

                {log.parametros && Object.keys(log.parametros).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="text-xs">
                      <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Parámetros:
                      </div>
                      <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
                        {JSON.stringify(log.parametros, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>
                    <strong>Registros:</strong> {log.registros_afectados.toLocaleString()}
                  </span>
                  {log.duracion_ms && (
                    <span>
                      <strong>Duración:</strong> {log.duracion_ms}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ==================== TABS CONFIG ====================

const tabs = [
  { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
  { id: 'accesos', label: 'Accesos', icon: <LogIn className="w-4 h-4" /> },
  { id: 'cambios', label: 'Cambios', icon: <FileEdit className="w-4 h-4" /> },
  { id: 'consultas', label: 'Consultas', icon: <Search className="w-4 h-4" /> },
];

// ==================== MAIN COMPONENT ====================

export default function LogsSistemaPage() {
  const [activeTab, setActiveTab] = useState('configuracion');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Logs del Sistema"
        description="Gestión de auditoría y trazabilidad del sistema"
        actions={
          <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar Todo
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'configuracion' && <ConfiguracionTab />}
        {activeTab === 'accesos' && <AccesosTab />}
        {activeTab === 'cambios' && <CambiosTab />}
        {activeTab === 'consultas' && <ConsultasTab />}
      </div>
    </div>
  );
}
