/**
 * Tab Vouchers de Recolección — Supply Chain (H-SC-RUTA-02 r2).
 *
 * 1 voucher = 1 parada. Lista plana con filtros por ruta + fecha.
 * Imprimir 58mm (entregar al productor) + completar.
 */
import { useMemo, useState } from 'react';
import { Edit, Eye, Plus, Printer, Trash2, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { Spinner } from '@/components/common/Spinner';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';

import { Modules, Sections } from '@/constants/permissions';
import { usePermissions } from '@/hooks/usePermissions';

import {
  useVouchersRecoleccion,
  useDeleteVoucherRecoleccion,
} from '../hooks/useVoucherRecoleccion';
import { useRutas } from '../hooks/useRutas';
import {
  EstadoVoucherRecoleccion,
  ESTADO_VOUCHER_RECOLECCION_LABELS,
} from '../types/voucher-recoleccion.types';
import { voucherRecoleccionApi } from '../api/voucher-recoleccion';
import VoucherRecoleccionFormModal from './VoucherRecoleccionFormModal';

const ESTADO_BADGE: Record<EstadoVoucherRecoleccion, 'warning' | 'success'> = {
  BORRADOR: 'warning',
  COMPLETADO: 'success',
};

export default function VoucherRecoleccionTab() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.VOUCHERS_RECOLECCION, 'create');
  const canUpdate = canDo(Modules.SUPPLY_CHAIN, Sections.VOUCHERS_RECOLECCION, 'update');
  const canDelete = canDo(Modules.SUPPLY_CHAIN, Sections.VOUCHERS_RECOLECCION, 'delete');

  const [openVoucherId, setOpenVoucherId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filtros
  const [filterRuta, setFilterRuta] = useState<number | ''>('');
  const [filterFecha, setFilterFecha] = useState<string>('');

  const { data: rutas = [] } = useRutas();
  const filterParams = useMemo(() => {
    const p: Record<string, unknown> = {};
    if (filterRuta) p.ruta = filterRuta;
    if (filterFecha) p.fecha_recoleccion = filterFecha;
    return p as Parameters<typeof useVouchersRecoleccion>[0];
  }, [filterRuta, filterFecha]);

  const { data: vouchers = [], isLoading } = useVouchersRecoleccion(filterParams);
  const deleteMut = useDeleteVoucherRecoleccion();

  // Suma agrupada por (ruta + fecha) para mostrar el total del viaje
  const totalKilos = useMemo(
    () => vouchers.reduce((acc, v) => acc + Number(v.cantidad ?? 0), 0),
    [vouchers]
  );

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
    } finally {
      setDeleteId(null);
    }
  };

  const handlePrint58mm = async (id: number) => {
    try {
      const pdfBlob = await voucherRecoleccionApi.getPrint58mm(id);
      const blobUrl = URL.createObjectURL(pdfBlob);
      const win = window.open(blobUrl, '_blank', 'width=400,height=700');
      if (!win) {
        URL.revokeObjectURL(blobUrl);
        toast.error('Permite popups para imprimir el voucher');
        return;
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      toast.error('No se pudo generar el voucher 58mm');
    }
  };

  return (
    <div className="space-y-4">
      <SectionToolbar
        title="Vouchers de Recolección"
        count={vouchers.length}
        primaryAction={
          canCreate ? { label: 'Nueva parada', onClick: () => setCreating(true) } : undefined
        }
      />

      {/* Filtros simples por ruta + fecha */}
      <Card variant="bordered" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <Select
              label="Filtrar por ruta"
              value={filterRuta}
              onChange={(e) => setFilterRuta(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: 'Todas las rutas' },
                ...rutas.map((r) => ({
                  value: r.id,
                  label: `${r.codigo} — ${r.nombre}`,
                })),
              ]}
            />
          </div>
          <div className="md:col-span-4">
            <Input
              label="Filtrar por fecha"
              type="date"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total filtrado</p>
            <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">
              {totalKilos.toFixed(3)} kg
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : vouchers.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-16 h-16" />}
          title="No hay vouchers de recolección"
          description="Cree un voucher por cada parada visitada (en ruta o post-entrega)."
          action={
            canCreate
              ? {
                  label: 'Nueva parada',
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ruta
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Kilos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {vouchers.map((v) => {
                  const isBorrador = v.estado === EstadoVoucherRecoleccion.BORRADOR;
                  return (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-white">
                        {v.codigo}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{v.ruta_nombre}</div>
                        <div className="text-xs text-gray-500 font-mono">{v.ruta_codigo}</div>
                      </td>
                      <td className="px-4 py-2 text-center text-sm text-gray-700 dark:text-gray-300">
                        {(() => {
                          try {
                            return format(new Date(v.fecha_recoleccion), 'dd/MM/yyyy');
                          } catch {
                            return v.fecha_recoleccion;
                          }
                        })()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{v.proveedor_nombre}</div>
                        <div className="text-xs text-gray-500 font-mono">{v.proveedor_codigo}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {v.producto_nombre}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {Number(v.cantidad).toFixed(3)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Badge variant={ESTADO_BADGE[v.estado]} size="sm">
                          {v.estado_display ?? ESTADO_VOUCHER_RECOLECCION_LABELS[v.estado]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Imprimir 58mm"
                            onClick={() => handlePrint58mm(v.id)}
                          >
                            <Printer className="w-4 h-4 text-blue-600" />
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
          defaultRutaId={typeof filterRuta === 'number' ? filterRuta : undefined}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Eliminar voucher de recolección"
        message="¿Está seguro? Este voucher se eliminará. Solo se pueden eliminar vouchers en BORRADOR."
        variant="danger"
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
