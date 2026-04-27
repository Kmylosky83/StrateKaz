/**
 * VoucherDetailModal — vista de detalle read-only de un voucher de recepción.
 *
 * Muestra:
 *   - Header con código, estado, fechas
 *   - Proveedor + almacén destino + operador
 *   - Modalidad de entrega + ruta (si aplica)
 *   - Tabla de líneas MP con pesos
 *   - Mediciones QC por línea (si existen)
 *   - Observaciones
 *
 * Se abre desde el icono "ojo" en RecepcionTab. Solo lectura.
 */
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Link2, Printer, Scale, Package, FlaskConical, Truck } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge, Card } from '@/components/common';
import apiClient from '@/api/axios-config';
import { voucherRecepcionApi } from '../api/recepcionApi';
import { useVouchersRecoleccion } from '../hooks/useVoucherRecoleccion';
import type { VoucherRecepcionList } from '../types/recepcion.types';

/** Parse fecha ISO (YYYY-MM-DD) como local — evita offset por timezone. */
const parseLocalDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

interface VoucherDetailModalProps {
  voucher: VoucherRecepcionList | null;
  isOpen: boolean;
  onClose: () => void;
}

const ESTADO_BADGE: Record<
  string,
  { label: string; variant: 'warning' | 'success' | 'danger' | 'info' }
> = {
  PENDIENTE_QC: { label: 'Pendiente QC', variant: 'warning' },
  APROBADO: { label: 'Aprobado', variant: 'success' },
  RECHAZADO: { label: 'Rechazado', variant: 'danger' },
  LIQUIDADO: { label: 'Liquidado', variant: 'info' },
};

