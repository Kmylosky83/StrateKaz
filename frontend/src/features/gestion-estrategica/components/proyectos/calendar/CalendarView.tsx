/**
 * CalendarView - Vista de calendario mensual para actividades de proyecto
 * Sprint CALENDAR-1: Calendar View for Planner
 *
 * Muestra las actividades del proyecto como puntos/barras de color
 * en una grilla mensual. Click en un dia abre el panel lateral
 * con detalle de las actividades de ese dia.
 *
 * Usa los MISMOS datos que KanbanBoard (via useKanbanData).
 * Solo cambia la visualizacion: en vez de columnas kanban, grilla calendario.
 *
 * Responsive:
 * - Desktop: grilla mensual completa + panel lateral
 * - Mobile: grilla compacta (solo dots) + panel full-width
 */
import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Spinner, EmptyState } from '@/components/common';
import { cn } from '@/utils/cn';
import { useKanbanData } from '../../../hooks/useKanban';
import {
  DAY_NAMES_SHORT,
  generateCalendarDays,
  isSameMonth,
  getActivitiesForDay,
  flattenKanbanActivities,
} from './calendarUtils';
import { CalendarHeader } from './CalendarHeader';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarActivityPopover } from './CalendarActivityPopover';
import type { ActividadProyecto } from '../../../types/proyectos.types';

interface CalendarViewProps {
  /** ID del proyecto seleccionado */
  proyectoId: number | null;
  /** Callback al hacer click en una actividad */
  onActivityClick?: (actividad: ActividadProyecto) => void;
}

export const CalendarView = ({ proyectoId, onActivityClick }: CalendarViewProps) => {
  const { data: kanbanData, isLoading, isError } = useKanbanData(proyectoId);

  // Estado del calendario: mes/ano actual
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // Dia seleccionado (para el popover)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Extraer todas las actividades de la estructura kanban
  const allActivities = useMemo(() => flattenKanbanActivities(kanbanData), [kanbanData]);

  // Generar las celdas del mes (incluye dias de meses adyacentes)
  const calendarDays = useMemo(() => generateCalendarDays(year, month), [year, month]);

  // Pre-computar actividades por dia para evitar recalcular en cada render de celda
  const activitiesByDay = useMemo(() => {
    const map = new Map<string, ActividadProyecto[]>();
    for (const day of calendarDays) {
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
      map.set(key, getActivitiesForDay(allActivities, day));
    }
    return map;
  }, [calendarDays, allActivities]);

  // Actividades del dia seleccionado
  const selectedDayActivities = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return activitiesByDay.get(key) ?? [];
  }, [selectedDate, activitiesByDay]);

  // Navegacion de mes
  const handlePrevMonth = useCallback(() => {
    setSelectedDate(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const handleNextMonth = useCallback(() => {
    setSelectedDate(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month]);

  const handleToday = useCallback(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(null);
  }, []);

  const handleDayClick = useCallback(
    (date: Date) => {
      // Toggle: si ya esta seleccionado el mismo dia, deseleccionar
      if (
        selectedDate &&
        selectedDate.getFullYear() === date.getFullYear() &&
        selectedDate.getMonth() === date.getMonth() &&
        selectedDate.getDate() === date.getDate()
      ) {
        setSelectedDate(null);
      } else {
        setSelectedDate(date);
      }
    },
    [selectedDate]
  );

  // ==================== ESTADOS DE CARGA ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12" />}
        title="Error al cargar el calendario"
        description="No se pudieron cargar las actividades. Intenta de nuevo."
      />
    );
  }

  if (!proyectoId) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12" />}
        title="Selecciona un proyecto"
        description="Elige un proyecto para ver sus actividades en el calendario."
      />
    );
  }

  // Contar actividades con fechas
  const actividadesConFechas = allActivities.filter(
    (a) => a.fecha_inicio_plan || a.fecha_fin_plan
  ).length;

  return (
    <div className="relative">
      {/* Encabezado con navegacion */}
      <CalendarHeader
        year={year}
        month={month}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      {/* Leyenda de estados */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>En progreso</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Completada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Bloqueada</span>
        </div>
        {actividadesConFechas < allActivities.length && (
          <span className="text-gray-400 italic">
            ({allActivities.length - actividadesConFechas} sin fechas)
          </span>
        )}
      </div>

      {/* Contenedor relativo para popover */}
      <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className={cn('transition-all duration-200', selectedDate ? 'md:mr-80 lg:mr-96' : '')}>
          {/* Cabecera dias de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {DAY_NAMES_SHORT.map((dayName) => (
              <div
                key={dayName}
                className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Grilla del mes con animacion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${year}-${month}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-7"
            >
              {calendarDays.map((day, index) => {
                const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const dayActivities = activitiesByDay.get(key) ?? [];
                const isCurrentMonth = isSameMonth(day, year, month);
                const isSelected =
                  selectedDate !== null &&
                  selectedDate.getFullYear() === day.getFullYear() &&
                  selectedDate.getMonth() === day.getMonth() &&
                  selectedDate.getDate() === day.getDate();

                return (
                  <div
                    key={`${key}-${index}`}
                    className={cn(
                      'border-b border-r border-gray-100 dark:border-gray-700/50',
                      // Borde derecho en la ultima columna
                      (index + 1) % 7 === 0 && 'border-r-0'
                    )}
                  >
                    <CalendarDayCell
                      date={day}
                      isCurrentMonth={isCurrentMonth}
                      activities={dayActivities}
                      isSelected={isSelected}
                      onClick={handleDayClick}
                    />
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Panel lateral de detalle del dia */}
        <CalendarActivityPopover
          date={selectedDate}
          activities={selectedDayActivities}
          onClose={() => setSelectedDate(null)}
          onActivityClick={onActivityClick}
        />
      </div>
    </div>
  );
};
