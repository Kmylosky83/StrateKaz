/**
 * Tab de Vouchers de Recolección — Supply Chain (H-SC-RUTA-02).
 *
 * Lista + crear/editar/eliminar vouchers de recolección en ruta. Cada voucher
 * tiene N líneas (1 por parada visitada), sin precios ni firmas.
 */
import { useState } from 'react';
import { Edit, Eye, Plus, Trash2, Truck } from 'lucide-react';
import { format } from 'date-fns';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Spinner } from '@/components/common/Spinner';

import { Modules, Sections } from '@/constants/permissions';
import { usePermissions } from '@/hooks/usePermissions';

import {
  useVouchersRecoleccion,
  useDeleteVoucherRecoleccion,
} from '../hooks/useVoucherRecoleccion';
import {
  EstadoVoucherRecoleccion,
  ESTADO_VOUCHER_RECOLECCION_LABELS,
} from '../types/voucher-recoleccion.types';
import VoucherRecoleccionFormModal from './VoucherRecoleccionFormModal';

const ESTADO_BADGE: Record<EstadoVoucherRecoleccion, 'warning' | 'primary' | 'success'> = {
  BORRADOR: 'warning',
  COMPLETADO: 'primary',
  CONSOLIDADO: 'success',
};

export default function VoucherRecoleccionTab() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.VOUCHERS_RECOLECCION, 'create');
  const canUpdate = canDo(Modules.SUPPLY_CHAIN, Sections.VOUCHERS_RECOLECCION, 'update');
  const canDelete = canDo(Modules.SUPPLY_CHAIN, Sections.VOUCHERS_RECOLECCION, 'delete');

  const [openVoucherId, setOpenVoucherId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: vouchers = [], isLoading } = useVouchersRecoleccion();
  const deleteMut = useDeleteVoucherRecoleccion();

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Vouchers de Recolección"
        count={vouchers.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Voucher',
                onClick: () => setCreating(true),
              }
            : undefined
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : vouchers.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-16 h-16" />}
          title="No hay vouchers de recolección"
          description="Cree un voucher al iniciar (o terminar) cada salida de ruta para registrar los kilos por parada."
          action={
            canCreate
              ? {
                  label: 'Nuevo Voucher',
                  onClick: () => setCreating(true),
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ruta
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Líneas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total kg
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {vouchers.map((v) => {
                  const isBorrador = v.estado === EstadoVoucherRecoleccion.BORRADOR;
                  return (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-3 text-sm font-mono text-gray-900 dark:text-white">
                        {v.codigo}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{v.ruta_nombre}</div>
                        <div className="text-xs text-gray-500 font-mono">{v.ruta_codigo}</div>
                      </td>
                      <td className="px-6 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                        {(() => {
                          try {
                            return format(new Date(v.fecha_recoleccion), 'dd/MM/yyyy');
                          } catch {
                            return v.fecha_recoleccion;
                          }
                        })()}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                        {v.total_lineas}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {Number(v.total_kilos).toFixed(3)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <Badge variant={ESTADO_BADGE[v.estado]} size="sm">
                          {v.estado_display ?? ESTADO_VOUCHER_RECOLECCION_LABELS[v.estado]}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={isBorrador && canUpdate ? 'Editar' : 'Ver'}
                            onClick={() => setOpenVoucherId(v.id)}
                          >
                            {isBorrador && canUpdate ? (
                              <Edit className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          {canDelete && isBorrador && (
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {(creating || openVoucherId !== null) && (
        <VoucherRecoleccionFormModal
          voucherId={openVoucherId}
          isOpen={creating || openVoucherId !== null}
          onClose={() => {
            setCreating(false);
            setOpenVoucherId(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Eliminar Voucher"
        message="¿Está seguro de eliminar este voucher de recolección? Las líneas asociadas también se eliminarán."
        variant="danger"
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
