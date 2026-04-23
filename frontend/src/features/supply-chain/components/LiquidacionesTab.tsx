/**
 * Tab Liquidaciones - Supply Chain S3
 *
 * Listado de Liquidaciones (pago al proveedor por voucher). KPIs,
 * filtro por estado, acción aprobar.
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Clock, DollarSign, Eye, FileCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { KpiCard, KpiCardGrid } from '@/components/common/KpiCard';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Spinner } from '@/components/common/Spinner';

import { Modules, Sections } from '@/constants/permissions';
import { usePermissions } from '@/hooks/usePermissions';

import { useAprobarLiquidacion, useLiquidaciones } from '../hooks/useLiquidaciones';
import type { EstadoLiquidacion, Liquidacion } from '../types/liquidaciones.types';

const ESTADO_VARIANT: Record<
  EstadoLiquidacion,
  'success' | 'primary' | 'warning' | 'danger' | 'gray'
> = {
  PENDIENTE: 'warning',
  APROBADA: 'primary',
  PAGADA: 'success',
  ANULADA: 'gray',
};

const formatCOP = (value?: string | number | null) => {
  if (value == null) return '-';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n)
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(n)
    : '-';
};

const formatKg = (kg: string | number) => {
  const n = typeof kg === 'string' ? parseFloat(kg) : kg;
  return Number.isFinite(n) ? `${n.toLocaleString('es-CO')} kg` : '-';
};

export default function LiquidacionesTab() {
  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.SUPPLY_CHAIN, Sections.LIQUIDACIONES_SC, 'edit');

  const [estadoFilter, setEstadoFilter] = useState<EstadoLiquidacion | ''>('');
  const [aprobarId, setAprobarId] = useState<number | null>(null);

  const queryParams = useMemo(
    () => (estadoFilter ? { estado: estadoFilter } : undefined),
    [estadoFilter]
  );

  const { data, isLoading } = useLiquidaciones(queryParams);
  const aprobar = useAprobarLiquidacion();

  const liquidaciones: Liquidacion[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results ?? []);
  }, [data]);

  const kpiData = useMemo(() => {
    const total = liquidaciones.length;
    const pendientes = liquidaciones.filter((l) => l.estado === 'PENDIENTE').length;
    const aprobadas = liquidaciones.filter((l) => l.estado === 'APROBADA').length;
    const totalMonto = liquidaciones.reduce(
      (acc, l) => acc + parseFloat(l.total_liquidado || '0'),
      0
    );
    return { total, pendientes, aprobadas, totalMonto };
  }, [liquidaciones]);

  const handleConfirmAprobar = async () => {
    if (!aprobarId) return;
    try {
      await aprobar.mutateAsync(aprobarId);
    } finally {
      setAprobarId(null);
    }
  };

  return (
    <div className="space-y-6">
      <KpiCardGrid cols={4}>
        <KpiCard
          title="Total Liquidaciones"
          value={kpiData.total}
          icon={<FileCheck className="w-5 h-5" />}
        />
        <KpiCard
          title="Pendientes"
          value={kpiData.pendientes}
          icon={<Clock className="w-5 h-5" />}
          variant="warning"
        />
        <KpiCard
          title="Aprobadas"
          value={kpiData.aprobadas}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="success"
        />
        <KpiCard
          title="Total Acumulado"
          value={formatCOP(kpiData.totalMonto)}
          icon={<DollarSign className="w-5 h-5" />}
        />
      </KpiCardGrid>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</label>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value as EstadoLiquidacion | '')}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="APROBADA">Aprobada</option>
          <option value="PAGADA">Pagada</option>
          <option value="ANULADA">Anulada</option>
        </select>
      </div>

      <SectionToolbar title="Liquidaciones" count={liquidaciones.length} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : liquidaciones.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="w-16 h-16" />}
          title="No hay liquidaciones"
          description="Las liquidaciones se generan automáticamente a partir de vouchers aprobados."
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Voucher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Peso
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ajuste
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {liquidaciones.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      #{l.id}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      Línea #{l.linea}
                      <div className="text-xs text-gray-500">
                        {l.created_at
                          ? format(new Date(l.created_at), 'dd MMM yyyy', { locale: es })
                          : ''}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {l.voucher_proveedor || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {l.voucher_producto || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white">
                      {formatKg(l.peso_neto_kg)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                      {formatCOP(l.subtotal)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                      {parseFloat(l.ajuste_calidad_pct || '0') > 0
                        ? `-${l.ajuste_calidad_pct}%`
                        : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                      {formatCOP(l.total_liquidado)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={ESTADO_VARIANT[l.estado] || 'gray'} size="sm">
                        {l.estado_display || l.estado}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {l.estado === 'PENDIENTE' && canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Aprobar"
                            onClick={() => setAprobarId(l.id)}
                          >
                            <CheckCircle className="w-4 h-4 text-success-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={!!aprobarId}
        title="Aprobar Liquidación"
        message="¿Confirmar aprobación? Una vez aprobada queda lista para pago y no puede editarse."
        variant="info"
        confirmText="Aprobar"
        onConfirm={handleConfirmAprobar}
        onClose={() => setAprobarId(null)}
      />
    </div>
  );
}
