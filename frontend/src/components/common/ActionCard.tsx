/**
 * ActionCard — Card accionable compacta para dashboards y portales.
 *
 * Muestra un ítem de acción con número destacado, ícono, label y sublabel
 * opcional. Clickeable. Variantes por tono.
 *
 * Design System component. Usar antes de construir HTML crudo para cards
 * de "pendientes", "KPIs accionables", "accesos rápidos".
 *
 * @example
 * <ActionCard
 *   icon={BookOpen}
 *   count={3}
 *   label="Lecturas pendientes"
 *   sublabel="Vence mañana"
 *   tone="attention"
 *   onClick={() => navigate('/mi-portal?tab=lecturas')}
 * />
 */
import { type LucideIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ActionCardTone = 'default' | 'attention' | 'danger' | 'success' | 'info';

export interface ActionCardProps {
  icon: LucideIcon;
  count?: number;
  label: string;
  sublabel?: string;
  tone?: ActionCardTone;
  onClick?: () => void;
  /** Si la card representa "todo al día", muestra CheckCircle y oculta count. */
  emptyState?: boolean;
  loading?: boolean;
  className?: string;
}

const TONE_STYLES: Record<
  ActionCardTone,
  {
    iconBg: string;
    iconColor: string;
    countColor: string;
    ring: string;
    hoverRing: string;
  }
> = {
  default: {
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-400',
    countColor: 'text-gray-900 dark:text-gray-100',
    ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
    hoverRing: 'hover:ring-gray-300 dark:hover:ring-gray-600',
  },
  attention: {
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    countColor: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-1 ring-amber-200 dark:ring-amber-900/40',
    hoverRing: 'hover:ring-amber-300 dark:hover:ring-amber-700',
  },
  danger: {
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
    countColor: 'text-red-700 dark:text-red-300',
    ring: 'ring-1 ring-red-200 dark:ring-red-900/40',
    hoverRing: 'hover:ring-red-300 dark:hover:ring-red-700',
  },
  success: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    countColor: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-1 ring-emerald-200 dark:ring-emerald-900/40',
    hoverRing: 'hover:ring-emerald-300 dark:hover:ring-emerald-700',
  },
  info: {
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    countColor: 'text-blue-700 dark:text-blue-300',
    ring: 'ring-1 ring-blue-200 dark:ring-blue-900/40',
    hoverRing: 'hover:ring-blue-300 dark:hover:ring-blue-700',
  },
};

export function ActionCard({
  icon,
  count,
  label,
  sublabel,
  tone = 'default',
  onClick,
  emptyState = false,
  loading = false,
  className,
}: ActionCardProps) {
  const styles = TONE_STYLES[tone];
  const isInteractive = !!onClick && !loading;
  const EffectiveIcon = emptyState ? CheckCircle2 : icon;

  const inner = (
    <>
      <div
        className={cn(
          'flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 transition-transform',
          styles.iconBg,
          isInteractive && 'group-hover:scale-105'
        )}
      >
        {loading ? (
          <div className="w-5 h-5 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : (
          <EffectiveIcon className={cn('w-5 h-5', styles.iconColor)} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {loading ? (
          <>
            <div className="h-5 w-12 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-1.5" />
            <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              {typeof count === 'number' && !emptyState && (
                <span
                  className={cn('text-xl font-bold tabular-nums leading-none', styles.countColor)}
                >
                  {count}
                </span>
              )}
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {label}
              </span>
            </div>
            {sublabel && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{sublabel}</p>
            )}
          </>
        )}
      </div>

      {isInteractive && (
        <ArrowRight
          className={cn(
            'w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform',
            'group-hover:translate-x-0.5 group-hover:text-gray-600 dark:group-hover:text-gray-300'
          )}
        />
      )}
    </>
  );

  const baseClasses = cn(
    'group flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 transition-all',
    styles.ring,
    className
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          baseClasses,
          styles.hoverRing,
          'text-left hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
        )}
      >
        {inner}
      </button>
    );
  }

  return <div className={baseClasses}>{inner}</div>;
}
