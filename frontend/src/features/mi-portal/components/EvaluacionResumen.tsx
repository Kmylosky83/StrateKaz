/**
 * EvaluacionResumen - Resumen de evaluaciones de desempeno propias
 */

import { BarChart3, TrendingUp } from 'lucide-react';
import { Card, Badge, Skeleton, EmptyState } from '@/components/common';
import { useMiEvaluacion } from '../api/miPortalApi';

const ESTADO_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  completada: 'success',
  en_proceso: 'info',
  pendiente: 'warning',
  cancelada: 'danger',
};

function getCalificacionColor(calificacion: number | null): string {
  if (calificacion == null) return 'text-gray-400';
  if (calificacion >= 4) return 'text-green-600 dark:text-green-400';
  if (calificacion >= 3) return 'text-blue-600 dark:text-blue-400';
  if (calificacion >= 2) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function EvaluacionResumen() {
  const { data: evaluaciones, isLoading } = useMiEvaluacion();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-8 w-16" />
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
        description="No tiene evaluaciones de desempeno registradas."
      />
    );
  }

  return (
    <div className="space-y-4">
      {evaluaciones.map((ev) => (
        <Card key={ev.id} className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Periodo: {ev.periodo}
                </p>
                {ev.fecha_evaluacion && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Fecha: {ev.fecha_evaluacion}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {ev.calificacion_general != null && (
                <div className="text-center">
                  <p className={`text-2xl font-bold ${getCalificacionColor(ev.calificacion_general)}`}>
                    {ev.calificacion_general.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">/ 5.0</p>
                </div>
              )}
              <Badge variant={ESTADO_COLORS[ev.estado] || 'info'}>
                {ev.estado}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
