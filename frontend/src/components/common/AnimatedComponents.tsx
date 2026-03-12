/**
 * Componentes Animados - Design System
 *
 * Wrappers de Framer Motion para componentes comunes
 * Uso: Reemplazar componentes estáticos por estos para animaciones
 */
import { ReactNode, forwardRef } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import {
  pageVariants,
  modalVariants,
  backdropVariants,
  cardHoverVariants,
  cardEnterVariants,
  listContainerVariants,
  listItemVariants,
  tableRowVariants,
  toastVariants,
  dropdownVariants,
  collapseVariants,
  fadeVariants,
  skeletonVariants,
  sidebarVariants,
  respectMotionPreference,
} from '@/lib/animations';

// ============================================
// ANIMATED PAGE
// ============================================

interface AnimatedPageProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

/**
 * Wrapper para páginas con animación de entrada/salida
 *
 * @example
 * <AnimatedPage>
 *   <h1>Mi Página</h1>
 * </AnimatedPage>
 */
export const AnimatedPage = forwardRef<HTMLDivElement, AnimatedPageProps>(
  ({ children, className = '', ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={respectMotionPreference(pageVariants)}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedPage.displayName = 'AnimatedPage';

// ============================================
// ANIMATED MODAL
// ============================================

interface AnimatedModalBackdropProps {
  isOpen: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

/**
 * Backdrop animado para modales
 *
 * @example
 * <AnimatedModalBackdrop isOpen={isOpen} onClick={onClose}>
 *   <AnimatedModalContent>
 *     {content}
 *   </AnimatedModalContent>
 * </AnimatedModalBackdrop>
 */
export const AnimatedModalBackdrop = ({
  isOpen,
  onClick,
  children,
}: AnimatedModalBackdropProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        variants={backdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClick}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

interface AnimatedModalContentProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
}

const modalSizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-[95vw]',
};

/**
 * Contenido animado del modal
 */
export const AnimatedModalContent = forwardRef<HTMLDivElement, AnimatedModalContentProps>(
  ({ children, size = 'md', className = '', ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={modalVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={(e) => e.stopPropagation()}
      className={`
        w-full ${modalSizeClasses[size]}
        bg-white dark:bg-gray-800
        rounded-2xl shadow-xl
        max-h-[90vh] overflow-hidden
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedModalContent.displayName = 'AnimatedModalContent';

// ============================================
// ANIMATED CARD
// ============================================

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  hover?: boolean;
  enter?: boolean;
}

/**
 * Card con animaciones opcionales de hover y entrada
 *
 * @example
 * <AnimatedCard hover enter>
 *   <CardContent />
 * </AnimatedCard>
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, hover = false, enter = false, className = '', ...props }, ref) => {
    const variants = enter ? cardEnterVariants : hover ? cardHoverVariants : undefined;

    return (
      <motion.div
        ref={ref}
        variants={variants}
        initial={enter ? 'initial' : undefined}
        animate={enter ? 'animate' : undefined}
        whileHover={hover ? 'hover' : undefined}
        whileTap={hover ? 'tap' : undefined}
        className={`
          bg-white dark:bg-gray-800
          rounded-xl shadow-sm
          border border-gray-200 dark:border-gray-700
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = 'AnimatedCard';

// ============================================
// ANIMATED LIST
// ============================================

interface AnimatedListProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

/**
 * Contenedor de lista con stagger animation
 *
 * @example
 * <AnimatedList>
 *   {items.map(item => (
 *     <AnimatedListItem key={item.id}>
 *       {item.content}
 *     </AnimatedListItem>
 *   ))}
 * </AnimatedList>
 */
export const AnimatedList = forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ children, className = '', ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={listContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedList.displayName = 'AnimatedList';

interface AnimatedListItemProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

/**
 * Item de lista animado
 */
export const AnimatedListItem = forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ children, className = '', ...props }, ref) => (
    <motion.div ref={ref} variants={listItemVariants} className={className} {...props}>
      {children}
    </motion.div>
  )
);
AnimatedListItem.displayName = 'AnimatedListItem';

// ============================================
// ANIMATED TABLE ROW
// ============================================

interface AnimatedTableRowProps extends HTMLMotionProps<'tr'> {
  children: ReactNode;
}

/**
 * Fila de tabla animada con hover
 *
 * @example
 * <tbody>
 *   {rows.map(row => (
 *     <AnimatedTableRow key={row.id}>
 *       <td>{row.name}</td>
 *     </AnimatedTableRow>
 *   ))}
 * </tbody>
 */
export const AnimatedTableRow = forwardRef<HTMLTableRowElement, AnimatedTableRowProps>(
  ({ children, className = '', ...props }, ref) => (
    <motion.tr
      ref={ref}
      variants={tableRowVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      className={className}
      {...props}
    >
      {children}
    </motion.tr>
  )
);
AnimatedTableRow.displayName = 'AnimatedTableRow';

// ============================================
// ANIMATED TOAST
// ============================================

interface AnimatedToastProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  isVisible: boolean;
}

/**
 * Toast notification animado
 *
 * @example
 * <AnimatedToast isVisible={showToast}>
 *   <ToastContent />
 * </AnimatedToast>
 */
export const AnimatedToast = ({
  children,
  isVisible,
  className = '',
  ...props
}: AnimatedToastProps) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        variants={toastVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================
// ANIMATED DROPDOWN
// ============================================

interface AnimatedDropdownProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  isOpen: boolean;
}

/**
 * Dropdown menu animado
 *
 * @example
 * <AnimatedDropdown isOpen={isOpen}>
 *   <DropdownItem>Opción 1</DropdownItem>
 *   <DropdownItem>Opción 2</DropdownItem>
 * </AnimatedDropdown>
 */
export const AnimatedDropdown = ({
  children,
  isOpen,
  className = '',
  ...props
}: AnimatedDropdownProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        variants={dropdownVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`
          absolute z-50
          bg-white dark:bg-gray-800
          rounded-lg shadow-lg
          border border-gray-200 dark:border-gray-700
          py-1
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================
// ANIMATED COLLAPSE
// ============================================

interface AnimatedCollapseProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  isOpen: boolean;
}

/**
 * Contenido colapsable animado
 *
 * @example
 * <AnimatedCollapse isOpen={isExpanded}>
 *   <CollapsedContent />
 * </AnimatedCollapse>
 */
export const AnimatedCollapse = ({
  children,
  isOpen,
  className = '',
  ...props
}: AnimatedCollapseProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        variants={collapseVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`overflow-hidden ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================
// ANIMATED SIDEBAR
// ============================================

interface AnimatedSidebarProps extends HTMLMotionProps<'aside'> {
  children: ReactNode;
  isCollapsed: boolean;
}

/**
 * Sidebar con animación de colapso
 *
 * @example
 * <AnimatedSidebar isCollapsed={isCollapsed}>
 *   <SidebarContent />
 * </AnimatedSidebar>
 */
export const AnimatedSidebar = forwardRef<HTMLElement, AnimatedSidebarProps>(
  ({ children, isCollapsed, className = '', ...props }, ref) => (
    <motion.aside
      ref={ref}
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      className={`
        h-screen overflow-hidden
        bg-white dark:bg-gray-800
        border-r border-gray-200 dark:border-gray-700
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.aside>
  )
);
AnimatedSidebar.displayName = 'AnimatedSidebar';

// ============================================
// FADE IN
// ============================================

interface FadeInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
}

/**
 * Wrapper simple de fade in
 *
 * @example
 * <FadeIn delay={0.2}>
 *   <Content />
 * </FadeIn>
 */
export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, className = '', ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FadeIn.displayName = 'FadeIn';

// ============================================
// SKELETON LOADER
// ============================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

/**
 * Skeleton loader con animación pulse
 *
 * @example
 * <Skeleton width={200} height={20} />
 * <Skeleton className="w-full h-10" rounded="lg" />
 */
export const Skeleton = ({ className = '', width, height, rounded = 'md' }: SkeletonProps) => (
  <motion.div
    variants={skeletonVariants}
    initial="initial"
    animate="animate"
    className={`
      bg-gray-200 dark:bg-gray-700
      ${roundedClasses[rounded]}
      ${className}
    `}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    }}
  />
);

// ============================================
// PULSE LOADER
// ============================================

interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'gray' | 'white';
}

const pulseSize = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const pulseColor = {
  primary: 'bg-primary-500',
  gray: 'bg-gray-500',
  white: 'bg-white',
};

/**
 * Loader de 3 puntos con animación
 *
 * @example
 * <PulseLoader size="md" color="primary" />
 */
export const PulseLoader = ({ size = 'md', color = 'primary' }: PulseLoaderProps) => (
  <div className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className={`${pulseSize[size]} ${pulseColor[color]} rounded-full`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.15,
        }}
      />
    ))}
  </div>
);

// ============================================
// PRESENCE WRAPPER
// ============================================

interface PresenceProps {
  children: ReactNode;
  mode?: 'sync' | 'wait' | 'popLayout';
}

/**
 * Wrapper para AnimatePresence con configuración predefinida
 *
 * @example
 * <Presence>
 *   {showComponent && <AnimatedComponent key="unique" />}
 * </Presence>
 */
export const Presence = ({ children, mode = 'wait' }: PresenceProps) => (
  <AnimatePresence mode={mode}>{children}</AnimatePresence>
);

// ============================================
// RE-EXPORTS
// ============================================

// eslint-disable-next-line react-refresh/only-export-components
export { AnimatePresence, motion } from 'framer-motion';
