import { useState } from 'react';
import {
  Eye,
  Trash2,
  Calendar,
  FlaskConical,
  Package,
  Receipt,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import type { PruebaAcidez, CalidadSebo } from '@/types/proveedores.types';

// Colores por calidad
const CALIDAD_CONFIG: Record<
  CalidadSebo,
  { bg: string; text: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'gray' }
> = {
  A: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', variant: 'success' },
  B: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', variant: 'info' },
  B1: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', variant: 'warning' },
  B2: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', variant: 'warning' },
  B4: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', variant: 'danger' },
  C: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200', variant: 'gray' },
};

interface PruebasAcidezTableProps {
  pruebas: PruebaAcidez[];
  onVerDetalle?: (prueba: PruebaAcidez) => void;
  onDelete?: (prueba: PruebaAcidez) => void;
  onGenerarVoucher?: (prueba: PruebaAcidez) => void;
  isLoading?: boolean;
  showProveedorColumn?: boolean;
}

export const PruebasAcidezTable = ({
  pruebas,
  onVerDetalle,
  onDelete,
  onGenerarVoucher,
  isLoading,
  showProveedorColumn = true,
}: PruebasAcidezTableProps) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (pruebas.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No se encontraron pruebas de acidez</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Registre una nueva prueba para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8">
              {/* Expand */}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Voucher
            </th>
            {showProveedorColumn && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Proveedor
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acidez
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Calidad
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Cantidad
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Valor Total
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {pruebas.map((prueba) => {
            const isExpanded = expandedRows.has(prueba.id);
            const calidadConfig = CALIDAD_CONFIG[prueba.calidad_resultante];

            return (
              <>
                <tr
                  key={prueba.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => toggleRowExpand(prueba.id)}
                >
                  {/* Expand Icon */}
                  <td className="px-4 py-4">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </td>

                  {/* Voucher */}
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {prueba.codigo_voucher}
                    </span>
                  </td>

                  {/* Proveedor */}
                  {showProveedorColumn && (
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {prueba.proveedor_nombre}
                      </div>
                      {prueba.proveedor_documento && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {prueba.proveedor_documento}
                        </div>
                      )}
                    </td>
                  )}

                  {/* Fecha */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {new Date(prueba.fecha_prueba).toLocaleDateString('es-CO')}
                    </div>
                  </td>

                  {/* Acidez */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <FlaskConical className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {parseFloat(prueba.valor_acidez).toFixed(2)}%
                      </span>
                    </div>
                  </td>

                  {/* Calidad */}
                  <td className="px-4 py-4">
                    <Badge variant={calidadConfig.variant}>
                      {prueba.calidad_resultante_display}
                    </Badge>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                      {prueba.codigo_materia}
                    </div>
                  </td>

                  {/* Cantidad */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100">
                      <Package className="h-3.5 w-3.5 text-gray-400" />
                      {parseFloat(prueba.cantidad_kg).toLocaleString('es-CO')} kg
                    </div>
                  </td>

                  {/* Valor Total */}
                  <td className="px-4 py-4">
                    {prueba.valor_total ? (
                      <span className="text-sm font-bold text-green-700 dark:text-green-400">
                        ${parseFloat(prueba.valor_total).toLocaleString('es-CO')}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {onVerDetalle && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerDetalle(prueba)}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onGenerarVoucher && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onGenerarVoucher(prueba)}
                          title="Generar Voucher"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(prueba)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Fila expandida con detalles */}
                {isExpanded && (
                  <tr key={`${prueba.id}-expanded`}>
                    <td
                      colSpan={showProveedorColumn ? 9 : 8}
                      className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Imagen de la prueba */}
                        <div className="md:col-span-1">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Foto de la Prueba
                          </h4>
                          {prueba.foto_prueba_url ? (
                            <a
                              href={prueba.foto_prueba_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block relative group"
                            >
                              <img
                                src={prueba.foto_prueba_url}
                                alt="Foto de prueba de acidez"
                                className="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm object-cover"
                                style={{ maxHeight: '200px' }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center rounded-lg">
                                <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </a>
                          ) : (
                            <div className="w-full max-w-xs h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Sin imagen
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Detalles de la prueba */}
                        <div className="md:col-span-2 space-y-4">
                          {/* Información de precios */}
                          {prueba.precio_kg_aplicado && (
                            <div className={`p-3 rounded-lg ${calidadConfig.bg}`}>
                              <h4 className={`text-sm font-semibold mb-2 ${calidadConfig.text}`}>
                                Información de Precio
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Precio/kg aplicado:
                                  </span>
                                  <p className="font-bold text-gray-900 dark:text-gray-100">
                                    ${parseFloat(prueba.precio_kg_aplicado).toLocaleString('es-CO')}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Valor Total:
                                  </span>
                                  <p className="font-bold text-green-700 dark:text-green-400 text-lg">
                                    ${prueba.valor_total ? parseFloat(prueba.valor_total).toLocaleString('es-CO') : 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Otros detalles */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {prueba.lote_numero && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Lote
                                </span>
                                <p className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                                  {prueba.lote_numero}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Realizado por
                              </span>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {prueba.realizado_por_nombre}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Fecha de registro
                              </span>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {new Date(prueba.created_at).toLocaleString('es-CO')}
                              </p>
                            </div>
                          </div>

                          {/* Observaciones */}
                          {prueba.observaciones && (
                            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Observaciones
                              </span>
                              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-wrap">
                                {prueba.observaciones}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
