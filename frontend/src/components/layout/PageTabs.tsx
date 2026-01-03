/**
 * PageTabs - Componente de tabs para navegación dentro de una página
 *
 * Design System v2: Enhanced Pills Container
 *
 * Características:
 * - Glassmorphism con fondo sutil y blur
 * - Micro-interacciones (scale, shimmer effect)
 * - Soporte para iconos y badges
 * - 3 variantes: pills (default), underline, segmented
 * - Colores dinámicos por módulo
 * - Responsive y accesible
 * - Compatible con dark mode
 */
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';
import type { ModuleColor } from '@/features/gestion-estrategica/types/modules.types';

// ============================================================================
// TIPOS
// ============================================================================

export interface TabItem {
  /** Identificador único del tab */
  id: string;
  /** Etiqueta del tab */
  label: string;
  /** Icono opcional */
  icon?: LucideIcon;
  /** Badge/contador opcional */
  badge?: string | number;
  /** Deshabilitado */
  disabled?: boolean;
}

export type PageTabsVariant = 'pills' | 'underline' | 'segmented';
export type PageTabsSize = 'sm' | 'md' | 'lg';

export interface PageTabsProps {
  /** Array de tabs */
  tabs: TabItem[];
  /** Tab activo */
  activeTab: string;
  /** Callback cuando cambia el tab */
  onTabChange: (tabId: string) => void;
  /** Variante de estilo */
  variant?: PageTabsVariant;
  /** Tamaño */
  size?: PageTabsSize;
  /** Color del módulo (para variante pills) */
  moduleColor?: ModuleColor;
  /** Clases adicionales */
  className?: string;
  /** Centrar tabs */
  centered?: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE COLORES POR MÓDULO
// ============================================================================

const moduleColorConfig: Record<ModuleColor, {
  activeBg: string;
  activeText: string;
  activeShadow: string;
  activeRing: string;
  badgeBg: string;
  badgeText: string;
}> = {
  purple: {
    activeBg: 'bg-white dark:bg-gray-800',
    activeText: 'text-purple-700 dark:text-purple-400',
    activeShadow: 'shadow-md shadow-purple-500/10',
    activeRing: 'ring-1 ring-purple-100 dark:ring-purple-900/30',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40',
    badgeText: 'text-purple-800 dark:text-purple-300',
  },
  blue: {
    activeBg: 'bg-white dark:bg-gray-800',
    activeText: 'text-blue-700 dark:text-blue-400',
    activeShadow: 'shadow-md shadow-blue-500/10',
    activeRing: 'ring-1 ring-blue-100 dark:ring-blue-900/30',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-800 dark:text-blue-300',
  },
  green: {
    activeBg: 'bg-white dark:bg-gray-800',
    activeText: 'text-emerald-700 dark:text-emerald-400',
    activeShadow: 'shadow-md shadow-emerald-500/10',
    activeRing: 'ring-1 ring-emerald-100 dark:ring-emerald-900/30',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
  },
  orange: {
    activeBg: 'bg-white dark:bg-gray-800',
    activeText: 'text-orange-700 dark:text-orange-400',
    activeShadow: 'shadow-md shadow-orange-500/10',
    activeRing: 'ring-1 ring-orange-100 dark:ring-orange-900/30',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/40',
    badgeText: 'text-orange-800 dark:text-orange-300',
  },
  teal: {
    activeBg: 'bg-white dark:bg-gray-800',
    activeText: 'text-teal-700 dark:text-teal-400',
    activeShadow: 'shadow-md shadow-teal-500/10',
    activeRing: 'ring-1 ring-teal-100 dark:ring-teal-900/30',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/40',
    badgeText: 'text-teal-800 dark:text-teal-300',
  },
  red: {
    activeBg: 'bg-white dark:bg-gray-800',
    activeText: 'text-red-700 dark:text-red-400',
    activeShadow: 'shadow-md shadow-red-500/10',
    activeRing: 'ring-1 ring-red-100 dark:ring-red-900/30',
    badgeBg: 'bg-red-100 dark:bg-red-900/40',
    badgeText: 'text-red-800 dark:text-red-300',
  },
  yellow: {
    activeBg: 'bg-white dark:bg-gray-800',
    activeText: 'text-yellow-700 dark:text-yellow-400',
    activeShadow: 'shadow-md shadow-yellow-500/10',
    activeRing: 'ring-1 ring-yellow-100 dark:ring-yellow-900/30',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    badgeText: 'text-yellow-800 dark:text-yellow-300',
  },
  pink: {
    activeBg: 'bg-white dark:bg-gray-800',
    activeText: 'text-pink-700 dark:text-pink-400',
    activeShadow: 'shadow-md shadow-pink-500/10',
    activeRing: 'ring-1 ring-pink-100 dark:ring-pink-900/30',
    badgeBg: 'bg-pink-100 dark:bg-pink-900/40',
    badgeText: 'text-pink-800 dark:text-pink-300',
  },
  indigo: {
    activeBg: 'bg-white dark:bg-gray-800',
    activeText: 'text-indigo-700 dark:text-indigo-400',
    activeShadow: 'shadow-md shadow-indigo-500/10',
    activeRing: 'ring-1 ring-indigo-100 dark:ring-indigo-900/30',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
  },
  gray: {
    activeBg: 'bg-white dark:bg-gray-800',
    activeText: 'text-gray-700 dark:text-gray-300',
    activeShadow: 'shadow-md shadow-gray-500/10',
    activeRing: 'ring-1 ring-gray-200 dark:ring-gray-700',
    badgeBg: 'bg-gray-100 dark:bg-gray-700',
    badgeText: 'text-gray-800 dark:text-gray-300',
  },
};

// ============================================================================
// CONFIGURACIÓN DE TAMAÑOS
// ============================================================================

const sizeConfig: Record<PageTabsSize, {
  container: string;
  tab: string;
  icon: string;
  badge: string;
}> = {
  sm: {
    container: 'gap-1 p-1',
    tab: 'px-3 py-1.5 text-xs gap-1.5',
    icon: 'h-3.5 w-3.5',
    badge: 'px-1.5 py-0.5 text-[10px]',
  },
  md: {
    container: 'gap-1.5 p-1.5',
    tab: 'px-4 py-2 text-sm gap-2',
    icon: 'h-4 w-4',
    badge: 'px-2 py-0.5 text-xs',
  },
  lg: {
    container: 'gap-2 p-2',
    tab: 'px-5 py-2.5 text-base gap-2.5',
    icon: 'h-5 w-5',
    badge: 'px-2.5 py-0.5 text-xs',
  },
};

// ============================================================================
// VARIANTE: PILLS (Enhanced)
// ============================================================================

function PillsVariant({
  tabs,
  activeTab,
  onTabChange,
  moduleColor = 'blue',
  size = 'md',
  centered = false,
  className,
}: PageTabsProps) {
  const colors = moduleColorConfig[moduleColor];
  const sizes = sizeConfig[size];

  return (
    <div className={cn(centered && 'flex justify-center', className)}>
      <nav
        className={cn(
          'inline-flex',
          sizes.container,
          'bg-gradient-to-br from-gray-50 to-gray-100/80',
          'dark:from-gray-800 dark:to-gray-900/80',
          'rounded-xl border border-gray-200/50 dark:border-gray-700/50',
          'shadow-sm backdrop-blur-sm'
        )}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
              className={cn(
                'relative inline-flex items-center rounded-lg',
                'font-medium transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                sizes.tab,
                tab.disabled && 'opacity-50 cursor-not-allowed',
                isActive
                  ? cn(
                      colors.activeBg,
                      colors.activeText,
                      colors.activeShadow,
                      colors.activeRing
                    )
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
              )}
              whileHover={!tab.disabled ? { scale: 1.02 } : undefined}
              whileTap={!tab.disabled ? { scale: 0.98 } : undefined}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {Icon && (
                <Icon
                  className={cn(
                    sizes.icon,
                    'transition-colors',
                    isActive && colors.activeText
                  )}
                />
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full font-semibold',
                    sizes.badge,
                    isActive
                      ? cn(colors.badgeBg, colors.badgeText)
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  )}
                >
                  {tab.badge}
                </span>
              )}

