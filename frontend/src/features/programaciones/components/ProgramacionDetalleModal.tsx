/**
 * Modal de Detalle de Programación
 *
 * Muestra información completa de una programación con acciones disponibles
 * según el rol del usuario y el estado de la programación.
 *
 * Acciones:
 * - Asignar Recolector: lider_log_econorte, superadmin (solo estado PROGRAMADA)
 * - Reprogramar: lider_log_econorte, superadmin
 * - Eliminar: comercial_econorte, lider_com_econorte, gerente, superadmin, coordinador_recoleccion
 */
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  Calendar,
  Building2,
  User,
  MapPin,
  Package,
  UserPlus,
  Trash2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type { Programacion } from '../types/programacion.types';

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
  if (!programacion) return null;

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

  const puedeReprogramar =
    canReprogramar && !['COMPLETADA', 'CANCELADA', 'REPROGRAMADA'].includes(programacion.estado);

  const puedeEliminar =
    canEliminar && !['COMPLETADA', 'EN_RUTA'].includes(programacion.estado);

  const fechaProgramada = new Date(programacion.fecha_programada);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Programación">
      <div className="space-y-6">
        {/* Alerta de vencida */}
        {programacion.esta_vencida && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Programación Vencida
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  La fecha de recolección ya pasó y no se asignó recolector. Se requiere
                  reprogramación al asignar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estado y Fecha */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <div
                className={`text-lg font-semibold ${
                  programacion.esta_vencida
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {fechaProgramada.toLocaleDateString('es-CO', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Fecha de recolección
              </div>
            </div>
          </div>
          {getEstadoBadge()}
        </div>

        {/* Información del Ecoaliado */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Ecoaliado
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Código:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.ecoaliado_codigo}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Razón Social:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.ecoaliado_razon_social}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ciudad:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {programacion.ecoaliado_ciudad}
              </span>
            </div>
            {programacion.ecoaliado_direccion && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Dirección:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {programacion.ecoaliado_direccion}
                </span>
              </div>
            )}
            {programacion.tiene_geolocalizacion && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <MapPin className="h-4 w-4" />
                <span className="text-xs">Con geolocalización</span>
              </div>
            )}
          </div>
        </div>

        {/* Detalles de la Programación */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Detalles
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">Tipo:</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {programacion.tipo_programacion_display}
              </span>
            </div>
            {programacion.cantidad_estimada_kg && (
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Cantidad Estimada:</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {programacion.cantidad_estimada_kg.toLocaleString('es-CO')} kg
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">Programado por:</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {programacion.programado_por_nombre}
              </span>
            </div>
          </div>
        </div>

        {/* Recolector Asignado */}
        <div
          className={`p-4 rounded-lg border ${
            programacion.recolector_asignado
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}
        >
          <h4
            className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
              programacion.recolector_asignado
                ? 'text-green-900 dark:text-green-100'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <User className="h-4 w-4" />
            Recolector
          </h4>
          {programacion.recolector_asignado ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span
                  className={
                    programacion.recolector_asignado
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }
                >
                  Asignado:
                </span>
                <span className="font-medium text-green-900 dark:text-green-100">
                  {programacion.recolector_asignado_nombre}
                </span>
              </div>
              {programacion.fecha_asignacion && (
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Fecha asignación:</span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {new Date(programacion.fecha_asignacion).toLocaleString('es-CO')}
                  </span>
                </div>
              )}
              {programacion.asignado_por_nombre && (
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Asignado por:</span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {programacion.asignado_por_nombre}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span className="text-sm italic">Sin recolector asignado</span>
            </div>
          )}
        </div>

        {/* Observaciones */}
        {(programacion.observaciones_comercial || programacion.observaciones_logistica) && (
          <div className="space-y-3">
            {programacion.observaciones_comercial && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Observaciones Comercial:
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                  {programacion.observaciones_comercial}
                </p>
              </div>
            )}
            {programacion.observaciones_logistica && (
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Observaciones Logística:
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {programacion.observaciones_logistica}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Motivo de cancelación */}
        {programacion.motivo_cancelacion && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-xs font-semibold text-red-900 dark:text-red-100 mb-1">
              Motivo de Cancelación:
            </div>
            <p className="text-sm text-red-800 dark:text-red-200">
              {programacion.motivo_cancelacion}
            </p>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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

          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
