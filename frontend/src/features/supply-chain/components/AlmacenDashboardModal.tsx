/**
 * AlmacenDashboardModal — Vista detalle de un almacén (Fase 1 Inventario).
 *
 * Muestra StatGrid con KPIs, inventario por producto (con promedio de calidad),
 * kardex paginado y alertas activas. Consume:
 *   GET /almacenes/<id>/dashboard/
 *   GET /almacenes/<id>/kardex/
 */
import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, History, Package, TrendingUp, Warehouse } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { BaseModal } from '@/components/modals/BaseModal';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { KpiCard, KpiCardGrid } from '@/components/common/KpiCard';
import { Spinner } from '@/components/common/Spinner';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';

import { useAlmacenDashboard, useKardexAlmacen } from '../hooks/useInventario';
import type { AlmacenResumenItem } from '../types/inventario.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  almacen: AlmacenResumenItem | null;
}

export default function AlmacenDashboardModal({ isOpen, onClose, almacen }: Props) {
  const almacenId = almacen?.id ?? null;

  const { data: dashboard, isLoading: dashLoading } = useAlmacenDashboard(almacenId);

  const [filters, setFilters] = useState<{
    desde: string;
    hasta: string;
    tipo: '' | 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  }>({
    desde: '',
    hasta: '',
    tipo: '',
  });

  const kardexParams = useMemo(
    () => ({
      desde: filters.desde || undefined,
      hasta: filters.hasta || undefined,
      tipo: filters.tipo || undefined,
    }),
    [filters]
  );
  const { data: kardex, isLoading: kardexLoading } = useKardexAlmacen(almacenId, kardexParams);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={almacen ? `${almacen.codigo} — ${almacen.nombre}` : 'Almacén'}
      subtitle={almacen?.sede_nombre || undefined}
      size="2xl"
    >
      <div className="space-y-6">
        {!almacen ? null : dashLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : !dashboard ? (
          <EmptyState
            icon={<Warehouse className="w-12 h-12" />}
            title="Dashboard no disponible"
            description="El backend aún no expone este endpoint o no hay datos suficientes."
          />
        ) : (
          <>
            {/* StatGrid */}
            <KpiCardGrid columns={5}>
              <KpiCard
                label="Cantidad total"
                value={formatNumber(dashboard.cantidad_total)}
                icon={<Package className="w-5 h-5" />}
                color="primary"
              />
              <KpiCard
                label="Ocupación"
                value={
                  dashboard.ocupacion_pct !== null && dashboard.ocupacion_pct !== undefined
                    ? `${dashboard.ocupacion_pct}%`
                    : '—'
                }
                icon={<TrendingUp className="w-5 h-5" />}
                color={pickOcupacionColor(dashboard.ocupacion_pct ?? null)}
                description={
                  dashboard.capacidad_maxima
                    ? `Cap. máx ${formatNumber(dashboard.capacidad_maxima)}`
                    : undefined
                }
              />
              <KpiCard
                label="Productos"
                value={dashboard.productos_distintos}
                icon={<Warehouse className="w-5 h-5" />}
                color="info"
              />
              <KpiCard
                label="Movimientos 30d"
                value={dashboard.movimientos_30d ?? 0}
                icon={<Activity className="w-5 h-5" />}
                color="blue"
              />
              <KpiCard
                label="Alertas"
                value={dashboard.alertas_activas ?? 0}
                icon={<AlertTriangle className="w-5 h-5" />}
                color={(dashboard.alertas_activas ?? 0) > 0 ? 'danger' : 'gray'}
              />
            </KpiCardGrid>

            {/* Inventario por Producto */}
            <Card variant="bordered" padding="none">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4" /> Inventario por producto
                </h3>
              </div>
              {dashboard.inventario_por_producto.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<Package className="w-12 h-12" />}
                    title="Sin inventario"
                    description="Este almacén no tiene productos almacenados actualmente."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Calidad (promedio)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {dashboard.inventario_por_producto.map((p) => (
                        <tr
                          key={p.producto_id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        >
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {p.producto_nombre}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {p.producto_codigo}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white font-mono">
                            {formatNumber(p.cantidad_total)} {p.unidad_codigo}
                          </td>
                          <td className="px-4 py-2">
                            {p.calidad_rango_nombre ? (
                              <span
                                className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md text-xs font-medium"
                                style={{
                                  backgroundColor: `${p.calidad_rango_color ?? '#64748B'}22`,
                                  color: p.calidad_rango_color ?? '#64748B',
                                  border: `1px solid ${p.calidad_rango_color ?? '#64748B'}55`,
                                }}
                              >
                                <span
                                  className="inline-block w-2 h-2 rounded-full"
                                  style={{ backgroundColor: p.calidad_rango_color ?? '#64748B' }}
                                />
                                {p.calidad_rango_nombre}
                                {p.calidad_valor_ponderado !== null &&
                                  p.calidad_valor_ponderado !== undefined && (
                                    <span className="opacity-70">
                                      ({p.calidad_valor_ponderado})
                                    </span>
                                  )}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Alertas activas */}
            <Card variant="bordered" padding="md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Alertas activas
                </h3>
                <Badge
                  variant={(dashboard.alertas?.length ?? 0) > 0 ? 'warning' : 'gray'}
                  size="sm"
                >
                  {dashboard.alertas?.length ?? 0}
                </Badge>
              </div>
              {(dashboard.alertas?.length ?? 0) === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No hay alertas pendientes.
                </p>
              ) : (
                <ul className="space-y-2">
                  {dashboard.alertas!.map((a) => (
                    <li
                      key={a.id}
                      className="p-3 rounded-md border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {a.tipo_alerta_nombre ?? 'Alerta'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {a.inventario_producto} {a.mensaje ? `· ${a.mensaje}` : ''}
                          </div>
                        </div>
                        <Badge variant={pickPrioridadVariant(a.prioridad)} size="sm">
                          {a.prioridad ?? '—'}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Kardex */}
            <Card variant="bordered" padding="none">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4" /> Kardex
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    type="date"
                    value={filters.desde}
                    onChange={(e) => setFilters((f) => ({ ...f, desde: e.target.value }))}
                    placeholder="Desde"
                  />
                  <Input
                    type="date"
                    value={filters.hasta}
                    onChange={(e) => setFilters((f) => ({ ...f, hasta: e.target.value }))}
                    placeholder="Hasta"
                  />
                  <Select
                    value={filters.tipo}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        tipo: e.target.value as typeof f.tipo,
                      }))
                    }
                  >
                    <option value="">Todos</option>
                    <option value="ENTRADA">Entrada</option>
                    <option value="SALIDA">Salida</option>
                    <option value="AJUSTE">Ajuste</option>
                  </Select>
                </div>
              </div>

              {kardexLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : !kardex || kardex.results.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<History className="w-12 h-12" />}
                    title="Sin movimientos"
                    description="No hay movimientos para los filtros aplicados."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Fecha
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {kardex.results.map((k) => (
                        <tr key={k.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {k.fecha
                              ? format(new Date(k.fecha), 'dd/MM/yy HH:mm', { locale: es })
                              : '—'}
                          </td>
                          <td className="px-4 py-2">
                            <Badge
                              variant={
                                k.afectacion_stock === 'ENTRADA'
                                  ? 'success'
                                  : k.afectacion_stock === 'SALIDA'
                                    ? 'warning'
                                    : 'info'
                              }
                              size="sm"
                            >
                              {k.tipo_movimiento_nombre ?? k.afectacion_stock}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {k.producto_nombre ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-gray-900 dark:text-white">
                            {k.afectacion_stock === 'SALIDA' ? '-' : '+'}
                            {formatNumber(k.cantidad)} {k.unidad_codigo ?? ''}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-gray-600 dark:text-gray-300">
                            {k.saldo_despues !== undefined ? formatNumber(k.saldo_despues) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </BaseModal>
  );
}

function formatNumber(n: number | string | undefined | null): string {
  if (n === null || n === undefined || n === '') return '—';
  const num = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('es-CO', { maximumFractionDigits: 3 });
}

function pickOcupacionColor(pct: number | null): 'success' | 'warning' | 'danger' | 'gray' {
  if (pct === null) return 'gray';
  if (pct >= 90) return 'danger';
  if (pct >= 70) return 'warning';
  return 'success';
}

function pickPrioridadVariant(p?: string): 'danger' | 'warning' | 'info' | 'gray' {
  if (!p) return 'gray';
  const up = p.toUpperCase();
  if (up.includes('CRITIC') || up.includes('ALTA')) return 'danger';
  if (up.includes('MEDIA')) return 'warning';
  if (up.includes('BAJA')) return 'info';
  return 'gray';
}
