/**
 * Utilidades compartidas para notificaciones: iconos, colores, modal de detalle.
 */
import { useState } from 'react';
import { Bell, Settings, CheckSquare, AlertTriangle, Clock, CheckCircle, Eye } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import type { Notificacion } from '../types/notificaciones.types';

// ==================== UTILITY FUNCTIONS ====================

export const getCategoriaIcon = (categoria: string) => {
  const icons: Record<string, typeof Bell> = {
    sistema: Settings,
    tarea: CheckSquare,
    alerta: AlertTriangle,
    recordatorio: Clock,
    aprobacion: CheckCircle,
  };
  return icons[categoria] || Bell;
};

export const getCategoriaColor = (categoria: string) => {
  const colors: Record<string, string> = {
    sistema: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    tarea: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    alerta: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    recordatorio: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    aprobacion: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  return colors[categoria] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
};

// ==================== NOTIFICATION DETAIL MODAL ====================

export function NotificacionDetailModal({
  notificacion,
  isOpen,
  onClose,
}: {
  notificacion: Notificacion | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!notificacion) return null;

  const categoria = notificacion.categoria || 'sistema';
  const prioridadColor =
    notificacion.prioridad === 'urgente'
      ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
      : notificacion.prioridad === 'alta'
        ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
        : 'text-gray-600 bg-gray-50 dark:bg-gray-800';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Notificación" size="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg flex-shrink-0', getCategoriaColor(categoria))}>
            {(() => {
              const Icon = getCategoriaIcon(categoria);
              return <Icon className="h-5 w-5" />;
            })()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {notificacion.titulo}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="gray" size="sm">
                {categoria}
              </Badge>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', prioridadColor)}>
                {notificacion.prioridad}
              </span>
              <Badge variant={notificacion.esta_leida ? 'gray' : 'success'} size="sm">
                {notificacion.esta_leida ? 'Leída' : 'Nueva'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Mensaje */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {notificacion.mensaje}
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(notificacion.created_at).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {notificacion.tipo_nombre && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {notificacion.tipo_nombre}
              </p>
            </div>
          )}
          {notificacion.fecha_lectura && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Leída el:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(notificacion.fecha_lectura).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
          {notificacion.esta_archivada && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Estado:</span>
              <p className="font-medium text-orange-600">Archivada</p>
            </div>
          )}
        </div>

        {/* URL link */}
        {notificacion.url && (
          <a
            href={notificacion.url}
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Eye className="w-4 h-4" />
            Ver recurso relacionado
          </a>
        )}
      </div>
    </Modal>
  );
}
