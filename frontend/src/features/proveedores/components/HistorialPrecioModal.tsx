import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Clock, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { Proveedor } from '@/types/proveedores.types';
import { useHistorialPrecio } from '../hooks/useProveedores';

interface HistorialPrecioModalProps {
  isOpen: boolean;
  onClose: () => void;
  proveedor: Proveedor | null;
}

export const HistorialPrecioModal = ({
  isOpen,
  onClose,
  proveedor,
}: HistorialPrecioModalProps) => {
  const { data: historialData, isLoading } = useHistorialPrecio(proveedor?.id || 0);

  if (!proveedor) return null;

  const getBadgeVariant = (tipoCambio: string) => {
    switch (tipoCambio) {
      case 'AUMENTO':
        return 'danger';
      case 'REDUCCION':
        return 'success';
      case 'INICIAL':
        return 'info';
      default:
        return 'gray';
    }
  };

  const getTipoCambioIcon = (tipoCambio: string) => {
    switch (tipoCambio) {
      case 'AUMENTO':
        return <TrendingUp className="h-4 w-4" />;
      case 'REDUCCION':
        return <TrendingDown className="h-4 w-4" />;
      case 'INICIAL':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTipoCambioLabel = (tipoCambio: string) => {
    switch (tipoCambio) {
      case 'AUMENTO':
        return 'Aumento';
      case 'REDUCCION':
        return 'Reducción';
      case 'INICIAL':
        return 'Precio Inicial';
      case 'SIN_CAMBIO':
        return 'Sin Cambio';
      default:
        return tipoCambio;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de Precios"
      size="xl"
    >
      <div className="space-y-6">
        {/* INFO DEL PROVEEDOR */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{proveedor.nombre_comercial}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Tipo:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">{proveedor.tipo_proveedor_display}</span>
            </div>
            {proveedor.subtipo_materia_display && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Subtipo:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {Array.isArray(proveedor.subtipo_materia_display)
                    ? proveedor.subtipo_materia_display.join(', ')
                    : proveedor.subtipo_materia_display}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PRECIOS ACTUALES POR TIPO DE MATERIA */}
        {historialData && historialData.precios_actuales && historialData.precios_actuales.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Precios Actuales</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {historialData.precios_actuales.map((precio: any) => (
                <div key={precio.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {precio.tipo_materia_display}
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    ${parseFloat(precio.precio_kg).toLocaleString('es-CO', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    <span className="text-sm font-normal">/ kg</span>
                  </div>
                  {precio.vigente_desde && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Desde: {new Date(precio.vigente_desde).toLocaleDateString('es-CO')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORIAL */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        ) : historialData && historialData.historial.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historial de Cambios ({historialData.historial.length})
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historialData.historial.map((registro, index) => {
                const precioAnterior = registro.precio_anterior
                  ? parseFloat(registro.precio_anterior)
                  : null;
                const precioNuevo = parseFloat(registro.precio_nuevo);
                const variacion = registro.variacion_precio
                  ? parseFloat(registro.variacion_precio)
                  : null;

                return (
                  <div
                    key={registro.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTipoCambioIcon(registro.tipo_cambio)}
                        <Badge variant={getBadgeVariant(registro.tipo_cambio)} size="sm">
                          {getTipoCambioLabel(registro.tipo_cambio)}
                        </Badge>
                        {registro.tipo_materia_display && (
                          <Badge variant="info" size="sm">
                            {registro.tipo_materia_display}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(registro.fecha_modificacion).toLocaleString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      {precioAnterior !== null && (
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">Precio Anterior</span>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            ${precioAnterior.toLocaleString('es-CO', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">
                          {registro.tipo_cambio === 'INICIAL' ? 'Precio Inicial' : 'Precio Nuevo'}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          ${precioNuevo.toLocaleString('es-CO', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {variacion !== null && variacion !== 0 && (
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">Variación</span>
                          <span
                            className={`text-sm font-semibold ${
                              variacion > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {variacion > 0 ? '+' : ''}
                            ${variacion.toLocaleString('es-CO', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {registro.motivo && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <strong className="text-gray-900 dark:text-gray-100">Motivo:</strong> {registro.motivo}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Modificado por:{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {registro.modificado_por_nombre}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
            <p>No hay historial de cambios de precio disponible</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
