import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility para combinar clases de Tailwind CSS
 * Permite fusionar clases conflictivas inteligentemente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
