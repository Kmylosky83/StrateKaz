/**
 * MobileCardList - Card view optimizada para móvil
 *
 * Transforma datos tabulares en tarjetas verticales
 * Patrón: https://www.nngroup.com/articles/mobile-tables/
 *
 * @example
 * <MobileCardList
 *   data={colaboradores}
 *   keyExtractor={(item) => item.id}
 *   renderCard={(item) => (
 *     <div>
 *       <h3>{item.nombre}</h3>
 *       <p>{item.cargo}</p>
 *     </div>
 *   )}
 * />
 */

import { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '@/utils/cn';

export interface MobileCardListProps<T> {
  /** Array de datos a mostrar */
  data: T[];
  /** Función para extraer key única */
  keyExtractor: (item: T, index: number) => string | number;
  /** Render function para cada tarjeta */
  renderCard: (item: T, index: number) => ReactNode;
  /** Clases para cada card */
  cardClassName?: string;
  /** Clases para el contenedor */
  className?: string;
  /** Empty state */
  emptyMessage?: string;
  /** Mostrar separadores entre cards */
  showDividers?: boolean;
  /** Spacing entre cards */
  spacing?: 'compact' | 'normal' | 'relaxed';
}

const spacingClasses = {
  compact: 'space-y-2',
  normal: 'space-y-4',
  relaxed: 'space-y-6',
};

export function MobileCardList<T>({
  data,
  keyExtractor,
  renderCard,
  cardClassName,
  className,
  emptyMessage = 'No hay datos para mostrar',
  showDividers = false,
  spacing = 'normal',
}: MobileCardListProps<T>) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {data.map((item, index) => (
        <div key={keyExtractor(item, index)}>
          <Card
            className={cn(
              'p-4',
              // Touch-friendly hover en móvil
              'active:scale-[0.98] transition-transform',
              cardClassName
            )}
          >
            {renderCard(item, index)}
          </Card>
          {showDividers && index < data.length - 1 && (
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * MobileCardListItem - Helper para estructura consistente de cards
 *
 * @example
 * <MobileCardListItem
 *   title="Juan Pérez"
 *   subtitle="Desarrollador Senior"
 *   metadata={[
 *     { label: 'Email', value: 'juan@example.com' },
 *     { label: 'Teléfono', value: '+57 300 123 4567' },
 *   ]}
 *   actions={<Button size="sm">Ver detalles</Button>}
 * />
 */
interface MobileCardListItemProps {
  /** Título principal */
  title: ReactNode;
  /** Subtítulo */
  subtitle?: ReactNode;
  /** Metadata en formato label-value */
  metadata?: Array<{ label: string; value: ReactNode }>;
  /** Acciones (botones, badges, etc.) */
  actions?: ReactNode;
  /** Avatar o ícono */
  avatar?: ReactNode;
  /** Clases adicionales */
  className?: string;
}

export function MobileCardListItem({
  title,
  subtitle,
  metadata,
  actions,
  avatar,
  className,
}: MobileCardListItemProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header con avatar + title/subtitle */}
      <div className="flex items-start gap-3">
        {avatar && <div className="flex-shrink-0">{avatar}</div>}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Metadata grid */}
      {metadata && metadata.length > 0 && (
        <dl className="grid grid-cols-1 gap-2 text-sm">
          {metadata.map((item, index) => (
            <div key={index} className="flex justify-between gap-2">
              <dt className="font-medium text-gray-500 dark:text-gray-400">{item.label}:</dt>
              <dd className="text-gray-900 dark:text-gray-100 text-right truncate">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Actions */}
      {actions && <div className="flex items-center justify-end gap-2 pt-2">{actions}</div>}
    </div>
  );
}
