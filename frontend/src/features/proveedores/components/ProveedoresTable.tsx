import { useState } from 'react';
import { Eye, MapPin } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ProveedorDetailModal } from './ProveedorDetailModal';
import type { Proveedor } from '@/types/proveedores.types';

interface ProveedoresTableProps {
  proveedores: Proveedor[];
  onEdit: (proveedor: Proveedor) => void;
  onDelete: (proveedor: Proveedor) => void;
  onCambiarPrecio?: (proveedor: Proveedor) => void;
  onVerHistorial?: (proveedor: Proveedor) => void;
  onToggleStatus: (proveedor: Proveedor) => void;
  canChangePrecio: boolean;
  isLoading?: boolean;
  showPrecioColumns?: boolean;
}

export const ProveedoresTable = ({
  proveedores,
  onEdit,
  onDelete,
  onCambiarPrecio,
  onVerHistorial,
  onToggleStatus,
  canChangePrecio,
  isLoading,
  showPrecioColumns = true,
}: ProveedoresTableProps) => {
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleOpenDetail = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    // No limpiar selectedProveedor aquí - se necesita para las acciones que usan setTimeout
    // Se limpiará cuando se abra un nuevo proveedor en handleOpenDetail
  };

  const getSubtipoMateriaBadges = (subtipos?: string[] | null) => {
    if (!subtipos || subtipos.length === 0) {
      return <span className="text-gray-400 dark:text-gray-500 text-sm">Sin clasificar</span>;
    }

    const colors: Record<string, 'success' | 'warning' | 'info' | 'primary'> = {
      SEBO: 'success',
      HUESO: 'warning',
      ACU: 'info',
      CABEZAS: 'primary',
    };

    return (
      <div className="flex flex-wrap gap-1">
        {subtipos.map((subtipo, idx) => (
          <Badge key={idx} variant={colors[subtipo] || 'gray'} size="sm">{subtipo}</Badge>
        ))}
      </div>
    );
  };

  const getModalidadLogisticaIcon = (modalidad?: string | null) => {
    if (!modalidad) return null;

    if (modalidad === 'COMPRA_EN_PUNTO') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
          <MapPin className="h-3 w-3" />
          Punto
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
        Planta
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (proveedores.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        <p className="text-gray-500 dark:text-gray-400">No se encontraron proveedores</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ubicación
              </th>
              {showPrecioColumns && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Precio/kg
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {proveedores.map((proveedor) => {
              const tienePrecio = proveedor.precios_materia_prima && proveedor.precios_materia_prima.length > 0;

              return (
                <tr
                  key={proveedor.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleOpenDetail(proveedor)}
                >
                  {/* CÓDIGO */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-medium text-primary-600 dark:text-primary-400">
                      {proveedor.codigo_interno || '-'}
                    </span>
                  </td>

                  {/* PROVEEDOR */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {proveedor.nombre_comercial}
                      </div>
                      {proveedor.telefono && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{proveedor.telefono}</div>
                      )}
                    </div>
                  </td>

                  {/* TIPO MATERIA */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {getSubtipoMateriaBadges(proveedor.subtipo_materia)}
                      {proveedor.modalidad_logistica && getModalidadLogisticaIcon(proveedor.modalidad_logistica)}
                    </div>
                  </td>

                  {/* UBICACIÓN */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{proveedor.ciudad}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{proveedor.departamento}</div>
                  </td>

                  {/* PRECIO */}
                  {showPrecioColumns && (
                    <td className="px-6 py-4">
                      {proveedor.es_proveedor_materia_prima ? (
                        tienePrecio ? (
                          <div className="space-y-1">
                            {proveedor.precios_materia_prima?.slice(0, 2).map((precio) => (
                              <div key={precio.id}>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {precio.tipo_materia_display}
                                </div>
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                  ${parseFloat(precio.precio_kg).toLocaleString('es-CO')}
                                </div>
                              </div>
                            ))}
                            {(proveedor.precios_materia_prima?.length ?? 0) > 2 && (
                              <div className="text-xs text-primary-600 dark:text-primary-400">
                                +{(proveedor.precios_materia_prima?.length ?? 0) - 2} más...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-amber-600 dark:text-amber-400">Sin precio</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                      )}
                    </td>
                  )}

                  {/* ESTADO */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleStatus(proveedor)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        proveedor.is_active ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          proveedor.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {proveedor.is_active ? 'Activo' : 'Inactivo'}
                    </div>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(proveedor);
                      }}
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de detalle */}
      <ProveedorDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        proveedor={selectedProveedor}
        onEdit={onEdit}
        onDelete={onDelete}
        onCambiarPrecio={onCambiarPrecio}
        onVerHistorial={onVerHistorial}
        onToggleStatus={onToggleStatus}
        canChangePrecio={canChangePrecio}
        showPrecioColumns={showPrecioColumns}
      />
    </>
  );
};
