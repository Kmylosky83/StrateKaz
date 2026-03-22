/**
 * Utilidad para extraer mensajes de error de respuestas API (Axios)
 *
 * Reemplaza el patron inseguro `(error: unknown) => error?.response?.data?.detail`
 * con type-safe access usando AxiosError.
 */
import { AxiosError } from 'axios';

/**
 * Extrae un mensaje legible de un error desconocido (tipicamente de onError en mutations).
 * Soporta AxiosError con response.data.detail, .message, o campos por campo.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data === 'string') return data;
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.message === 'string') return data.message;
    if (typeof data === 'object' && data !== null) {
      const messages: string[] = [];
      for (const [field, value] of Object.entries(data)) {
        if (field === 'detail' || field === 'message') return String(value);
        if (Array.isArray(value)) messages.push(`${field}: ${value.join(', ')}`);
        else if (typeof value === 'string') messages.push(`${field}: ${value}`);
      }
      if (messages.length > 0) return messages.join('\n');
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
