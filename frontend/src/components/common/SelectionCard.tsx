/**
 * SelectionCard Component
 *
 * Tarjetas interactivas para selección de módulos con efectos premium.
 * Usa Framer Motion para animaciones suaves y profesionales.
 */
import React, { useState, useRef, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SelectionCardVariant = 'default' | 'gradient' | 'glass' | 'glow';
export type SelectionCardColor = 'purple' | 'blue' | 'green' | 'orange' | 'teal' | 'gray' | 'red';

export interface SelectionCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  variant?: SelectionCardVariant;
  color?: SelectionCardColor;
  disabled?: boolean;
  className?: string;
  /** Layout compacto: icono y título en horizontal */
  compact?: boolean;
}

export interface SelectionCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

// ============================================================================
// COLOR CONFIGURATIONS
// ============================================================================

const colorVariants: Record<SelectionCardColor, {
  gradient: string;
  gradientHover: string;
  glow: string;
  glowIntense: string;
  iconBg: string;
  text: string;
  border: string;
  borderHover: string;
}> = {
  purple: {
    gradient: 'from-purple-500/20 via-purple-400/10 to-transparent',
    gradientHover: 'from-purple-500/30 via-purple-400/20 to-purple-500/10',
    glow: 'shadow-purple-500/20',
    glowIntense: 'shadow-purple-500/40',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    borderHover: 'hover:border-purple-400 dark:hover:border-purple-600',
  },
  blue: {
    gradient: 'from-blue-500/20 via-blue-400/10 to-transparent',
    gradientHover: 'from-blue-500/30 via-blue-400/20 to-blue-500/10',
    glow: 'shadow-blue-500/20',
    glowIntense: 'shadow-blue-500/40',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    borderHover: 'hover:border-blue-400 dark:hover:border-blue-600',
  },
  green: {
    gradient: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
    gradientHover: 'from-emerald-500/30 via-emerald-400/20 to-emerald-500/10',
    glow: 'shadow-emerald-500/20',
    glowIntense: 'shadow-emerald-500/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
  },
  orange: {
    gradient: 'from-orange-500/20 via-orange-400/10 to-transparent',
    gradientHover: 'from-orange-500/30 via-orange-400/20 to-orange-500/10',
    glow: 'shadow-orange-500/20',
    glowIntense: 'shadow-orange-500/40',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    borderHover: 'hover:border-orange-400 dark:hover:border-orange-600',
  },
  teal: {
    gradient: 'from-teal-500/20 via-teal-400/10 to-transparent',
    gradientHover: 'from-teal-500/30 via-teal-400/20 to-teal-500/10',
    glow: 'shadow-teal-500/20',
    glowIntense: 'shadow-teal-500/40',
    iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    borderHover: 'hover:border-teal-400 dark:hover:border-teal-600',
  },
  gray: {
    gradient: 'from-gray-500/20 via-gray-400/10 to-transparent',
    gradientHover: 'from-gray-500/30 via-gray-400/20 to-gray-500/10',
    glow: 'shadow-gray-500/20',
    glowIntense: 'shadow-gray-500/40',
    iconBg: 'bg-gray-100 dark:bg-gray-700/30',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    borderHover: 'hover:border-gray-400 dark:hover:border-gray-500',
  },
  red: {
    gradient: 'from-red-500/20 via-red-400/10 to-transparent',
    gradientHover: 'from-red-500/30 via-red-400/20 to-red-500/10',
    glow: 'shadow-red-500/20',
    glowIntense: 'shadow-red-500/40',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    borderHover: 'hover:border-red-400 dark:hover:border-red-600',
  },
};

// ============================================================================
// SELECTION CARD COMPONENT
// ============================================================================

