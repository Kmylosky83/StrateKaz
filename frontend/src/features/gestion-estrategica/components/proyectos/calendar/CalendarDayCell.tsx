/**
 * CalendarDayCell - Celda individual de dia en el calendario de actividades
 * Sprint CALENDAR-1: Calendar View for Planner
 *
 * Muestra el numero del dia y puntos de color representando actividades.
 * Click en la celda abre el popover de detalle del dia.
 */
import { cn } from '@/utils/cn';
import { isToday, isWeekend, getActivityColor } from './calendarUtils';
import type { ActividadProyecto } from '../../../types/proyectos.types';

/** Maximo de indicadores de actividad visibles por celda */
const MAX_DOTS = 4;

interface CalendarDayCellProps {
  /** Fecha de esta celda */
  date: Date;
  /** Si la fecha pertenece al mes actualmente visible */
  isCurrentMonth: boolean;
  /** Actividades que se cruzan con este dia */
  activities: ActividadProyecto[];
  /** Si esta celda esta seleccionada (para mostrar popover) */
  isSelected: boolean;
  /** Callback al hacer click en la celda */
  onClick: (date: Date) => void;
}

export const CalendarDayCell = ({
  date,
  isCurrentMonth,
  activities,
  isSelected,
  onClick,
}: CalendarDayCellProps) => {
  const today = isToday(date);
  const weekend = isWeekend(date);
  const hasActivities = activities.length > 0;
  const visibleDots = activities.slice(0, MAX_DOTS);
  const extraCount = activities.length - MAX_DOTS;

  return (
    <button
      type="button"
      onClick={() => onClick(date)}
      className={cn(
        'relative flex flex-col items-center p-1.5 min-h-[72px] md:min-h-[80px] rounded-lg',
        'transition-colors duration-150 text-left w-full',
        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1',
        // Mes actual vs otros meses
        isCurrentMonth
          ? 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
          : 'opacity-40 hover:opacity-60',
        // Fin de semana
        weekend && isCurrentMonth && 'bg-gray-50/50 dark:bg-gray-800/30',
        // Seleccionado
        isSelected &&
          'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400 dark:ring-primary-500',
        // Hoy
        today && !isSelected && 'bg-blue-50 dark:bg-blue-900/20'
      )}
    >
      {/* Numero del dia */}
      <span
        className={cn(
          'text-sm font-medium leading-none mb-1.5',
          today
            ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'
            : isCurrentMonth
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-600'
        )}
      >
        {date.getDate()}
      </span>

      {/* Indicadores de actividad (dots) */}
      {hasActivities && (
        <div className="flex flex-wrap gap-0.5 justify-center mt-auto">
          {visibleDots.map((act) => {
            const color = getActivityColor(act.estado);
            return (
              <span
                key={act.id}
                className={cn('w-2 h-2 rounded-full shrink-0', color.dot)}
                title={act.nombre}
              />
            );
          })}
          {extraCount > 0 && (
            <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400 leading-none ml-0.5">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* Barra de actividades en vista desktop (muestra nombre corto) */}
      {hasActivities && (
        <div className="hidden md:flex flex-col gap-0.5 w-full mt-1 overflow-hidden">
          {activities.slice(0, 2).map((act) => {
            const color = getActivityColor(act.estado);
            return (
              <div
                key={act.id}
                className={cn(
                  'text-[10px] leading-tight px-1 py-0.5 rounded truncate',
                  color.bg,
                  color.text
                )}
                title={act.nombre}
              >
                {act.nombre}
              </div>
            );
          })}
          {activities.length > 2 && (
            <span className="text-[9px] text-gray-500 dark:text-gray-400 text-center">
              +{activities.length - 2} mas
            </span>
          )}
        </div>
      )}
    </button>
  );
};
