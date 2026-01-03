/**
 * Hook useTimeElapsed - Calcula tiempo transcurrido desde una fecha inicial
 *
 * @description
 * Hook que calcula y actualiza automáticamente el tiempo transcurrido desde una fecha inicial.
 * Soporta diferentes granularidades y formatos de salida.
 *
 * @example
 * ```tsx
 * const { elapsed, formatted } = useTimeElapsed({
 *   startDate: new Date('2020-01-15'),
 *   updateInterval: 60000, // cada minuto
 *   format: 'long'
 * });
 * ```
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

export type TimeUnit = 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds';

export type FormatStyle = 'long' | 'short' | 'compact';

export interface TimeElapsedConfig {
  /**
   * Fecha inicial desde la cual calcular el tiempo transcurrido
   */
  startDate: Date | string;

  /**
   * Intervalo de actualización en milisegundos
   * @default 60000 (1 minuto)
   */
  updateInterval?: number;

  /**
   * Granularidades a incluir en el cálculo
   * @default ['years', 'months', 'days']
   */
  granularities?: TimeUnit[];

  /**
   * Estilo de formato de salida
   * - 'long': "5 años, 3 meses, 12 días"
   * - 'short': "5a 3m 12d"
   * - 'compact': "5a 3m"
   * @default 'long'
   */
  format?: FormatStyle;

  /**
   * Si es true, el contador se detiene cuando se desmonta el componente
   * @default true
   */
  pauseOnUnmount?: boolean;

  /**
   * Mostrar ceros (ej: "0 años, 5 meses" vs "5 meses")
   * @default false
   */
  showZeros?: boolean;

  /**
   * Separador entre unidades
   * @default ', ' para long/short, ' ' para compact
   */
  separator?: string;
}

export interface TimeElapsedValue {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
}

export interface UseTimeElapsedReturn {
  /**
   * Objeto con todos los valores de tiempo calculados
   */
  elapsed: TimeElapsedValue;

  /**
   * String formateado según configuración
   */
  formatted: string;

  /**
   * Fecha inicial normalizada
   */
  startDate: Date;

  /**
   * Fecha actual
   */
  currentDate: Date;

  /**
   * Fuerza una actualización manual del contador
   */
  refresh: () => void;

  /**
   * Indica si el contador está activo
   */
  isActive: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_MONTH = 30.44; // Promedio aproximado
const MONTHS_PER_YEAR = 12;

const DEFAULT_UPDATE_INTERVAL = 60000; // 1 minuto
const DEFAULT_GRANULARITIES: TimeUnit[] = ['years', 'months', 'days'];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Normaliza una fecha string o Date a objeto Date
 */
const normalizeDate = (date: Date | string): Date => {
  return typeof date === 'string' ? new Date(date) : date;
};

/**
 * Calcula la diferencia en años, meses y días entre dos fechas
 */
const calculateDateDifference = (start: Date, end: Date): { years: number; months: number; days: number } => {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  // Ajustar días negativos
  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // Ajustar meses negativos
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
};

/**
 * Calcula todos los valores de tiempo transcurrido
 */
const calculateElapsed = (startDate: Date, currentDate: Date): TimeElapsedValue => {
  const diffMs = currentDate.getTime() - startDate.getTime();

  // Totales
  const totalSeconds = Math.floor(diffMs / MILLISECONDS_PER_SECOND);
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const totalHours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const totalDays = Math.floor(totalHours / HOURS_PER_DAY);

  // Diferencia de fechas (años, meses, días)
  const { years, months, days } = calculateDateDifference(startDate, currentDate);

  // Horas, minutos, segundos del día actual
  const remainingMs = diffMs - (totalDays * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND);
  const hours = Math.floor(remainingMs / (MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND));
  const minutes = Math.floor((remainingMs % (MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND)) / (SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND));
  const seconds = Math.floor((remainingMs % (SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND)) / MILLISECONDS_PER_SECOND);

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds,
  };
};

/**
 * Formatea el tiempo según el estilo especificado
 */
const formatElapsed = (
  elapsed: TimeElapsedValue,
  style: FormatStyle,
  granularities: TimeUnit[],
  showZeros: boolean,
  customSeparator?: string
): string => {
  const labels: Record<FormatStyle, Record<TimeUnit, (n: number) => string>> = {
    long: {
      years: (n) => `${n} ${n === 1 ? 'año' : 'años'}`,
      months: (n) => `${n} ${n === 1 ? 'mes' : 'meses'}`,
      days: (n) => `${n} ${n === 1 ? 'día' : 'días'}`,
      hours: (n) => `${n} ${n === 1 ? 'hora' : 'horas'}`,
      minutes: (n) => `${n} ${n === 1 ? 'minuto' : 'minutos'}`,
      seconds: (n) => `${n} ${n === 1 ? 'segundo' : 'segundos'}`,
    },
    short: {
      years: (n) => `${n}a`,
      months: (n) => `${n}m`,
      days: (n) => `${n}d`,
      hours: (n) => `${n}h`,
      minutes: (n) => `${n}min`,
      seconds: (n) => `${n}s`,
    },
    compact: {
      years: (n) => `${n}a`,
      months: (n) => `${n}m`,
      days: (n) => `${n}d`,
      hours: (n) => `${n}h`,
      minutes: (n) => `${n}m`,
      seconds: (n) => `${n}s`,
    },
  };

  const separator = customSeparator ?? (style === 'compact' ? ' ' : ', ');

  const parts: string[] = [];

  granularities.forEach((unit) => {
    const value = elapsed[unit];
    if (value > 0 || showZeros) {
      parts.push(labels[style][unit](value));
    }
  });

  return parts.length > 0 ? parts.join(separator) : '0';
};

// ============================================
// HOOK
// ============================================

/**
 * Hook para calcular y mostrar tiempo transcurrido desde una fecha inicial
 *
 * @param config Configuración del hook
 * @returns Objeto con valores calculados y utilidades
 */
export const useTimeElapsed = (config: TimeElapsedConfig): UseTimeElapsedReturn => {
  const {
    startDate: startDateInput,
    updateInterval = DEFAULT_UPDATE_INTERVAL,
    granularities = DEFAULT_GRANULARITIES,
    format = 'long',
    pauseOnUnmount = true,
    showZeros = false,
    separator,
  } = config;

  // Normalizar fecha de inicio
  const startDate = useMemo(() => normalizeDate(startDateInput), [startDateInput]);

  // Estado
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isActive, setIsActive] = useState<boolean>(true);

  // Callback para actualizar fecha actual
  const refresh = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Calcular valores de tiempo transcurrido
  const elapsed = useMemo(
    () => calculateElapsed(startDate, currentDate),
    [startDate, currentDate]
  );

  // Formatear salida
  const formatted = useMemo(
    () => formatElapsed(elapsed, format, granularities, showZeros, separator),
    [elapsed, format, granularities, showZeros, separator]
  );

  // Efecto para actualizar automáticamente
  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      setCurrentDate(new Date());
    }, updateInterval);

    return () => {
      clearInterval(intervalId);
      if (pauseOnUnmount) {
        setIsActive(false);
      }
    };
  }, [updateInterval, isActive, pauseOnUnmount]);

  return {
    elapsed,
    formatted,
    startDate,
    currentDate,
    refresh,
    isActive,
  };
};
