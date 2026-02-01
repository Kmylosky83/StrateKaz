import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from './dateUtils';

/**
 * Formatea un número como moneda colombiana (COP)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Formatea una fecha a formato DD/MM/YYYY
 * NOTA: Para fechas 'YYYY-MM-DD' sin hora, usa parseLocalDate para evitar
 * problemas de timezone donde la fecha se muestra un día antes
 */
export const formatDate = (date: string | Date): string => {
  try {
    let dateObj: Date;
    if (typeof date === 'string') {
      // Si es solo fecha (YYYY-MM-DD), usar parseLocalDate para evitar UTC
      if (date.length === 10 && !date.includes('T')) {
        dateObj = parseLocalDate(date) || new Date();
      } else {
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }
    return format(dateObj, 'dd/MM/yyyy', { locale: es });
  } catch {
    return '';
  }
};

/**
 * Formatea una fecha y hora a formato DD/MM/YYYY HH:mm
 */
export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return '';
  }
};

/**
 * Formatea una hora a formato HH:mm
 */
export const formatTime = (time: string): string => {
  try {
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    return time;
  } catch {
    return '';
  }
};

/**
 * Formatea un peso en kilogramos
 */
export const formatWeight = (kilos: number): string => {
  return `${formatNumber(kilos, 2)} kg`;
};

/**
 * Formatea un número de teléfono colombiano
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Formatea un NIT colombiano
 */
export const formatNIT = (nit: string): string => {
  const cleaned = nit.replace(/\D/g, '');
  if (cleaned.length >= 9) {
    const parts = cleaned.match(/^(\d{1,9})(\d{1})$/);
    if (parts) {
      return `${parts[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${parts[2]}`;
    }
  }
  return nit;
};

/**
 * Formatea un porcentaje
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${formatNumber(value, decimals)}%`;
};

/**
 * Trunca un texto a cierta longitud
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
