import React, { useState } from 'react';
import {
  Trash2,
  UserPlus,
  Calendar,
  Building2,
  Package,
  User,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpand = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
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

  const renderField = (label: string, value: any, className?: string) => {
    if (!value) return null;

    return (
      <div className={className}>
        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</span>
        <p className="font-medium text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    );
  };

  const canAsignarRecolectorInternal = (programacion: Programacion) => {
    // Estado PROGRAMADA = pendiente de asignar recolector
    return programacion.estado === 'PROGRAMADA' && !programacion.recolector_asignado;
  };

  const canReprogramarInternal = (programacion: Programacion) => {
    return !['COMPLETADA', 'CANCELADA'].includes(programacion.estado);
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
            const isExpanded = expandedRows.has(programacion.id);
            const fechaProgramada = new Date(programacion.fecha_programada);

            return (
              <React.Fragment key={programacion.id}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => toggleRowExpand(programacion.id)}
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
                      <Calendar className={`h-4 w-4 ${programacion.esta_vencida ? 'text-red-500' : 'text-gray-400'}`} />
                      <div>
                        <div className={`text-sm font-medium ${
                          programacion.esta_vencida
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {fechaProgramada.toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {programacion.esta_vencida && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Requiere reprogramación
                          </div>
                        )}
                        {programacion.fecha_reprogramada && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            Reprog:{' '}
                            {new Date(programacion.fecha_reprogramada).toLocaleDateString('es-CO')}
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
                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Pendiente
                      </div>
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
                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Sin asignar
                      </div>
                    )}
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1 flex-wrap">
                      {canAsignarRecolector && canAsignarRecolectorInternal(programacion) && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onAsignarRecolector(programacion)}
                          title="Asignar recolector"
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      )}

                      {canReprogramar && canReprogramarInternal(programacion) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReprogramar(programacion)}
                          title="Reprogramar"
                        >
                          <Calendar className="h-3 w-3" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(programacion)}
                          title="Eliminar"
                          disabled={['COMPLETADA', 'EN_RUTA'].includes(programacion.estado)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* FILA EXPANDIDA CON DETALLES */}
                {isExpanded && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="space-y-6">
                        {/* SECCIÓN 1: Información del Ecoaliado */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Información del Ecoaliado
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {renderField(
                              'Razón Social',
                              programacion.ecoaliado_razon_social
                            )}
                            {renderField('Ciudad', programacion.ecoaliado_ciudad)}
                            {renderField('Dirección', programacion.ecoaliado_direccion)}
                            {renderField('Teléfono', programacion.ecoaliado_telefono)}
                            {programacion.tiene_geolocalizacion && (
                              <div>
                                <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Geolocalización
                                </span>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-green-600" />
                                  <span className="text-xs text-green-600 dark:text-green-400">
                                    Lat: {programacion.latitud?.toFixed(6)} / Lng:{' '}
                                    {programacion.longitud?.toFixed(6)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SECCIÓN 2: Detalles de la Programación */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Detalles de la Programación
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {renderField('Estado', programacion.estado_display)}
                            {renderField(
                              'Fecha Programada',
                              fechaProgramada.toLocaleDateString('es-CO', {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })
                            )}
                            {programacion.fecha_reprogramada &&
                              renderField(
                                'Fecha Reprogramada',
                                new Date(programacion.fecha_reprogramada).toLocaleDateString(
                                  'es-CO',
                                  {
                                    weekday: 'long',
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                  }
                                )
                              )}
                            {programacion.fecha_asignacion &&
                              renderField(
                                'Fecha Asignación',
                                new Date(programacion.fecha_asignacion).toLocaleString('es-CO')
                              )}
                            {programacion.fecha_inicio_ruta &&
                              renderField(
                                'Inicio de Ruta',
                                new Date(programacion.fecha_inicio_ruta).toLocaleString('es-CO')
                              )}
                            {programacion.fecha_completada &&
                              renderField(
                                'Fecha Completada',
                                new Date(programacion.fecha_completada).toLocaleString('es-CO')
                              )}
                          </div>
                        </div>

                        {/* SECCIÓN 3: Observaciones */}
                        {(programacion.observaciones_comercial ||
                          programacion.observaciones_logistica ||
                          programacion.motivo_cancelacion ||
                          programacion.motivo_reprogramacion) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Observaciones
                            </h4>
                            <div className="space-y-2">
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
                              {programacion.motivo_reprogramacion && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                  <div className="text-xs font-semibold text-orange-900 dark:text-orange-100 mb-1">
                                    Motivo de Reprogramación:
                                  </div>
                                  <p className="text-sm text-orange-800 dark:text-orange-200">
                                    {programacion.motivo_reprogramacion}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* SECCIÓN 4: Metadata */}
                        {programacion.created_by_nombre && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>Creado por: {programacion.created_by_nombre}</span>
                            </div>
                            {programacion.created_at && (
                              <span>
                                el {new Date(programacion.created_at).toLocaleDateString('es-CO')}{' '}
                                a las{' '}
                                {new Date(programacion.created_at).toLocaleTimeString('es-CO', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
