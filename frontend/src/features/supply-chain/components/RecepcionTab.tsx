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
  Edit,
  Eye,
  FileText,
  Package,
  Plus,
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

import { useDeleteVoucher, useVouchers } from '../hooks/useRecepcion';
import type { EstadoVoucher, VoucherRecepcionList } from '../types/recepcion.types';

// ==================== UTILITIES ====================

const ESTADO_VARIANT: Record<EstadoVoucher, 'success' | 'primary' | 'warning' | 'danger' | 'gray'> =
  {
    PENDIENTE_QC: 'warning',
    APROBADO: 'primary',
    RECHAZADO: 'danger',
    LIQUIDADO: 'success',
  };

const MODALIDAD_ICON: Record<string, React.ReactNode> = {
  DIRECTO: <Package className="w-4 h-4" />,
  TRANSPORTE_INTERNO: <Truck className="w-4 h-4" />,
  RECOLECCION: <Truck className="w-4 h-4" />,
};

const formatKg = (kg: string | number) => {
  const n = typeof kg === 'string' ? parseFloat(kg) : kg;
  return Number.isFinite(n)
    ? `${n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`
    : '-';
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

// ==================== COMPONENT ====================

export default function RecepcionTab() {
  const { canDo } = usePermissions();
  // TODO(S3.1): agregar Sections.RECEPCION_MP_SC en constants/permissions.ts + seed
  // backend. Por ahora se reusa ORDENES_COMPRA como permiso transversal.
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.ORDENES_COMPRA, 'create');
  const canDelete = canDo(Modules.SUPPLY_CHAIN, Sections.ORDENES_COMPRA, 'delete');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<EstadoVoucher | ''>('');

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
    const pesoTotal = vouchers.reduce((acc, v) => acc + parseFloat(v.peso_neto_kg || '0'), 0);
    return { total, pendientes, aprobados, pesoTotal };
  }, [vouchers]);

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
      <KpiCardGrid cols={4}>
        <KpiCard
          title="Total Vouchers"
          value={kpiData.total}
          icon={<FileText className="w-5 h-5" />}
        />
        <KpiCard
          title="Pendientes QC"
          value={kpiData.pendientes}
          icon={<Scale className="w-5 h-5" />}
          variant="warning"
        />
        <KpiCard
          title="Aprobados"
          value={kpiData.aprobados}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="success"
        />
        <KpiCard
          title="Peso Total Recibido"
          value={formatKg(kpiData.pesoTotal)}
          icon={<Package className="w-5 h-5" />}
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
          <option value="PENDIENTE_QC">Pendiente QC</option>
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
                onClick: () => {
                  // TODO(S3.1): implementar VoucherFormModal completo con RHF + Zod
                  // eslint-disable-next-line no-alert
                  alert(
                    'Formulario de creación pendiente — se implementa en siguiente iteración con RHF/Zod.'
                  );
                },
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
                  onClick: () => {
                    // eslint-disable-next-line no-alert
                    alert('Formulario pendiente.');
                  },
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
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Modalidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Peso Neto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Valor
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
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      #{v.id}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {v.fecha_viaje
                        ? format(new Date(v.fecha_viaje), 'dd MMM yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {v.proveedor_nombre || `#${v.proveedor}`}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {v.producto_nombre || `#${v.producto}`}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        {MODALIDAD_ICON[v.modalidad_entrega]}
                        <span>{v.modalidad_entrega_display || v.modalidad_entrega}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
                      {formatKg(v.peso_neto_kg)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                      {formatCOP(v.valor_total_estimado)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={ESTADO_VARIANT[v.estado] || 'gray'} size="sm">
                        {v.estado_display || v.estado}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
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
    </div>
  );
}
