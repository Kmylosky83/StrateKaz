/**
 * Modal para ver historial de valores de un KPI
 */
import { BaseModal } from '@/components/modals/BaseModal';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useValoresKPIByKPI } from '../hooks/useAnalytics';
import type { CatalogoKPI, ValorKPI } from '../types';

interface HistorialValoresModalProps {
  kpi: CatalogoKPI | null;
  isOpen: boolean;
  onClose: () => void;
}

const getSemaforoColor = (color: string) => {
  const colors: Record<string, string> = {
    verde: 'bg-green-500',
    amarillo: 'bg-yellow-500',
    rojo: 'bg-red-500',
  };
  return colors[color] || 'bg-gray-500';
};

const getSemaforoBadge = (color: string) => {
  if (color === 'verde') return 'success' as const;
  if (color === 'amarillo') return 'warning' as const;
  if (color === 'rojo') return 'danger' as const;
  return 'gray' as const;
};

export const HistorialValoresModal = ({ kpi, isOpen, onClose }: HistorialValoresModalProps) => {
  const { data: valoresData, isLoading } = useValoresKPIByKPI(kpi?.id ?? 0);
  const valores = Array.isArray(valoresData) ? valoresData : [];

  if (!kpi) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Historial - ${kpi.nombre}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{kpi.codigo}</span> - {kpi.nombre}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Unidad: {kpi.unidad_medida} | Categoría: {kpi.categoria}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Spinner size="md" />
          </div>
        ) : valores.length === 0 ? (
          <EmptyState
            icon={<History className="w-12 h-12" />}
            title="Sin registros"
            description="No hay valores registrados para este indicador"
          />
        ) : (
          <>
            {/* Mini trend visualization */}
            <Card variant="bordered" padding="md">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tendencia ({valores.length} registros)
              </p>
              <div className="flex items-end gap-1 h-16">
                {valores.slice(-12).map((v: ValorKPI, i: number) => {
                  const maxVal = Math.max(...valores.slice(-12).map((x: ValorKPI) => x.valor_numerico));
                  const height = maxVal > 0 ? (v.valor_numerico / maxVal) * 100 : 0;
                  return (
                    <div
                      key={v.id || i}
                      className={cn(
                        'flex-1 rounded-t transition-all',
                        getSemaforoColor(v.color_semaforo)
                      )}
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${v.periodo}: ${v.valor_numerico} ${kpi.unidad_medida}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">
                  {valores.slice(-12)[0]?.periodo}
                </span>
                <span className="text-[10px] text-gray-400">
                  {valores[valores.length - 1]?.periodo}
                </span>
              </div>
            </Card>

            {/* Values table */}
            <div className="overflow-y-auto max-h-[300px]">
              <table className="w-full text-sm">
                <thead className="text-left bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium text-gray-600">Periodo</th>
                    <th className="px-3 py-2 font-medium text-gray-600">Fecha</th>
                    <th className="px-3 py-2 font-medium text-gray-600 text-right">Valor</th>
                    <th className="px-3 py-2 font-medium text-gray-600">Semáforo</th>
                    <th className="px-3 py-2 font-medium text-gray-600 text-right">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {valores.map((valor: ValorKPI) => (
                    <tr key={valor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                        {valor.periodo}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {valor.fecha_medicion}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">
                        {valor.valor_numerico.toLocaleString()} {kpi.unidad_medida}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={getSemaforoBadge(valor.color_semaforo)} size="sm">
                          {valor.color_semaforo}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {valor.variacion_anterior != null ? (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-xs font-medium',
                              valor.variacion_anterior > 0 ? 'text-green-600' :
                              valor.variacion_anterior < 0 ? 'text-red-600' : 'text-gray-500'
                            )}
                          >
                            {valor.variacion_anterior > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : valor.variacion_anterior < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                            {Math.abs(valor.variacion_anterior).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
};
