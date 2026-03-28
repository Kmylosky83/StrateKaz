/**
 * ResponsiveModal - Modal adaptativo Desktop/Mobile
 *
 * Componente que renderiza automáticamente:
 * - Desktop/Tablet: Modal centrado tradicional
 * - Mobile: BottomSheet con swipe to close
 *
 * Uso:
 * ```tsx
 * <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Editar">
 *   <form>...</form>
 * </ResponsiveModal>
 * ```
 */
import { ReactNode } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { BottomSheet } from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

export interface ResponsiveModalProps {
  /** Estado de apertura */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Título del modal/sheet */
  title: string;
  /** Contenido */
  children: ReactNode;
  /** Tamaño del modal en desktop */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  /** Altura del BottomSheet en móvil */
  mobileHeight?: 'auto' | 'half' | 'full' | 'fit';
  /** Mostrar botón de cerrar */
  showCloseButton?: boolean;
  /** Permitir swipe to close en móvil */
  swipeToClose?: boolean;
  /** Forzar un tipo específico (ignorar responsive) */
  forceType?: 'modal' | 'sheet';
}

export const ResponsiveModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  mobileHeight = 'auto',
  showCloseButton = true,
  swipeToClose = true,
  forceType,
}: ResponsiveModalProps) => {
  const isMobile = useIsMobile();

  // Determinar qué tipo renderizar
  const shouldUseSheet = forceType === 'sheet' || (forceType !== 'modal' && isMobile);

  if (shouldUseSheet) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        height={mobileHeight}
        showCloseButton={showCloseButton}
        swipeToClose={swipeToClose}
      >
        {children}
      </BottomSheet>
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      showCloseButton={showCloseButton}
    >
      {children}
    </BaseModal>
  );
};
