/**
 * PagosTab - Registro de pagos de nómina
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { Plus, Trash2, Banknote } from 'lucide-react';
import { usePagosNomina, useDeletePagoNomina } from '../../hooks/useNomina';
import type { PagoNomina } from '../../types';
import { PagoFormModal } from './PagoFormModal';

const formatCurrency = (value: number | undefined) => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

const getMetodoPagoColor = (metodo: string) => {
  switch (metodo) {
    case 'transferencia':
      return 'info';
    case 'cheque':
      return 'warning';
    case 'efectivo':
      return 'success';
    default:
      return 'gray';
  }
};

export const PagosTab = () => {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PagoNomina | null>(null);

  const { data: pagos, isLoading } = usePagosNomina();
  const deleteMutation = useDeletePagoNomina();

  const filtered = useMemo(() => {
    if (!pagos) return [];
    return pagos.filter((pago) => {
      if (fechaDesde && pago.fecha_pago < fechaDesde) return false;
      if (fechaHasta && pago.fecha_pago > fechaHasta) return false;
      return true;
    });
  }, [pagos, fechaDesde, fechaHasta]);

  const handleCreate = () => {
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando pagos...</span>
        </div>
      </Card>
    );
  }

  if (!pagos || pagos.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          icon={<Banknote className="h-12 w-12 text-gray-400" />}
          title="No hay pagos registrados"
          description="Registra los pagos de nómina realizados."
          action={
            <Button onClick={handleCreate} className="mt-4">
              <Plus size={16} className="mr-2" />
              Registrar Pago
            </Button>
          }
        />
        <PagoFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Pagos de Nómina" description="Registro de pagos realizados">
        <Button onClick={handleCreate}>
          <Plus size={16} className="mr-2" />
          Registrar Pago
        </Button>
      </SectionHeader>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha Desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
          <Input
            label="Fecha Hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Pago
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((pago) => (
                <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {pago.liquidacion_colaborador}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {pago.liquidacion_periodo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(pago.fecha_pago).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={getMetodoPagoColor(pago.metodo_pago)}>
                      {pago.metodo_pago_display || pago.metodo_pago}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(pago.valor_pagado)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {pago.referencia_pago || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Button variant="outline" size="sm" onClick={() => setDeleteTarget(pago)}>
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No se encontraron pagos con los filtros aplicados.
            </div>
          )}
        </div>
      </Card>

      <PagoFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar Pago"
        message="¿Está seguro de eliminar este registro de pago? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
