/**
 * Dashboard de Vencimientos - Requisitos Legales
 *
 * Características:
 * - Alertas visuales por estado (verde=vigente, amarillo=próximo, rojo=vencido)
 * - Contador de días para vencer
 * - Resumen de requisitos por estado
 * - KPIs con colores según prioridad
 */
import { AlertTriangle, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import type { EmpresaRequisito } from '../../types/requisitosLegales';

interface VencimientosCardProps {
  requisitos: EmpresaRequisito[];
  onRequisitoClick?: (requisito: EmpresaRequisito) => void;
}

/**
 * Determina el color según días para vencer
 */
const getEstadoColor = (diasParaVencer: number | null, estado: string) => {
  if (estado === 'vencido') return 'danger';
  if (estado === 'no_aplica') return 'gray';
  if (diasParaVencer === null) return 'gray';
  if (diasParaVencer < 0) return 'danger';
  if (diasParaVencer <= 30) return 'warning';
  return 'success';
};

/**
 * Obtiene el ícono según el estado
 */
const getEstadoIcon = (color: string) => {
  switch (color) {
    case 'danger':
      return <XCircle className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'success':
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

/**
 * Formatea los días para vencer en texto legible
 */
const formatDiasVencer = (dias: number | null, estado: string): string => {
  if (estado === 'no_aplica') return 'No Aplica';
  if (dias === null) return 'Sin vencimiento';
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} días`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  return `${dias} días`;
};

export const VencimientosCard = ({ requisitos, onRequisitoClick }: VencimientosCardProps) => {
  // Calcular estadísticas
  const stats = {
    total: requisitos.length,
    vigentes: requisitos.filter((r) => r.estado === 'vigente').length,
    proximosVencer: requisitos.filter((r) => r.estado === 'proximo_vencer').length,
    vencidos: requisitos.filter((r) => r.estado === 'vencido').length,
    enTramite: requisitos.filter((r) => r.estado === 'en_tramite').length,
  };

  // Filtrar requisitos críticos (próximos a vencer o vencidos)
  const requisitosCriticos = requisitos
    .filter((r) => r.estado === 'vencido' || r.estado === 'proximo_vencer')
    .sort((a, b) => {
      const diasA = a.dias_para_vencer ?? Infinity;
      const diasB = b.dias_para_vencer ?? Infinity;
      return diasA - diasB;
    })
    .slice(0, 5); // Top 5 más urgentes

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Requisitos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card padding="sm" className="border-l-4 border-success-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vigentes</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                {stats.vigentes}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-success-500" />
          </div>
        </Card>

        <Card padding="sm" className="border-l-4 border-warning-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Próximos a Vencer</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {stats.proximosVencer}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-warning-500" />
          </div>
        </Card>

        <Card padding="sm" className="border-l-4 border-danger-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidos</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">
                {stats.vencidos}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-danger-500" />
          </div>
        </Card>
      </div>

      {/* Alertas de requisitos críticos */}
      {requisitosCriticos.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Requisitos que Requieren Atención
              </h3>
              <Badge variant="danger" size="sm">
                {requisitosCriticos.length} urgentes
              </Badge>
            </div>

            <div className="space-y-2">
              {requisitosCriticos.map((requisito) => {
                const color = getEstadoColor(requisito.dias_para_vencer, requisito.estado);
                const icon = getEstadoIcon(color);
                const diasTexto = formatDiasVencer(requisito.dias_para_vencer, requisito.estado);

                return (
                  <div
                    key={requisito.id}
                    onClick={() => onRequisitoClick?.(requisito)}
                    className={cn(
                      'p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md',
                      color === 'danger' && 'bg-danger-50 dark:bg-danger-900/20 border-danger-500',
                      color === 'warning' &&
                        'bg-warning-50 dark:bg-warning-900/20 border-warning-500',
                      color === 'success' &&
                        'bg-success-50 dark:bg-success-900/20 border-success-500'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {icon}
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {requisito.requisito_nombre}
                          </h4>
                        </div>
                        {requisito.numero_documento && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Nro: {requisito.numero_documento}
                          </p>
                        )}
                        {requisito.responsable_nombre && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Responsable: {requisito.responsable_nombre}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <Badge
                          variant={color as unknown}
                          size="sm"
                          className="whitespace-nowrap mb-1"
                        >
                          {diasTexto}
                        </Badge>
                        {requisito.fecha_vencimiento && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Vence: {new Date(requisito.fecha_vencimiento).toLocaleDateString('es-CO')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Estado general */}
      {requisitosCriticos.length === 0 && stats.total > 0 && (
        <Card className="bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-success-600 dark:text-success-400" />
            <div>
              <h3 className="text-lg font-semibold text-success-900 dark:text-success-100">
                Todos los requisitos están al día
              </h3>
              <p className="text-sm text-success-700 dark:text-success-300">
                No hay requisitos vencidos o próximos a vencer en los próximos 30 días.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
