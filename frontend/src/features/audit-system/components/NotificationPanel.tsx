/**
 * NotificationPanel — Panel dropdown de notificaciones (Nivel 2).
 * Se abre desde la campana del Header. Muestra últimas ~10 notificaciones
 * con acciones rápidas. Link "Ver todas" lleva a la bandeja completa.
 */
import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, ExternalLink, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge } from '@/components/common';
import { cn } from '@/utils/cn';
import {
  useNotificacionesNoLeidas,
  useMarcarLeida,
  useMarcarTodasLeidas,
} from '../hooks/useNotificaciones';
import { getCategoriaIcon, getCategoriaColor } from './notificacion-utils';
import type { Notificacion } from '../types/notificaciones.types';
import { ROUTES } from '@/constants';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_VISIBLE = 8;

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notificaciones } = useNotificacionesNoLeidas();
  const marcarLeidaMutation = useMarcarLeida();
  const marcarTodasMutation = useMarcarTodasLeidas();

  const items = (notificaciones ?? []).slice(0, MAX_VISIBLE);
  const totalUnread = notificaciones?.length ?? 0;
  const hasMore = totalUnread > MAX_VISIBLE;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Delay para no cerrar inmediatamente al abrir
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = (notif: Notificacion) => {
    if (!notif.esta_leida) {
      marcarLeidaMutation.mutate(notif.id);
    }
    if (notif.url) {
      navigate(notif.url);
      onClose();
    }
  };

  const handleVerTodas = () => {
    navigate(ROUTES.NOTIFICATIONS);
    onClose();
  };

  const handleMarcarTodas = () => {
    marcarTodasMutation.mutate();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'absolute right-0 top-full mt-2 z-50',
            'w-[380px] max-h-[520px]',
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'rounded-xl shadow-xl',
            'flex flex-col overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notificaciones
              </h3>
              {totalUnread > 0 && (
                <Badge variant="danger" size="sm">
                  {totalUnread}
                </Badge>
              )}
            </div>
            {totalUnread > 0 && (
              <button
                onClick={handleMarcarTodas}
                disabled={marcarTodasMutation.isPending}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Inbox className="w-10 h-10 mb-2" />
                <p className="text-sm">Sin notificaciones nuevas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {items.map((notif) => {
                  const categoria = notif.categoria || 'sistema';
                  const Icon = getCategoriaIcon(categoria);

                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        'w-full text-left px-4 py-3 flex items-start gap-3',
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                        !notif.esta_leida && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                    >
                      {/* Dot indicador no leída */}
                      <div className="flex-shrink-0 mt-1.5">
                        {!notif.esta_leida ? (
                          <span className="block w-2 h-2 rounded-full bg-primary-500" />
                        ) : (
                          <span className="block w-2 h-2" />
                        )}
                      </div>

                      {/* Icono categoría */}
                      <div
                        className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                          getCategoriaColor(categoria)
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm truncate',
                            !notif.esta_leida
                              ? 'font-semibold text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          )}
                        >
                          {notif.titulo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                          {notif.mensaje}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatTimeAgo(notif.created_at)}
                        </p>
                      </div>

                      {/* Marcar leída */}
                      {!notif.esta_leida && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            marcarLeidaMutation.mutate(notif.id);
                          }}
                          className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          title="Marcar como leída"
                        >
                          <Check className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2.5">
            <button
              onClick={handleVerTodas}
              className="w-full flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium py-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {hasMore
                ? `Ver todas (${totalUnread - MAX_VISIBLE} más)`
                : 'Ver todas las notificaciones'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
