/**
 * Tabla de Recolecciones
 *
 * Muestra lista de recolecciones con:
 * - Codigo voucher
 * - Ecoaliado
 * - Recolector
 * - Fecha
 * - Cantidad kg
 * - Valor total
 * - Acciones (ver voucher, reimprimir)
 */
import React, { useState } from 'react';
import {
  Building2,
  User,
  Calendar,
  Scale,
  DollarSign,
  Receipt,
  ChevronDown,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { Recoleccion } from '../types/recoleccion.types';

interface RecoleccionesTableProps {
  recolecciones: Recoleccion[];
  onVerVoucher?: (recoleccion: Recoleccion) => void;
  onReimprimir?: (recoleccion: Recoleccion) => void;
  isLoading?: boolean;
}

export const RecoleccionesTable = ({
  recolecciones,
  onVerVoucher,
  onReimprimir,
  isLoading,
}: RecoleccionesTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (recolecciones.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          No hay recolecciones
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Las recolecciones registradas apareceran aqui
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Voucher
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ecoaliado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Cantidad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Precio/kg
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {recolecciones.map((recoleccion) => {
            const isExpanded = expandedRows.has(recoleccion.id);

            return (
              <React.Fragment key={recoleccion.id}>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* VOUCHER */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRow(recoleccion.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {recoleccion.codigo_voucher}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ECOALIADO */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {recoleccion.ecoaliado_razon_social}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {recoleccion.ecoaliado_codigo} - {recoleccion.ecoaliado_ciudad}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* FECHA */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(recoleccion.fecha_recoleccion)}
                      </span>
                    </div>
                  </td>

                  {/* CANTIDAD */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {recoleccion.cantidad_kg.toLocaleString('es-CO')} kg
                      </span>
                    </div>
                  </td>

                  {/* PRECIO/KG */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(recoleccion.precio_kg)}/kg
                    </span>
                  </td>

                  {/* TOTAL */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(recoleccion.valor_total)}
                      </span>
                    </div>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onVerVoucher && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerVoucher(recoleccion)}
                          title="Ver Voucher"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                      )}
                      {onReimprimir && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReimprimir(recoleccion)}
                          title="Reimprimir"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* FILA EXPANDIDA */}
                {isExpanded && (
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Recolector:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {recoleccion.recolector_nombre}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Programacion:</span>
                          <div className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                            {recoleccion.programacion_codigo || `#${recoleccion.programacion}`}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Registrado:</span>
                          <div className="mt-1 text-gray-900 dark:text-gray-100">
                            {new Date(recoleccion.created_at).toLocaleDateString('es-CO')}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Calculo:</span>
                          <div className="mt-1 text-gray-600 dark:text-gray-400">
                            {recoleccion.cantidad_kg.toLocaleString('es-CO')} kg x{' '}
                            {formatCurrency(recoleccion.precio_kg)} ={' '}
                            <span className="font-bold text-green-600">
                              {formatCurrency(recoleccion.valor_total)}
                            </span>
                          </div>
                        </div>
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
