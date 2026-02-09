/**
 * CapacitacionesList - Historial de capacitaciones propias
 */

import { GraduationCap, Award } from 'lucide-react';
import { Card, Badge, Skeleton, EmptyState } from '@/components/common';
import { useMisCapacitaciones } from '../api/miPortalApi';

const ESTADO_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  completada: 'success',
  en_curso: 'info',
  pendiente: 'warning',
  cancelada: 'danger',
};

export function CapacitacionesList() {
  const { data: capacitaciones, isLoading } = useMisCapacitaciones();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (!capacitaciones || capacitaciones.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="w-12 h-12" />}
        title="Sin capacitaciones"
        description="No tiene capacitaciones registradas."
      />
    );
  }

  return (
    <div className="space-y-3">
      {capacitaciones.map((cap) => (
        <Card key={cap.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {cap.nombre}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {cap.fecha_inicio && <span>Desde: {cap.fecha_inicio}</span>}
                  {cap.fecha_fin && <span>Hasta: {cap.fecha_fin}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cap.calificacion != null && (
                <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                  <Award className="w-4 h-4" />
                  <span className="font-medium">{cap.calificacion}</span>
                </div>
              )}
              <Badge variant={ESTADO_COLORS[cap.estado] || 'info'}>
                {cap.estado}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
