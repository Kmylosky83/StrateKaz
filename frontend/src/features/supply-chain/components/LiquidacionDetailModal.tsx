/**
 * LiquidacionDetailModal — H-SC-12
 *
 * Modal read-only con detalle completo de una liquidación:
 * header + líneas + pagos (si aplica). Permite lanzar acciones
 * contextuales: Aprobar (si BORRADOR), Registrar Pago (si APROBADA),
 * Imprimir (stub).
 */
import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, CreditCard, Printer, Receipt } from 'lucide-react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { BaseModal } from '@/components/modals/BaseModal';

import { useLiquidacion } from '../hooks/useLiquidaciones';
import type { EstadoLiquidacion } from '../types/liquidaciones.types';

const ESTADO_VARIANT: Record<
  EstadoLiquidacion,
  'success' | 'primary' | 'warning' | 'danger' | 'gray'
> = {
  BORRADOR: 'gray',
  APROBADA: 'primary',
  PAGADA: 'success',
  ANULADA: 'danger',
};

const toNumber = (v: number | string | undefined | null) => {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
};

const formatCOP = (value?: string | number | null) => {
  const n = toNumber(value);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
};

const formatNumber = (value?: string | number | null, decimals = 2) => {
  const n = toNumber(value);
  return n.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

const formatPct = (value?: string | number | null) => {
  const n = toNumber(value);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
};

interface LiquidacionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquidacionId: number | null;
  canEdit?: boolean;
  onAprobar?: (id: number) => void;
  onRegistrarPago?: (id: number) => void;
  onEditarAjustes?: (id: number) => void;
}

export default function LiquidacionDetailModal({
  isOpen,
  onClose,
  liquidacionId,
  canEdit = false,
  onAprobar,
  onRegistrarPago,
  onEditarAjustes,
}: LiquidacionDetailModalProps) {
  const { data: liquidacion, isLoading } = useLiquidacion(liquidacionId);

  const handlePrint = () => {
    // Stub: se conecta cuando el BE exponga endpoint de impresión
    window.print();
  };

  const totales = useMemo(() => {
    if (!liquidacion) return { subtotal: 0, ajuste: 0, total: 0 };
    return {
      subtotal: toNumber(liquidacion.subtotal),
      ajuste: toNumber(liquidacion.ajuste_calidad_total),
      total: toNumber(liquidacion.total),
    };
  }, [liquidacion]);

  const pagos = liquidacion?.pagos ?? [];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={liquidacion ? `Liquidación ${liquidacion.codigo}` : 'Liquidación'}
      subtitle={
        liquidacion
          ? `${liquidacion.voucher_proveedor_nombre ?? `Voucher #${liquidacion.voucher}`} · ${
              liquidacion.lineas_liquidacion?.length ?? 0
            } línea(s)`
          : undefined
      }
      size="3xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" onClick={handlePrint} disabled={!liquidacion}>
            <Printer className="w-4 h-4 mr-1" />
            Imprimir
          </Button>
          {liquidacion && liquidacion.estado === 'BORRADOR' && canEdit && onEditarAjustes && (
            <Button variant="secondary" onClick={() => onEditarAjustes(liquidacion.id)}>
              Editar ajustes
            </Button>
          )}
          {liquidacion && liquidacion.estado === 'BORRADOR' && canEdit && onAprobar && (
            <Button variant="primary" onClick={() => onAprobar(liquidacion.id)}>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Aprobar
            </Button>
          )}
          {liquidacion && liquidacion.estado === 'APROBADA' && canEdit && onRegistrarPago && (
            <Button variant="primary" onClick={() => onRegistrarPago(liquidacion.id)}>
              <CreditCard className="w-4 h-4 mr-1" />
              Registrar pago
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      {isLoading || !liquidacion ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <Card variant="bordered" padding="md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Código</div>
                <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {liquidacion.codigo}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Voucher</div>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  #{liquidacion.voucher}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Fecha viaje</div>
                <div className="text-slate-900 dark:text-slate-100">
                  {liquidacion.voucher_fecha_viaje
                    ? format(new Date(liquidacion.voucher_fecha_viaje), 'dd MMM yyyy', {
                        locale: es,
                      })
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Estado</div>
                <Badge variant={ESTADO_VARIANT[liquidacion.estado]} size="sm">
                  {liquidacion.estado_display || liquidacion.estado}
                </Badge>
              </div>
              <div className="col-span-2 md:col-span-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">Proveedor</div>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {liquidacion.voucher_proveedor_nombre ?? '—'}
                </div>
              </div>
              {liquidacion.fecha_aprobacion && (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Aprobada</div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {format(new Date(liquidacion.fecha_aprobacion), 'dd MMM yyyy HH:mm', {
                      locale: es,
                    })}
                  </div>
                  {liquidacion.aprobado_por_nombre && (
                    <div className="text-xs text-slate-500">
                      por {liquidacion.aprobado_por_nombre}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Líneas */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Líneas de liquidación
            </h4>
            <Card variant="bordered" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                        Producto
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                        Cantidad
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                        P. Unit.
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                        Base
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                        Ajuste %
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                        Ajuste
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {(liquidacion.lineas_liquidacion ?? []).map((linea) => (
                      <tr key={linea.id}>
                        <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                          {linea.voucher_linea_producto_nombre ?? `Línea #${linea.voucher_linea}`}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                          {formatNumber(linea.cantidad)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                          {formatCOP(linea.precio_unitario)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                          {formatCOP(linea.monto_base)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                          {formatPct(linea.ajuste_calidad_pct)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                          {formatCOP(linea.ajuste_calidad_monto)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatCOP(linea.monto_final)}
                        </td>
                      </tr>
                    ))}
                    {(liquidacion.lineas_liquidacion ?? []).length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-6 text-center text-slate-400 dark:text-slate-500"
                        >
                          Esta liquidación no tiene líneas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400"
                      >
                        Subtotal
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-700 dark:text-slate-300">
                        {formatCOP(totales.subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400"
                      >
                        Ajuste calidad
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-700 dark:text-slate-300">
                        {formatCOP(totales.ajuste)}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-200 dark:border-slate-700">
                      <td
                        colSpan={6}
                        className="px-3 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Total a pagar
                      </td>
                      <td className="px-3 py-2 text-right text-base font-bold text-slate-900 dark:text-slate-100">
                        {formatCOP(totales.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>

          {/* Pagos (si ya está PAGADA) */}
          {liquidacion.estado === 'PAGADA' && pagos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Pagos registrados
              </h4>
              <div className="space-y-2">
                {pagos.map((pago) => (
                  <Card key={pago.id} variant="bordered" padding="md">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">Fecha</div>
                        <div className="text-slate-900 dark:text-slate-100">
                          {format(new Date(pago.fecha_pago), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Método</div>
                        <div className="text-slate-900 dark:text-slate-100">
                          {pago.metodo_display || pago.metodo}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Referencia</div>
                        <div className="text-slate-700 dark:text-slate-300 font-mono text-xs">
                          {pago.referencia || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Monto</div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatCOP(pago.monto_pagado)}
                        </div>
                      </div>
                      {pago.observaciones && (
                        <div className="col-span-2 md:col-span-4 text-xs text-slate-500">
                          {pago.observaciones}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {liquidacion.observaciones && (
            <Card variant="bordered" padding="md">
              <div className="text-xs text-slate-500 mb-1">Observaciones</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {liquidacion.observaciones}
              </div>
            </Card>
          )}
        </div>
      )}
    </BaseModal>
  );
}
