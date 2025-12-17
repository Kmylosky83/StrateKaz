import { useState } from 'react';
import { Eye, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EcoaliadoDetailModal } from './EcoaliadoDetailModal';
import type { Ecoaliado } from '../types/ecoaliado.types';

interface EcoaliadosTableProps {
  ecoaliados: Ecoaliado[];
  onEdit: (ecoaliado: Ecoaliado) => void;
  onDelete: (ecoaliado: Ecoaliado) => void;
  onCambiarPrecio: (ecoaliado: Ecoaliado) => void;
  onVerHistorial: (ecoaliado: Ecoaliado) => void;
  onToggleStatus: (ecoaliado: Ecoaliado) => void;
  canChangePrecio: boolean;
  canManage: boolean;
  isLoading?: boolean;
}

export const EcoaliadosTable = ({
  ecoaliados,
  onEdit,
  onDelete,
  onCambiarPrecio,
  onVerHistorial,
  onToggleStatus,
  canChangePrecio,
  canManage,
  isLoading,
}: EcoaliadosTableProps) => {
  const [selectedEcoaliado, setSelectedEcoaliado] = useState<Ecoaliado | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleOpenDetail = (ecoaliado: Ecoaliado) => {
    setSelectedEcoaliado(ecoaliado);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
  };

  const getTipoDocumentoBadge = (tipo: string) => {
    const colors: Record<string, 'primary' | 'info' | 'success' | 'warning'> = {
      CC: 'primary',
      CE: 'info',
      NIT: 'success',
      PASAPORTE: 'warning',
    };

    return (
      <Badge variant={colors[tipo] || 'gray'} size="sm">
        {tipo}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (ecoaliados.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        <p className="text-gray-500 dark:text-gray-400">No se encontraron ecoaliados</p>
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
                Ecoaliado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Documento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Unidad Interna
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Precio/kg
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GPS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {ecoaliados.map((ecoaliado) => (
              <tr
                key={ecoaliado.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => handleOpenDetail(ecoaliado)}
              >
                {/* CÓDIGO */}
                <td className="px-6 py-4">
                  <span className="text-sm font-mono font-medium text-primary-600 dark:text-primary-400">
                    {ecoaliado.codigo}
                  </span>
                </td>

                {/* ECOALIADO */}
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ecoaliado.razon_social}
                    </div>
                    {ecoaliado.telefono && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {ecoaliado.telefono}
                      </div>
                    )}
                  </div>
                </td>

                {/* DOCUMENTO */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {getTipoDocumentoBadge(ecoaliado.documento_tipo)}
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {ecoaliado.documento_numero}
                    </span>
                  </div>
                </td>

                {/* UNIDAD NEGOCIO */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {ecoaliado.unidad_negocio_nombre}
                  </div>
                </td>

                {/* UBICACIÓN */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {ecoaliado.ciudad}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {ecoaliado.departamento}
                  </div>
                </td>

                {/* PRECIO */}
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    ${parseFloat(ecoaliado.precio_compra_kg).toLocaleString('es-CO')}
                  </div>
                </td>

                {/* GPS */}
                <td className="px-6 py-4">
                  {ecoaliado.tiene_geolocalizacion ? (
                    <div className="flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </td>

                {/* ESTADO */}
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => canManage && onToggleStatus(ecoaliado)}
                    disabled={!canManage}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      ecoaliado.is_active
                        ? 'bg-green-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    } ${!canManage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        ecoaliado.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {ecoaliado.is_active ? 'Activo' : 'Inactivo'}
                  </div>
                </td>

                {/* ACCIONES */}
                <td className="px-6 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(ecoaliado);
                    }}
                    title="Ver detalle"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de detalle */}
      <EcoaliadoDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        ecoaliado={selectedEcoaliado}
        onEdit={onEdit}
        onDelete={onDelete}
        onCambiarPrecio={onCambiarPrecio}
        onVerHistorial={onVerHistorial}
        onToggleStatus={onToggleStatus}
        canChangePrecio={canChangePrecio}
        canManage={canManage}
      />
    </>
  );
};
