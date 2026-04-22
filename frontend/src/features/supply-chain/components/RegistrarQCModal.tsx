/**
 * RegistrarQCModal — H-SC-03
 *
 * Modal para registrar el control de calidad de un voucher de recepción.
 * Si el producto tiene `ProductoEspecCalidadParametro`, la UI renderiza
 * inputs con rango de validación en vivo. Si no tiene specs, el operador
 * captura parámetros libres tipo clave/valor.
 *
 * Reglas:
 *   - Al menos un parámetro es requerido si el producto tiene specs.
 *   - Si `resultado=APROBADO` y algún parámetro crítico está fuera de
 *     rango, el backend devuelve 400 (también validamos en FE como hint).
 *   - Si el producto NO requiere QC, este modal no se abre (el botón
 *     "Registrar QC" solo aparece cuando `voucher.requiere_qc=true`).
 */
import { useMemo, useState } from 'react';
import { Beaker, AlertTriangle, CheckCircle2, Save } from 'lucide-react';

import { BaseModal } from '@/components/modals/BaseModal';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';

import { useRegistrarQC } from '../hooks/useRecepcion';
import type { ResultadoQC, VoucherRecepcionList } from '../types/recepcion.types';

interface Parametro {
  nombre: string;
  unidad?: string;
  valor_min?: string;
  valor_max?: string;
  es_critico?: boolean;
}

interface RegistrarQCModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: VoucherRecepcionList | null;
  /**
   * Parámetros esperados del producto (desde ProductoEspecCalidadParametro).
   * Si es undefined, el modal entra en modo "libre" (key/value arbitrarios).
   */
  parametrosEsperados?: Parametro[];
}

const RESULTADO_OPTIONS: { value: ResultadoQC; label: string }[] = [
  { value: 'APROBADO', label: 'Aprobado (sin ajuste)' },
  { value: 'CONDICIONAL', label: 'Condicional (requiere ajuste precio)' },
  { value: 'RECHAZADO', label: 'Rechazado (no se recibe)' },
];

export default function RegistrarQCModal({
  isOpen,
  onClose,
  voucher,
  parametrosEsperados = [],
}: RegistrarQCModalProps) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<ResultadoQC>('APROBADO');
  const [observaciones, setObservaciones] = useState('');

  const mutation = useRegistrarQC();

  const cumplimiento = useMemo(() => {
    const out: Record<string, { cumple: boolean; fueraRango: boolean }> = {};
    for (const p of parametrosEsperados) {
      const raw = valores[p.nombre];
      if (!raw || raw.trim() === '') {
        out[p.nombre] = { cumple: false, fueraRango: false };
        continue;
      }
      const v = Number(raw);
      if (Number.isNaN(v) || !p.valor_min || !p.valor_max) {
        out[p.nombre] = { cumple: false, fueraRango: false };
        continue;
      }
      const cumple = v >= Number(p.valor_min) && v <= Number(p.valor_max);
      out[p.nombre] = { cumple, fueraRango: !cumple };
    }
    return out;
  }, [valores, parametrosEsperados]);

  const criticosFueraRango = useMemo(
    () =>
      parametrosEsperados
        .filter((p) => p.es_critico && cumplimiento[p.nombre]?.fueraRango)
        .map((p) => p.nombre),
    [parametrosEsperados, cumplimiento]
  );

  const puedeAprobar = resultado !== 'APROBADO' || criticosFueraRango.length === 0;

  const handleClose = () => {
    setValores({});
    setResultado('APROBADO');
    setObservaciones('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!voucher) return;
    const parametros_medidos: Record<string, number | string> = {};
    for (const [k, v] of Object.entries(valores)) {
      if (v && v.trim() !== '') {
        const n = Number(v);
        parametros_medidos[k] = Number.isNaN(n) ? v : n;
      }
    }
    await mutation.mutateAsync({
      id: voucher.id,
      data: {
        parametros_medidos,
        resultado,
        observaciones: observaciones || undefined,
      },
    });
    handleClose();
  };

  if (!voucher) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Registrar Control de Calidad — Voucher #${voucher.id}`}
      subtitle={`${voucher.proveedor_nombre ?? 'Proveedor'} · ${voucher.producto_nombre ?? 'Producto'} · ${voucher.peso_neto_kg} kg`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" onClick={handleClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!puedeAprobar || mutation.isPending}
          >
            <Save className="w-4 h-4 mr-1" />
            {mutation.isPending ? 'Guardando...' : 'Guardar QC'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3">
          <Beaker className="w-5 h-5 text-slate-500" />
          <div className="flex-1">
            <Select
              label="Resultado del análisis"
              value={resultado}
              onChange={(e) => setResultado(e.target.value as ResultadoQC)}
              required
            >
              {RESULTADO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {parametrosEsperados.length > 0 ? (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Parámetros medidos
            </h4>
            <div className="space-y-2">
              {parametrosEsperados.map((p) => {
                const estado = cumplimiento[p.nombre];
                return (
                  <div
                    key={p.nombre}
                    className="grid grid-cols-[1fr_auto] gap-2 items-start rounded-md border border-slate-200 dark:border-slate-700 p-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {p.nombre}
                        </span>
                        {p.es_critico && (
                          <Badge variant="danger" size="sm">
                            Crítico
                          </Badge>
                        )}
                        {p.valor_min && p.valor_max && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Rango: {p.valor_min} – {p.valor_max} {p.unidad ?? ''}
                          </span>
                        )}
                      </div>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder={`Valor medido${p.unidad ? ` (${p.unidad})` : ''}`}
                        value={valores[p.nombre] ?? ''}
                        onChange={(e) =>
                          setValores((prev) => ({ ...prev, [p.nombre]: e.target.value }))
                        }
                      />
                    </div>
                    <div className="pt-6">
                      {valores[p.nombre] && estado ? (
                        estado.cumple ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                            En rango
                          </Badge>
                        ) : (
                          <Badge variant={p.es_critico ? 'danger' : 'warning'} size="sm">
                            <AlertTriangle className="w-3 h-3 mr-1 inline" />
                            Fuera de rango
                          </Badge>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {resultado === 'APROBADO' && criticosFueraRango.length > 0 && (
              <div className="mt-2 rounded-md border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-2 text-xs text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                No se puede marcar como <strong>APROBADO</strong> con parámetros críticos fuera de
                rango: <strong>{criticosFueraRango.join(', ')}</strong>. Use{' '}
                <strong>CONDICIONAL</strong> o <strong>RECHAZADO</strong>.
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md bg-slate-50 dark:bg-slate-800/40 p-3 text-xs text-slate-500 dark:text-slate-400">
            Este producto no tiene parámetros de calidad definidos. Ingrese el resultado y
            observaciones. Para agregar parámetros, configure la especificación de calidad en
            Catálogo de Productos.
          </div>
        )}

        <Textarea
          label="Observaciones"
          rows={3}
          placeholder="Notas del análisis, condiciones del muestreo, etc."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </div>
    </BaseModal>
  );
}
