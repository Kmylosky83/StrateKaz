/**
 * Página: Centro de Notificaciones
 *
 * Gestión de notificaciones con tabs:
 * 1. Bandeja - Lista de notificaciones
 * 2. Tipos - CRUD de tipos de notificación
 * 3. Preferencias - Configuración por usuario
 * 4. Masivas - Envío de notificaciones masivas
 */
import { useState } from 'react';
import {
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  Settings,
  Send,
  CheckCircle,
  Archive,
  Filter,
  Plus,
  Clock,
  AlertTriangle,
  CheckSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/utils/cn';

// ==================== MOCK DATA ====================

const mockNotificaciones = [
  {
    id: 1,
    titulo: 'Vencimiento de Certificado ISO 9001',
    cuerpo: 'El certificado ISO 9001 vencerá en 15 días. Es necesario programar auditoría de recertificación.',
    categoria: 'alerta',
    prioridad: 'urgente',
    leida: false,
    archivada: false,
    created_at: '2024-12-30 14:30',
    tipo_notificacion_nombre: 'Vencimiento Certificación',
  },
  {
    id: 2,
    titulo: 'Nueva Tarea Asignada',
    cuerpo: 'Se te ha asignado la tarea "Revisión de Plan de Emergencia" con fecha límite 05/01/2025.',
    categoria: 'tarea',
    prioridad: 'alta',
    leida: false,
    archivada: false,
    created_at: '2024-12-30 13:15',
    tipo_notificacion_nombre: 'Asignación Tarea',
  },
  {
    id: 3,
    titulo: 'Recordatorio: Capacitación SST',
    cuerpo: 'Mañana a las 9:00 AM está programada la capacitación "Trabajo en Alturas - Nivel Avanzado".',
    categoria: 'recordatorio',
    prioridad: 'normal',
    leida: true,
    archivada: false,
    created_at: '2024-12-30 10:00',
    tipo_notificacion_nombre: 'Recordatorio Capacitación',
  },
  {
    id: 4,
    titulo: 'Aprobación Pendiente',
    cuerpo: 'La solicitud de compra #SC-2024-156 requiere tu aprobación.',
    categoria: 'aprobacion',
    prioridad: 'alta',
    leida: true,
    archivada: false,
    created_at: '2024-12-30 09:30',
    tipo_notificacion_nombre: 'Solicitud Aprobación',
  },
];

const mockTiposNotificacion = [
  {
    id: 1,
    codigo: 'VENC_CERT',
    nombre: 'Vencimiento Certificación',
    categoria: 'alerta',
    plantilla_titulo: 'Vencimiento de {certificacion}',
    plantilla_cuerpo: 'El certificado {certificacion} vencerá en {dias} días.',
    enviar_email: true,
    enviar_push: true,
    enviar_sms: false,
    is_active: true,
  },
  {
    id: 2,
    codigo: 'ASIG_TAREA',
    nombre: 'Asignación de Tarea',
    categoria: 'tarea',
    plantilla_titulo: 'Nueva tarea asignada',
    plantilla_cuerpo: 'Se te ha asignado la tarea "{tarea}" con fecha límite {fecha_limite}.',
    enviar_email: true,
    enviar_push: true,
    enviar_sms: false,
    is_active: true,
  },
];

const mockPreferencias = [
  {
    id: 1,
    categoria: 'sistema',
    recibir_email: true,
    recibir_push: true,
    recibir_sms: false,
    frecuencia_resumen: 'tiempo_real',
  },
  {
    id: 2,
    categoria: 'tarea',
    recibir_email: true,
    recibir_push: true,
    recibir_sms: false,
    frecuencia_resumen: 'diario',
  },
  {
    id: 3,
    categoria: 'alerta',
    recibir_email: true,
    recibir_push: true,
    recibir_sms: true,
    frecuencia_resumen: 'tiempo_real',
  },
];

// ==================== UTILITY FUNCTIONS ====================

const getCategoriaIcon = (categoria: string) => {
  const icons = {
    sistema: Settings,
    tarea: CheckSquare,
    alerta: AlertTriangle,
    recordatorio: Clock,
    aprobacion: CheckCircle,
  };
  const Icon = icons[categoria as keyof typeof icons] || Bell;
  return Icon;
};

const getCategoriaColor = (categoria: string) => {
  const colors = {
    sistema: 'bg-blue-100 text-blue-600',
    tarea: 'bg-green-100 text-green-600',
    alerta: 'bg-orange-100 text-orange-600',
    recordatorio: 'bg-purple-100 text-purple-600',
    aprobacion: 'bg-yellow-100 text-yellow-600',
  };
  return colors[categoria as keyof typeof colors] || 'bg-gray-100 text-gray-600';
};

// ==================== COMPONENTS ====================

function BandejaTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bandeja de Notificaciones
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {mockNotificaciones.filter(n => !n.leida).length} sin leer
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<CheckCircle className="w-4 h-4" />}>
            Marcar todas leídas
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {mockNotificaciones.map((notif) => {
          const Icon = getCategoriaIcon(notif.categoria);
          return (
            <Card
              key={notif.id}
              variant="bordered"
              padding="md"
              className={cn(
                'transition-all',
                !notif.leida && 'border-l-4 border-l-primary-500 bg-primary-50/30 dark:bg-primary-900/10'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  getCategoriaColor(notif.categoria)
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className={cn(
                        'text-sm font-medium',
                        !notif.leida ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      )}>
                        {notif.titulo}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notif.cuerpo}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!notif.leida && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full" />
                      )}
                      <Badge
                        variant={
                          notif.prioridad === 'urgente' ? 'danger' :
                          notif.prioridad === 'alta' ? 'warning' : 'gray'
                        }
                        size="sm"
                      >
                        {notif.prioridad}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <Badge variant="gray" size="sm">
                        {notif.categoria}
                      </Badge>
                      <span>{notif.tipo_notificacion_nombre}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.created_at}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {!notif.leida && (
                        <Button variant="ghost" size="sm">
                          Marcar leída
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" leftIcon={<Archive className="w-4 h-4" />}>
                        Archivar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TiposTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tipos de Notificación
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configuración de plantillas de notificación
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Tipo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockTiposNotificacion.map((tipo) => (
          <Card key={tipo.id} variant="bordered" padding="md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                    {tipo.nombre}
                  </h4>
                  <Badge variant="gray" size="sm">
                    {tipo.codigo}
                  </Badge>
                  <Badge variant={tipo.is_active ? 'success' : 'gray'} size="sm">
                    {tipo.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <Badge variant="gray" size="sm" className={getCategoriaColor(tipo.categoria)}>
                  {tipo.categoria}
                </Badge>

                <div className="mt-3 space-y-2">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Plantilla Título:
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono">
                      {tipo.plantilla_titulo}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Plantilla Cuerpo:
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono">
                      {tipo.plantilla_cuerpo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-xs">
                    {tipo.enviar_email ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <BellOff className="w-4 h-4 text-gray-400" />
                    )}
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {tipo.enviar_push ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <BellOff className="w-4 h-4 text-gray-400" />
                    )}
                    <Bell className="w-4 h-4" />
                    <span>Push</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {tipo.enviar_sms ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <BellOff className="w-4 h-4 text-gray-400" />
                    )}
                    <MessageSquare className="w-4 h-4" />
                    <span>SMS</span>
                  </div>
                </div>
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

function PreferenciasTab() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Preferencias de Notificación
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configura cómo quieres recibir notificaciones por categoría
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockPreferencias.map((pref) => {
          const Icon = getCategoriaIcon(pref.categoria);
          return (
            <Card key={pref.id} variant="bordered" padding="md">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  getCategoriaColor(pref.categoria)
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white capitalize mb-4">
                    {pref.categoria}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Canales de Notificación
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={pref.recibir_email}
                            readOnly
                            className="rounded"
                          />
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">Email</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={pref.recibir_push}
                            readOnly
                            className="rounded"
                          />
                          <Bell className="w-4 h-4" />
                          <span className="text-sm">Push</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={pref.recibir_sms}
                            readOnly
                            className="rounded"
                          />
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm">SMS</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Frecuencia de Resumen
                      </p>
                      <select className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm">
                        <option value="tiempo_real">Tiempo real</option>
                        <option value="diario">Resumen diario</option>
                        <option value="semanal">Resumen semanal</option>
                        <option value="nunca">Nunca</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Cancelar
        </Button>
        <Button variant="primary" size="sm">
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
}

function MasivasTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notificaciones Masivas
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Envía notificaciones a múltiples usuarios
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Send className="w-4 h-4" />}>
          Nueva Notificación Masiva
        </Button>
      </div>

      <Card variant="bordered" padding="md">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
              placeholder="Título de la notificación"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje
            </label>
            <textarea
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
              rows={4}
              placeholder="Contenido del mensaje"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridad
              </label>
              <select className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2">
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destinatarios
              </label>
              <select className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2">
                <option value="todos">Todos los usuarios</option>
                <option value="por_rol">Por rol</option>
                <option value="por_area">Por área</option>
                <option value="especificos">Usuarios específicos</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Canales de Envío
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <Bell className="w-4 h-4" />
                <span className="text-sm">Push</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">SMS</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm">
              Vista Previa
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Send className="w-4 h-4" />}>
              Enviar Notificación
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ==================== TABS CONFIG ====================

const tabs = [
  { id: 'bandeja', label: 'Bandeja', icon: <Bell className="w-4 h-4" /> },
  { id: 'tipos', label: 'Tipos', icon: <Settings className="w-4 h-4" /> },
  { id: 'preferencias', label: 'Preferencias', icon: <Settings className="w-4 h-4" /> },
  { id: 'masivas', label: 'Masivas', icon: <Send className="w-4 h-4" /> },
];

// ==================== MAIN COMPONENT ====================

export default function NotificacionesPage() {
  const [activeTab, setActiveTab] = useState('bandeja');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Centro de Notificaciones"
        description="Gestión de notificaciones y comunicaciones del sistema"
        actions={
          <div className="flex gap-2">
            <Badge variant="primary" size="lg">
              {mockNotificaciones.filter(n => !n.leida).length} sin leer
            </Badge>
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'bandeja' && <BandejaTab />}
        {activeTab === 'tipos' && <TiposTab />}
        {activeTab === 'preferencias' && <PreferenciasTab />}
        {activeTab === 'masivas' && <MasivasTab />}
      </div>
    </div>
  );
}
