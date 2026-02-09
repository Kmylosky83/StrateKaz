/**
 * EquipoEvaluaciones - Estado de evaluaciones del equipo
 */

import { BarChart3, TrendingUp } from 'lucide-react';
import { Card, Badge, Skeleton, EmptyState } from '@/components/common';
import { useEvaluacionesEquipo } from '../api/miEquipoApi';

const ESTADO_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  completada: 'success',
  en_proceso: 'info',
  pendiente: 'warning',
  sin_evaluacion: 'danger',
};

export function EquipoEvaluaciones() {
  const { data: evaluaciones, isLoading } = useEvaluacionesEquipo();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (!evaluaciones || evaluaciones.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-12 h-12" />}
        title="Sin evaluaciones"
        description="No hay evaluaciones registradas para su equipo."
      />
    );
  }

  return (
    <div className="space-y-3">
      {evaluaciones.map((ev) => (
        <Card key={ev.colaborador_id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {ev.colaborador_nombre}
                </p>
                {ev.fecha_evaluacion && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Evaluado: {ev.fecha_evaluacion}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {ev.calificacion_general != null && (
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {ev.calificacion_general}
                </span>
              )}
              <Badge variant={ESTADO_COLORS[ev.estado] || 'info'} size="sm">
                {ev.estado.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
