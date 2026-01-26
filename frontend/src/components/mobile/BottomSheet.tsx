/**
 * BottomSheet - Modal tipo sheet desde abajo para móvil
 *
 * Componente de modal que aparece desde la parte inferior de la pantalla,
 * optimizado para dispositivos móviles con soporte de gestos.
 *
 * Características:
 * - Gesto de swipe down para cerrar
 * - Safe area insets para notch
 * - Múltiples tamaños (alturas)
 * - Handle visual para arrastrar
 * - Backdrop con blur
 * - Soporte dark mode
 */
import { Fragment, ReactNode, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useIsMobile } from '@/hooks/useMediaQuery';

export interface BottomSheetProps {
  /** Estado de apertura */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Título del sheet */
  title?: string;
  /** Contenido del sheet */
  children: ReactNode;
  /** Altura del sheet */
  height?: 'auto' | 'half' | 'full' | 'fit';
  /** Mostrar handle para arrastrar */
  showHandle?: boolean;
  /** Mostrar botón de cerrar */
  showCloseButton?: boolean;
  /** Permitir cerrar con swipe */
  swipeToClose?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

const heightClasses = {
  auto: 'max-h-[85vh]',
  half: 'h-[50vh]',
  full: 'h-[95vh]',
  fit: 'max-h-[85vh]',
};

export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
  showCloseButton = true,
  swipeToClose = true,
  className,
}: BottomSheetProps) => {
  const isMobile = useIsMobile();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Motion values para el gesto de swipe
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);

  // Threshold para cerrar (50% del sheet o 150px)
  const closeThreshold = 150;

  // Handler para el gesto de pan/drag
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!swipeToClose) return;

      const shouldClose = info.velocity.y > 500 || info.offset.y > closeThreshold;

      if (shouldClose) {
        onClose();
      }
    },
    [swipeToClose, onClose]
  );

  // Si no es móvil, no renderizar el BottomSheet
  // (el componente padre debería usar Modal normal)
  if (!isMobile) {
    return null;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ opacity }}
          />
        </Transition.Child>

        {/* Container */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full items-end justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="translate-y-full opacity-0"
              enterTo="translate-y-0 opacity-100"
              leave="ease-in duration-200"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo="translate-y-full opacity-0"
            >
              <Dialog.Panel
                as={motion.div}
                ref={sheetRef}
                drag={swipeToClose ? 'y' : false}
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={handleDragEnd}
                style={{ y }}
                className={cn(
                  // Base
                  'w-full transform',
                  // Bordes redondeados arriba
                  'rounded-t-3xl',
                  // Fondo
                  'bg-white dark:bg-gray-800',
                  // Sombra
                  'shadow-2xl',
                  // Altura según prop
                  heightClasses[height],
                  // Flex column para layout interno
                  'flex flex-col',
                  // Safe area para dispositivos con home indicator
                  'pb-[env(safe-area-inset-bottom)]',
                  // Overflow
                  'overflow-hidden',
                  className
                )}
              >
                {/* Handle para arrastrar */}
                {showHandle && (
                  <div className="flex-shrink-0 pt-3 pb-2">
                    <div
                      className={cn(
                        'mx-auto w-12 h-1.5 rounded-full',
                        'bg-gray-300 dark:bg-gray-600',
                        swipeToClose && 'cursor-grab active:cursor-grabbing'
                      )}
                    />
                  </div>
                )}

                {/* Header con título */}
                {(title || showCloseButton) && (
                  <div
                    className={cn(
                      'flex items-center justify-between px-4 py-3 flex-shrink-0',
                      'border-b border-gray-200 dark:border-gray-700'
                    )}
                  >
                    {title && (
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                      >
                        {title}
                      </Dialog.Title>
                    )}
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className={cn(
                          // Touch target mínimo
                          'p-2 -m-2',
                          'rounded-full',
                          'text-gray-500 dark:text-gray-400',
                          'hover:bg-gray-100 dark:hover:bg-gray-700',
                          'active:scale-95',
                          'transition-all duration-200'
                        )}
                        aria-label="Cerrar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Contenido scrollable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export type { BottomSheetProps };
