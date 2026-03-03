/**
 * CalendarActivityPopover - Panel lateral con detalle de actividades de un dia
 * Sprint CALENDAR-1: Calendar View for Planner
 *
 * Se muestra al hacer click en un dia del calendario.
 * Lista las actividades del dia con informacion resumida.
 */
import { X, User, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge, Button } from '@/components/common';
import { cn } from '@/utils/cn';
import {
  getEstadoBadgeVariant,
  formatDateShort,
  isActivityOverdue,
  MONTH_NAMES,
} from './calendarUtils';
import type { ActividadProyecto } from '../../../types/proyectos.types';

interface CalendarActivityPopoverProps {
  /** Fecha seleccionada */
  date: Date | null;
  /** Actividades del dia seleccionado */
  activities: ActividadProyecto[];
  /** Cerrar el popover */
  onClose: () => void;
  /** Click en una actividad individual */
  onActivityClick?: (actividad: ActividadProyecto) => void;
}

/** Mapeo de prioridad numerica a etiqueta */
function getPriorityLabel(prioridad: number): string {
  if (prioridad <= 3) return 'Alta';
  if (prioridad <= 6) return 'Normal';
  return 'Baja';
}

function getPriorityVariant(prioridad: number): 'danger' | 'warning' | 'info' | 'gray' {
  if (prioridad <= 1) return 'danger';
  if (prioridad <= 3) return 'warning';
  if (prioridad <= 6) return 'info';
  return 'gray';
}

export const CalendarActivityPopover = ({
  date,
  activities,
  onClose,
  onActivityClick,
}: CalendarActivityPopoverProps) => {
  const isOpen = date !== null;

  const formattedDate = date
    ? `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            'absolute right-0 top-0 bottom-0 w-full md:w-80 lg:w-96',
            'bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700',
            'shadow-xl z-20 overflow-y-auto'
          )}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formattedDate}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {activities.length} actividad{activities.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista de actividades */}
          <div className="p-3 space-y-2">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay actividades para este dia
                </p>
              </div>
            ) : (
              activities.map((actividad) => {
                const overdue = isActivityOverdue(actividad);

                return (
                  <button
                    key={actividad.id}
                    type="button"
                    onClick={() => onActivityClick?.(actividad)}
                    className={cn(
                      'w-full text-left rounded-lg border p-3 transition-colors',
                      'border-gray-200 dark:border-gray-700',
                      'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                      'focus:outline-none focus:ring-2 focus:ring-primary-400',
                      overdue && 'border-red-200 dark:border-red-800'
                    )}
                  >
                    {/* Titulo + badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        {actividad.codigo_wbs && (
                          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 block mb-0.5">
                            {actividad.codigo_wbs}
                          </span>
                        )}
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                          {actividad.nombre}
                        </h4>
                      </div>
                      {overdue && (
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Badges: estado + prioridad */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant={getEstadoBadgeVariant(actividad.estado)} size="sm">
                        {actividad.estado_display ?? actividad.estado}
                      </Badge>
                      <Badge variant={getPriorityVariant(actividad.prioridad)} size="sm">
                        {getPriorityLabel(actividad.prioridad)}
                      </Badge>
                    </div>

                    {/* Progreso */}
                    {actividad.porcentaje_avance > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                          <span>Avance</span>
                          <span>{actividad.porcentaje_avance}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${actividad.porcentaje_avance}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Meta: responsable, fechas, duracion */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                      {actividad.responsable_nombre && (
                        <div className="flex items-center gap-1 min-w-0">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {actividad.responsable_nombre}
                          </span>
                        </div>
                      )}
                      {actividad.fecha_inicio_plan && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>
                            {formatDateShort(actividad.fecha_inicio_plan)} -{' '}
                            {formatDateShort(actividad.fecha_fin_plan)}
                          </span>
                        </div>
                      )}
                      {actividad.duracion_estimada_dias != null &&
                        actividad.duracion_estimada_dias > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{actividad.duracion_estimada_dias}d</span>
                          </div>
                        )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
