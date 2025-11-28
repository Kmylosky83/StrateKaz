/**
 * Modal para Ver Historial de Precios de Ecoaliado
 *
 * Muestra el historial completo de cambios de precio con:
 * - Fecha y hora del cambio
 * - Precio anterior y nuevo
 * - Diferencia y porcentaje de cambio
 * - Tipo de cambio (INICIAL, AUMENTO, DISMINUCION)
 * - Justificación del cambio
 * - Usuario que realizó el cambio
 */
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { DollarSign, TrendingUp, TrendingDown, Clock, User } from 'lucide-react';
import type { HistorialPrecioEcoaliado } from '../types/ecoaliado.types';

interface HistorialPrecioModalProps {
  isOpen: boolean;
  onClose: () => void;
  ecoaliado: {
    razon_social: string;
    codigo: string;
  } | null;
  precioActual: string;
  historial: HistorialPrecioEcoaliado[];
  isLoading?: boolean;
}

export const HistorialPrecioModal = ({
  isOpen,
  onClose,
  ecoaliado,
  precioActual,
  historial,
  isLoading,
}: HistorialPrecioModalProps) => {
  const getTipoCambioBadge = (tipo: string) => {
    switch (tipo) {
      case 'INICIAL':
        return (
          <Badge variant="info" size="sm">
            Precio Inicial
          </Badge>
        );
      case 'AUMENTO':
        return (
          <Badge variant="danger" size="sm">
            Aumento
          </Badge>
        );
      case 'DISMINUCION':
        return (
          <Badge variant="success" size="sm">
            Disminución
          </Badge>
        );
      default:
        return (
          <Badge variant="gray" size="sm">
            {tipo}
          </Badge>
        );
    }
  };

  const getTipoCambioIcon = (tipo: string) => {
    switch (tipo) {
      case 'AUMENTO':
        return <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'DISMINUCION':
        return <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />;
      default:
        return <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historial de Precios" size="xl">
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* INFO DEL ECOALIADO */}
          {ecoaliado && (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {ecoaliado.razon_social}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Código: {ecoaliado.codigo}
              </p>
            </div>
          )}

          {/* PRECIO ACTUAL */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Precio Actual
              </span>
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              ${parseFloat(precioActual).toLocaleString('es-CO', { minimumFractionDigits: 2 })} / kg
            </div>
          </div>

          {/* TIMELINE DE HISTORIAL */}
          {historial.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400">No hay historial de precios</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Historial de Cambios ({historial.length})
              </h4>

              <div className="relative">
                {/* Línea vertical del timeline */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                {/* Items del historial */}
                <div className="space-y-6">
                  {historial.map((item, index) => {
                    const precioAnterior = item.precio_anterior
                      ? parseFloat(item.precio_anterior)
                      : null;
                    const precioNuevo = parseFloat(item.precio_nuevo);
                    const diferencia = item.diferencia_precio
                      ? parseFloat(item.diferencia_precio)
                      : null;
                    const porcentaje = item.porcentaje_cambio
                      ? parseFloat(item.porcentaje_cambio)
                      : null;

                    return (
                      <div key={item.id} className="relative flex gap-4">
                        {/* Icono del timeline */}
                        <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                          {getTipoCambioIcon(item.tipo_cambio)}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getTipoCambioBadge(item.tipo_cambio)}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(item.fecha_cambio).toLocaleDateString('es-CO', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(item.fecha_cambio).toLocaleTimeString('es-CO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Precios */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            {precioAnterior !== null && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Precio Anterior
                                </span>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  ${precioAnterior.toLocaleString('es-CO', {
                                    minimumFractionDigits: 2,
                                  })}{' '}
                                  / kg
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Precio Nuevo
                              </span>
                              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                ${precioNuevo.toLocaleString('es-CO', {
                                  minimumFractionDigits: 2,
                                })}{' '}
                                / kg
                              </p>
                            </div>
                          </div>

                          {/* Diferencia y porcentaje */}
                          {diferencia !== null && (
                            <div className="mb-3">
                              <div
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                                  item.tipo_cambio === 'AUMENTO'
                                    ? 'bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                                    : item.tipo_cambio === 'DISMINUCION'
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-100'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                }`}
                              >
                                {diferencia > 0 ? '+' : ''}$
                                {diferencia.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                                {porcentaje !== null && (
                                  <span className="ml-1">
                                    ({diferencia > 0 ? '+' : ''}
                                    {porcentaje.toFixed(2)}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Justificación */}
                          {item.justificacion && (
                            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Justificación:
                              </p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {item.justificacion}
                              </p>
                            </div>
                          )}

                          {/* Usuario */}
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <User className="h-3 w-3" />
                            <span>Modificado por: {item.modificado_por_nombre}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
