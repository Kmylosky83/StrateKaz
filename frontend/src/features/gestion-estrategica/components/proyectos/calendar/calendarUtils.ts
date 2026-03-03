/**
 * Utilidades para el componente Calendar de actividades de proyecto.
 * Sprint CALENDAR-1: Calendar View for Planner
 */
import type { ActividadProyecto, KanbanData } from '../../../types/proyectos.types';

// ==================== CONSTANTES ====================

/** Nombres de meses en espanol colombiano */
export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

/** Nombres cortos de dias de la semana (Lun-Dom) */
export const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] as const;

/** Mapeo de estado de actividad a color Tailwind */
const ESTADO_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pendiente: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
  en_progreso: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  completada: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
  },
  bloqueada: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
  cancelada: {
    bg: 'bg-gray-200 dark:bg-gray-600',
    text: 'text-gray-500 dark:text-gray-400',
    dot: 'bg-gray-500',
  },
};

// ==================== FUNCIONES DE FECHA ====================

/** Obtiene el numero de dias en un mes dado (1-indexed month) */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Obtiene el dia de la semana del primer dia del mes.
 * Retorna 0=Lunes ... 6=Domingo (formato ISO, no JS nativo).
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // JS: 0=Dom, 1=Lun, ... 6=Sab -> ISO: 0=Lun, ... 6=Dom
  return day === 0 ? 6 : day - 1;
}

/** Verifica si una fecha es hoy */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/** Verifica si una fecha pertenece al mes indicado */
export function isSameMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month;
}

/** Verifica si una fecha es fin de semana (Sabado o Domingo) */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Genera las celdas del calendario para un mes.
 * Incluye dias del mes anterior y siguiente para completar la grilla.
 */
export function generateCalendarDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDayOffset = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  // Dias del mes anterior para rellenar el inicio
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  for (let i = firstDayOffset - 1; i >= 0; i--) {
    days.push(new Date(prevYear, prevMonth, daysInPrevMonth - i));
  }

  // Dias del mes actual
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  // Dias del mes siguiente para completar la ultima fila (6 filas * 7 = 42 celdas)
  const remaining = 42 - days.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(nextYear, nextMonth, d));
  }

  return days;
}

// ==================== FUNCIONES DE ACTIVIDADES ====================

/**
 * Extrae todas las actividades de la estructura KanbanData (agrupada por columnas)
 * en una lista plana.
 */
export function flattenKanbanActivities(kanbanData: KanbanData | undefined): ActividadProyecto[] {
  if (!kanbanData?.columns) return [];
  const all: ActividadProyecto[] = [];
  for (const items of Object.values(kanbanData.columns)) {
    if (Array.isArray(items)) {
      all.push(...items);
    }
  }
  return all;
}

/**
 * Filtra las actividades que se cruzan con una fecha determinada.
 * Una actividad se muestra en un dia si: fecha_inicio_plan <= dia <= fecha_fin_plan.
 * Si solo tiene fecha_inicio_plan, se muestra solo en ese dia.
 * Si solo tiene fecha_fin_plan, se muestra solo en ese dia.
 * Si no tiene fechas, no se muestra.
 */
export function getActivitiesForDay(
  activities: ActividadProyecto[],
  date: Date
): ActividadProyecto[] {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayEnd = dayStart + 86400000 - 1; // end of day

  return activities.filter((act) => {
    const inicio = act.fecha_inicio_plan ? new Date(act.fecha_inicio_plan).getTime() : null;
    const fin = act.fecha_fin_plan ? new Date(act.fecha_fin_plan).getTime() : null;

    if (inicio && fin) {
      // La actividad abarca un rango: mostrar si el dia se cruza con el rango
      return inicio <= dayEnd && fin >= dayStart;
    }
    if (inicio && !fin) {
      // Solo fecha inicio: mostrar solo en ese dia
      return inicio >= dayStart && inicio <= dayEnd;
    }
    if (!inicio && fin) {
      // Solo fecha fin: mostrar solo en ese dia
      return fin >= dayStart && fin <= dayEnd;
    }
    return false;
  });
}

/**
 * Retorna clases de color para un estado de actividad.
 */
export function getActivityColor(estado: string): { bg: string; text: string; dot: string } {
  return ESTADO_COLORS[estado] ?? ESTADO_COLORS.pendiente;
}

/**
 * Retorna la variante de Badge segun el estado.
 */
export function getEstadoBadgeVariant(estado: string): 'gray' | 'primary' | 'success' | 'danger' {
  switch (estado) {
    case 'en_progreso':
      return 'primary';
    case 'completada':
      return 'success';
    case 'bloqueada':
    case 'cancelada':
      return 'danger';
    default:
      return 'gray';
  }
}

/**
 * Formatea una fecha para display en el calendario.
 */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sin fecha';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
  });
}

/**
 * Verifica si una actividad esta atrasada (fecha_fin_plan pasada y no completada).
 */
export function isActivityOverdue(actividad: ActividadProyecto): boolean {
  if (actividad.estado === 'completada' || actividad.estado === 'cancelada') return false;
  if (!actividad.fecha_fin_plan) return false;
  return new Date(actividad.fecha_fin_plan) < new Date();
}
