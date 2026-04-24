/**
 * Tab Recepcion de MP - Supply Chain S3
 *
 * Listado de VoucherRecepcion (documento primario de ingreso de MP) con KPIs,
 * filtros básicos y acciones. Formulario de creación en modal.
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle,
  Eye,
  FileText,
  Package,
  Plus,
  Printer,
  Scale,
  Trash2,
  Truck,
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
import { useAuthStore } from '@/store/authStore';

import { voucherRecepcionApi } from '../api/recepcionApi';
import { useAprobarVoucher, useDeleteVoucher, useVouchers } from '../hooks/useRecepcion';
import type { EstadoVoucher, VoucherRecepcionList } from '../types/recepcion.types';
import { VoucherDetailModal } from './VoucherDetailModal';
import VoucherFormModal from './VoucherFormModal';

// ==================== UTILITIES ====================

const ESTADO_VARIANT: Record<EstadoVoucher, 'success' | 'primary' | 'warning' | 'danger' | 'gray'> =
  {
    PENDIENTE_QC: 'warning',
    APROBADO: 'primary',
    RECHAZADO: 'danger',
    LIQUIDADO: 'success',
  };

/**
 * Labels concisos del estado para tabla (el display del backend queda
 * "Pendiente de control de calidad" que es verboso y redundante con la
 * columna QC. Resumimos a una palabra).
 */
const ESTADO_LABEL: Record<EstadoVoucher, string> = {
  PENDIENTE_QC: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  LIQUIDADO: 'Liquidado',
};

const MODALIDAD_ICON: Record<string, React.ReactNode> = {
  DIRECTO: <Package className="w-4 h-4" />,
  TRANSPORTE_INTERNO: <Truck className="w-4 h-4" />,
  RECOLECCION: <Truck className="w-4 h-4" />,
};

