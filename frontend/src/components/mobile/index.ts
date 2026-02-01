/**
 * Mobile Components
 *
 * Componentes optimizados para experiencia móvil nativa.
 * Estos componentes se muestran únicamente en pantallas < 768px.
 *
 * Uso:
 * ```tsx
 * import {
 *   BottomNavigation,
 *   BottomSheet,
 *   ResponsiveModal,
 *   MobileTableCard,
 *   MobileTableCardList,
 * } from '@/components/mobile';
 * ```
 */

// Bottom Navigation (app-like bottom nav bar)
export { BottomNavigation } from './BottomNavigation';
export type { BottomNavigationProps, BottomNavItem } from './BottomNavigation';

// Bottom Sheet (modal from bottom with swipe)
export { BottomSheet } from './BottomSheet';
export type { BottomSheetProps } from './BottomSheet';

// Responsive Modal (auto-switches between Modal and BottomSheet)
export { ResponsiveModal } from './ResponsiveModal';
export type { ResponsiveModalProps } from './ResponsiveModal';

// Mobile Table Card (table rows as cards)
export { MobileTableCard, MobileTableCardList } from './MobileTableCard';
export type {
  MobileTableCardProps,
  MobileCardField,
  MobileTableCardListProps,
} from './MobileTableCard';
