/**
 * Modal de Detalle de Programación
 *
 * Muestra información completa de una programación con tabs y acciones disponibles
 * según el rol del usuario y el estado de la programación.
 *
 * Tabs:
 * - General: Fecha, estado, tipo de programación
 * - Ecoaliado: Información del ecoaliado asociado
 * - Logística: Recolector asignado, cantidades
 * - Observaciones: Notas comerciales y logísticas
 *
 * Acciones:
 * - Asignar Recolector: lider_log_econorte, superadmin (solo estado PROGRAMADA)
 * - Reprogramar: lider_log_econorte, superadmin
 * - Eliminar: comercial_econorte, lider_com_econorte, gerente, superadmin, coordinador_recoleccion
 *
 * NOTA: Los estados se actualizan automáticamente al asignar recolector o reprogramar
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  X,
  Calendar,
  Building2,
  User,
  MapPin,
  Package,
  UserPlus,
  Trash2,
  AlertCircle,
  Clock,
  RefreshCw,
  Truck,
  FileText,
  MessageSquare,
  Navigation,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Programacion } from '../types/programacion.types';

type TabType = 'general' | 'ecoaliado' | 'logistica' | 'observaciones';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

interface ProgramacionDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  programacion: Programacion | null;
  onAsignarRecolector?: (programacion: Programacion) => void;
  onReprogramar?: (programacion: Programacion) => void;
  onEliminar?: (programacion: Programacion) => void;
  canAsignarRecolector: boolean;
  canReprogramar: boolean;
  canEliminar: boolean;
}

export const ProgramacionDetalleModal = ({
  isOpen,
  onClose,
  programacion,
  onAsignarRecolector,
  onReprogramar,
  onEliminar,
  canAsignarRecolector,
  canReprogramar,
  canEliminar,
}: ProgramacionDetalleModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  if (!isOpen || !programacion) return null;

  const tabs: Tab[] = [
    { id: 'general', label: 'General', icon: FileText },
    { id: 'ecoaliado', label: 'Ecoaliado', icon: Building2 },
    { id: 'logistica', label: 'Logística', icon: Truck },
    { id: 'observaciones', label: 'Observaciones', icon: MessageSquare },
  ];

  // Helper para renderizar campos
  const renderField = (
    icon: React.ElementType,
    label: string,
    value: React.ReactNode,
    className?: string
  ) => {
    if (!value) return null;
    const Icon = icon;

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
            {value}
          </p>
        </div>
      </div>
    );
  };

  const getEstadoBadge = () => {
    if (programacion.esta_vencida) {
      return (
        <Badge variant="danger" size="sm">
          Vencida
        </Badge>
      );
    }

    const badgeMap: Record<
      string,
      { variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'; label: string }
    > = {
      PROGRAMADA: { variant: 'gray', label: 'Programada' },
      CONFIRMADA: { variant: 'info', label: 'Confirmada' },
      EN_RUTA: { variant: 'warning', label: 'En Ruta' },
      COMPLETADA: { variant: 'success', label: 'Completada' },
      CANCELADA: { variant: 'danger', label: 'Cancelada' },
      REPROGRAMADA: { variant: 'primary', label: 'Reprogramada' },
    };

    const badge = badgeMap[programacion.estado] || badgeMap.PROGRAMADA;

    return (
      <Badge variant={badge.variant} size="sm">
        {badge.label}
      </Badge>
    );
  };

  // Determinar acciones disponibles
  const puedeAsignarRecolector =
    canAsignarRecolector &&
    programacion.estado === 'PROGRAMADA' &&
    !programacion.recolector_asignado;

  // Se puede reprogramar si:
  // - Está vencida (SIEMPRE se puede reprogramar una vencida)
  // - Estado es PROGRAMADA, CONFIRMADA, CANCELADA o EN_RUTA
  // NO se puede si: COMPLETADA o REPROGRAMADA
  const puedeReprogramar =
    canReprogramar &&
    (programacion.esta_vencida ||
      ['PROGRAMADA', 'CONFIRMADA', 'CANCELADA', 'EN_RUTA'].includes(programacion.estado));

  const puedeEliminar =
    canEliminar && !['COMPLETADA', 'EN_RUTA'].includes(programacion.estado);

  const fechaProgramada = new Date(programacion.fecha_programada);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-mono font-bold">
                    {programacion.codigo || programacion.ecoaliado_codigo}
                  </span>
                  {getEstadoBadge()}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {programacion.ecoaliado_razon_social}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {fechaProgramada.toLocaleDateString('es-CO', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Alerta de vencida */}
          {programacion.esta_vencida && (
            <div className="px-6 py-3 bg-danger-50 dark:bg-danger-900/20 border-b border-danger-200 dark:border-danger-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-danger-800 dark:text-danger-200">
                    Programación Vencida
                  </h4>
                  <p className="text-sm text-danger-700 dark:text-danger-300 mt-1">
                    La fecha de recolección ya pasó y no se asignó recolector. Se requiere
                    reprogramación al asignar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="px-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-1 -mb-px" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            {/* Tab: General */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Información de la Programación */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Información de la Programación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(
                      Calendar,
                      'Fecha Programada',
                      fechaProgramada.toLocaleDateString('es-CO', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    )}
                    {renderField(Package, 'Tipo de Programación', programacion.tipo_programacion_display)}
                    {renderField(User, 'Programado por', programacion.programado_por_nombre)}
                    {programacion.fecha_reprogramada &&
                      renderField(
                        RefreshCw,
                        'Fecha Reprogramada',
                        new Date(programacion.fecha_reprogramada).toLocaleDateString('es-CO', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      )}
                  </div>
                </div>

                {/* Cantidades */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Cantidades
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-info-50 dark:bg-info-900/20 p-4 rounded-lg border border-info-200 dark:border-info-800">
                      <p className="text-sm text-info-700 dark:text-info-300">Cantidad Estimada</p>
                      <p className="text-2xl font-bold text-info-900 dark:text-info-100">
                        {programacion.cantidad_estimada_kg
                          ? `${programacion.cantidad_estimada_kg.toLocaleString('es-CO')} kg`
                          : 'No especificada'}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'p-4 rounded-lg border',
                        programacion.cantidad_recolectada_kg
                          ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                      )}
                    >
                      <p
                        className={cn(
                          'text-sm',
                          programacion.cantidad_recolectada_kg
                            ? 'text-success-700 dark:text-success-300'
                            : 'text-gray-600 dark:text-gray-400'
                        )}
                      >
                        Cantidad Recolectada
                      </p>
                      <p
                        className={cn(
                          'text-2xl font-bold',
                          programacion.cantidad_recolectada_kg
                            ? 'text-success-900 dark:text-success-100'
                            : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {programacion.cantidad_recolectada_kg
                          ? `${programacion.cantidad_recolectada_kg.toLocaleString('es-CO')} kg`
                          : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Ecoaliado */}
            {activeTab === 'ecoaliado' && (
              <div className="space-y-6">
                {/* Información básica */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Información del Ecoaliado
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(FileText, 'Código', programacion.ecoaliado_codigo)}
                    {renderField(Building2, 'Razón Social', programacion.ecoaliado_razon_social)}
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Ubicación
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {renderField(MapPin, 'Ciudad', programacion.ecoaliado_ciudad)}
                    {programacion.ecoaliado_direccion &&
                      renderField(MapPin, 'Dirección', programacion.ecoaliado_direccion)}
                  </div>
                </div>

                {/* Geolocalización */}
                {programacion.tiene_geolocalizacion && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Geolocalización
                    </h4>
                    <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg border border-success-200 dark:border-success-800">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
                          <Navigation className="h-5 w-5 text-success-600 dark:text-success-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-success-900 dark:text-success-100">
                            Ubicación Georreferenciada
                          </p>
                          <p className="text-xs text-success-700 dark:text-success-300">
                            Este ecoaliado cuenta con coordenadas GPS registradas
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Logística */}
            {activeTab === 'logistica' && (
              <div className="space-y-6">
                {/* Recolector */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Recolector Asignado
                  </h4>
                  {programacion.recolector_asignado ? (
                    <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg border border-success-200 dark:border-success-800">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-success-600 dark:text-success-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-success-900 dark:text-success-100">
                              {programacion.recolector_asignado_nombre}
                            </p>
                            {programacion.fecha_asignacion && (
                              <p className="text-xs text-success-700 dark:text-success-300 mt-1">
                                Asignado el{' '}
                                {new Date(programacion.fecha_asignacion).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                            )}
                            {programacion.asignado_por_nombre && (
                              <p className="text-xs text-success-700 dark:text-success-300">
                                Por: {programacion.asignado_por_nombre}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg border border-warning-200 dark:border-warning-800">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
                          <Clock className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-warning-900 dark:text-warning-100">
                            Sin recolector asignado
                          </p>
                          <p className="text-xs text-warning-700 dark:text-warning-300">
                            Esta programación aún no tiene un recolector asignado
                          </p>
                        </div>
                      </div>
                      {puedeAsignarRecolector && onAsignarRecolector && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="mt-3"
                          onClick={() => {
                            onClose();
                            onAsignarRecolector(programacion);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Asignar Recolector
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Motivo de cancelación */}
                {programacion.motivo_cancelacion && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Motivo de Cancelación
                    </h4>
                    <div className="bg-danger-50 dark:bg-danger-900/20 p-4 rounded-lg border border-danger-200 dark:border-danger-800">
                      <p className="text-sm text-danger-800 dark:text-danger-200">
                        {programacion.motivo_cancelacion}
                      </p>
                    </div>
                  </div>
                )}

                {/* Motivo de reprogramación */}
                {programacion.motivo_reprogramacion && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Motivo de Reprogramación
                    </h4>
                    <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg border border-warning-200 dark:border-warning-800">
                      <p className="text-sm text-warning-800 dark:text-warning-200">
                        {programacion.motivo_reprogramacion}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Observaciones */}
            {activeTab === 'observaciones' && (
              <div className="space-y-6">
                {/* Observaciones Comercial */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Observaciones Comercial
                  </h4>
                  {programacion.observaciones_comercial ? (
                    <div className="bg-info-50 dark:bg-info-900/20 p-4 rounded-lg border border-info-200 dark:border-info-800">
                      <p className="text-sm text-info-800 dark:text-info-200 whitespace-pre-wrap">
                        {programacion.observaciones_comercial}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Sin observaciones comerciales
                      </p>
                    </div>
                  )}
                </div>

                {/* Observaciones Logística */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Observaciones Logística
                  </h4>
                  {programacion.observaciones_logistica ? (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {programacion.observaciones_logistica}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Sin observaciones de logística
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>

              <div className="flex gap-2">
                {puedeAsignarRecolector && onAsignarRecolector && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      onClose();
                      onAsignarRecolector(programacion);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {programacion.esta_vencida ? 'Reprogramar y Asignar' : 'Asignar Recolector'}
                  </Button>
                )}

                {puedeReprogramar && onReprogramar && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onReprogramar(programacion);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reprogramar
                  </Button>
                )}

                {puedeEliminar && onEliminar && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      onClose();
                      onEliminar(programacion);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
