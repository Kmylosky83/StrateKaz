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

/** @deprecated Usar BaseModal de @/components/modals/BaseModal. Se mantiene solo para módulos inactivos (L15+). */
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

export { TenantSwitcher } from './TenantSwitcher';
export type { TenantSwitcherProps } from './TenantSwitcher';

export { HeaderTabs } from './HeaderTabs';
export type { HeaderTabsProps } from './HeaderTabs';

// Section Header (title + contextual actions)
export { SectionHeader } from './SectionHeader';
export type { SectionHeaderProps } from './SectionHeader';

// Generic Section Fallback (MM-002: for unimplemented sections)
export { GenericSectionFallback } from './GenericSectionFallback';
export type { GenericSectionFallbackProps } from './GenericSectionFallback';

// Action Buttons (RBAC-aware action buttons)
export { ActionButtons } from './ActionButtons';
export type { ActionButtonsProps } from './ActionButtons';

// Branded Skeleton (loading with company logo)
export { BrandedSkeleton } from './BrandedSkeleton';
export type { BrandedSkeletonProps } from './BrandedSkeleton';

// Analytics & Metrics Components (KPI Dashboard)
export { MetricCard } from './MetricCard';
export type { MetricCardProps } from './MetricCard';

export { GaugeProgress } from './GaugeProgress';
export type { GaugeProgressProps } from './GaugeProgress';

export { ColorLegend } from './ColorLegend';
export type { ColorLegendProps, LegendItem } from './ColorLegend';

export { Progress } from './Progress';
export type { ProgressProps } from './Progress';

// View Toggle (Dashboard/Kanban, List/Grid switcher)
export { ViewToggle } from './ViewToggle';
export type { ViewToggleProps, ViewToggleOption } from './ViewToggle';

// Table (TanStack Table wrapper)
export { Table } from './Table';
export type { TableProps } from './Table';

// Responsive Table (Mobile-first adaptive table with card view)
export { ResponsiveTable } from './ResponsiveTable';
export type { ResponsiveTableProps, ResponsiveTableColumn } from './ResponsiveTable';

// Mobile Card List (Card view for mobile tables)
export { MobileCardList, MobileCardListItem } from './MobileCardList';
export type { MobileCardListProps } from './MobileCardList';

// Pagination
export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';

// Toast (Sonner wrapper)
export { toast, Toaster } from './Toast';
export type { ToastOptions, PromiseOptions } from './Toast';

// Breadcrumbs
export { Breadcrumbs } from './Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './Breadcrumbs';

// Multi-Tenant
export { TenantSelector } from './TenantSelector';

// Error Handling
export { ErrorBoundary } from './ErrorBoundary';

// KPI Cards (replaces 110+ inline stat cards across HSEQ/Cumplimiento/Riesgos/TalentHub)
export { KpiCard, KpiCardGrid, KpiCardSkeleton } from './KpiCard';
export type { KpiCardProps, KpiCardGridProps, KpiCardSkeletonProps, KpiCardColor } from './KpiCard';

// Section Toolbar (replaces toolbar pattern in 20+ sections)
export { SectionToolbar } from './SectionToolbar';
export type { SectionToolbarProps, SectionToolbarAction } from './SectionToolbar';

// Status Badge (smart status-to-color badge, replaces formatEstado + getBadgeVariant in 15+ tables)
export { StatusBadge, formatStatusLabel } from './StatusBadge';
export type { StatusBadgeProps, StatusPreset } from './StatusBadge';

// DataGrid (Table + SectionToolbar combined, replaces manual HTML tables in 20+ sections)
export { DataGrid } from './DataGrid';
export type { DataGridProps } from './DataGrid';

// DynamicFormRenderer (renders forms from CampoFormulario backend definitions)
export { DynamicFormRenderer, validateDynamicForm } from './DynamicFormRenderer';
export type { DynamicFieldDefinition, DynamicFormRendererProps } from './DynamicFormRenderer';

// FormBuilder (visual form builder for CampoFormulario)
export { FormBuilder } from './FormBuilder';
export type { FormBuilderProps } from './FormBuilder';

// Export Button (CSV/Excel download from ViewSets with ExportMixin)
export { ExportButton } from './ExportButton';
export type { ExportButtonProps } from './ExportButton';

// Evidence (Centralized Evidence Hub - cross-module file attachments)
export { EvidenceUploader } from './EvidenceUploader';
export type { EvidenceUploaderProps } from './EvidenceUploader';

export { EvidenceGallery } from './EvidenceGallery';
export type { EvidenceGalleryProps } from './EvidenceGallery';

export { EvidenceTimeline } from './EvidenceTimeline';
export type { EvidenceTimelineProps } from './EvidenceTimeline';

// AI Assistant (contextual help + text assist)
export { AIAssistantButton } from './AIAssistantButton';
export type { AIAssistantButtonProps } from './AIAssistantButton';

export { AIHelpModal } from './AIHelpModal';
export type { AIHelpModalProps } from './AIHelpModal';

// Profile Completeness Bar (Mi Portal + Header badge)
export { ProfileProgressBar } from './ProfileProgressBar';
export type { ProfileProgressBarProps } from './ProfileProgressBar';
