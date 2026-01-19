/**
 * Common Components
 *
 * Componentes UI reutilizables del Design System.
 *
 * Uso tipico:
 *
 * ```tsx
 * import {
 *   Button,
 *   Badge,
 *   Card,
 *   Modal,
 *   Spinner,
 *   ConfirmDialog,
 *   Alert,
 *   EmptyState,
 *   Tooltip,
 *   Dropdown,
 *   Avatar,
 *   Tabs,
 *   SelectionCard,
 *   SelectionCardGrid,
 *   Typography,
 * } from '@/components/common';
 * ```
 */

// Core components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Badge } from './Badge';
export type { BadgeVariant, BadgeSize } from './Badge';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

// Dialog & Feedback
export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';

export { Alert } from './Alert';
export type { AlertProps } from './Alert';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

// Overlay & Navigation
export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export { Dropdown } from './Dropdown';
export type { DropdownProps, DropdownItem } from './Dropdown';

export { Tabs } from './Tabs';
export type { TabsProps, Tab } from './Tabs';

// Display
export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

// Selection Cards (for Gestion Integral and navigation)
export {
  SelectionCard,
  SelectionCardGrid,
  SelectionCardDefault,
  SelectionCardGradient,
  SelectionCardGlass,
  SelectionCardGlow,
} from './SelectionCard';
export type {
  SelectionCardProps,
  SelectionCardGridProps,
  SelectionCardVariant,
  SelectionCardColor,
} from './SelectionCard';

// Typography
export {
  Typography,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  BodyText,
  BodyLarge,
  BodySmall,
  Label,
  Caption,
  Overline,
} from './Typography';
export type { TypographyProps } from './Typography';

// Animated Components (Framer Motion)
export {
  AnimatedPage,
  AnimatedModalBackdrop,
  AnimatedModalContent,
  AnimatedCard,
  AnimatedList,
  AnimatedListItem,
  AnimatedTableRow,
  AnimatedToast,
  AnimatedDropdown,
  AnimatedCollapse,
  AnimatedSidebar,
  FadeIn,
  Skeleton,
  PulseLoader,
  Presence,
  AnimatePresence,
  motion,
} from './AnimatedComponents';

// Protected Components (RBAC)
export {
  ProtectedAction,
  SuperAdminOnly,
  CoordinationOnly,
  DirectionOnly,
  withProtection,
} from './ProtectedAction';
export type { default as ProtectedActionProps } from './ProtectedAction';

// Navigation & Routing
export { SmartRedirect } from './SmartRedirect';

export { SubNavigation } from './SubNavigation';
export type { SubNavigationProps, SubNavigationItem } from './SubNavigation';

// Feature Toggle Cards (for module/feature flags)
export { FeatureToggleCard, FeatureToggleGrid } from './FeatureToggleCard';
export type {
  FeatureToggleCardProps,
  FeatureToggleGridProps,
  FeatureToggleColor,
  FeatureToggleLayout,
} from './FeatureToggleCard';

// Dynamic Sections (API-driven sub-navigation)
export { DynamicSections } from './DynamicSections';
export type { DynamicSectionsProps } from './DynamicSections';

// Module Card (Dashboard modules with animated hover)
export { ModuleCard, ModuleCardSkeleton, ModuleGrid } from './ModuleCard';
export type { ModuleCardProps, ModuleCardColor } from './ModuleCard';

// Time Elapsed Display (Real-time uptime counter)
export { TimeElapsedDisplay } from './TimeElapsedDisplay';
export type {
  TimeElapsedDisplayProps,
  TimeElapsedVariant,
  TimeElapsedSize,
} from './TimeElapsedDisplay';

// PWA Offline Indicator
export { OfflineIndicator, useOnlineStatus } from './OfflineIndicator';
export type { OfflineIndicatorProps } from './OfflineIndicator';

// PWA Splash Screen (branding loader)
export { SplashScreen } from './SplashScreen';
export type { SplashScreenProps } from './SplashScreen';

// Dynamic Icons (API-driven icon system)
export {
  DynamicIcon,
  isValidIconName,
  getAvailableIconNames,
  getIconComponent,
} from './DynamicIcon';
export type { DynamicIconProps } from './DynamicIcon';

// Icon Picker (for selecting icons from DB)
export { IconPicker } from './IconPicker';
export type { IconPickerProps } from './IconPicker';

// Header Components (contextual navigation)
export { SearchModal, useSearchModal } from './SearchModal';
export type { SearchModalProps } from './SearchModal';

export { UserMenu } from './UserMenu';
export type { UserMenuProps } from './UserMenu';

export { HeaderTabs } from './HeaderTabs';
export type { HeaderTabsProps } from './HeaderTabs';

// Section Header (title + contextual actions)
export { SectionHeader } from './SectionHeader';
export type { SectionHeaderProps } from './SectionHeader';

// Generic Section Fallback (MM-002: for unimplemented sections)
export { GenericSectionFallback } from './GenericSectionFallback';
export type { GenericSectionFallbackProps } from './GenericSectionFallback';
