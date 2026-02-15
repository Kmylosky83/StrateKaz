/**
 * Hooks reutilizables del proyecto
 * Sistema de Gestión StrateKaz
 */

export {
  useGenericCRUD,
  type CRUDOptions,
  type CRUDResult,
  type BaseEntity,
  type PaginatedResponse,
} from './useGenericCRUD';
export { useFormModal, useModal } from './useFormModal';
export { useBrandingConfig, type UseBrandingConfigReturn } from './useBrandingConfig';
export { useDynamicTheme } from './useDynamicTheme';
export { useModuleColor, type UseModuleColorReturn, type ModuleColor } from './useModuleColor';
export {
  useTimeElapsed,
  type TimeElapsedConfig,
  type TimeElapsedValue,
  type UseTimeElapsedReturn,
} from './useTimeElapsed';
export {
  useIcons,
  useIconsByCategory,
  useIconSearch,
  type IconRegistryItem,
  type IconCategory,
  type UseIconsReturn,
} from './useIcons';
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useBreakpoint,
  useOrientation,
  usePrefersReducedMotion,
  useHasTouch,
  BREAKPOINTS,
  type Breakpoint,
  type BreakpointState,
} from './useMediaQuery';
export {
  usePageHeader,
  type UsePageHeaderOptions,
  type UsePageHeaderReturn,
} from './usePageHeader';
export {
  usePageSections,
  type UsePageSectionsOptions,
  type UsePageSectionsReturn,
} from './usePageSections';

// Permissions (RBAC)
export {
  usePermissions,
  useIsSuperAdmin,
  useCurrentCargo,
  useIsCoordinationOrAbove,
  useIsDirection,
} from './usePermissions';

// Responsive View (table/cards toggle)
export {
  useResponsiveView,
  useAutoTableView,
  type ViewMode,
  type UseResponsiveViewOptions,
  type UseResponsiveViewReturn,
} from './useResponsiveView';

// Responsive (centralized responsive breakpoints)
export {
  useResponsive,
  useIsMobile,
  useOrientation,
  type Breakpoint,
  type ResponsiveState,
} from './useResponsive';
