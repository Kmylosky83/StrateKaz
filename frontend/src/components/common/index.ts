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
export type { BadgeProps } from './Badge';

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
