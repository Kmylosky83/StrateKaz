/**
 * Sección Resumen de Riesgos y Oportunidades
 * Vista general con KPIs y estadísticas desde API (motor_riesgos)
 */
import { useMemo } from 'react';
import { Card, Spinner, EmptyState } from '@/components/common';
import { StatsGrid, type StatItem } from '@/components/layout';
import { AlertTriangle, Shield, Target, XCircle, Activity } from 'lucide-react';
import { useRiesgosResumen, useRiesgosCriticos } from '../../hooks/useRiesgosOportunidades';

interface ResumenRiesgosSectionProps {
  triggerNewForm?: number;
}

const ESTADO_LABELS: Record<string, string> = {
  identificado: 'Identificado',
  en_tratamiento: 'En Tratamiento',
  controlado: 'Controlado',
  materializado: 'Materializado',
  cerrado: 'Cerrado',
};

export function ResumenRiesgosSection({ _triggerNewForm }: ResumenRiesgosSectionProps) {
  const { data: resumen, isLoading: resumenLoading } = useRiesgosResumen();
  const { data: criticos, isLoading: criticosLoading } = useRiesgosCriticos();

  const isLoading = resumenLoading || criticosLoading;

  const stats: StatItem[] = useMemo(() => {
    if (!resumen) return [];
    return [
      {
        label: 'Total Riesgos',
        value: resumen.total,
        icon: AlertTriangle,
        iconColor: 'text-orange-500',
        description: 'Riesgos identificados',
      },
      {
        label: 'Riesgos Críticos',
        value: resumen.criticos,
        icon: XCircle,
        iconColor: 'text-red-500',
        description: 'Requieren atención inmediata',
      },
      {
        label: 'En Tratamiento',
        value: resumen.en_tratamiento,
        icon: Shield,
        iconColor: 'text-blue-500',
        description: 'Con planes activos',
      },
      {
        label: 'Efectividad',
        value:
          resumen.total > 0
            ? `${Math.round(((resumen.total - resumen.criticos) / resumen.total) * 100)}%`
            : '0%',
        icon: Target,
        iconColor: 'text-primary-500',
        description: 'Riesgos bajo control',
      },
    ];
  }, [resumen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!resumen) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-12 h-12" />}
        title="Sin datos de riesgos"
        description="No se encontraron datos de riesgos. Verifique que el módulo de Gestión de Riesgos esté configurado."
      />
    );
  }

  return (
    <div className="space-y-6">
      <StatsGrid stats={stats} columns={4} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribución por Estado */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Distribución por Estado
          </h3>
          <div className="space-y-3">
            {resumen.por_estado.length > 0 ? (
              resumen.por_estado.map((item) => {
                const porcentaje = resumen.total > 0 ? (item.cantidad / resumen.total) * 100 : 0;
                return (
                  <div key={item.estado} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[120px]">
                      {ESTADO_LABELS[item.estado] || item.estado}
                    </span>
                    <div className="flex items-center gap-2 flex-1 ml-4">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-2 bg-primary-500 rounded-full transition-all"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">
                        {item.cantidad}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Sin riesgos registrados</p>
            )}
          </div>
        </Card>

        {/* Distribución por Tipo */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-500" />
            Distribución por Tipo
          </h3>
          <div className="space-y-3">
            {resumen.por_tipo.length > 0 ? (
              resumen.por_tipo.map((item) => {
                const porcentaje = resumen.total > 0 ? (item.cantidad / resumen.total) * 100 : 0;
                return (
                  <div key={item.tipo} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300 capitalize min-w-[120px]">
                      {item.tipo.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2 flex-1 ml-4">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full transition-all"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">
                        {item.cantidad}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Sin datos de tipos</p>
            )}
          </div>
        </Card>
      </div>

      {/* Riesgos Críticos */}
      {criticos && criticos.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Riesgos Críticos ({criticos.length})
            </h3>
            <div className="space-y-3">
              {criticos.slice(0, 5).map((riesgo) => (
                <div
                  key={riesgo.id}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">{riesgo.codigo}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {riesgo.nombre}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {riesgo.tipo.replace(/_/g, ' ')} | Nivel residual: {riesgo.nivel_residual}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">
                    P:{riesgo.probabilidad_residual} × I:{riesgo.impacto_residual}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ResumenRiesgosSection;
