/**
 * Base Types and Utility Types
 * Sistema de Gestión StrateKaz
 *
 * Tipos base genéricos para entidades del sistema, utility types avanzados,
 * branded types para validación en tiempo de compilación, y type guards.
 */

// ==================== BASE ENTITIES ====================

/**
 * Entidad base con campos de identificación y timestamps
 */
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Entidad con campos de auditoría (quién creó/modificó)
 */
export interface AuditableEntity extends BaseEntity {
  created_by?: number;
  created_by_name?: string;
  updated_by?: number;
  updated_by_name?: string;
}

/**
 * Entidad con soporte para soft delete
 */
export interface SoftDeletableEntity {
  deleted_at?: string | null;
  deleted_by?: number;
  is_deleted?: boolean;
}

/**
 * Entidad que puede ser activada/desactivada
 */
export interface ActivableEntity {
  is_active: boolean;
}

/**
 * Entidad completa con todos los campos base
 */
export interface FullEntity extends AuditableEntity, SoftDeletableEntity, ActivableEntity {}

// ==================== UTILITY TYPES FOR DTOS ====================

/**
 * DTO para creación - excluye campos generados automáticamente
 *
 * @example
 * ```typescript
 * interface Area extends BaseEntity {
 *   code: string;
 *   name: string;
 *   parent?: number;
 * }
 *
 * type CreateAreaDTO = CreateDTO<Area>;
 * // Resultado: { code: string; name: string; parent?: number }
 * ```
 */
export type CreateDTO<T extends BaseEntity> = Omit<
  T,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'created_by'
  | 'created_by_name'
  | 'updated_by'
  | 'updated_by_name'
>;

/**
 * DTO para actualización - todos los campos opcionales excepto ID
 *
 * @example
 * ```typescript
 * type UpdateAreaDTO = UpdateDTO<Area>;
 * // Resultado: { code?: string; name?: string; parent?: number }
 * ```
 */
export type UpdateDTO<T extends BaseEntity> = Partial<CreateDTO<T>>;

/**
 * DTO para listados - solo campos esenciales
 * Útil para optimizar respuestas de API con muchos registros
 */
export type ListItemDTO<T> = Pick<T, 'id'> & Partial<Omit<T, 'id'>>;

/**
 * Extrae el tipo de un array
 *
 * @example
 * ```typescript
 * type Item = ArrayElement<string[]>; // string
 * type Item = ArrayElement<User[]>; // User
 * ```
 */
export type ArrayElement<T> = T extends readonly (infer U)[]
  ? U
  : T extends (infer U)[]
    ? U
    : never;

/**
 * Hace que campos específicos sean requeridos
 *
 * @example
 * ```typescript
 * interface User { id?: number; name?: string; email?: string; }
 * type RequiredUser = RequireFields<User, 'name' | 'email'>;
 * // Resultado: { id?: number; name: string; email: string; }
 * ```
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Hace que campos específicos sean opcionales
 *
 * @example
 * ```typescript
 * interface User { id: number; name: string; email: string; }
 * type PartialUser = PartialFields<User, 'email'>;
 * // Resultado: { id: number; name: string; email?: string; }
 * ```
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extrae propiedades de un tipo que son de un tipo específico
 *
 * @example
 * ```typescript
 * interface User { id: number; name: string; age: number; active: boolean; }
 * type StringProps = PickByType<User, string>; // { name: string }
 * type NumberProps = PickByType<User, number>; // { id: number; age: number }
 * ```
 */
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/**
 * Omite propiedades de un tipo que son de un tipo específico
 */
export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

/**
 * Hace un tipo profundamente readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Hace un tipo profundamente parcial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extrae las claves de un objeto cuyo valor es un tipo específico
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// ==================== BRANDED TYPES ====================

/**
 * Símbolo único para crear branded types
 */
declare const brand: unique symbol;

/**
 * Tipo genérico para crear branded types (nominal typing)
 * Permite crear tipos distintos en tiempo de compilación aunque sean el mismo tipo en runtime
 *
 * @example
 * ```typescript
 * type UserId = Brand<number, 'UserId'>;
 * type ProductId = Brand<number, 'ProductId'>;
 *
 * function getUser(id: UserId) { ... }
 *
 * const userId = 1 as UserId;
 * const productId = 1 as ProductId;
 * getUser(userId);     // ✓ OK
 * getUser(productId);  // ✗ Error: ProductId no es asignable a UserId
 * ```
 */
export type Brand<K, T> = K & { readonly [brand]: T };

/**
 * Email validado
 */
export type Email = Brand<string, 'Email'>;

/**
 * NIT colombiano validado (formato: 123456789-0)
 */
export type NIT = Brand<string, 'NIT'>;

/**
 * Número de teléfono validado
 */
export type PhoneNumber = Brand<string, 'PhoneNumber'>;

/**
 * UUID v4 validado
 */
export type UUID = Brand<string, 'UUID'>;

/**
 * URL validada
 */
export type URL = Brand<string, 'URL'>;

/**
 * Código validado (alfanumérico, guiones y guiones bajos)
 */
export type Code = Brand<string, 'Code'>;

/**
 * Porcentaje (0-100)
 */
export type Percentage = Brand<number, 'Percentage'>;

/**
 * Entero positivo
 */
