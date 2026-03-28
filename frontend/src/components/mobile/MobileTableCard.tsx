/**
 * MobileTableCard - Vista de tarjeta para tablas en móvil
 *
 * Transforma filas de tabla en tarjetas apiladas verticalmente,
 * optimizado para pantallas pequeñas.
 *
 * Características:
 * - Campo principal destacado
 * - Campos secundarios en grid
 * - Acciones con swipe o botones
 * - Expandible para más detalles
 * - Badge de estado
 */
import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MoreVertical } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Dropdown } from '@/components/common/Dropdown';
import type { DropdownItem } from '@/components/common/Dropdown';

export interface MobileCardField {
  /** Etiqueta del campo */
  label: string;
  /** Valor a mostrar */
  value: ReactNode;
  /** Es el campo principal (título de la card) */
  isPrimary?: boolean;
  /** Ocultar en vista compacta */
  hideInCompact?: boolean;
}

export interface MobileTableCardProps<T = unknown> {
  /** Datos del item */
  item: T;
  /** Campos a mostrar */
  fields: MobileCardField[];
  /** Acciones disponibles */
  actions?: DropdownItem[];
  /** Badge de estado */
  statusBadge?: ReactNode;
  /** Click en la tarjeta */
  onClick?: (item: T) => void;
  /** Expandible para mostrar más campos */
  expandable?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

export const MobileTableCard = <T,>({
  item,
  fields,
  actions,
  statusBadge,
  onClick,
  expandable = true,
  className,
}: MobileTableCardProps<T>) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Separar campo principal de secundarios
  const primaryField = fields.find((f) => f.isPrimary);
  const visibleFields = fields.filter((f) => !f.isPrimary && !f.hideInCompact);
  const hiddenFields = fields.filter((f) => !f.isPrimary && f.hideInCompact);

  const handleCardClick = () => {
    if (onClick) {
      onClick(item);
    } else if (expandable && hiddenFields.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        // Base
        'bg-white dark:bg-gray-800',
        'rounded-xl',
        'border border-gray-200 dark:border-gray-700',
        'shadow-sm',
        // Touch feedback
        'active:scale-[0.99] active:shadow-md',
        'transition-all duration-200',
        // Cursor
        (onClick || (expandable && hiddenFields.length > 0)) && 'cursor-pointer',
        className
      )}
    >
      {/* Header con campo principal y acciones */}
      <div className="flex items-start justify-between p-4" onClick={handleCardClick}>
        <div className="flex-1 min-w-0">
          {/* Campo principal */}
          {primaryField && (
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {primaryField.value}
            </h3>
          )}

          {/* Campos secundarios visibles en grid */}
          {visibleFields.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
              {visibleFields.map((field, index) => (
                <div key={index} className="min-w-0">
                  <dt className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {field.label}
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {field.value}
                  </dd>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lado derecho: Badge y acciones */}
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {statusBadge && <div>{statusBadge}</div>}

          {actions && actions.length > 0 && (
            <Dropdown
              trigger={
                <button
                  className={cn(
                    'p-2 -m-1',
                    'rounded-full',
                    'text-gray-500 dark:text-gray-400',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'active:scale-95',
                    'transition-all'
                  )}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Más opciones"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              }
              items={actions}
              align="right"
            />
          )}

          {/* Indicador de expansión */}
          {expandable && hiddenFields.length > 0 && !actions && (
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Campos ocultos expandibles */}
      <AnimatePresence>
        {isExpanded && hiddenFields.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'px-4 pb-4 pt-2',
                'border-t border-gray-100 dark:border-gray-700/50',
                'grid grid-cols-2 gap-x-4 gap-y-3'
              )}
            >
              {hiddenFields.map((field, index) => (
                <div key={index} className="min-w-0">
                  <dt className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {field.label}
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">{field.value}</dd>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Lista de MobileTableCards con animaciones
 */
export interface MobileTableCardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  className?: string;
}

export const MobileTableCardList = <T,>({
  items,
  renderCard,
  emptyMessage = 'No hay datos para mostrar',
  className,
}: MobileTableCardListProps<T>) => {
  if (items.length === 0) {
    return <div className="py-12 text-center text-gray-500 dark:text-gray-400">{emptyMessage}</div>;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <div key={index}>{renderCard(item, index)}</div>
        ))}
      </AnimatePresence>
    </div>
  );
};