export const VoucherDetailModal = ({ voucher, isOpen, onClose }: VoucherDetailModalProps) => {
  const qc = useQueryClient();
  const lineas = useMemo(() => voucher?.lineas ?? [], [voucher]);
  const pesoTotal = useMemo(
    () => lineas.reduce((acc, l) => acc + Number(l.peso_neto_kg ?? 0), 0),
    [lineas]
  );

  const [isPrinting, setIsPrinting] = useState(false);

  // ── H-SC-RUTA-02 (refactor 2): M2M con N vouchers de recolección ────
  const [linking, setLinking] = useState(false);

  const { data: vouchersRecoleccion = [] } = useVouchersRecoleccion();
  const recoleccionesDisponibles = useMemo(
    () =>
      vouchersRecoleccion.filter((v) =>
        voucher?.ruta_recoleccion ? v.ruta === voucher.ruta_recoleccion : true
      ),
    [vouchersRecoleccion, voucher]
  );

  const linkedInfo = useMemo(
    () => voucher?.vouchers_recoleccion_info ?? [],
    [voucher?.vouchers_recoleccion_info]
  );
  const linkedIds = useMemo(() => new Set(linkedInfo.map((v) => v.id)), [linkedInfo]);

  const handleToggle = async (recId: number) => {
    if (!voucher) return;
    const newIds = linkedIds.has(recId)
      ? Array.from(linkedIds).filter((id) => id !== recId)
      : [...Array.from(linkedIds), recId];
    setLinking(true);
    try {
      await voucherRecepcionApi.asociarRecolecciones(voucher.id, newIds);
      toast.success(linkedIds.has(recId) ? 'Voucher desasociado.' : 'Voucher asociado.');
      qc.invalidateQueries();
    } catch {
      toast.error('No se pudo actualizar el vínculo.');
    } finally {
      setLinking(false);
    }
  };

  const totalKgRecolectados = useMemo(
    () => linkedInfo.reduce((acc, v) => acc + Number(v.cantidad ?? 0), 0),
    [linkedInfo]
  );

  if (!voucher) return null;

  // Descarga el HTML del voucher con JWT (apiClient) y lo abre en un popup
  // imprimible. No se puede usar window.open(url) directo porque el backend
  // exige Bearer token y window.open no adjunta headers (H-SC-E2E-04).
  // 2026-04-26: cambiado de 58mm a 80mm (voucher de RECEPCIÓN en planta).
  const handlePrint80mm = async () => {
    setIsPrinting(true);
    try {
      const { data } = await apiClient.get<string>(
        `/supply-chain/recepcion/vouchers/${voucher.id}/print-80mm/`,
        { responseType: 'text', headers: { Accept: 'text/html' } }
      );
      const blob = new Blob([data], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank', 'width=480,height=700');
      if (!win) {
        URL.revokeObjectURL(blobUrl);
        toast.error('Permite popups para imprimir el voucher');
        return;
      }
      // Liberar la URL tras un minuto (la ventana ya cargó el HTML).
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      toast.error('No se pudo generar el voucher 80mm');
    } finally {
      setIsPrinting(false);
    }
  };

  const estadoInfo = ESTADO_BADGE[voucher.estado] ?? {
    label: voucher.estado,
    variant: 'info' as const,
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>
        Cerrar
      </Button>
      <Button variant="primary" onClick={handlePrint80mm} disabled={isPrinting}>
        <Printer className="w-4 h-4 mr-2" />
        {isPrinting ? 'Generando…' : 'Imprimir 80mm'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Voucher #${String(voucher.id).padStart(4, '0')}`}
      subtitle="Detalle de recepción de materia prima"
      size="3xl"
      footer={footer}
    >
      <div className="space-y-6">
        {/* Estado + fecha */}
        <div className="flex items-center justify-between">
          <Badge variant={estadoInfo.variant} size="md">
            {estadoInfo.label}
          </Badge>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Fecha de viaje:{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {voucher.fecha_viaje
                ? format(parseLocalDate(voucher.fecha_viaje), 'dd MMM yyyy', { locale: es })
                : '—'}
            </span>
          </div>
        </div>

        {/* Bloque de información general */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div>
              <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Proveedor</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {voucher.proveedor_nombre ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                Almacén destino
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {voucher.almacen_nombre ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                <Truck className="w-3 h-3 inline mr-1" />
                Modalidad
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {voucher.modalidad_entrega_display ?? voucher.modalidad_entrega}
              </p>
            </div>
            {voucher.ruta_recoleccion_nombre && (
              <div>
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Ruta de recolección
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {voucher.ruta_recoleccion_nombre}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                Generado por
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {voucher.operador_nombre ?? '—'}
              </p>
              {voucher.operador_cargo && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {voucher.operador_cargo}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* H-SC-RUTA-02 (refactor 2): M2M con N vouchers de recolección */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Vouchers de Recolección asociados ({linkedInfo.length})
                </h4>
              </div>
              {linkedInfo.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total recolectado:{' '}
                  <strong className="font-mono">{totalKgRecolectados.toFixed(3)} kg</strong>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Marca los vouchers de recolección que se consolidaron en esta recepción. El inventario
              YA entró — los vouchers asocian para liquidar a cada productor por separado.
            </p>

            {recoleccionesDisponibles.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No hay vouchers de recolección disponibles. Crea uno en Supply Chain → Recolección
                en Ruta.
              </p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                {recoleccionesDisponibles.map((v) => {
                  const checked = linkedIds.has(v.id);
                  return (
                    <label
                      key={v.id}
                      className={`flex items-start gap-3 p-2 rounded-md cursor-pointer text-sm ${
                        checked
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggle(v.id)}
                        disabled={linking || voucher.estado === 'LIQUIDADO'}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">
                            {v.codigo}
                          </span>
                          <Badge
                            variant={v.estado === 'COMPLETADO' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {v.estado === 'BORRADOR'
                              ? 'BORRADOR — bloquea liquidación'
                              : 'COMPLETADO ✓'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {v.proveedor_nombre} · {v.producto_nombre} ·{' '}
                          <strong>{Number(v.cantidad).toFixed(3)} kg</strong> ·{' '}
                          {v.fecha_recoleccion}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Tabla de líneas */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Materias Primas recibidas ({lineas.length})
            </h4>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Producto
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Bruto (kg)
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tara (kg)
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Neto (kg)
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Mediciones QC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l) => (
                    <tr key={l.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {l.producto_nombre ?? `#${l.producto}`}
                      </td>
                      <td className="py-2 px-3 text-sm text-right tabular-nums">
                        {Number(l.peso_bruto_kg ?? 0).toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-sm text-right tabular-nums">
                        {Number(l.peso_tara_kg ?? 0).toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-sm text-right tabular-nums font-semibold">
                        {Number(l.peso_neto_kg ?? 0).toFixed(1)}
                      </td>
                      <td className="py-2 px-3">
                        {l.measurements && l.measurements.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {l.measurements.map((m) => (
                              <span
                                key={m.id}
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700"
                                style={{
                                  backgroundColor: m.classified_range_color
                                    ? `${m.classified_range_color}20`
                                    : undefined,
                                  color: m.classified_range_color ?? undefined,
                                }}
                                title={`${m.parameter_name}: ${Number(m.measured_value).toFixed(1)}${m.parameter_unit ?? ''}`}
                              >
                                <FlaskConical className="w-3 h-3" />
                                <span className="font-medium">
                                  {m.parameter_name}: {Number(m.measured_value).toFixed(1)}
                                  {m.parameter_unit ?? ''}
                                </span>
                                {m.classified_range_name && (
                                  <span className="opacity-75">· {m.classified_range_name}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                    <td
                      colSpan={3}
                      className="py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right"
                    >
                      <Scale className="w-4 h-4 inline mr-1" />
                      Peso total neto:
                    </td>
                    <td className="py-2 px-3 text-sm text-right tabular-nums font-bold text-gray-900 dark:text-gray-100">
                      {pesoTotal.toFixed(1)} kg
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>

        {/* Observaciones */}
        {voucher.observaciones && (
          <Card>
            <div className="p-4">
              <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                Observaciones del operador
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {voucher.observaciones}
              </p>
            </div>
          </Card>
        )}
      </div>
    </BaseModal>
  );
};
