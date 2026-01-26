/**
 * ModuleCard - Componente del Design System
 *
 * Card animada para mostrar módulos del sistema en el Dashboard.
 * Incluye animaciones de hover en icono, badge y flecha.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  moduleCardHoverVariants,
  moduleIconVariants,
  moduleChevronVariants,
  moduleBadgeVariants,
} from '@/lib/animations';

// ============================================================================
// TIPOS
// ============================================================================

export type ModuleCardColor = 'purple' | 'blue' | 'green' | 'orange' | 'gray' | 'teal' | 'red' | 'yellow' | 'pink' | 'indigo';

export interface ModuleCardProps {
  /** Componente de icono de Lucide */
  icon: LucideIcon;
  /** Título del módulo */
  title: string;
  /** Descripción corta (se trunca automáticamente) */
  description?: string;
  /** Color del módulo */
  color?: ModuleCardColor;
  /** Número de secciones/tabs habilitados */
  sectionsCount?: number;
  /** Ruta de navegación */
  to: string;
  /** Clase CSS adicional */
  className?: string;
}

// ============================================================================
// CONFIGURACIÓN DE COLORES
// ============================================================================

const colorConfig: Record<ModuleCardColor, {
  bg: string;
  icon: string;
  border: string;
  badge: string;
  ring: string;
}> = {
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    ring: 'ring-purple-200 dark:ring-purple-800',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    ring: 'ring-blue-200 dark:ring-blue-800',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    ring: 'ring-orange-200 dark:ring-orange-800',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
    ring: 'ring-teal-200 dark:ring-teal-800',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    ring: 'ring-red-200 dark:ring-red-800',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    icon: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    ring: 'ring-gray-200 dark:ring-gray-700',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    ring: 'ring-yellow-200 dark:ring-yellow-800',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    icon: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    ring: 'ring-pink-200 dark:ring-pink-800',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    ring: 'ring-indigo-200 dark:ring-indigo-800',
  },
};

// ============================================================================
// MAPEO DE COLORES
// ============================================================================

/**
 * Mapea colores extendidos de Tailwind a los 10 colores soportados
 * Esto permite que la BD use cualquier color de Tailwind y el frontend
 * lo convierta al color más cercano soportado
 */
const colorMapping: Record<string, ModuleCardColor> = {
  // Colores directos (ya soportados)
  purple: 'purple',
  blue: 'blue',
  green: 'green',
  orange: 'orange',
  gray: 'gray',
  teal: 'teal',
  red: 'red',
  yellow: 'yellow',
  pink: 'pink',
  indigo: 'indigo',
  // Colores extendidos → mapeados al más cercano
  amber: 'orange',
  cyan: 'teal',
  rose: 'pink',
  violet: 'purple',
  emerald: 'green',
  lime: 'green',
  slate: 'gray',
  stone: 'gray',
  zinc: 'gray',
  neutral: 'gray',
  fuchsia: 'pink',
  sky: 'blue',
};

// ============================================================================
// COMPONENTE
// ============================================================================

// Helper para obtener color con fallback y mapeo
const getColors = (color: string | undefined | null) => {
  if (!color) return colorConfig['blue'];
  const mappedColor = colorMapping[color] || 'blue';
  return colorConfig[mappedColor];
};

export function ModuleCard({
  icon: Icon,
  title,
  description,
  color = 'blue',
  sectionsCount,
  to,
  className,
}: ModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = getColors(color);

  // Truncar descripción a 60 caracteres
  const shortDesc = description
    ? description.length > 60
      ? description.substring(0, 57) + '...'
      : description
    : null;

  return (
    <motion.div
      variants={moduleCardHoverVariants}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={className}
    >
      <Link
        to={to}
        className={cn(
          'block rounded-xl border bg-white dark:bg-gray-800/80',
          'transition-shadow duration-300',
          colors.border,
          isHovered && 'shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50'
        )}
      >
        <div className="p-4">
          {/* Header: Icono + Título */}
          <div className="flex items-start gap-3 mb-2">
            <motion.div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                colors.bg,
                'transition-all duration-200',
                isHovered && 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800',
                isHovered && colors.ring
              )}
              variants={moduleIconVariants}
              animate={isHovered ? 'hover' : 'idle'}
            >
              <Icon className={cn('w-5 h-5', colors.icon)} strokeWidth={2} />
            </motion.div>
            <div className="flex-grow min-w-0">
              <h3
                className={cn(
                  'font-semibold text-sm text-gray-900 dark:text-white truncate',
                  'transition-colors duration-200',
                  isHovered && colors.icon
                )}
              >
                {title}
              </h3>
              {shortDesc && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                  {shortDesc}
                </p>
              )}
            </div>
            <motion.div
              variants={moduleChevronVariants}
              animate={isHovered ? 'hover' : 'idle'}
            >
              <ChevronRight
                className={cn(
                  'flex-shrink-0 w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5',
                  'transition-colors duration-200',
                  isHovered && colors.icon
                )}
              />
            </motion.div>
          </div>

          {/* Footer: Badge */}
          {sectionsCount !== undefined && sectionsCount > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
              <motion.span
                className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colors.badge)}
                variants={moduleBadgeVariants}
                animate={isHovered ? 'hover' : 'idle'}
              >
                {sectionsCount} {sectionsCount === 1 ? 'sección' : 'secciones'}
              </motion.span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

export function ModuleCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 p-4">
      <div className="flex items-start gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse-subtle flex-shrink-0" />
        <div className="flex-grow">
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse-subtle mb-1" />
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse-subtle" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse-subtle" />
      </div>
    </div>
  );
}

// ============================================================================
// GRID CONTAINER
// ============================================================================

interface ModuleGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ModuleGrid({ children, className }: ModuleGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.25, staggerChildren: 0.05 },
        },
      }}
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export default ModuleCard;
