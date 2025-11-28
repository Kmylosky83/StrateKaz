import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  DollarSign,
  History,
  MapPin,
  Phone,
  Mail,
  FileText,
  Info,
  Building2,
  User,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
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

  // Helper para renderizar solo campos con valor
  const renderField = (label: string, value: any, className?: string) => {
    if (!value) return null;

    return (
      <div className={className}>
        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</span>
        <p className="font-medium text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    );
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
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
              Comercial
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
          {ecoaliados.map((ecoaliado) => {
            const isExpanded = expandedRows.has(ecoaliado.id);

            return (
              <React.Fragment key={ecoaliado.id}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => toggleRowExpand(ecoaliado.id)}
                >
                  {/* ECOALIADO */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {ecoaliado.razon_social}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Código: {ecoaliado.codigo}
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

                  {/* COMERCIAL */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {ecoaliado.comercial_asignado_nombre}
                    </div>
                  </td>

                  {/* PRECIO */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-2">
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        ${parseFloat(ecoaliado.precio_compra_kg).toLocaleString('es-CO')}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerHistorial(ecoaliado)}
                          title="Ver historial de precios"
                        >
                          <History className="h-3 w-3" />
                        </Button>
                        {canChangePrecio && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onCambiarPrecio(ecoaliado)}
                            title="Cambiar precio"
                          >
                            <DollarSign className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
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
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {canManage && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(ecoaliado)}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDelete(ecoaliado)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* FILA EXPANDIDA CON DETALLES */}
                {isExpanded && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="space-y-6">
                        {/* SECCIÓN 1: Información de Contacto */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Información de Contacto
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {renderField('Teléfono', ecoaliado.telefono)}
                            {renderField('Email', ecoaliado.email)}
                            {renderField('Dirección', ecoaliado.direccion)}
                          </div>
                        </div>

                        {/* SECCIÓN 2: Ubicación */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Ubicación
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {renderField('Ciudad', ecoaliado.ciudad)}
                            {renderField('Departamento', ecoaliado.departamento)}
                            {ecoaliado.tiene_geolocalizacion && (
                              <>
                                {renderField(
                                  'Latitud',
                                  ecoaliado.latitud?.toFixed(6)
                                )}
                                {renderField(
                                  'Longitud',
                                  ecoaliado.longitud?.toFixed(6)
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* SECCIÓN 3: Información Comercial */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Información Comercial
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {renderField(
                              'Unidad Interna',
                              ecoaliado.unidad_negocio_nombre
                            )}
                            {renderField(
                              'Comercial Asignado',
                              ecoaliado.comercial_asignado_nombre
                            )}
                            <div>
                              <span className="block text-xs text-blue-700 dark:text-blue-300 mb-1">
                                Precio de Compra
                              </span>
                              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                ${parseFloat(ecoaliado.precio_compra_kg).toLocaleString('es-CO')}{' '}
                                / kg
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* SECCIÓN 4: Observaciones */}
                        {ecoaliado.observaciones && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Observaciones
                            </h4>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                {ecoaliado.observaciones}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* SECCIÓN 5: Metadata */}
                        {ecoaliado.created_by_nombre && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              Información Adicional
                            </h4>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                <span>Creado por: {ecoaliado.created_by_nombre}</span>
                              </div>
                              {ecoaliado.created_at && (
                                <span>
                                  el {new Date(ecoaliado.created_at).toLocaleDateString('es-CO')}{' '}
                                  a las{' '}
                                  {new Date(ecoaliado.created_at).toLocaleTimeString('es-CO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
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
