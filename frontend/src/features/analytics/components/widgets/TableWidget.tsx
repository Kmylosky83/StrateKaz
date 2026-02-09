import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card } from '@/components/common';
import { Spinner } from '@/components/common';
import { cn } from '@/utils/cn';
import { useValoresKPIByKPI } from '../../hooks/useAnalytics';
import type { WidgetDashboard } from '../../types';

interface Props {
  widget: WidgetDashboard;
}

/**
 * TableWidget
 *
 * Compact data table showing recent KPI values.
 * Columns: Periodo, Valor, Meta, Semáforo, Variación
 * Limited to last 10 values for performance.
 */
function TableWidget({ widget }: Props) {
  const { data: valores = [], isLoading } = useValoresKPIByKPI(widget.kpi);

  if (isLoading) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <Spinner size="sm" />
      </Card>
    );
  }

  if (valores.length === 0) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
      </Card>
    );
  }

  // Sort by date descending and take last 10
  const sortedValores = [...valores]
    .sort((a, b) => new Date(b.fecha_medicion).getTime() - new Date(a.fecha_medicion).getTime())
    .slice(0, 10);

  // Semaphore badge colors
  const getSemaphoreColor = (color: string | null) => {
    if (color === 'verde') return 'bg-green-100 text-green-800';
    if (color === 'amarillo') return 'bg-yellow-100 text-yellow-800';
    if (color === 'rojo') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getSemaphoreLabel = (color: string | null) => {
    if (color === 'verde') return 'Verde';
    if (color === 'amarillo') return 'Amarillo';
    if (color === 'rojo') return 'Rojo';
    return 'N/A';
  };

  return (
    <Card className="p-4 h-full overflow-hidden flex flex-col">
      <h3 className="text-sm font-medium mb-3">{widget.titulo || widget.kpi_nombre}</h3>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-medium text-gray-600">Periodo</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">Valor</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">Meta</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Estado</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">Variación</th>
            </tr>
          </thead>
          <tbody>
            {sortedValores.map((valor, index) => {
              const variacion = valor.variacion_porcentaje || 0;
              const VariacionIcon = variacion > 0 ? ArrowUp : variacion < 0 ? ArrowDown : Minus;
              const variacionColor =
                variacion > 0 ? 'text-green-600' : variacion < 0 ? 'text-red-600' : 'text-gray-600';

              return (
                <tr
                  key={valor.id || index}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2 px-2 text-gray-700">
                    {new Date(valor.fecha_medicion).toLocaleDateString('es-CO', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-2 px-2 text-right font-medium text-gray-900">
                    {(valor.valor_numerico || 0).toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-600">
                    {valor.meta_aplicable ? (valor.meta_aplicable).toFixed(2) : '-'}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium',
                        getSemaphoreColor(valor.color_semaforo)
                      )}
                    >
                      {getSemaphoreLabel(valor.color_semaforo)}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <div className={cn('flex items-center justify-end gap-1', variacionColor)}>
                      <VariacionIcon className="h-3 w-3" />
                      <span className="font-medium">{Math.abs(variacion).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
        Mostrando {sortedValores.length} de {valores.length} registros
      </div>
    </Card>
  );
}

export { TableWidget };
export type { Props as TableWidgetProps };
