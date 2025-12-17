/**
 * Modal para Ver Historial de Precios de Ecoaliado
 *
 * Muestra el historial completo de cambios de precio con:
 * - Header con información del ecoaliado y precio actual
 * - Timeline visual de cambios
 * - Fecha y hora del cambio
 * - Precio anterior y nuevo
 * - Diferencia y porcentaje de cambio
 * - Tipo de cambio (INICIAL, AUMENTO, DISMINUCION)
 * - Justificación del cambio
 * - Usuario que realizó el cambio
 */
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import {
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  FileText,
  Building2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useHistorialPrecios } from '../api/useEcoaliados';
import type { Ecoaliado } from '../types/ecoaliado.types';

interface HistorialPrecioModalProps {
  isOpen: boolean;
  onClose: () => void;
  ecoaliado: Ecoaliado | null;
}

export const HistorialPrecioModal = ({
  isOpen,
  onClose,
  ecoaliado,
}: HistorialPrecioModalProps) => {
  // Obtener datos internamente como hace Proveedores
  const { data: historialData, isLoading } = useHistorialPrecios(ecoaliado?.id || 0);

  if (!isOpen || !ecoaliado) return null;

  const getBadgeVariant = (tipo: string): 'info' | 'danger' | 'success' | 'warning' | 'gray' => {
    switch (tipo) {
      case 'CREACION':
        return 'info';
      case 'AUMENTO':
        return 'danger';
      case 'DISMINUCION':
        return 'success';
      case 'AJUSTE':
        return 'warning';
      default:
        return 'gray';
    }
  };

  const getTipoCambioLabel = (tipo: string) => {
    switch (tipo) {
      case 'CREACION':
        return 'Precio Inicial';
      case 'AUMENTO':
        return 'Aumento';
      case 'DISMINUCION':
        return 'Disminución';
      case 'AJUSTE':
        return 'Ajuste';
      default:
        return tipo;
    }
  };

  const getTipoCambioIcon = (tipo: string) => {
    switch (tipo) {
      case 'AUMENTO':
        return <TrendingUp className="h-4 w-4" />;
      case 'DISMINUCION':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const precioActual = historialData?.precio_actual || ecoaliado.precio_compra_kg || '0';
  const historial = historialData?.historial || [];

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
                    {ecoaliado.codigo}
                  </span>
                  <Badge variant={ecoaliado.is_active ? 'success' : 'gray'} size="sm">
                    {ecoaliado.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {ecoaliado.razon_social}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Historial de Precios
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

          {/* Content */}
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Info del Ecoaliado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField(Building2, 'Unidad de Negocio', ecoaliado.unidad_negocio_nombre)}
                  {renderField(User, 'Comercial Asignado', ecoaliado.comercial_asignado_nombre)}
                </div>

                {/* Precio Actual */}
                <div className="bg-info-50 dark:bg-info-900/20 p-4 rounded-lg border border-info-200 dark:border-info-800">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-info-600 dark:text-info-400" />
                    <span className="text-sm font-medium text-info-900 dark:text-info-100">
                      Precio Actual
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-info-900 dark:text-info-100">
                    ${parseFloat(precioActual).toLocaleString('es-CO', { minimumFractionDigits: 2 })} / kg
                  </div>
                </div>

                {/* Historial */}
                {historial.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay historial de cambios de precio disponible
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Historial de Cambios ({historial.length})
                    </h4>
                    <div className="space-y-4">
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

                        const esAumento = item.tipo_cambio === 'AUMENTO';
                        const esDisminucion = item.tipo_cambio === 'DISMINUCION';

                        return (
                          <div
                            key={item.id}
                            className={cn(
                              'p-4 rounded-lg border transition-shadow hover:shadow-md',
                              index === 0
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                            )}
                          >
                            {/* Header del registro */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getTipoCambioIcon(item.tipo_cambio)}
                                <Badge variant={getBadgeVariant(item.tipo_cambio)} size="sm">
                                  {getTipoCambioLabel(item.tipo_cambio)}
                                </Badge>
                                {index === 0 && (
                                  <Badge variant="primary" size="sm">
                                    Más reciente
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(item.fecha_cambio).toLocaleString('es-CO', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {/* Precios */}
                            <div className="grid grid-cols-3 gap-4 mb-3">
                              {precioAnterior !== null && (
                                <div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                    Precio Anterior
                                  </span>
                                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    ${precioAnterior.toLocaleString('es-CO', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              )}

                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                  {item.tipo_cambio === 'CREACION' ? 'Precio Inicial' : 'Precio Nuevo'}
                                </span>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                  ${precioNuevo.toLocaleString('es-CO', {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>

                              {diferencia !== null && diferencia !== 0 && (
                                <div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                    Variación
                                  </span>
                                  <span
                                    className={cn(
                                      'text-sm font-semibold',
                                      esAumento
                                        ? 'text-danger-600 dark:text-danger-400'
                                        : esDisminucion
                                          ? 'text-success-600 dark:text-success-400'
                                          : 'text-gray-600 dark:text-gray-400'
                                    )}
                                  >
                                    {diferencia > 0 ? '+' : ''}$
                                    {diferencia.toLocaleString('es-CO', {
                                      minimumFractionDigits: 2,
                                    })}
                                    {porcentaje !== null && (
                                      <span className="ml-1">
                                        ({diferencia > 0 ? '+' : ''}{porcentaje.toFixed(1)}%)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Justificación */}
                            {item.justificacion && (
                              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg mb-3">
                                <div className="flex items-start gap-2">
                                  <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                                  <div>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      Motivo:
                                    </span>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {item.justificacion}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Usuario */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <User className="h-3 w-3" />
                              <span>
                                Modificado por:{' '}
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {item.modificado_por_nombre}
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
