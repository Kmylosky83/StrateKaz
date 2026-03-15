/**
 * BandejaNotificaciones — Bandeja personal de notificaciones.
 *
 * Reutilizable: usado en MisNotificacionesPage (perfil) y opcionalmente en
 * NotificacionesPage (admin).
 */
import { useState } from 'react';
import { Inbox, CheckCircle, Filter, Eye, Archive } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { cn } from '@/utils/cn';
import {
  useNotificaciones,
  useNotificacionesNoLeidas,
  useMarcarLeida,
  useMarcarTodasLeidas,
  useArchivarNotificacion,
} from '../hooks/useNotificaciones';
import { NotificacionDetailModal, getCategoriaIcon, getCategoriaColor } from './notificacion-utils';
import type { Notificacion } from '../types/notificaciones.types';

export function BandejaNotificaciones() {
  const { data: notificaciones, isLoading, error } = useNotificaciones();
  const { data: noLeidas } = useNotificacionesNoLeidas();
  const marcarLeida = useMarcarLeida();
  const marcarTodasLeidas = useMarcarTodasLeidas();
  const archivar = useArchivarNotificacion();
  const [selectedNotif, setSelectedNotif] = useState<Notificacion | null>(null);

  const countNoLeidas = noLeidas?.length || 0;
  const notifList = notificaciones || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 w-10 h-10" />
            <div>
              <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
            </div>
          </div>
        </div>
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
      {/* Section Header */}
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
                      onClick={() => {
                        setSelectedNotif(notif);
                        if (!isLeida) marcarLeida.mutate(notif.id);
                      }}
                      className={cn(
                        'border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer',
                        !isLeida && 'bg-primary-50/30 dark:bg-primary-900/10'
                      )}
                    >
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
                      <td className="py-3 px-4">
                        <Badge variant="gray" size="sm">
                          {categoria}
                        </Badge>
                      </td>
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
                      <td className="py-3 px-4">
                        <Badge variant={isLeida ? 'gray' : 'success'} size="sm">
                          {isLeida ? 'Leída' : 'Nueva'}
                        </Badge>
                      </td>
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

      <NotificacionDetailModal
        notificacion={selectedNotif}
        isOpen={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
      />
    </div>
  );
}
