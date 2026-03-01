/**
 * Página: Centro de Notificaciones
 *
 * Gestión de notificaciones con tabs:
 * 1. Bandeja - Lista de notificaciones (Vista 2: Lista CRUD)
 * 2. Tipos - CRUD de tipos de notificación
 * 3. Preferencias - Configuración por usuario
 * 4. Masivas - Envío de notificaciones masivas
 *
 * MN-001: Conectado con backend real via React Query hooks
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md - Vista 2
 */
import { useState, useEffect } from 'react';
import {
  Bell,
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
  Inbox,
  Eye,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { Input, Select, Textarea, Switch, Checkbox } from '@/components/forms';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import {
  useNotificaciones,
  useNotificacionesNoLeidas,
  useMarcarLeida,
  useMarcarTodasLeidas,
  useArchivarNotificacion,
  useTiposNotificacion,
  useCreateTipoNotificacion,
  useUpdateTipoNotificacion,
  useDeleteTipoNotificacion,
  usePreferenciasNotificacion,
  useUpdatePreferencia,
  useCreateNotificacionMasiva,
} from '../hooks/useNotificaciones';
import { useSelectCargos, useSelectUsers, useSelectAreas } from '@/hooks/useSelectLists';
import { TipoNotificacionModal } from '../components';
import type { Notificacion, TipoNotificacion } from '../types/notificaciones.types';

// ==================== UTILITY FUNCTIONS ====================

const getCategoriaIcon = (categoria: string) => {
  const icons: Record<string, typeof Bell> = {
    sistema: Settings,
    tarea: CheckSquare,
    alerta: AlertTriangle,
    recordatorio: Clock,
    aprobacion: CheckCircle,
  };
  return icons[categoria] || Bell;
};

const getCategoriaColor = (categoria: string) => {
  const colors: Record<string, string> = {
    sistema: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    tarea: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    alerta: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    recordatorio: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    aprobacion: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  return colors[categoria] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
};

// ==================== COMPONENTS ====================

/**
 * BandejaTab - Vista 2: Lista CRUD (Table View)
 *
 * Estructura:
 * - Section Header fuera del Card (icono + título + contador + acciones)
 * - Data Table en Card con acciones por fila
 * - Empty State con CTA
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md - Vista 2
 */
function BandejaTab() {
  const { data: notificaciones, isLoading, error } = useNotificaciones();
  const { data: noLeidas } = useNotificacionesNoLeidas();
  const marcarLeida = useMarcarLeida();
  const marcarTodasLeidas = useMarcarTodasLeidas();
  const archivar = useArchivarNotificacion();

  const countNoLeidas = noLeidas?.length || 0;
  const notifList = notificaciones || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Section Header skeleton */}
        <div className="flex items-center justify-between animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 w-10 h-10" />
            <div>
              <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
            </div>
          </div>
        </div>
        {/* Table skeleton */}
        <Card>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse-subtle"
              />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        variant="error"
        message="Error al cargar las notificaciones. Intenta de nuevo más tarde."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header - Por fuera del Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Bandeja de Notificaciones
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {notifList.length} notificación{notifList.length !== 1 ? 'es' : ''} •{' '}
              <span className="text-primary-600 dark:text-primary-400 font-medium">
                {countNoLeidas} sin leer
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => marcarTodasLeidas.mutate()}
            isLoading={marcarTodasLeidas.isPending}
            disabled={countNoLeidas === 0}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar todas leídas
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Data Table Card o Empty State */}
      {notifList.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Notificación
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Categoría
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Prioridad
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {notifList.map((notif: Notificacion) => {
                  const categoria = notif.categoria || 'sistema';
                  const Icon = getCategoriaIcon(categoria);
                  const isLeida = notif.esta_leida;

                  return (
                    <tr
                      key={notif.id}
                      className={cn(
                        'border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                        !isLeida && 'bg-primary-50/30 dark:bg-primary-900/10'
                      )}
                    >
                      {/* Notificación: Icono + Título + Mensaje */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'p-2 rounded-lg flex-shrink-0',
                              getCategoriaColor(categoria)
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {!isLeida && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                              )}
                              <span
                                className={cn(
                                  'font-medium truncate',
                                  !isLeida
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                                )}
                              >
                                {notif.titulo}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {notif.mensaje}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-4">
                        <Badge variant="gray" size="sm">
                          {categoria}
                        </Badge>
                      </td>

                      {/* Prioridad */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            notif.prioridad === 'urgente'
                              ? 'danger'
                              : notif.prioridad === 'alta'
                                ? 'warning'
                                : 'gray'
                          }
                          size="sm"
                        >
                          {notif.prioridad}
                        </Badge>
                      </td>

                      {/* Fecha */}
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(notif.created_at).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <Badge variant={isLeida ? 'gray' : 'success'} size="sm">
                          {isLeida ? 'Leída' : 'Nueva'}
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isLeida && (
                            <Button
                              variant="ghost"
                              className="p-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => marcarLeida.mutate(notif.id)}
                              title="Marcar como leída"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            className="p-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            onClick={() => archivar.mutate(notif.id)}
                            title="Archivar"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Empty State */
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No tienes notificaciones
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Tu bandeja está vacía. Las nuevas notificaciones aparecerán aquí.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * TiposTab - Vista 2: Lista CRUD (Table View)
 *
 * Estructura:
 * - Section Header fuera del Card (icono + título + contador + botón crear)
 * - Data Table en Card con acciones por fila
 * - Empty State con CTA
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md - Vista 2
 */
function TiposTab() {
  const { data: tipos, isLoading, error } = useTiposNotificacion();
  const createTipo = useCreateTipoNotificacion();
  const updateTipo = useUpdateTipoNotificacion();
  const deleteTipo = useDeleteTipoNotificacion();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoNotificacion | null>(null);

  const tiposList = tipos || [];

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este tipo de notificación?')) {
      deleteTipo.mutate(id);
    }
  };

  const handleEdit = (tipo: TipoNotificacion) => {
    setSelectedTipo(tipo);
    setShowEditModal(true);
  };

  const handleView = (tipo: TipoNotificacion) => {
    setSelectedTipo(tipo);
    // TODO: Implementar modal de vista detallada o navegar a página de detalle
    alert(`Ver detalle de: ${tipo.nombre}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 w-10 h-10" />
            <div>
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
            </div>
          </div>
        </div>
        <Card>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse-subtle"
              />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error" message="Error al cargar los tipos de notificación." />;
  }

  return (
    <div className="space-y-6">
      {/* Section Header - Por fuera del Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Tipos de Notificación
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tiposList.length} tipo{tiposList.length !== 1 ? 's' : ''} configurado
              {tiposList.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tipo
        </Button>
      </div>

      {/* Data Table Card o Empty State */}
      {tiposList.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Categoría
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Canales
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {tiposList.map((tipo: TipoNotificacion) => (
                  <tr
                    key={tipo.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {/* Tipo: Icono + Nombre + Código */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-lg flex-shrink-0',
                            getCategoriaColor(tipo.categoria)
                          )}
                        >
                          {getCategoriaIcon(tipo.categoria) &&
                            (() => {
                              const Icon = getCategoriaIcon(tipo.categoria);
                              return <Icon className="h-4 w-4" />;
                            })()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {tipo.nombre}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">
                            {tipo.codigo}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="py-3 px-4">
                      <Badge variant="gray" size="sm">
                        {tipo.categoria}
                      </Badge>
                    </td>

                    {/* Canales */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {tipo.es_email && (
                          <div
                            className="p-1 rounded bg-green-100 dark:bg-green-900/30"
                            title="Email"
                          >
                            <Mail className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                        {tipo.es_push && (
                          <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30" title="Push">
                            <Bell className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        {!tipo.es_email && !tipo.es_push && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4">
                      <Badge variant={tipo.is_active ? 'success' : 'gray'} size="sm">
                        {tipo.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="p-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={() => handleView(tipo)}
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="p-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          onClick={() => handleEdit(tipo)}
                          title="Editar"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="p-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(tipo.id)}
                          disabled={deleteTipo.isPending}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Empty State */
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Settings className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay tipos de notificación
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Crea el primer tipo para definir plantillas de notificación.
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Tipo
            </Button>
          </div>
        </Card>
      )}

      {/* Modal de Creación */}
      <TipoNotificacionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => {
          createTipo.mutate(data, {
            onSuccess: () => {
              setShowCreateModal(false);
            },
          });
        }}
        isLoading={createTipo.isPending}
      />

      {/* Modal de Edición */}
      <TipoNotificacionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTipo(null);
        }}
        tipo={selectedTipo}
        onSubmit={(data) => {
          if (selectedTipo) {
            updateTipo.mutate(
              { id: selectedTipo.id, data },
              {
                onSuccess: () => {
                  setShowEditModal(false);
                  setSelectedTipo(null);
                },
              }
            );
          }
        }}
        isLoading={updateTipo.isPending}
      />
    </div>
  );
}

/**
 * PreferenciasTab - Vista 3: Panel de Activación (Toggle Grid)
 *
 * Estructura:
 * - Section Header fuera del Card
 * - Cards con toggles para activar/desactivar canales
 * - Configuración de horarios
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md - Vista 3
 */
function PreferenciasTab() {
  const { data: preferencias, isLoading, error } = usePreferenciasNotificacion();
  const updatePreferencia = useUpdatePreferencia();

  // Estado local para manejar los valores del formulario
  const [formValues, setFormValues] = useState({
    recibir_app: true,
    recibir_email: true,
    recibir_push: false,
    horario_inicio: '08:00',
    horario_fin: '18:00',
  });

  // Flag para evitar re-sincronización después de guardar
  const [isSaving, setIsSaving] = useState(false);

  // Actualizar form values cuando cargan las preferencias inicialmente
  useEffect(() => {
    if (preferencias && preferencias.length > 0 && !isSaving) {
      const pref = preferencias[0];
      setFormValues({
        recibir_app: pref.recibir_app ?? true,
        recibir_email: pref.recibir_email ?? true,
        recibir_push: pref.recibir_push ?? false,
        horario_inicio: pref.horario_inicio || '08:00',
        horario_fin: pref.horario_fin || '18:00',
      });
    }
  }, [preferencias, isSaving]);

  const handleToggle = (key: 'recibir_app' | 'recibir_email' | 'recibir_push') => {
    setFormValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferencias = () => {
    if (preferencias && preferencias.length > 0) {
      const prefId = preferencias[0].id;
      setIsSaving(true);

      updatePreferencia.mutate(
        {
          id: prefId,
          data: formValues,
        },
        {
          onSettled: () => {
            // Siempre resetear isSaving después de la operación
            setTimeout(() => setIsSaving(false), 500);
          },
        }
      );
    }
  };

  const handleResetDefaults = () => {
    const defaults = {
      recibir_app: true,
      recibir_email: true,
      recibir_push: false,
      horario_inicio: '08:00',
      horario_fin: '18:00',
    };
    setFormValues(defaults);

    // Guardar inmediatamente después de restaurar
    if (preferencias && preferencias.length > 0) {
      const prefId = preferencias[0].id;
      setIsSaving(true);

      updatePreferencia.mutate(
        {
          id: prefId,
          data: defaults,
        },
        {
          onSettled: () => {
            // Siempre resetear isSaving después de la operación
            setTimeout(() => setIsSaving(false), 500);
          },
        }
      );
    }
  };

  // Loading state con skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 animate-pulse-subtle">
          <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 w-10 h-10" />
          <div>
            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
          </div>
        </div>
        <Card>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse-subtle"
              />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error" message="Error al cargar las preferencias." />;
  }

  const _prefList = preferencias || [];

  // Canales disponibles para configurar
  const canales = [
    {
      key: 'recibir_app',
      icon: Bell,
      title: 'Notificaciones en App',
      description: 'Recibir alertas dentro de la aplicación',
    },
    {
      key: 'recibir_email',
      icon: Mail,
      title: 'Notificaciones por Email',
      description: 'Recibir notificaciones en tu correo electrónico',
    },
    {
      key: 'recibir_push',
      icon: MessageSquare,
      title: 'Notificaciones Push',
      description: 'Recibir notificaciones push en tu dispositivo',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header - Por fuera del Card */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Preferencias de Notificación
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configura cómo quieres recibir notificaciones
          </p>
        </div>
      </div>

      {/* Card de Canales de Notificación */}
      <Card>
        <div className="p-6">
          {/* Header del grupo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Canales de Notificación
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Activa o desactiva los canales por los que deseas recibir notificaciones
              </p>
            </div>
          </div>

          {/* Lista de toggles para canales */}
          <div className="space-y-4">
            {canales.map((canal) => {
              const Icon = canal.icon;
              // Usar formValues para el estado del toggle
              const isActive = formValues[canal.key as keyof typeof formValues] as boolean;

              return (
                <div
                  key={canal.key}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{canal.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {canal.description}
                      </p>
                    </div>
                  </div>
                  {/* Toggle switch */}
                  <Switch
                    checked={isActive}
                    onCheckedChange={() =>
                      handleToggle(canal.key as 'recibir_app' | 'recibir_email' | 'recibir_push')
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Card de Horarios */}
      <Card>
        <div className="p-6">
          {/* Header del grupo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Horario de Notificaciones
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Define en qué horario deseas recibir notificaciones
              </p>
            </div>
          </div>

          {/* Configuración de horario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="time"
              label="Hora de inicio"
              value={formValues.horario_inicio}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, horario_inicio: e.target.value }))
              }
            />
            <Input
              type="time"
              label="Hora de fin"
              value={formValues.horario_fin}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, horario_fin: e.target.value }))
              }
            />
          </div>

          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Las notificaciones fuera de este horario se acumularán y se entregarán al inicio del
            próximo período.
          </p>
        </div>
      </Card>

      {/* Footer con acciones */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetDefaults}
          disabled={updatePreferencia.isPending}
        >
          Restaurar Predeterminados
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSavePreferencias}
          isLoading={updatePreferencia.isPending}
        >
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
}

/**
 * MasivasTab - Vista 5: Formulario de Acción (Action Form View)
 *
 * Estructura:
 * - Section Header fuera del Card
 * - Card único con formulario de acción
 * - Campos organizados en secciones lógicas
 * - Botones de acción al final
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md - Vista 5
 */
function MasivasTab() {
  const createMasiva = useCreateNotificacionMasiva();
  const { data: cargosData } = useSelectCargos();
  const cargos = cargosData || [];
  const { data: areasData } = useSelectAreas();
  const { data: usersData } = useSelectUsers();

  const areas = areasData || [];
  const users = usersData || [];

  // Estado para vista previa
  const [showPreview, setShowPreview] = useState(false);

  // Obtener tipos de notificación para el select
  const { data: tiposData, isLoading: tiposLoading } = useTiposNotificacion();
  const tipos = tiposData || [];

  // Estado del formulario
  const [formData, setFormData] = useState({
    tipo: '', // ID del tipo de notificación (requerido por backend)
    titulo: '',
    mensaje: '',
    destinatarios_tipo: 'todos' as 'todos' | 'rol' | 'area' | 'usuarios_especificos',
    cargo_id: '',
    area_id: '',
    usuarios_ids: [] as number[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!formData.tipo.trim()) {
      toast.error('Selecciona un tipo de notificación');
      return;
    }
    if (!formData.titulo.trim() || !formData.mensaje.trim()) {
      toast.error('El título y mensaje son requeridos');
      return;
    }

    // Validación de destinatarios
    if (formData.destinatarios_tipo === 'rol' && !formData.cargo_id) {
      toast.error('Debes seleccionar un cargo');
      return;
    }
    if (formData.destinatarios_tipo === 'area' && !formData.area_id) {
      toast.error('Debes seleccionar un área');
      return;
    }
    if (
      formData.destinatarios_tipo === 'usuarios_especificos' &&
      formData.usuarios_ids.length === 0
    ) {
      toast.error('Debes seleccionar al menos un usuario');
      return;
    }

    // Preparar datos según modelo backend
    const payload: any = {
      tipo: parseInt(formData.tipo),
      titulo: formData.titulo,
      mensaje: formData.mensaje,
      destinatarios_tipo: formData.destinatarios_tipo,
    };

    // Agregar relaciones según tipo de destinatario
    if (formData.destinatarios_tipo === 'rol' && formData.cargo_id) {
      // ManyToMany field 'roles' - enviar como array
      payload.roles = [parseInt(formData.cargo_id)];
    } else if (formData.destinatarios_tipo === 'area' && formData.area_id) {
      // ManyToMany field 'areas' - enviar como array
      payload.areas = [parseInt(formData.area_id)];
    } else if (
      formData.destinatarios_tipo === 'usuarios_especificos' &&
      formData.usuarios_ids.length > 0
    ) {
      // ManyToMany field 'usuarios' - enviar como array
      payload.usuarios = formData.usuarios_ids;
    }

    createMasiva.mutate(payload, {
      onSuccess: () => {
        // Limpiar formulario
        setFormData({
          tipo: '',
          titulo: '',
          mensaje: '',
          destinatarios_tipo: 'todos',
          cargo_id: '',
          area_id: '',
          usuarios_ids: [],
        });
        toast.success('Notificación masiva enviada correctamente');
      },
    });
  };

  // Calcular texto de destinatarios
  const getDestinatariosText = () => {
    if (formData.destinatarios_tipo === 'todos') {
      return 'todos los usuarios';
    } else if (formData.destinatarios_tipo === 'rol' && formData.cargo_id) {
      const cargo = cargos.find((c) => c.id === parseInt(formData.cargo_id));
      return cargo ? `usuarios con cargo: ${cargo.label}` : 'seleccionar cargo';
    } else if (formData.destinatarios_tipo === 'area' && formData.area_id) {
      const area = areas.find((a) => a.id === parseInt(formData.area_id));
      return area ? `usuarios del área: ${area.label}` : 'seleccionar área';
    } else if (
      formData.destinatarios_tipo === 'usuarios_especificos' &&
      formData.usuarios_ids.length > 0
    ) {
      return `${formData.usuarios_ids.length} usuario${formData.usuarios_ids.length !== 1 ? 's' : ''} seleccionado${formData.usuarios_ids.length !== 1 ? 's' : ''}`;
    }
    return 'seleccionar destinatarios';
  };

  return (
    <div className="space-y-6">
      {/* Section Header - Por fuera del Card */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <Send className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Envío de Notificación Masiva
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Envía notificaciones a múltiples usuarios de la organización
          </p>
        </div>
      </div>

      {/* Card con formulario */}
      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sección: Contenido del Mensaje */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Contenido del Mensaje
            </h4>

            <Input
              label="Título de la notificación"
              value={formData.titulo}
              onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ej: Actualización importante del sistema"
              required
            />

            <div>
              <Textarea
                label="Mensaje"
                value={formData.mensaje}
                onChange={(e) => setFormData((prev) => ({ ...prev, mensaje: e.target.value }))}
                rows={4}
                placeholder="Escribe el contenido de la notificación..."
                maxLength={500}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Máximo 500 caracteres. El mensaje se mostrará en todos los canales seleccionados.
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Sección: Configuración de Envío */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Configuración de Envío
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Tipo de Notificación"
                  value={formData.tipo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value }))}
                  required
                  disabled={tiposLoading}
                >
                  <option value="">
                    {tiposLoading ? 'Cargando tipos...' : 'Seleccione un tipo'}
                  </option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </Select>
                {tipos.length === 0 && !tiposLoading && (
                  <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    No hay tipos de notificación disponibles. Créalos en la pestaña "Tipos".
                  </p>
                )}
              </div>

              <Select
                label="Destinatarios"
                value={formData.destinatarios_tipo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    destinatarios_tipo: e.target.value as 'todos' | 'rol' | 'area' | 'usuarios_especificos',
                    cargo_id: '',
                    area_id: '',
                    usuarios_ids: [],
                  }))
                }
              >
                <option value="todos">Todos los usuarios</option>
                <option value="rol">Por cargo</option>
                <option value="area">Por área</option>
                <option value="usuarios_especificos">Usuarios específicos</option>
              </Select>
            </div>

            {/* Select condicional de cargo */}
            {formData.destinatarios_tipo === 'rol' && (
              <Select
                label="Seleccionar Cargo"
                value={formData.cargo_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, cargo_id: e.target.value }))}
                required
              >
                <option value="">Seleccione un cargo</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.label}
                  </option>
                ))}
              </Select>
            )}

            {/* Select condicional de área */}
            {formData.destinatarios_tipo === 'area' && (
              <Select
                label="Seleccionar Área"
                value={formData.area_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, area_id: e.target.value }))}
                required
              >
                <option value="">Seleccione un proceso</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.label}
                  </option>
                ))}
              </Select>
            )}

            {/* Checkboxes de usuarios específicos */}
            {formData.destinatarios_tipo === 'usuarios_especificos' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Seleccionar Usuarios ({formData.usuarios_ids.length} seleccionado
                  {formData.usuarios_ids.length !== 1 ? 's' : ''})
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto bg-white dark:bg-gray-800">
                  {users.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No hay usuarios disponibles
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => {
                        const isSelected = formData.usuarios_ids.includes(user.id);
                        const displayName = user.label;

                        return (
                          <div
                            key={user.id}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700',
                              isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                            )}
                            onClick={() => {
                              if (isSelected) {
                                setFormData((prev) => ({
                                  ...prev,
                                  usuarios_ids: prev.usuarios_ids.filter((id) => id !== user.id),
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  usuarios_ids: [...prev.usuarios_ids, user.id],
                                }));
                              }
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    usuarios_ids: [...prev.usuarios_ids, user.id],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    usuarios_ids: prev.usuarios_ids.filter((id) => id !== user.id),
                                  }));
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {displayName}
                              </p>
                              {user.extra?.email && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {user.extra.email}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {formData.usuarios_ids.length === 0 && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Debes seleccionar al menos un usuario
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Acciones del formulario */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Se enviará a{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {getDestinatariosText()}
              </span>
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!formData.titulo.trim() || !formData.mensaje.trim()) {
                    toast.error('Completa el título y mensaje para ver la vista previa');
                    return;
                  }
                  setShowPreview(true);
                }}
                disabled={!formData.titulo.trim() || !formData.mensaje.trim()}
              >
                <Eye className="w-4 h-4 mr-2" />
                Vista Previa
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={createMasiva.isPending}
                disabled={createMasiva.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Notificación
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Modal de Vista Previa */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vista Previa de Notificación
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Simulación de notificación */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg flex-shrink-0 bg-blue-100 dark:bg-blue-900/30">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {formData.titulo}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                      {formData.mensaje}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Ahora mismo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de envío */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Información de Envío</h4>
                <div className="text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Destinatarios:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {getDestinatariosText()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cerrar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowPreview(false);
                  // Trigger submit programáticamente
                  const form = document.querySelector('form') as HTMLFormElement;
                  if (form) {
                    form.requestSubmit();
                  }
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Ahora
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SECTIONS CONFIG ====================

/**
 * Secciones para el PageHeader
 * Siguiendo Vista 2: Las secciones van en el header a la derecha
 */
const PAGE_SECTIONS = [
  { code: 'bandeja', name: 'Bandeja', icon: 'Bell' },
  { code: 'tipos', name: 'Tipos', icon: 'Settings' },
  { code: 'preferencias', name: 'Preferencias', icon: 'Sliders' },
  { code: 'masivas', name: 'Masivas', icon: 'Send' },
];

// ==================== MAIN COMPONENT ====================

/**
 * NotificacionesPage - Vista 2: Lista CRUD
 *
 * Estructura:
 * - PageHeader con título y secciones a la derecha
 * - Contenido de cada sección con Section Header + Data Table
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md - Vista 2
 */
export default function NotificacionesPage() {
  const [activeSection, setActiveSection] = useState('bandeja');

  return (
    <div className="space-y-6">
      {/* PageHeader con secciones a la derecha - Vista 2 */}
      <PageHeader
        title="Centro de Notificaciones"
        description="Gestiona tus notificaciones, tipos y preferencias"
        sections={PAGE_SECTIONS}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        moduleColor="blue"
      />

      {/* Contenido de la sección activa */}
      {activeSection === 'bandeja' && <BandejaTab />}
      {activeSection === 'tipos' && <TiposTab />}
      {activeSection === 'preferencias' && <PreferenciasTab />}
      {activeSection === 'masivas' && <MasivasTab />}
    </div>
  );
}
