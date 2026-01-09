/**
 * Tipos comunes del sistema
 */

// Re-export common API types for convenience
export type { PaginatedResponse, ApiResponse, FilterParams } from './api.types';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export type Status = 'idle' | 'loading' | 'success' | 'error';

// Re-export base types
export * from './base.types';

// Extended select option
export interface SelectOptionWithMeta<T = string | number> extends SelectOption {
  value: T;
  icon?: string;
  description?: string;
  color?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}
