/**
 * API Response Types
 * Sistema de Gestión StrateKaz
 *
 * Tipos centralizados para respuestas de API Django REST Framework.
 * Este archivo contiene las definiciones comunes utilizadas en todas las llamadas a la API.
 */

/**
 * Respuesta paginada estándar de Django REST Framework
 *
 * @template T - Tipo de los elementos en el array results
 *
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 * }
 *
 * const response: PaginatedResponse<User> = await api.get('/users/');
 * // response.count → Total de usuarios
 * // response.results → Array de usuarios de la página actual
 * ```
 */
export interface PaginatedResponse<T> {
  /** Número total de registros en la base de datos */
  count: number;

  /** URL de la siguiente página o null si es la última página */
  next: string | null;

  /** URL de la página anterior o null si es la primera página */
  previous: string | null;

  /** Array de resultados de la página actual */
  results: T[];
}

/**
 * Respuesta de la API con datos y mensajes opcionales
 *
 * @template T - Tipo de los datos en la respuesta
 *
 * @example
 * ```typescript
 * const response: ApiResponse<User> = await api.post('/users/', userData);
 * if (response.errors) {
 *   // Errores de validación: response.errors
 * }
 * ```
 */
export interface ApiResponse<T> {
  /** Datos de la respuesta */
  data: T;

  /** Mensaje opcional de la respuesta */
  message?: string;

  /** Errores de validación por campo */
  errors?: Record<string, string[]>;
}

/**
 * Parámetros para filtrado y paginación
 *
 * @example
 * ```typescript
 * const params: FilterParams = {
 *   page: 1,
 *   page_size: 20,
 *   search: 'john',
 *   ordering: '-created_at'
 * };
 * ```
 */
export interface FilterParams {
  /** Número de página (1-indexed) */
  page?: number;

  /** Tamaño de página */
  page_size?: number;

  /** Texto de búsqueda */
  search?: string;

  /** Campo para ordenamiento (prefijo '-' para descendente) */
  ordering?: string;

  /** Filtros adicionales específicos por endpoint */
  [key: string]: any;
}

/**
 * Respuesta de error de la API
 *
 * @example
 * ```typescript
 * catch (error) {
 *   const apiError = error as ApiError;
 *   // apiError.detail contiene el mensaje de error
 * }
 * ```
 */
export interface ApiError {
  /** Mensaje de error principal */
  detail?: string;

  /** Errores de validación por campo */
  errors?: Record<string, string[]>;

  /** Código de estado HTTP */
  status?: number;

  /** Texto del estado HTTP */
  statusText?: string;
}

/**
 * Estado de una operación asíncrona
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Resultado de una operación asíncrona
 *
 * @template T - Tipo de los datos en caso de éxito
 * @template E - Tipo del error en caso de fallo (por defecto: ApiError)
 */
export interface AsyncResult<T, E = ApiError> {
  /** Estado de la operación */
  status: AsyncStatus;

  /** Datos en caso de éxito */
  data?: T;

  /** Error en caso de fallo */
  error?: E;

  /** Indica si la operación está en progreso */
  isLoading: boolean;

  /** Indica si la operación fue exitosa */
  isSuccess: boolean;

  /** Indica si la operación falló */
  isError: boolean;
}