              {/* Shimmer effect sutil en hover (solo inactivos) */}
              {!isActive && !tab.disabled && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5 pointer-events-none"
                  initial={{ x: '-100%', opacity: 0 }}
                  whileHover={{ x: '100%', opacity: 1 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}

// ============================================================================
// VARIANTE: UNDERLINE (Clásico mejorado)
// ============================================================================

function UnderlineVariant({
  tabs,
  activeTab,
  onTabChange,
  moduleColor = 'blue',
  size = 'md',
  centered = false,
  className,
}: PageTabsProps) {
  const sizes = sizeConfig[size];

  return (
    <nav
      className={cn(
        '-mb-px flex border-b border-gray-200 dark:border-gray-700',
        centered && 'justify-center',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'relative flex items-center border-b-2 font-medium transition-all whitespace-nowrap',
              sizes.tab,
              'py-4',
              tab.disabled && 'opacity-50 cursor-not-allowed',
              isActive
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            {Icon && <Icon className={cn(sizes.icon)} />}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'ml-1 inline-flex items-center rounded-full font-medium',
                  sizes.badge,
                  isActive
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ============================================================================
// VARIANTE: SEGMENTED (iOS Style)
// ============================================================================

function SegmentedVariant({
  tabs,
  activeTab,
  onTabChange,
  moduleColor = 'blue',
  size = 'md',
  centered = false,
  className,
}: PageTabsProps) {
  const colors = moduleColorConfig[moduleColor];
  const sizes = sizeConfig[size];

  return (
    <div className={cn(centered && 'flex justify-center', className)}>
      <div
        className={cn(
          'inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 shadow-inner'
        )}
        role="tablist"
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
              role="tab"
              aria-selected={isActive}
              className={cn(
                'relative inline-flex items-center font-medium transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                sizes.tab,
                isFirst && 'rounded-l-lg',
                isLast && 'rounded-r-lg',
                !isFirst && !isLast && 'rounded-none',
                tab.disabled && 'opacity-50 cursor-not-allowed',
                isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              {/* Background animado */}
              {isActive && (
                <motion.div
                  layoutId="segmentedActiveTab"
                  className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-md"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}

              {/* Contenido */}
              <span className="relative z-10 flex items-center gap-2">
                {Icon && (
                  <Icon
                    className={cn(
                      sizes.icon,
                      'transition-colors',
                      isActive && colors.activeText
                    )}
                  />
                )}
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full font-semibold',
                      sizes.badge,
                      isActive
                        ? cn(colors.badgeBg, colors.badgeText)
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * PageTabs - Componente de tabs para navegación dentro de una página
 *
 * @example Pills (default - recomendado)
 * ```tsx
 * <PageTabs
 *   tabs={[
 *     { id: 'config', label: 'Configuración', icon: Settings },
 *     { id: 'team', label: 'Equipo', icon: Users, badge: 5 },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   moduleColor="purple"
 * />
 * ```
 *
 * @example Underline (clásico)
 * ```tsx
 * <PageTabs
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   variant="underline"
 * />
 * ```
 *
 * @example Segmented (iOS style)
 * ```tsx
 * <PageTabs
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   variant="segmented"
 *   centered
 * />
 * ```
 */
export function PageTabs({
  variant = 'pills',
  ...props
}: PageTabsProps) {
  switch (variant) {
    case 'underline':
      return <UnderlineVariant {...props} />;
    case 'segmented':
      return <SegmentedVariant {...props} />;
    case 'pills':
    default:
      return <PillsVariant {...props} />;
  }
}

// ============================================================================
// SKELETON
// ============================================================================

interface PageTabsSkeletonProps {
  count?: number;
  variant?: PageTabsVariant;
  size?: PageTabsSize;
}

export function PageTabsSkeleton({
  count = 3,
  variant = 'pills',
  size = 'md',
}: PageTabsSkeletonProps) {
  const sizes = sizeConfig[size];

  if (variant === 'underline') {
    return (
      <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex',
        sizes.container,
        'bg-gray-100 dark:bg-gray-800 rounded-xl'
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse',
            i === 0 && 'bg-white dark:bg-gray-600'
          )}
        />
      ))}
    </div>
  );
}

export default PageTabs;
