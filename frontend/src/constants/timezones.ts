/**
 * Timezones constants - Common timezones for user preferences
 */

import type { TimezoneOption } from '../features/perfil/types/preferences.types';

/**
 * Common timezones list
 * Includes major cities and regions worldwide
 */
export const COMMON_TIMEZONES: TimezoneOption[] = [
  // Americas - South America
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Lima', label: 'Lima (GMT-5)' },
  { value: 'America/Caracas', label: 'Caracas (GMT-4)' },
  { value: 'America/Guayaquil', label: 'Guayaquil (GMT-5)' },
  { value: 'America/La_Paz', label: 'La Paz (GMT-4)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-3/-4)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Montevideo', label: 'Montevideo (GMT-3)' },
  { value: 'America/Asuncion', label: 'Asunción (GMT-3/-4)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },

  // Americas - Central America & Caribbean
  { value: 'America/Panama', label: 'Panamá (GMT-5)' },
  { value: 'America/Costa_Rica', label: 'San José (GMT-6)' },
  { value: 'America/Managua', label: 'Managua (GMT-6)' },
  { value: 'America/Tegucigalpa', label: 'Tegucigalpa (GMT-6)' },
  { value: 'America/Guatemala', label: 'Guatemala (GMT-6)' },
  { value: 'America/El_Salvador', label: 'San Salvador (GMT-6)' },
  { value: 'America/Belize', label: 'Belmopán (GMT-6)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6/-5)' },
  { value: 'America/Havana', label: 'La Habana (GMT-5/-4)' },
  { value: 'America/Santo_Domingo', label: 'Santo Domingo (GMT-4)' },

  // Americas - North America
  { value: 'America/New_York', label: 'Nueva York (GMT-5/-4)' },
  { value: 'America/Chicago', label: 'Chicago (GMT-6/-5)' },
  { value: 'America/Denver', label: 'Denver (GMT-7/-6)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8/-7)' },
  { value: 'America/Phoenix', label: 'Phoenix (GMT-7)' },
  { value: 'America/Anchorage', label: 'Anchorage (GMT-9/-8)' },
  { value: 'America/Toronto', label: 'Toronto (GMT-5/-4)' },
  { value: 'America/Vancouver', label: 'Vancouver (GMT-8/-7)' },

  // Europe
  { value: 'Europe/London', label: 'Londres (GMT+0/+1)' },
  { value: 'Europe/Dublin', label: 'Dublín (GMT+0/+1)' },
  { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0/+1)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1/+2)' },
  { value: 'Europe/Paris', label: 'París (GMT+1/+2)' },
  { value: 'Europe/Rome', label: 'Roma (GMT+1/+2)' },
  { value: 'Europe/Berlin', label: 'Berlín (GMT+1/+2)' },
  { value: 'Europe/Amsterdam', label: 'Ámsterdam (GMT+1/+2)' },
  { value: 'Europe/Brussels', label: 'Bruselas (GMT+1/+2)' },
  { value: 'Europe/Vienna', label: 'Viena (GMT+1/+2)' },
  { value: 'Europe/Zurich', label: 'Zúrich (GMT+1/+2)' },
  { value: 'Europe/Athens', label: 'Atenas (GMT+2/+3)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (GMT+2/+3)' },
  { value: 'Europe/Stockholm', label: 'Estocolmo (GMT+1/+2)' },
  { value: 'Europe/Moscow', label: 'Moscú (GMT+3)' },

  // Asia
  { value: 'Asia/Dubai', label: 'Dubái (GMT+4)' },
  { value: 'Asia/Karachi', label: 'Karachi (GMT+5)' },
  { value: 'Asia/Kolkata', label: 'Kolkata (GMT+5:30)' },
  { value: 'Asia/Dhaka', label: 'Dhaka (GMT+6)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
  { value: 'Asia/Singapore', label: 'Singapur (GMT+8)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (GMT+8)' },
  { value: 'Asia/Shanghai', label: 'Shanghái (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Tokio (GMT+9)' },
  { value: 'Asia/Seoul', label: 'Seúl (GMT+9)' },

  // Oceania
  { value: 'Australia/Sydney', label: 'Sídney (GMT+10/+11)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (GMT+10/+11)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (GMT+10)' },
  { value: 'Australia/Perth', label: 'Perth (GMT+8)' },
  { value: 'Pacific/Auckland', label: 'Auckland (GMT+12/+13)' },

  // Africa
  { value: 'Africa/Cairo', label: 'El Cairo (GMT+2)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburgo (GMT+2)' },
  { value: 'Africa/Lagos', label: 'Lagos (GMT+1)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (GMT+3)' },

  // UTC
  { value: 'UTC', label: 'UTC (GMT+0)' },
];

/**
 * Get timezone label by value
 */
export const getTimezoneLabel = (timezone: string): string => {
  const found = COMMON_TIMEZONES.find((tz) => tz.value === timezone);
  return found?.label || timezone;
};

/**
 * Search timezones by query
 */
export const searchTimezones = (query: string): TimezoneOption[] => {
  const lowerQuery = query.toLowerCase();
  return COMMON_TIMEZONES.filter(
    (tz) =>
      tz.label.toLowerCase().includes(lowerQuery) || tz.value.toLowerCase().includes(lowerQuery)
  );
};