export function SelectionCard({
  icon: Icon,
  title,
  subtitle,
  href,
  onClick,
  variant = 'default',
  color = 'blue',
  disabled = false,
  className = '',
  compact = false,
}: SelectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values para tracking suave del mouse
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Configuración de spring para animaciones ultra-suaves
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };

  // Animaciones con spring - muy sutiles (±2 grados)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [2, -2]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-2, 2]), springConfig);
  const scale = useSpring(1, springConfig);

  // Efecto de brillo sutil
  const shineX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);
  const shineY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-15, 15]), springConfig);

  // Manejo del mouse con coordenadas normalizadas
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || disabled) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovered(true);
      scale.set(1.02);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const colors = colorVariants[color];

  // Detectar si no tiene subtitle para usar layout compacto automático
  const useCompactLayout = compact || !subtitle;

  // Clases específicas por variante
  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return cn(
          'bg-gradient-to-br',
          colors.gradient,
          'backdrop-blur-sm',
          'border border-white/20 dark:border-gray-700/50'
        );
      case 'glass':
        return cn(
          'bg-white/70 dark:bg-gray-800/70',
          'backdrop-blur-xl backdrop-saturate-150',
          'border border-white/30 dark:border-gray-700/30'
        );
      case 'glow':
        return cn(
          'bg-gradient-to-br from-white via-white to-gray-50',
          'dark:from-gray-800 dark:via-gray-800 dark:to-gray-900',
          'border',
          colors.border
        );
      default:
        return cn(
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          colors.borderHover
        );
    }
  };

  // Wrapper de contenido
  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (href && !disabled) {
      return (
        <Link to={href} className="block h-full">
          {children}
        </Link>
      );
    }
    return <div onClick={handleClick} className="h-full">{children}</div>;
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden',
        useCompactLayout ? 'rounded-xl' : 'rounded-2xl',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        getVariantClasses(),
        'group',
        className
      )}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      animate={{
        boxShadow: isHovered
          ? '0 15px 30px -10px rgba(0, 0, 0, 0.12)'
          : '0 2px 8px -2px rgba(0, 0, 0, 0.06)',
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Efecto de brillo sutil */}
      <motion.div
        className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/0 via-white/15 to-white/0 dark:via-white/5"
        style={{ x: shineX, y: shineY }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        aria-hidden="true"
      />

      {/* Overlay de gradiente en hover */}
      <motion.div
        className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', colors.gradientHover)}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        aria-hidden="true"
      />

      {/* Contenido */}
      <ContentWrapper>
        {useCompactLayout ? (
          // Layout compacto: horizontal
          <div className="relative z-10 p-3 sm:p-4 flex items-center gap-3">
            {/* Icono */}
            <motion.div
              className={cn(
                'flex-shrink-0 inline-flex items-center justify-center rounded-lg',
                'w-9 h-9 sm:w-10 sm:h-10',
                colors.iconBg
              )}
              animate={{
                scale: isHovered ? 1.08 : 1,
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Icon
                className={cn('w-4 h-4 sm:w-5 sm:h-5', colors.text)}
                strokeWidth={2}
              />
            </motion.div>

            {/* Título */}
            <h3 className="font-heading font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate flex-grow">
              {title}
            </h3>

            {/* Flecha */}
            <motion.div
              className={cn('flex-shrink-0', colors.text)}
              animate={{
                opacity: isHovered ? 1 : 0.3,
                x: isHovered ? 2 : 0,
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </div>
        ) : (
          // Layout vertical (con subtitle)
          <div className="relative z-10 h-full flex flex-col p-5 sm:p-6">
            {/* Contenedor del icono */}
            <motion.div
              className={cn(
                'inline-flex items-center justify-center rounded-xl',
                'w-12 h-12 sm:w-14 sm:h-14',
                colors.iconBg,
                'mb-3'
              )}
              animate={{
                scale: isHovered ? 1.05 : 1,
                rotate: isHovered ? 3 : 0,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Icon
                className={cn('w-6 h-6 sm:w-7 sm:h-7', colors.text)}
                strokeWidth={2}
              />
            </motion.div>

            {/* Título */}
            <h3 className="font-heading font-bold text-lg sm:text-xl text-gray-900 dark:text-white mb-1">
              {title}
            </h3>

            {/* Subtítulo */}
            <p className="font-body text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-grow">
              {subtitle}
            </p>

            {/* Indicador de flecha */}
            <motion.div
              className={cn(
                'inline-flex items-center gap-1.5',
                colors.text,
                'font-medium text-sm mt-3'
              )}
              animate={{
                opacity: isHovered ? 1 : 0,
                x: isHovered ? 0 : -12,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <span>Acceder</span>
              <motion.svg
                className="w-3.5 h-3.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ x: isHovered ? 3 : 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            </motion.div>
          </div>
        )}
      </ContentWrapper>

      {/* Anillo de focus para accesibilidad */}
      <div
        className={cn(
          'absolute inset-0',
          useCompactLayout ? 'rounded-xl' : 'rounded-2xl',
          'ring-2 ring-offset-2',
          'opacity-0 focus-within:opacity-100',
          'transition-opacity duration-300',
          'pointer-events-none',
          color === 'purple' && 'ring-purple-500',
          color === 'blue' && 'ring-blue-500',
          color === 'green' && 'ring-emerald-500',
          color === 'orange' && 'ring-orange-500',
          color === 'teal' && 'ring-teal-500',
          color === 'gray' && 'ring-gray-500',
          color === 'red' && 'ring-red-500'
        )}
        aria-hidden="true"
      />
    </motion.div>
  );
}

// ============================================================================
// SELECTION CARD GRID COMPONENT
// ============================================================================

export function SelectionCardGrid({
  children,
  columns = 2,
  className = '',
}: SelectionCardGridProps) {
  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  return (
    <div
      className={cn(
        'grid',
        gridColumns[columns],
        'gap-3',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// PRESET VARIANTS
// ============================================================================

export function SelectionCardDefault(props: Omit<SelectionCardProps, 'variant'>) {
  return <SelectionCard {...props} variant="default" />;
}

export function SelectionCardGradient(props: Omit<SelectionCardProps, 'variant'>) {
  return <SelectionCard {...props} variant="gradient" />;
}

export function SelectionCardGlass(props: Omit<SelectionCardProps, 'variant'>) {
  return <SelectionCard {...props} variant="glass" />;
}

export function SelectionCardGlow(props: Omit<SelectionCardProps, 'variant'>) {
  return <SelectionCard {...props} variant="glow" />;
}
