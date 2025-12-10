import React, { useState, useRef, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SelectionCardVariant = 'default' | 'gradient' | 'glass' | 'glow';
export type SelectionCardColor = 'purple' | 'blue' | 'green' | 'orange';

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
}

export interface SelectionCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
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
  iconBgHover: string;
  text: string;
  border: string;
  borderHover: string;
  shine: string;
}> = {
  purple: {
    gradient: 'from-purple-500/20 via-purple-400/10 to-transparent',
    gradientHover: 'from-purple-500/30 via-purple-400/20 to-purple-500/10',
    glow: 'shadow-purple-500/20',
    glowIntense: 'shadow-purple-500/40',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconBgHover: 'group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    borderHover: 'hover:border-purple-400 dark:hover:border-purple-600',
    shine: 'via-purple-200/60',
  },
  blue: {
    gradient: 'from-blue-500/20 via-blue-400/10 to-transparent',
    gradientHover: 'from-blue-500/30 via-blue-400/20 to-blue-500/10',
    glow: 'shadow-blue-500/20',
    glowIntense: 'shadow-blue-500/40',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconBgHover: 'group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    borderHover: 'hover:border-blue-400 dark:hover:border-blue-600',
    shine: 'via-blue-200/60',
  },
  green: {
    gradient: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
    gradientHover: 'from-emerald-500/30 via-emerald-400/20 to-emerald-500/10',
    glow: 'shadow-emerald-500/20',
    glowIntense: 'shadow-emerald-500/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconBgHover: 'group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    shine: 'via-emerald-200/60',
  },
  orange: {
    gradient: 'from-orange-500/20 via-orange-400/10 to-transparent',
    gradientHover: 'from-orange-500/30 via-orange-400/20 to-orange-500/10',
    glow: 'shadow-orange-500/20',
    glowIntense: 'shadow-orange-500/40',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconBgHover: 'group-hover:bg-orange-200 dark:group-hover:bg-orange-800/40',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    borderHover: 'hover:border-orange-400 dark:hover:border-orange-600',
    shine: 'via-orange-200/60',
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
}: SelectionCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Parallax tilt effect on mouse move
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || disabled) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1

    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  // Transform styles for parallax effect
  const transformStyle = {
    transform: `perspective(1000px) rotateX(${-mousePosition.y * 5}deg) rotateY(${mousePosition.x * 5}deg) scale(${isHovered ? 1.02 : 1})`,
  };

  // Gradient position for shine effect
  const shineStyle = {
    transform: `translateX(${mousePosition.x * 50}px) translateY(${mousePosition.y * 50}px)`,
  };

  const colors = colorVariants[color];

  // Variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return cn(
          'bg-gradient-to-br',
          colors.gradient,
          'backdrop-blur-sm',
          'border border-white/20 dark:border-gray-700/50',
          'hover:shadow-2xl',
          `shadow-lg ${colors.glowIntense}`
        );
      case 'glass':
        return cn(
          'bg-white/70 dark:bg-gray-800/70',
          'backdrop-blur-xl backdrop-saturate-150',
          'border border-white/30 dark:border-gray-700/30',
          'shadow-lg',
          'hover:shadow-2xl hover:bg-white/80 dark:hover:bg-gray-800/80'
        );
      case 'glow':
        return cn(
          'bg-gradient-to-br from-white via-white to-gray-50',
          'dark:from-gray-800 dark:via-gray-800 dark:to-gray-900',
          'border',
          colors.border,
          `shadow-lg ${colors.glow}`,
          `hover:shadow-2xl ${colors.glowIntense}`
        );
      default:
        return cn(
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          colors.borderHover,
          'hover:shadow-xl',
          `shadow-md ${colors.glow}`
        );
    }
  };

  // Content wrapper
  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (href && !disabled) {
      return (
        <Link to={href} className="block">
          {children}
        </Link>
      );
    }
    return <div onClick={handleClick}>{children}</div>;
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'transition-all duration-500 ease-out',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        getVariantClasses(),
        'group',
        className
      )}
      style={transformStyle}
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
    >
      {/* Animated shine effect overlay */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100',
          'transition-opacity duration-700 pointer-events-none',
          'bg-gradient-to-br from-transparent',
          colors.shine,
          'to-transparent'
        )}
        style={shineStyle}
        aria-hidden="true"
      />

      {/* Gradient overlay for hover state */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          colors.gradientHover,
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-500',
          'pointer-events-none'
        )}
        aria-hidden="true"
      />

      {/* Content */}
      <ContentWrapper>
        <div className="relative z-10 p-6 sm:p-8">
          {/* Icon container with animated background */}
          <div
            className={cn(
              'inline-flex items-center justify-center',
              'w-14 h-14 sm:w-16 sm:h-16 rounded-xl',
              colors.iconBg,
              colors.iconBgHover,
              'transition-all duration-500',
              'group-hover:scale-110 group-hover:rotate-3',
              'mb-4'
            )}
          >
            <Icon
              className={cn(
                'w-7 h-7 sm:w-8 sm:h-8',
                colors.text,
                'transition-transform duration-500',
                'group-hover:scale-110'
              )}
              strokeWidth={2}
            />
          </div>

          {/* Title */}
          <h3
            className={cn(
              'font-heading text-xl sm:text-2xl font-bold mb-2',
              'text-gray-900 dark:text-white',
              'transition-all duration-300'
            )}
          >
            {title}
          </h3>

          {/* Subtitle */}
          {subtitle && (
            <p className="font-body text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Animated arrow indicator */}
          <div
            className={cn(
              'mt-4 inline-flex items-center gap-2',
              colors.text,
              'font-medium text-sm',
              'opacity-0 -translate-x-4',
              'group-hover:opacity-100 group-hover:translate-x-0',
              'transition-all duration-500'
            )}
          >
            <span>Acceder</span>
            <svg
              className="w-4 h-4 transform transition-transform duration-500 group-hover:translate-x-1"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </ContentWrapper>

      {/* Focus ring for accessibility */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl',
          'ring-2 ring-offset-2',
          'opacity-0 focus-within:opacity-100',
          'transition-opacity duration-300',
          'pointer-events-none',
          color === 'purple' && 'ring-purple-500',
          color === 'blue' && 'ring-blue-500',
          color === 'green' && 'ring-emerald-500',
          color === 'orange' && 'ring-orange-500'
        )}
        aria-hidden="true"
      />
    </div>
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
  };

  return (
    <div
      className={cn(
        'grid',
        gridColumns[columns],
        'gap-4 sm:gap-6 lg:gap-8',
        'auto-rows-fr',
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

/**
 * Default variant with subtle hover effects
 */
export function SelectionCardDefault(props: Omit<SelectionCardProps, 'variant'>) {
  return <SelectionCard {...props} variant="default" />;
}

/**
 * Gradient variant with colorful backgrounds
 */
export function SelectionCardGradient(props: Omit<SelectionCardProps, 'variant'>) {
  return <SelectionCard {...props} variant="gradient" />;
}

/**
 * Glass variant with glassmorphism effect
 */
export function SelectionCardGlass(props: Omit<SelectionCardProps, 'variant'>) {
  return <SelectionCard {...props} variant="glass" />;
}

/**
 * Glow variant with intense shadow effects
 */
export function SelectionCardGlow(props: Omit<SelectionCardProps, 'variant'>) {
  return <SelectionCard {...props} variant="glow" />;
}
