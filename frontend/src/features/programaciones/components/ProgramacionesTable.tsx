import { useState } from 'react';
import { Eye, Calendar, User, AlertCircle, Package } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ProgramacionDetalleModal } from './ProgramacionDetalleModal';
import { formatFechaLocal } from '@/utils/dateUtils';
import type { Programacion } from '../types/programacion.types';

interface ProgramacionesTableProps {
  programaciones: Programacion[];
  onDelete: (programacion: Programacion) => void;
  onAsignarRecolector: (programacion: Programacion) => void;
  onReprogramar: (programacion: Programacion) => void;
  canDelete: boolean;
  canReprogramar: boolean;
  canAsignarRecolector: boolean;
  isLoading?: boolean;
}

export const ProgramacionesTable = ({
  programaciones,
  onDelete,
  onAsignarRecolector,
  onReprogramar,
  canDelete,
  canReprogramar,
  canAsignarRecolector,
  isLoading,
}: ProgramacionesTableProps) => {
  const [selectedProgramacion, setSelectedProgramacion] = useState<Programacion | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleOpenDetail = (programacion: Programacion) => {
    setSelectedProgramacion(programacion);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
  };

  const getEstadoBadge = (programacion: Programacion) => {
    // Si está vencida (fecha pasó y no tiene recolector asignado)
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (programaciones.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No se encontraron programaciones</p>
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
                Código / Ecoaliado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha Recolección
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cantidad Est.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cantidad Real.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recolector
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {programaciones.map((programacion) => {
              return (
                <tr
                  key={programacion.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleOpenDetail(programacion)}
                >
                  {/* CÓDIGO / ECOALIADO */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {programacion.ecoaliado_razon_social}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {programacion.ecoaliado_codigo}
                      </div>
                    </div>
                  </td>

                  {/* FECHA RECOLECCIÓN */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar
                        className={`h-4 w-4 ${programacion.esta_vencida ? 'text-red-500' : 'text-gray-400'}`}
                      />
                      <div>
                        <div
                          className={`text-sm font-medium ${
                            programacion.esta_vencida
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {formatFechaLocal(programacion.fecha_programada)}
                        </div>
                        {programacion.esta_vencida && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Requiere reprogramación
                          </div>
                        )}
                        {programacion.fecha_reprogramada && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            Reprog: {formatFechaLocal(programacion.fecha_reprogramada)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ESTADO */}
                  <td className="px-6 py-4">{getEstadoBadge(programacion)}</td>

                  {/* CANTIDAD ESTIMADA */}
                  <td className="px-6 py-4">
                    {programacion.cantidad_estimada_kg ? (
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {programacion.cantidad_estimada_kg.toLocaleString('es-CO')} kg
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                        No especificada
                      </div>
                    )}
                  </td>

                  {/* CANTIDAD RECOLECTADA */}
                  <td className="px-6 py-4">
                    {programacion.cantidad_recolectada_kg ? (
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        {programacion.cantidad_recolectada_kg.toLocaleString('es-CO')} kg
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">Pendiente</div>
                    )}
                  </td>

                  {/* RECOLECTOR */}
                  <td className="px-6 py-4">
                    {programacion.recolector_asignado ? (
                      <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {programacion.recolector_asignado_nombre}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">Sin asignar</div>
                    )}
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(programacion);
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
      <ProgramacionDetalleModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        programacion={selectedProgramacion}
        onAsignarRecolector={onAsignarRecolector}
        onReprogramar={onReprogramar}
        onEliminar={onDelete}
        canAsignarRecolector={canAsignarRecolector}
        canReprogramar={canReprogramar}
        canEliminar={canDelete}
      />
    </>
  );
};