export type PositiveInteger = Brand<number, 'PositiveInteger'>;

// ==================== TYPE GUARDS ====================

/**
 * Type guard para Email
 */
export const isEmail = (value: string): value is Email => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

/**
 * Type guard para NIT colombiano (formato: 123456789-0)
 */
export const isNIT = (value: string): value is NIT => {
  return /^\d{9}-\d$/.test(value);
};

/**
 * Type guard para UUID v4
 */
export const isUUID = (value: string): value is UUID => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

/**
 * Type guard para URL válida
 */
export const isURL = (value: string): value is URL => {
  try {
    new globalThis.URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Type guard para Code (alfanumérico, guiones y guiones bajos)
 */
export const isCode = (value: string): value is Code => {
  return /^[A-Za-z0-9_-]+$/.test(value);
};

/**
 * Type guard para Percentage
 */
export const isPercentage = (value: number): value is Percentage => {
  return value >= 0 && value <= 100;
};

/**
 * Type guard para PositiveInteger
 */
export const isPositiveInteger = (value: number): value is PositiveInteger => {
  return Number.isInteger(value) && value > 0;
};

/**
 * Type guard genérico para verificar si un valor no es null ni undefined
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/**
 * Type guard para verificar si un objeto tiene una propiedad específica
 */
export const hasProperty = <T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> => {
  return key in obj;
};

// ==================== ASSERTION FUNCTIONS ====================

/**
 * Assertion function para garantizar que un valor no es null ni undefined
 *
 * @throws {Error} Si el valor es null o undefined
 *
 * @example
 * ```typescript
 * function process(value: string | null) {
 *   assertDefined(value); // Después de esto, value es de tipo string
 *   value.toUpperCase(); // value es de tipo string aquí
 * }
 * ```
 */
export function assertDefined<T>(
  value: T | undefined | null,
  message?: string
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is not defined');
  }
}

/**
 * Assertion function para validar que un valor es un Email
 */
export function assertEmail(value: string, message?: string): asserts value is Email {
  if (!isEmail(value)) {
    throw new Error(message || `Invalid email: ${value}`);
  }
}

/**
 * Assertion function para validar que un valor es un NIT
 */
export function assertNIT(value: string, message?: string): asserts value is NIT {
  if (!isNIT(value)) {
    throw new Error(message || `Invalid NIT format: ${value}`);
  }
}

// ==================== SAFE CONSTRUCTORS ====================

/**
 * Constructor seguro para Email
 * @returns Email válido o null si la validación falla
 */
export const createEmail = (value: string): Email | null => {
  return isEmail(value) ? (value as Email) : null;
};

/**
 * Constructor seguro para NIT
 * @returns NIT válido o null si la validación falla
 */
export const createNIT = (value: string): NIT | null => {
  return isNIT(value) ? (value as NIT) : null;
};

/**
 * Constructor seguro para UUID
 * @returns UUID válido o null si la validación falla
 */
export const createUUID = (value: string): UUID | null => {
  return isUUID(value) ? (value as UUID) : null;
};

/**
 * Constructor seguro para URL
 * @returns URL válida o null si la validación falla
 */
export const createURL = (value: string): URL | null => {
  return isURL(value) ? (value as URL) : null;
};

/**
 * Constructor seguro para Code
 * @returns Code válido o null si la validación falla
 */
export const createCode = (value: string): Code | null => {
  return isCode(value) ? (value as Code) : null;
};

/**
 * Constructor seguro para Percentage
 * @returns Percentage válido o null si la validación falla
 */
export const createPercentage = (value: number): Percentage | null => {
  return isPercentage(value) ? (value as Percentage) : null;
};

/**
 * Constructor seguro para PositiveInteger
 * @returns PositiveInteger válido o null si la validación falla
 */
export const createPositiveInteger = (value: number): PositiveInteger | null => {
  return isPositiveInteger(value) ? (value as PositiveInteger) : null;
};

// ==================== RESULT TYPE (FUNCTIONAL ERROR HANDLING) ====================

/**
 * Result type para manejo funcional de errores
 * Inspirado en Rust y otros lenguajes funcionales
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) {
 *     return { success: false, error: 'Division by zero' };
 *   }
 *   return { success: true, value: a / b };
 * }
 *
 * const result = divide(10, 2);
 * if (result.success) {
 *   // result.value → 5
 * } else {
 *   // result.error contiene el mensaje de error
 * }
 * ```
 */
export type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E };

/**
 * Helper para crear un Result exitoso
 */
export const success = <T>(value: T): Result<T, never> => ({
  success: true,
  value,
});

/**
 * Helper para crear un Result con error
 */
export const failure = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

/**
 * Helper para manejar un Result con exhaustive checking
 */
export const handleResult = <T, E>(
  result: Result<T, E>,
  onSuccess: (value: T) => void,
  onError: (error: E) => void
): void => {
  if (result.success) {
    onSuccess(result.value);
  } else {
    onError(result.error);
  }
};

/**
 * Transforma un Result mapeando su valor
 */
export const mapResult = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
  return result.success ? success(fn(result.value)) : result;
};

/**
 * Transforma un Result mapeando su error
 */
export const mapError = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
  return result.success ? result : failure(fn(result.error));
};
