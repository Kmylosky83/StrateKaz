/**
 * HistorialPrecioDialog — Sub-modal que muestra el log de cambios de un precio.
 *
 * Fuente: /api/supply-chain/historial-precios/?proveedor=N&producto=M
 * Backend: HistorialPrecioProveedor (append-only, audit log).
 *
 * Se abre desde PreciosProveedorModal (botón 'Ver historial' por fila).
 */
import { useQuery } from '@tanstack/react-query';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';

import axiosInstance from '@/api/axios-config';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';

import type { HistorialPrecio } from '../types/precio.types';

const formatCurrency = (value: string | number | null) => {
  if (value === null) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

interface HistorialPrecioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proveedorId: number | null;
  productoId: number | null;
  productoNombre?: string;
}

export default function HistorialPrecioDialog({
  isOpen,
  onClose,
  proveedorId,
  productoId,
  productoNombre,
}: HistorialPrecioDialogProps) {
  const { data: historial = [], isLoading } = useQuery<HistorialPrecio[]>({
    queryKey: ['sc-historial-precios', proveedorId, productoId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<HistorialPrecio[] | { results: HistorialPrecio[] }>(
        `/supply-chain/historial-precios/?proveedor=${proveedorId}&producto=${productoId}&ordering=-created_at`
      );
      return Array.isArray(data) ? data : data.results;
    },
    enabled: !!(isOpen && proveedorId && productoId),
  });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Historial de precio — ${productoNombre ?? 'Producto'}`}
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : historial.length === 0 ? (
        <EmptyState
          icon={<History className="w-5 h-5 text-gray-400" />}
          title="Sin cambios registrados"
          description="Este precio no ha tenido cambios o aún no ha sido creado."
        />
      ) : (
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                  Fecha
                </th>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                  Usuario
                </th>
                <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                  Anterior
                </th>
                <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                  Nuevo
                </th>
                <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                  Variación
                </th>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                  Motivo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {historial.map((h) => {
                const variacion = h.variacion_precio;
                const tipoLabel: Record<HistorialPrecio['tipo_cambio'], string> = {
                  INICIAL: 'Inicial',
                  AUMENTO: 'Aumento',
                  REDUCCION: 'Reducción',
                  SIN_CAMBIO: 'Sin cambio',
                };
                const tipoVariant: Record<
                  HistorialPrecio['tipo_cambio'],
                  'default' | 'success' | 'warning' | 'info'
                > = {
                  INICIAL: 'info',
                  AUMENTO: 'warning',
                  REDUCCION: 'success',
                  SIN_CAMBIO: 'default',
                };
                return (
                  <tr key={h.id}>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(h.created_at)}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {h.modificado_por_nombre || <span className="italic">(Sistema)</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                      {formatCurrency(h.precio_anterior)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(h.precio_nuevo)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={tipoVariant[h.tipo_cambio]}>
                        {h.tipo_cambio === 'AUMENTO' && (
                          <TrendingUp className="w-3 h-3 mr-1 inline" />
                        )}
                        {h.tipo_cambio === 'REDUCCION' && (
                          <TrendingDown className="w-3 h-3 mr-1 inline" />
                        )}
                        {h.tipo_cambio === 'SIN_CAMBIO' && (
                          <Minus className="w-3 h-3 mr-1 inline" />
                        )}
                        {tipoLabel[h.tipo_cambio]}
                        {variacion !== null && (
                          <span className="ml-1">
                            ({variacion > 0 ? '+' : ''}
                            {variacion.toFixed(1)}%)
                          </span>
                        )}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {h.motivo || <span className="italic">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </BaseModal>
  );
}
