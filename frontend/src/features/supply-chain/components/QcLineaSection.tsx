/**
 * QcLineaSection — Sección expandible de Calidad por línea de Voucher.
 *
 * Renderiza, por cada ParametroCalidad activo del tenant, un input numérico
 * y calcula client-side la clasificación (RangoCalidad) según los rangos
 * cargados para ese parámetro. Las mediciones se guardan en un map controlado
 * por VoucherFormModal y se envían por bulk tras crear el voucher.
 */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FlaskConical } from 'lucide-react';

import { Input } from '@/components/forms/Input';

import type { ParametroCalidad, RangoCalidad } from '../types/calidad.types';

export interface QcLineaMap {
  /** parameter_id → measured_value (string para respetar input type="number") */
  [parameterId: number]: string;
}

interface Props {
  /** Mediciones actuales de esta línea (controlado por el padre). */
  value: QcLineaMap;
  onChange: (next: QcLineaMap) => void;
  parametros: ParametroCalidad[];
  /** Todos los rangos disponibles — se filtran por parametro.id. */
  rangos: RangoCalidad[];
  /** Etiqueta corta del producto para header. */
  label?: string;
  /** Forzar expansión inicial (p.ej. si producto.requiere_qc_recepcion). */
  defaultExpanded?: boolean;
}

export default function QcLineaSection({
  value,
  onChange,
  parametros,
  rangos,
  label,
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);

  const rangosPorParam = useMemo(() => {
    const map = new Map<number, RangoCalidad[]>();
    for (const r of rangos) {
      if (!r.is_active) continue;
      const arr = map.get(r.parameter) ?? [];
      arr.push(r);
      map.set(r.parameter, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [rangos]);

  if (parametros.length === 0) {
    return (
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
        No hay parámetros de calidad configurados para este tenant.
      </div>
    );
  }

  return (
    <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-md">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <span className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <FlaskConical className="w-4 h-4" />
          Calidad {label ? <span className="text-gray-400">· {label}</span> : null}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {Object.values(value).filter((v) => v !== '').length} / {parametros.length} medidos
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 bg-gray-50/60 dark:bg-gray-900/30">
          {parametros.map((p) => {
            const raw = value[p.id] ?? '';
            const measured = raw !== '' ? Number(raw) : null;
            const rango =
              measured !== null && !Number.isNaN(measured)
                ? classify(measured, rangosPorParam.get(p.id) ?? [])
                : null;

            return (
              <div key={p.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                <Input
                  label={`${p.name} (${p.unit})`}
                  type="number"
                  step="0.01"
                  placeholder="—"
                  value={raw}
                  onChange={(e) => onChange({ ...value, [p.id]: e.target.value })}
                />
                <div className="min-w-[120px] h-[38px] flex items-center">
                  {rango ? (
                    <span
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{
                        backgroundColor: `${rango.color_hex}22`,
                        color: rango.color_hex,
                        border: `1px solid ${rango.color_hex}55`,
                      }}
                      title={`Clasificación: ${rango.name}`}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: rango.color_hex }}
                      />
                      {rango.name}
                    </span>
                  ) : raw !== '' ? (
                    <span className="text-xs text-gray-400 italic">Fuera de rango</span>
                  ) : (
                    <span className="text-xs text-gray-400">Sin medir</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function classify(value: number, rangos: RangoCalidad[]): RangoCalidad | null {
  for (const r of rangos) {
    const min = r.min_value !== null && r.min_value !== '' ? Number(r.min_value) : -Infinity;
    const max = r.max_value !== null && r.max_value !== '' ? Number(r.max_value) : Infinity;
    if (value >= min && value <= max) return r;
  }
  return null;
}
