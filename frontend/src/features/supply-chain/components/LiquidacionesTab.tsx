/**
 * Tab Liquidaciones — Supply Chain (H-SC-12)
 *
 * Refactor: liquidación ahora es "header + líneas" con mini-tesorería.
 * Listado con KPIs, filtro por estado y acciones contextuales:
 *   BORRADOR   → Ver, Aprobar, Editar ajustes, Anular
 *   APROBADA   → Ver, Registrar pago, Anular
 *   PAGADA     → Ver
 *   ANULADA    → Ver
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Ban,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Edit,
  Eye,
  FileCheck,
  Receipt,
  Wallet,
  XCircle,
} from 'lucide-react';
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

import {
  useAnularLiquidacion,
  useAprobarLiquidacion,
  useLiquidaciones,
} from '../hooks/useLiquidaciones';
import { usePagos } from '../hooks/usePagosLiquidacion';
import type { EstadoLiquidacion, Liquidacion } from '../types/liquidaciones.types';
import LiquidacionAjustesModal from './LiquidacionAjustesModal';
import LiquidacionDetailModal from './LiquidacionDetailModal';
import PagoLiquidacionFormModal from './PagoLiquidacionFormModal';

// ==================== UTILITIES ====================

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

// ==================== COMPONENT ====================

export default function LiquidacionesTab() {
  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.SUPPLY_CHAIN, Sections.LIQUIDACIONES_SC, 'edit');

  const [estadoFilter, setEstadoFilter] = useState<EstadoLiquidacion | ''>('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [ajustesId, setAjustesId] = useState<number | null>(null);
  const [pagoId, setPagoId] = useState<number | null>(null);
  const [aprobarId, setAprobarId] = useState<number | null>(null);
  const [anularId, setAnularId] = useState<number | null>(null);

  const queryParams = useMemo(
    () => (estadoFilter ? { estado: estadoFilter } : undefined),
    [estadoFilter]
  );

  const { data, isLoading } = useLiquidaciones(queryParams);
  const { data: pagosData } = usePagos();
  const aprobarMut = useAprobarLiquidacion();
  const anularMut = useAnularLiquidacion();

  const liquidaciones: Liquidacion[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results ?? []);
  }, [data]);

  // Para "pagado en el mes" usamos el listado de pagos
  const pagos = useMemo(() => {
    if (!pagosData) return [];
    return Array.isArray(pagosData) ? pagosData : (pagosData.results ?? []);
  }, [pagosData]);

  const kpiData = useMemo(() => {
    const borrador = liquidaciones.filter((l) => l.estado === 'BORRADOR').length;
    const aprobadas = liquidaciones.filter((l) => l.estado === 'APROBADA').length;
    const pagadas = liquidaciones.filter((l) => l.estado === 'PAGADA').length;
    const anuladas = liquidaciones.filter((l) => l.estado === 'ANULADA').length;

    const pendientePago = liquidaciones
      .filter((l) => l.estado === 'APROBADA')
      .reduce((acc, l) => acc + toNumber(l.total), 0);

    const hoy = new Date();
    const pagadoMes = pagos
      .filter((p) => {
        if (!p.fecha_pago) return false;
        const d = new Date(p.fecha_pago);
        return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth();
      })
      .reduce((acc, p) => acc + toNumber(p.monto_pagado), 0);

    return { borrador, aprobadas, pagadas, anuladas, pendientePago, pagadoMes };
  }, [liquidaciones, pagos]);

  const handleConfirmAprobar = async () => {
    if (!aprobarId) return;
    try {
      await aprobarMut.mutateAsync(aprobarId);
    } finally {
      setAprobarId(null);
    }
  };

  const handleConfirmAnular = async () => {
    if (!anularId) return;
    try {
      await anularMut.mutateAsync({ id: anularId });
    } finally {
      setAnularId(null);
    }
  };

  // Handlers desde el Detail modal
  const handleAprobarFromDetail = (id: number) => {
    setDetailId(null);
    setAprobarId(id);
  };
  const handleRegistrarPagoFromDetail = (id: number) => {
    setDetailId(null);
    setPagoId(id);
  };
  const handleEditarAjustesFromDetail = (id: number) => {
    setDetailId(null);
    setAjustesId(id);
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <KpiCardGrid cols={4}>
        <KpiCard
          title="Borradores"
          value={kpiData.borrador}
          icon={<FileCheck className="w-5 h-5" />}
          variant="default"
        />
        <KpiCard
          title="Aprobadas"
          value={kpiData.aprobadas}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="primary"
        />
        <KpiCard
          title="Pagadas"
          value={kpiData.pagadas}
          icon={<Receipt className="w-5 h-5" />}
          variant="success"
        />
        <KpiCard
          title="Anuladas"
          value={kpiData.anuladas}
          icon={<XCircle className="w-5 h-5" />}
          variant="danger"
        />
      </KpiCardGrid>

      <KpiCardGrid cols={2}>
        <KpiCard
          title="Pendiente de pago"
          value={formatCOP(kpiData.pendientePago)}
          icon={<DollarSign className="w-5 h-5" />}
          variant="warning"
        />
        <KpiCard
          title="Pagado este mes"
          value={formatCOP(kpiData.pagadoMes)}
          icon={<Wallet className="w-5 h-5" />}
          variant="success"
        />
      </KpiCardGrid>

      {/* Filtro */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</label>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value as EstadoLiquidacion | '')}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos</option>
          <option value="BORRADOR">Borrador</option>
          <option value="APROBADA">Aprobada</option>
          <option value="PAGADA">Pagada</option>
          <option value="ANULADA">Anulada</option>
        </select>
      </div>

      <SectionToolbar title="Liquidaciones" count={liquidaciones.length} />

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : liquidaciones.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-16 h-16" />}
          title="No hay liquidaciones"
          description="Las liquidaciones se generan a partir de vouchers aprobados."
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Voucher / Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Líneas
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
                    <td className="px-6 py-3 text-sm font-mono font-semibold text-gray-900 dark:text-white">
                      {l.codigo}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {l.voucher_proveedor_nombre ?? `Voucher #${l.voucher}`}
                      </div>
                      <div className="text-xs text-gray-500">Voucher #{l.voucher}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {l.voucher_fecha_viaje
                        ? format(new Date(l.voucher_fecha_viaje), 'dd MMM yyyy', { locale: es })
                        : l.created_at
                          ? format(new Date(l.created_at), 'dd MMM yyyy', { locale: es })
                          : '-'}
                    </td>
                    <td className="px-6 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                      {l.lineas_liquidacion?.length ?? 0}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                      {formatCOP(l.total)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={ESTADO_VARIANT[l.estado]} size="sm">
                        {l.estado_display || l.estado}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Ver detalle"
                          onClick={() => setDetailId(l.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {l.estado === 'BORRADOR' && canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Editar ajustes de calidad"
                              onClick={() => setAjustesId(l.id)}
                            >
                              <Edit className="w-4 h-4 text-amber-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Aprobar liquidación"
                              onClick={() => setAprobarId(l.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 text-success-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Anular"
                              onClick={() => setAnularId(l.id)}
                            >
                              <Ban className="w-4 h-4 text-danger-600" />
                            </Button>
                          </>
                        )}

                        {l.estado === 'APROBADA' && canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Registrar pago"
                              onClick={() => setPagoId(l.id)}
                            >
                              <CreditCard className="w-4 h-4 text-primary-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Anular"
                              onClick={() => setAnularId(l.id)}
                            >
                              <Ban className="w-4 h-4 text-danger-600" />
                            </Button>
                          </>
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

      {/* Modales */}
      <LiquidacionDetailModal
        isOpen={!!detailId}
        liquidacionId={detailId}
        onClose={() => setDetailId(null)}
        canEdit={canEdit}
        onAprobar={handleAprobarFromDetail}
        onRegistrarPago={handleRegistrarPagoFromDetail}
        onEditarAjustes={handleEditarAjustesFromDetail}
      />

      <LiquidacionAjustesModal
        isOpen={!!ajustesId}
        liquidacionId={ajustesId}
        onClose={() => setAjustesId(null)}
      />

      <PagoLiquidacionFormModal
        isOpen={!!pagoId}
        liquidacionId={pagoId}
        onClose={() => setPagoId(null)}
      />

      <ConfirmDialog
        isOpen={!!aprobarId}
        title="Aprobar Liquidación"
        message="¿Confirmar aprobación? Una vez aprobada queda lista para pago y no pueden editarse los ajustes."
        variant="info"
        confirmText="Aprobar"
        onConfirm={handleConfirmAprobar}
        onClose={() => setAprobarId(null)}
      />

      <ConfirmDialog
        isOpen={!!anularId}
        title="Anular Liquidación"
        message="¿Seguro que desea anular esta liquidación? Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Anular"
        onConfirm={handleConfirmAnular}
        onClose={() => setAnularId(null)}
      />
    </div>
  );
}