const formatKg = (kg: string | number) => {
  const n = typeof kg === 'string' ? parseFloat(kg) : kg;
  return Number.isFinite(n)
    ? `${n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
    : '-';
};

/**
 * Parse de fecha ISO date (YYYY-MM-DD) como fecha local.
 * Evita el bug de timezone: new Date('2026-04-24') se interpreta como UTC
 * midnight y en zonas UTC-N muestra el día anterior.
 */
const parseLocalDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

// ==================== COMPONENT ====================

export default function RecepcionTab() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.RECEPCION_MP_SC, 'create');
  const canDelete = canDo(Modules.SUPPLY_CHAIN, Sections.RECEPCION_MP_SC, 'delete');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<EstadoVoucher | ''>('');
  const [detailVoucher, setDetailVoucher] = useState<VoucherRecepcionList | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const aprobarMut = useAprobarVoucher();
  const currentUserId = useAuthStore((s) => s.user?.id ?? 0);

  const queryParams = useMemo(
    () => (estadoFilter ? { estado: estadoFilter } : undefined),
    [estadoFilter]
  );

  const { data, isLoading } = useVouchers(queryParams);
  const deleteVoucher = useDeleteVoucher();

  const vouchers: VoucherRecepcionList[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data.results ?? []);
  }, [data]);

  // KPIs
  const kpiData = useMemo(() => {
    const total = vouchers.length;
    const pendientes = vouchers.filter((v) => v.estado === 'PENDIENTE_QC').length;
    const aprobados = vouchers.filter((v) => v.estado === 'APROBADO').length;
    const pesoTotal = vouchers.reduce((acc, v) => acc + parseFloat(v.peso_neto_total || '0'), 0);
    return { total, pendientes, aprobados, pesoTotal };
  }, [vouchers]);

  const handlePrint = async (id: number) => {
    try {
      const response = await voucherRecepcionApi.getPrint58mm(id);
      const html = response.data as unknown as string;
      const win = window.open('', '_blank', 'width=420,height=650,scrollbars=yes');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
      }
    } catch {
      // silencioso: el usuario verá que no pasó nada
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVoucher.mutateAsync(deleteId);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Vouchers"
          value={kpiData.total}
          icon={<FileText className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Pendientes"
          value={kpiData.pendientes}
          icon={<Scale className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Aprobados"
          value={kpiData.aprobados}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Peso Total Recibido"
          value={formatKg(kpiData.pesoTotal)}
          icon={<Package className="w-5 h-5" />}
          color="info"
        />
      </KpiCardGrid>

      {/* Filtro + Toolbar */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</label>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value as EstadoVoucher | '')}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos</option>
          <option value="PENDIENTE_QC">Pendiente</option>
          <option value="APROBADO">Aprobado</option>
          <option value="RECHAZADO">Rechazado</option>
          <option value="LIQUIDADO">Liquidado</option>
        </select>
      </div>

      <SectionToolbar
        title="Vouchers de Recepción"
        count={vouchers.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Voucher',
                onClick: () => setCreateModalOpen(true),
              }
            : undefined
        }
      />

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : vouchers.length === 0 ? (
        <EmptyState
          icon={<Scale className="w-16 h-16" />}
          title="No hay vouchers registrados"
          description="Los vouchers de recepción se generan al pesar materia prima en báscula."
          action={
            canCreate
              ? {
                  label: 'Nuevo Voucher',
                  onClick: () => setCreateModalOpen(true),
                  icon: <Plus className="w-4 h-4" />,
                }
              : undefined
          }
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
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Producto(s)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Modalidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Peso Neto Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    QC
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      #{v.id}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {v.fecha_viaje
                        ? format(parseLocalDate(v.fecha_viaje), 'dd MMM yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {v.proveedor_nombre || `#${v.proveedor}`}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {v.lineas && v.lineas.length > 0
                        ? v.lineas.length === 1
                          ? v.lineas[0].producto_nombre
                          : `${v.lineas.length} productos`
                        : `${v.lineas_count ?? 0} producto(s)`}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        {MODALIDAD_ICON[v.modalidad_entrega]}
                        <span>{v.modalidad_entrega_display || v.modalidad_entrega}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
                      {formatKg(v.peso_neto_total)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={ESTADO_VARIANT[v.estado] || 'gray'} size="sm">
                        {ESTADO_LABEL[v.estado] ?? v.estado}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {v.requiere_qc ? (
                        v.tiene_qc ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {(v.lineas ?? [])
                              .flatMap((l) => l.measurements ?? [])
                              .map((m) => (
                                <span
                                  key={m.id}
                                  className="text-xs"
                                  style={{ color: m.classified_range_color ?? undefined }}
                                  title={m.parameter_name ?? undefined}
                                >
                                  <span className="font-medium">
                                    {Number(m.measured_value).toFixed(1)}
                                    {m.parameter_unit ?? ''}
                                  </span>
                                  {m.classified_range_name && (
                                    <span className="opacity-75"> · {m.classified_range_name}</span>
                                  )}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            Pendiente
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Ver detalle"
                          onClick={() => setDetailVoucher(v)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {/* H-SC-11: el QC se toma por linea en el flujo de creacion
                            del voucher (QcLineaSection en VoucherFormModal). No hay
                            boton de "Registrar QC" post-creacion — el voucher que
                            requiere QC y no lo tiene, simplemente no puede aprobarse. */}
                        {/* H-SC-03: aprobar voucher */}
                        {v.estado === 'PENDIENTE_QC' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={
                              v.requiere_qc && !v.tiene_qc
                                ? 'Requiere registrar QC antes de aprobar'
                                : 'Aprobar voucher'
                            }
                            disabled={(v.requiere_qc && !v.tiene_qc) || aprobarMut.isPending}
                            onClick={() => aprobarMut.mutate(v.id)}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {(v.estado === 'APROBADO' || v.estado === 'LIQUIDADO') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Imprimir voucher (58mm)"
                            onClick={() => handlePrint(v.id)}
                          >
                            <Printer className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        {/* Botón "Editar" oculto: el voucher tras creación
                            sigue flujo QC → Aprobar → Imprimir. No se edita.
                            Para cambios se anula y se recrea. */}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Eliminar"
                            onClick={() => setDeleteId(v.id)}
                          >
                            <Trash2 className="w-4 h-4 text-danger-600" />
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

      {/* Confirmar eliminación */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Eliminar Voucher"
        message="¿Está seguro de eliminar este voucher? Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteId(null)}
      />

      {/* H-SC-13: Ver detalle de voucher */}
      <VoucherDetailModal
        isOpen={!!detailVoucher}
        voucher={detailVoucher}
        onClose={() => setDetailVoucher(null)}
      />

      {/* H-SC-03 F8: Crear voucher */}
      <VoucherFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        currentUserId={currentUserId}
      />
    </div>
  );
}
