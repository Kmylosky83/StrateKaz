/**
 * PlanMejoraDetailModal - Detalle de plan de mejora con actividades y seguimientos
 */
import { Badge } from '@/components/common/Badge';
import { Progress } from '@/components/common/Progress';
import { Button } from '@/components/common/Button';
import { BaseModal } from '@/components/modals/BaseModal';
import { EmptyState } from '@/components/common/EmptyState';
import { CheckCircle, Clock, ListChecks, MessageSquare } from 'lucide-react';
import { useActividadesPorPlan, useCompletarActividad } from '../../hooks/useDesempeno';
import type { PlanMejora } from '../../types';

const ESTADO_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  borrador: 'gray',
  aprobado: 'info',
  en_ejecucion: 'warning',
  seguimiento: 'info',
  completado: 'success',
  cancelado: 'danger',
};

const ACTIVIDAD_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  pendiente: 'gray',
  en_progreso: 'warning',
  completada: 'success',
  cancelada: 'danger',
};

const PRIORIDAD_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Alta', color: 'text-red-500' },
  2: { label: 'Media', color: 'text-yellow-500' },
  3: { label: 'Baja', color: 'text-green-500' },
};

interface Props {
  plan: PlanMejora | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlanMejoraDetailModal = ({ plan, isOpen, onClose }: Props) => {
  const { data: actividades } = useActividadesPorPlan(plan ? String(plan.id) : '');
  const completarMutation = useCompletarActividad();

  if (!plan) return null;

  const actividadesList = Array.isArray(actividades) ? actividades : plan.actividades || [];
  const seguimientos = plan.seguimientos || [];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Plan de Mejora"
      size="3xl"
      footer={
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {plan.titulo}
            </h4>
            <p className="text-sm text-gray-500 font-mono">{plan.codigo}</p>
            <p className="text-sm text-gray-500">
              {plan.colaborador_nombre} | Responsable: {plan.responsable_nombre}
            </p>
          </div>
          <Badge variant={ESTADO_BADGE[plan.estado] || 'gray'} size="sm">
            {plan.estado_display || plan.estado}
          </Badge>
        </div>

        {/* Progreso */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-300">Avance general</span>
            <span className="font-medium">{plan.porcentaje_avance}%</span>
          </div>
          <Progress value={plan.porcentaje_avance} max={100} className="h-2" />
        </div>

        {/* Info */}
        {plan.objetivo_general && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Objetivo General
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              {plan.objetivo_general}
            </p>
          </div>
        )}

        {/* Actividades */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks size={16} className="text-primary-500" />
            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Actividades ({actividadesList.length})
            </h5>
          </div>

          {actividadesList.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-8 w-8 text-gray-300" />}
              title="Sin actividades"
              description="No hay actividades registradas en este plan."
            />
          ) : (
            <div className="space-y-2">
              {actividadesList.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant={ACTIVIDAD_BADGE[act.estado] || 'gray'} size="sm">
                      {act.estado_display || act.estado}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{act.descripcion}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span>{act.tipo_display || act.tipo_actividad}</span>
                        <span className={PRIORIDAD_LABELS[act.prioridad]?.color}>
                          {PRIORIDAD_LABELS[act.prioridad]?.label || 'Media'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(act.fecha_fin).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {act.estado === 'en_progreso' && (
                    <button
                      type="button"
                      onClick={() => completarMutation.mutate(String(act.id))}
                      className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/20"
                      title="Completar"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seguimientos */}
        {seguimientos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-blue-500" />
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Seguimientos ({seguimientos.length})
              </h5>
            </div>

            <div className="space-y-3">
              {seguimientos.map((seg) => (
                <div
                  key={seg.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {new Date(seg.fecha_seguimiento).toLocaleDateString('es-CO')} -{' '}
                      {seg.realizado_por_nombre}
                    </span>
                    <Badge variant="info" size="sm">
                      {seg.porcentaje_avance}%
                    </Badge>
                  </div>
                  {seg.logros && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-green-600">Logros:</span> {seg.logros}
                    </p>
                  )}
                  {seg.dificultades && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-red-600">Dificultades:</span>{' '}
                      {seg.dificultades}
                    </p>
                  )}
                  {seg.acciones_correctivas && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-blue-600">Acciones:</span>{' '}
                      {seg.acciones_correctivas}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
