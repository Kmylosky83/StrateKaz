/**
 * MS-002-A: Componente de Sesiones Activas
 *
 * Muestra lista de sesiones activas del usuario con opciones para:
 * - Ver información de cada dispositivo
 * - Cerrar sesiones individuales
 * - Cerrar todas las otras sesiones
 * - Renombrar dispositivos
 */
import { useState } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  X,
  Edit2,
  Check,
  AlertTriangle,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { Card, Button, Spinner, ConfirmDialog } from '@/components/common';
import {
  useSessions,
  useCloseSession,
  useCloseOtherSessions,
  useRenameSession,
} from '../hooks/useSessions';
import type { UserSession } from '../types/sessions.types';

/**
 * Icono según tipo de dispositivo
 */
const DeviceIcon = ({ type }: { type: UserSession['device_type'] }) => {
  const iconClass = 'h-5 w-5 text-gray-500 dark:text-gray-400';
  switch (type) {
    case 'mobile':
      return <Smartphone className={iconClass} />;
    case 'tablet':
      return <Tablet className={iconClass} />;
    default:
      return <Monitor className={iconClass} />;
  }
};

/**
 * Item de sesión individual
 */
const SessionItem = ({
  session,
  onClose,
  onRename,
  isClosing,
}: {
  session: UserSession;
  onClose: () => void;
  onRename: (name: string) => void;
  isClosing: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [deviceName, setDeviceName] = useState(session.device_name || '');

  const handleSaveName = () => {
    if (deviceName.trim()) {
      onRename(deviceName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        session.is_current
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <DeviceIcon type={session.device_type} />
        <div className="flex-1 min-w-0">
          {/* Nombre del dispositivo */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700
                             border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="Nombre del dispositivo"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 text-green-600 hover:bg-green-100 rounded dark:hover:bg-green-900/30"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-gray-500 hover:bg-gray-200 rounded dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.device_display}
                </p>
                {session.is_current && (
                  <span className="shrink-0 px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    Actual
                  </span>
                )}
                {!session.is_current && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded dark:hover:bg-gray-700"
                    title="Renombrar dispositivo"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Información adicional */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{session.device_os}</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>{session.device_browser}</span>
          </div>

          {/* Ubicación e IP */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {session.city && session.country
                ? `${session.city}, ${session.country}`
                : session.ip_address}
            </span>
          </div>

          {/* Tiempo */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Iniciada {session.time_elapsed}
            </span>
            {!session.is_current && (
              <span className="text-amber-600 dark:text-amber-400">
                Expira en {session.time_remaining}
              </span>
            )}
          </div>
        </div>

        {/* Botón cerrar sesión */}
        {!session.is_current && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isClosing}
            className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
            title="Cerrar esta sesión"
          >
            {isClosing ? <Spinner size="sm" /> : <X className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Componente principal de sesiones activas
 */
export const ActiveSessionsCard = () => {
  const { data, isLoading, error, refetch, isRefetching } = useSessions();
  const closeSession = useCloseSession();
  const closeOtherSessions = useCloseOtherSessions();
  const renameSession = useRenameSession();

  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);
  const [closingSessionId, setClosingSessionId] = useState<number | null>(null);

  const handleCloseSession = async (id: number) => {
    setClosingSessionId(id);
    try {
      await closeSession.mutateAsync(id);
    } finally {
      setClosingSessionId(null);
    }
  };

  const handleCloseOthers = async () => {
    await closeOtherSessions.mutateAsync();
    setShowCloseAllConfirm(false);
  };

  const handleRename = (id: number, name: string) => {
    renameSession.mutate({ id, data: { device_name: name } });
  };

  const otherSessionsCount = data?.sessions.filter((s) => !s.is_current).length ?? 0;

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sesiones Activas
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona los dispositivos donde tienes sesiones iniciadas.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              title="Actualizar"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Estado de carga */}
          {isLoading && (
            <div className="mt-4 flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Error al cargar las sesiones
                </p>
                <Button variant="link" size="sm" onClick={() => refetch()} className="p-0 h-auto">
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de sesiones */}
          {data && (
            <div className="mt-4 space-y-3">
              {data.sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  onClose={() => handleCloseSession(session.id)}
                  onRename={(name) => handleRename(session.id, name)}
                  isClosing={closingSessionId === session.id}
                />
              ))}

              {data.sessions.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No hay sesiones activas
                </p>
              )}
            </div>
          )}

          {/* Botón cerrar otras sesiones */}
          {otherSessionsCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCloseAllConfirm(true)}
                disabled={closeOtherSessions.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar otras sesiones ({otherSessionsCount})
              </Button>
            </div>
          )}

          {/* Contador de sesiones */}
          {data && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {data.count} {data.count === 1 ? 'sesión activa' : 'sesiones activas'}
            </p>
          )}
        </div>
      </div>

      {/* Confirmación para cerrar todas */}
      <ConfirmDialog
        isOpen={showCloseAllConfirm}
        onClose={() => setShowCloseAllConfirm(false)}
        onConfirm={handleCloseOthers}
        title="Cerrar otras sesiones"
        message={`Se cerrarán ${otherSessionsCount} ${otherSessionsCount === 1 ? 'sesión' : 'sesiones'} en otros dispositivos. Tendrás que volver a iniciar sesión en esos dispositivos.`}
        confirmText="Cerrar sesiones"
        confirmVariant="danger"
        isLoading={closeOtherSessions.isPending}
      />
    </Card>
  );
};

export default ActiveSessionsCard;
