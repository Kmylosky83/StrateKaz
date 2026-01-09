/**
 * Hooks reutilizables del proyecto
 * Sistema de Gestión StrateKaz
 */

export { useGenericCRUD, type CRUDOptions, type CRUDResult, type BaseEntity, type PaginatedResponse } from './useGenericCRUD';
export { useFormModal, useModal } from './useFormModal';
export { useBrandingConfig, type UseBrandingConfigReturn } from './useBrandingConfig';
export { useDynamicTheme } from './useDynamicTheme';
export { useModuleColor, type UseModuleColorReturn, type ModuleColor } from './useModuleColor';
export { useTimeElapsed, type TimeElapsedConfig, type TimeElapsedValue, type UseTimeElapsedReturn } from './useTimeElapsed';
export { useIcons, useIconsByCategory, useIconSearch, type IconRegistryItem, type IconCategory, type UseIconsReturn } from './useIcons';
