import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  DollarSign,
  History,
  MapPin,
  AlertTriangle,
  FileText,
  CreditCard,
  Info,
  Phone,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
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
        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </span>
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
    );
  };

  const getTipoProveedorBadge = (tipo: string) => {
    switch (tipo) {
      case 'MATERIA_PRIMA_EXTERNO':
        return <Badge variant="primary">Materia Prima</Badge>;
      case 'UNIDAD_NEGOCIO':
        return <Badge variant="info">Unidad Interna</Badge>;
      case 'PRODUCTO_SERVICIO':
        return <Badge variant="warning">Producto/Servicio</Badge>;
      default:
        return <Badge variant="gray">{tipo}</Badge>;
    }
  };

  const getSubtipoMateriaBadges = (subtipos?: string[] | null) => {
    if (!subtipos || subtipos.length === 0) return null;

    const colors: Record<string, 'success' | 'warning' | 'info'> = {
      SEBO: 'success',
      HUESO: 'warning',
      ACU: 'info',
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
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
            const isExpanded = expandedRows.has(proveedor.id);
            const tienePrecio = proveedor.precios_materia_prima && proveedor.precios_materia_prima.length > 0;

            return (
              <React.Fragment key={proveedor.id}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => toggleRowExpand(proveedor.id)}
                >
                  {/* PROVEEDOR */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {proveedor.nombre_comercial}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{proveedor.numero_documento}</div>
                      {proveedor.telefono && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{proveedor.telefono}</div>
                      )}
                    </div>
                  </td>

                  {/* TIPO */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {getTipoProveedorBadge(proveedor.tipo_proveedor)}
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
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {proveedor.es_proveedor_materia_prima ? (
                        tienePrecio ? (
                          <div className="space-y-2">
                            {proveedor.precios_materia_prima && proveedor.precios_materia_prima.length > 0 && (
                              <>
                                {proveedor.precios_materia_prima.map((precio) => (
                                  <div key={precio.id} className="mb-1">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {precio.tipo_materia_display}
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                      ${parseFloat(precio.precio_kg).toLocaleString('es-CO')}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex gap-1 mt-2">
                                  {onVerHistorial && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onVerHistorial(proveedor)}
                                      title="Ver historial de precios"
                                    >
                                      <History className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {canChangePrecio && onCambiarPrecio && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => onCambiarPrecio(proveedor)}
                                      title="Cambiar precio (Solo Gerente)"
                                    >
                                      <DollarSign className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ) : canChangePrecio && onCambiarPrecio ? (
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                                Sin precio asignado
                              </span>
                            </div>
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCambiarPrecio(proveedor);
                              }}
                              className="w-full"
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Asignar Precio
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">Sin precios</span>
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
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(proveedor)}
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(proveedor)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>

                {/* FILA EXPANDIDA CON DETALLES */}
                {isExpanded && (
                  <tr>
                    <td
                      colSpan={showPrecioColumns ? 6 : 5}
                      className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="space-y-6">
                        {/* SECCIÓN 1: Información Básica */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Información Básica
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {renderField('Razón Social', proveedor.razon_social)}
                            {renderField('Dirección', proveedor.direccion)}
                            {renderField(
                              'Documento',
                              proveedor.tipo_documento && proveedor.numero_documento
                                ? `${proveedor.tipo_documento}: ${proveedor.numero_documento}`
                                : null
                            )}
                            {renderField('NIT', proveedor.nit)}
                            {renderField('Teléfono', proveedor.telefono)}
                            {renderField('Email', proveedor.email)}
                            {renderField(
                              'Modalidad Logística',
                              proveedor.modalidad_logistica === 'COMPRA_EN_PUNTO'
                                ? 'Compra en Punto'
                                : proveedor.modalidad_logistica === 'ENTREGA_EN_PLANTA'
                                ? 'Entrega en Planta'
                                : null
                            )}
                            {renderField('Unidad Interna', proveedor.unidad_negocio_nombre)}
                          </div>
                        </div>

                        {/* SECCIÓN 2: Información de Contacto */}
                        {(proveedor.email || proveedor.telefono || proveedor.direccion) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Información de Contacto
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              {renderField('Email', proveedor.email)}
                              {renderField('Teléfono', proveedor.telefono)}
                              {renderField('Dirección', proveedor.direccion)}
                            </div>
                          </div>
                        )}

                        {/* SECCIÓN 3: Precios (solo si es_proveedor_materia_prima y showPrecioColumns) */}
                        {showPrecioColumns && proveedor.es_proveedor_materia_prima && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              Precios de Materia Prima
                            </h4>
                            {tienePrecio && proveedor.precios_materia_prima && proveedor.precios_materia_prima.length > 0 ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {proveedor.precios_materia_prima.map((precio) => (
                                    <div
                                      key={precio.id}
                                      className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-300 dark:border-blue-700"
                                    >
                                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        {precio.tipo_materia_display}
                                      </div>
                                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                        ${parseFloat(precio.precio_kg).toLocaleString('es-CO')}
                                        <span className="text-xs font-normal text-gray-600 dark:text-gray-400 ml-1">
                                          /kg
                                        </span>
                                      </div>
                                      {precio.vigente_desde && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          Desde: {new Date(precio.vigente_desde).toLocaleDateString('es-CO')}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {canChangePrecio && onCambiarPrecio && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCambiarPrecio(proveedor);
                                    }}
                                    className="mt-2"
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Cambiar Precio
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  No hay precios asignados para este proveedor
                                </p>
                                {canChangePrecio && onCambiarPrecio && (
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCambiarPrecio(proveedor);
                                    }}
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Asignar Precio
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* SECCIÓN 4: Información Financiera (si tiene datos) */}
                        {((proveedor.formas_pago_display && proveedor.formas_pago_display.length > 0) ||
                          proveedor.banco) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Información Financiera
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              {proveedor.formas_pago_display && proveedor.formas_pago_display.length > 0 && (
                                <div>
                                  <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Formas de Pago
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {proveedor.formas_pago_display.map((fp, idx) => (
                                      <Badge key={idx} variant="info" size="sm">
                                        {fp}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {renderField(
                                'Días Plazo Pago',
                                proveedor.dias_plazo_pago ? `${proveedor.dias_plazo_pago} días` : null
                              )}
                              {renderField('Banco', proveedor.banco)}
                              {renderField('Tipo de Cuenta', proveedor.tipo_cuenta)}
                              {renderField('Número de Cuenta', proveedor.numero_cuenta)}
                              {renderField('Titular de Cuenta', proveedor.titular_cuenta)}
                            </div>
                          </div>
                        )}

                        {/* SECCIÓN 5: Metadata (si tiene observaciones o created_by) */}
                        {(proveedor.observaciones || proveedor.created_by_nombre) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              Información Adicional
                            </h4>
                            <div className="space-y-3">
                              {proveedor.observaciones && (
                                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                  <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Observaciones
                                  </span>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                    {proveedor.observaciones}
                                  </p>
                                </div>
                              )}
                              {proveedor.created_by_nombre && (
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span>Creado por: {proveedor.created_by_nombre}</span>
                                  {proveedor.created_at && (
                                    <span>
                                      el {new Date(proveedor.created_at).toLocaleDateString('es-CO')} a las{' '}
                                      {new Date(proveedor.created_at).toLocaleTimeString('es-CO', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  )}
                                </div>
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
