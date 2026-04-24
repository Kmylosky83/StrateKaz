/**
 * LiquidacionAjustesModal — H-SC-12
 *
 * Modal editable (solo estado BORRADOR) que permite ajustar
 * `ajuste_calidad_pct` por línea. Los totales se recalculan en vivo
 * sin golpear el backend; al guardar se hace un PATCH por cada línea
 * modificada.
 *
 * UX:
 *   - Producto + monto base read-only
 *   - Input % editable (-100 a 100)
 *   - Monto ajuste y monto final calculados en vivo
 *   - Total general se recalcula en el pie
 *   - Se marcan líneas dirty para solo patchear las que cambiaron
 */
import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Save } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { Input } from '@/components/forms/Input';
import { BaseModal } from '@/components/modals/BaseModal';

import { useAjustarLinea, useLiquidacion } from '../hooks/useLiquidaciones';
import type { LiquidacionLinea } from '../types/liquidaciones.types';

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

const MIN_PCT = -100;
const MAX_PCT = 100;

interface AjusteDraft {
  lineaId: number;
  ajuste_calidad_pct: string;
  original_pct: string;
  monto_base: number;
}

interface LiquidacionAjustesModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquidacionId: number | null;
}

export default function LiquidacionAjustesModal({
  isOpen,
  onClose,
  liquidacionId,
}: LiquidacionAjustesModalProps) {
  const { data: liquidacion, isLoading } = useLiquidacion(liquidacionId);
  const ajustarMut = useAjustarLinea();

  const [drafts, setDrafts] = useState<Record<number, AjusteDraft>>({});
  const [submitting, setSubmitting] = useState(false);

  // Hidratar drafts cuando cambia la liquidación
  useEffect(() => {
    if (!liquidacion) return;
    const next: Record<number, AjusteDraft> = {};
    for (const linea of liquidacion.lineas_liquidacion ?? []) {
      const pct = String(toNumber(linea.ajuste_calidad_pct));
      next[linea.id] = {
        lineaId: linea.id,
        ajuste_calidad_pct: pct,
        original_pct: pct,
        monto_base: toNumber(linea.monto_base),
      };
    }
    setDrafts(next);
  }, [liquidacion]);

  const updateDraft = (lineaId: number, raw: string) => {
    setDrafts((prev) => ({
      ...prev,
      [lineaId]: { ...prev[lineaId], ajuste_calidad_pct: raw },
    }));
  };

  const computed = useMemo(() => {
    if (!liquidacion)
      return {
        subtotal: 0,
        ajuste: 0,
        total: 0,
        lineas: [] as Array<LiquidacionLinea & { _calcAjuste: number; _calcFinal: number }>,
      };
    let subtotal = 0;
    let ajuste = 0;
    const lineas = (liquidacion.lineas_liquidacion ?? []).map((linea) => {
      const base = toNumber(linea.monto_base);
      const draft = drafts[linea.id];
      const pctRaw = draft?.ajuste_calidad_pct ?? String(toNumber(linea.ajuste_calidad_pct));
      const pct = toNumber(pctRaw);
      // Ajuste negativo (descuenta) cuando pct > 0? Convención: pct positivo = castigo al proveedor.
      // Seguimos la semántica del BE (monto_final = base - base*pct/100 si positivo).
      const ajusteMonto = (base * pct) / 100;
      const montoFinal = base - ajusteMonto;
      subtotal += base;
      ajuste += ajusteMonto;
      return {
        ...linea,
        _calcAjuste: ajusteMonto,
        _calcFinal: montoFinal,
      };
    });
    return {
      subtotal,
      ajuste,
      total: subtotal - ajuste,
      lineas,
    };
  }, [liquidacion, drafts]);

  const dirtyLineas = useMemo(
    () =>
      Object.values(drafts).filter((d) => {
        const actual = toNumber(d.ajuste_calidad_pct);
        const orig = toNumber(d.original_pct);
        return actual !== orig;
      }),
    [drafts]
  );

  const hasInvalid = useMemo(
    () =>
      Object.values(drafts).some((d) => {
        const n = toNumber(d.ajuste_calidad_pct);
        return n < MIN_PCT || n > MAX_PCT || Number.isNaN(Number(d.ajuste_calidad_pct));
      }),
    [drafts]
  );

  const handleSubmit = async () => {
    if (!liquidacion || dirtyLineas.length === 0 || hasInvalid) return;
    setSubmitting(true);
    try {
      for (const d of dirtyLineas) {
        await ajustarMut.mutateAsync({
          liquidacionId: liquidacion.id,
          lineaId: d.lineaId,
          data: { ajuste_calidad_pct: toNumber(d.ajuste_calidad_pct) },
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = liquidacion?.estado !== 'BORRADOR';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={liquidacion ? `Ajustes de calidad — ${liquidacion.codigo}` : 'Ajustes de calidad'}
      subtitle={
        liquidacion
          ? `${liquidacion.voucher_proveedor_nombre ?? `Voucher #${liquidacion.voucher}`}`
          : undefined
      }
      size="3xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={disabled || dirtyLineas.length === 0 || hasInvalid || submitting}
          >
            <Save className="w-4 h-4 mr-1" />
            {submitting
              ? 'Guardando...'
              : dirtyLineas.length === 0
                ? 'Sin cambios'
                : `Guardar ${dirtyLineas.length} ajuste(s)`}
          </Button>
        </div>
      }
    >
      {isLoading || !liquidacion ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : disabled ? (
        <Card variant="bordered" padding="md">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Esta liquidación no está en estado <strong>BORRADOR</strong>. Solo se pueden editar los
            ajustes de calidad antes de aprobar.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card variant="bordered" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                      Producto
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                      Monto base
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 uppercase w-40">
                      Ajuste %
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                      Monto ajuste
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                      Monto final
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {computed.lineas.map((linea) => {
                    const draft = drafts[linea.id];
                    const rawValue = draft?.ajuste_calidad_pct ?? '0';
                    const n = toNumber(rawValue);
                    const invalid = n < MIN_PCT || n > MAX_PCT;
                    const dirty = toNumber(rawValue) !== toNumber(draft?.original_pct ?? '0');
                    return (
                      <tr key={linea.id}>
                        <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                          {linea.voucher_linea_producto_nombre ?? `Línea #${linea.voucher_linea}`}
                          <div className="text-xs text-slate-500">
                            {toNumber(linea.cantidad)} × {formatCOP(linea.precio_unitario)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                          {formatCOP(linea.monto_base)}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            min={MIN_PCT}
                            max={MAX_PCT}
                            value={rawValue}
                            onChange={(e) => updateDraft(linea.id, e.target.value)}
                            error={invalid ? 'Fuera de rango' : undefined}
                            className={dirty ? 'border-primary-400' : ''}
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                          {formatCOP(linea._calcAjuste)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatCOP(linea._calcFinal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right text-xs text-slate-500">
                      Subtotal
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700 dark:text-slate-300">
                      {formatCOP(computed.ajuste)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700 dark:text-slate-300">
                      {formatCOP(computed.subtotal)}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td
                      colSpan={4}
                      className="px-3 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Total recalculado
                    </td>
                    <td className="px-3 py-2 text-right text-base font-bold text-slate-900 dark:text-slate-100">
                      {formatCOP(computed.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ajustes entre {MIN_PCT}% y {MAX_PCT}%. Positivo = castigo al proveedor. Solo se envían
            al backend las líneas modificadas.
          </p>
        </div>
      )}
    </BaseModal>
  );
}
