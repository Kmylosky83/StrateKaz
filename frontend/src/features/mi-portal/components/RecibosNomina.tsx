/**
 * RecibosNomina - Lista de recibos de nomina propios
 */

import { DollarSign, FileText } from 'lucide-react';
import { Card, Skeleton, EmptyState, Badge } from '@/components/common';
import { useMisRecibos } from '../api/miPortalApi';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

export function RecibosNomina() {
  const { data: recibos, isLoading } = useMisRecibos();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!recibos || recibos.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-12 h-12" />}
        title="Sin recibos de nomina"
        description="Aun no tiene recibos de nomina registrados."
      />
    );
  }

  return (
    <div className="space-y-3">
      {recibos.map((recibo) => (
        <Card key={recibo.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Periodo: {recibo.periodo}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Liquidado: {recibo.fecha_liquidacion}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(recibo.neto_pagar)}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Dev: {formatCurrency(recibo.total_devengado)}</span>
                <span>-</span>
                <span>Ded: {formatCurrency(recibo.total_deducciones)}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
