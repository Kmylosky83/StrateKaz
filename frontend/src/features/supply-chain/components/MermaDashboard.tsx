/**
 * MermaDashboard — Tablero de Merma de Recolección vs Recepción (H-SC-RUTA-04).
 *
 * Consume el endpoint:
 *   GET /api/supply-chain/recepcion/vouchers/merma-resumen/
 *
 * KPIs agregados (recolectado, recibido, merma kg, merma %), tabla detalle
 * por voucher y filtros por rutas + rango de fechas.
 *
 * Reusa Design System: Card, Badge, Spinner, EmptyState, KpiCard, KpiCardGrid,
 * MultiSelectCombobox, DateRangePicker, PageHeader.
 */
import { useMemo, useState } from 'react';

import { AlertTriangle, BarChart3, Package, Scale, TrendingDown } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { KpiCard, KpiCardGrid, KpiCardSkeleton } from '@/components/common/KpiCard';
import { Spinner } from '@/components/common/Spinner';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import { MultiSelectCombobox } from '@/components/forms/MultiSelectCombobox';

import { useMermaResumen } from '../hooks/useMermaResumen';
import { useRutas } from '../hooks/useRutas';
import type { MermaResumenItem } from '../types/merma.types';

// ============================================================================
// HELPERS
// ============================================================================

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatKg(value: number): string {
  return value.toLocaleString('es-CO', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function mermaVariant(pct: number): 'success' | 'warning' | 'danger' {
  if (pct > 3) return 'danger';
  if (pct > 1) return 'warning';
  return 'success';
}

function formatFecha(iso: string): string {
  // Backend devuelve YYYY-MM-DD; mostrar igual y agregar día corto local.
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MermaDashboard() {
  const [rutaIds, setRutaIds] = useState<number[]>([]);
  const [fechaDesde, setFechaDesde] = useState<string>(daysAgoISO(30));
  const [fechaHasta, setFechaHasta] = useState<string>(todayISO());

  const { data: rutas = [], isLoading: rutasLoading } = useRutas({ is_active: true });

  const {
    data: items = [],
    isLoading,
    isFetching,
    error,
  } = useMermaResumen({ rutaIds, fechaDesde, fechaHasta });

  const kpis = useMemo(() => {
    const totalRecolectado = items.reduce((s, i) => s + Number(i.peso_recolectado || 0), 0);
    const totalRecibido = items.reduce((s, i) => s + Number(i.peso_recibido || 0), 0);
    const totalMerma = totalRecolectado - totalRecibido;
    const mermaPct = totalRecolectado > 0 ? (totalMerma / totalRecolectado) * 100 : 0;
    return {
      totalRecolectado,
      totalRecibido,
      totalMerma,
      mermaPct,
      count: items.length,
    };
  }, [items]);

  const rutaOptions = useMemo(
    () =>
      rutas.map((r) => ({
        value: r.id,
        label: `${r.codigo} — ${r.nombre}`,
      })),
    [rutas]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard de Merma"
        description="Comparación recolectado vs recibido por voucher de recepción (H-SC-RUTA-04)"
      />

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <MultiSelectCombobox
              label="Rutas"
              options={rutaOptions}
              value={rutaIds}
              onChange={(values) => setRutaIds(values.map((v) => Number(v)))}
              placeholder={rutasLoading ? 'Cargando rutas...' : 'Todas las rutas'}
              emptyMessage="No hay rutas activas"
              disabled={rutasLoading}
            />
          </div>
          <div className="lg:col-span-2">
            <DateRangePicker
              label="Rango de fechas"
              startDate={fechaDesde}
              endDate={fechaHasta}
              onStartDateChange={setFechaDesde}
              onEndDateChange={setFechaHasta}
              startLabel="Desde"
              endLabel="Hasta"
            />
          </div>
        </div>
      </Card>

      {/* Estado de carga / error */}
      {isLoading ? (
        <KpiCardSkeleton count={4} columns={4} />
      ) : error ? (
        <Card>
          <EmptyState
            icon={
              <div className="p-3 bg-danger-100 dark:bg-danger-900/30 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
              </div>
            }
            title="Error al cargar la merma"
            description="No fue posible obtener el resumen. Verifica la conexión e inténtalo de nuevo."
          />
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <KpiCardGrid columns={4}>
            <KpiCard
              label="Recolectado total"
              value={`${formatKg(kpis.totalRecolectado)} kg`}
              icon={<Package className="w-5 h-5" />}
              color="info"
            />
            <KpiCard
              label="Recibido total"
              value={`${formatKg(kpis.totalRecibido)} kg`}
              icon={<Scale className="w-5 h-5" />}
              color="success"
            />
            <KpiCard
              label="Merma total"
              value={`${formatKg(kpis.totalMerma)} kg`}
              icon={<TrendingDown className="w-5 h-5" />}
              color={mermaVariant(kpis.mermaPct)}
              description={`${kpis.mermaPct.toFixed(2)}% del recolectado`}
            />
            <KpiCard
              label="Vouchers analizados"
              value={kpis.count}
              icon={<BarChart3 className="w-5 h-5" />}
              color="primary"
            />
          </KpiCardGrid>

          {/* Tabla detalle */}
          {items.length === 0 ? (
            <Card>
              <EmptyState
                icon={
                  <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                }
                title="Sin datos"
                description="No hay vouchers de recepción con recolección asociada en el período seleccionado."
              />
            </Card>
          ) : (
            <Card padding="none">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Detalle por voucher de recepción
                </h3>
                {isFetching && <Spinner size="sm" />}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium">Ruta</th>
                      <th className="px-4 py-3 text-right font-medium">Recolectado (kg)</th>
                      <th className="px-4 py-3 text-right font-medium">Recibido (kg)</th>
                      <th className="px-4 py-3 text-right font-medium">Merma (kg)</th>
                      <th className="px-4 py-3 text-right font-medium">Merma %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item) => (
                      <MermaRow key={item.voucher_id} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface MermaRowProps {
  item: MermaResumenItem;
}

function MermaRow({ item }: MermaRowProps) {
  const recolectado = Number(item.peso_recolectado || 0);
  const recibido = Number(item.peso_recibido || 0);
  const mermaKg = Number(item.merma_kg || 0);
  const mermaPct = Number(item.merma_porcentaje || 0);

  return (
    <tr className="text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/40">
      <td className="px-4 py-3 whitespace-nowrap">{formatFecha(item.fecha_viaje)}</td>
      <td className="px-4 py-3 whitespace-nowrap">{item.ruta_codigo ?? '—'}</td>
      <td className="px-4 py-3 text-right tabular-nums">{formatKg(recolectado)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{formatKg(recibido)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{formatKg(mermaKg)}</td>
      <td className="px-4 py-3 text-right">
        <Badge variant={mermaVariant(mermaPct)} size="sm">
          {mermaPct.toFixed(2)}%
        </Badge>
      </td>
    </tr>
  );
}

export default MermaDashboard;
