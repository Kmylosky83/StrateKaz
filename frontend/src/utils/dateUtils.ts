/**
 * Utilidades para manejo consistente de fechas en Colombia (UTC-5)
 *
 * PROBLEMA: JavaScript interpreta strings de fecha 'YYYY-MM-DD' como UTC medianoche,
 * lo que causa que en Colombia (UTC-5) se muestre un día anterior.
 *
 * SOLUCIÓN: Siempre trabajar con fechas locales explícitas, sin conversión a UTC.
 */

/**
 * Obtiene la fecha actual en Colombia como string 'YYYY-MM-DD'
 * Uso: min/max de inputs type="date"
 */
export const getFechaColombia = (): string => {
  const now = new Date();
  // Obtener componentes de fecha en timezone de Bogotá
  const year = now.toLocaleString('en-US', { timeZone: 'America/Bogota', year: 'numeric' });
  const month = now.toLocaleString('en-US', { timeZone: 'America/Bogota', month: '2-digit' });
  const day = now.toLocaleString('en-US', { timeZone: 'America/Bogota', day: '2-digit' });

  return `${year}-${month}-${day}`;
};

/**
 * Suma días a una fecha string 'YYYY-MM-DD' sin cambiar timezone
 * Uso: calcular "mañana", "en 7 días", etc.
 */
export const addDaysToDateString = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // Crear fecha local explícita
  date.setDate(date.getDate() + days);

  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  const newDay = String(date.getDate()).padStart(2, '0');

  return `${newYear}-${newMonth}-${newDay}`;
};

/**
 * Convierte string 'YYYY-MM-DD' a objeto Date LOCAL (sin conversión UTC)
 * Uso: mostrar fechas en tabla/calendario
 *
 * IMPORTANTE: NO usar new Date('2024-12-03') porque interpreta como UTC
 */
export const parseLocalDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;

  // Si tiene 'T' es un datetime ISO, usar parseISO
  if (dateString.includes('T')) {
    return new Date(dateString);
  }

  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // Mes es 0-indexed
};

/**
 * Formatea una fecha string 'YYYY-MM-DD' para mostrar en UI
 * Uso: ProgramacionesTable, CalendarioView
 */
export const formatFechaLocal = (
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return '-';

  const date = parseLocalDate(dateString);
  if (!date) return '-';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  };

  return date.toLocaleDateString('es-CO', defaultOptions);
};

/**
 * Formatea una fecha string 'YYYY-MM-DD' a formato corto (DD/MM/YYYY)
 */
export const formatFechaCorta = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';

  const date = parseLocalDate(dateString);
  if (!date) return '-';

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Verifica si una fecha string 'YYYY-MM-DD' es anterior a hoy
 * Uso: validar programaciones vencidas
 */
export const isFechaPasada = (dateString: string): boolean => {
  const fecha = parseLocalDate(dateString);
  const hoy = parseLocalDate(getFechaColombia());
  if (!fecha || !hoy) return false;
  return fecha < hoy;
};

/**
 * Verifica si una fecha string 'YYYY-MM-DD' es hoy
 */
export const isFechaHoy = (dateString: string): boolean => {
  return dateString === getFechaColombia();
};

/**
 * Obtiene la fecha de mañana en formato 'YYYY-MM-DD'
 */
export const getFechaManana = (): string => {
  return addDaysToDateString(getFechaColombia(), 1);
};
