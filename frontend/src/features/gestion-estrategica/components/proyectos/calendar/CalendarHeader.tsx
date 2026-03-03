/**
 * CalendarHeader - Navegacion de mes/ano para el calendario de actividades
 * Sprint CALENDAR-1: Calendar View for Planner
 *
 * Muestra: < Marzo 2026 > [Hoy]
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common';
import { MONTH_NAMES } from './calendarUtils';

interface CalendarHeaderProps {
  /** Ano actual del calendario */
  year: number;
  /** Mes actual del calendario (0-indexed) */
  month: number;
  /** Navegar al mes anterior */
  onPrevMonth: () => void;
  /** Navegar al mes siguiente */
  onNextMonth: () => void;
  /** Ir al mes actual (hoy) */
  onToday: () => void;
}

export const CalendarHeader = ({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) => {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="flex items-center justify-between py-3">
      {/* Navegacion mes */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onPrevMonth} aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[180px] text-center select-none">
          {MONTH_NAMES[month]} {year}
        </h2>

        <Button variant="ghost" size="sm" onClick={onNextMonth} aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Boton Hoy */}
      {!isCurrentMonth && (
        <Button variant="secondary" size="sm" onClick={onToday}>
          Hoy
        </Button>
      )}
    </div>
  );
};
