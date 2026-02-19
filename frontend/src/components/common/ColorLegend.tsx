/**
 * ColorLegend - Leyenda de colores para gráficos
 * Design System StrateKaz
 */
import { cn } from '@/utils/cn';

export interface LegendItem {
  label: string;
  color: string;
  value?: string | number;
}

export interface ColorLegendProps {
  items: LegendItem[];
  orientation?: 'horizontal' | 'vertical';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function ColorLegend({
  items,
  orientation = 'horizontal',
  position = 'bottom',
  className,
}: ColorLegendProps) {
  return (
    <div
      className={cn(
        'flex gap-4',
        orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
        position === 'top' && 'mb-4',
        position === 'bottom' && 'mt-4',
        position === 'left' && 'mr-4',
        position === 'right' && 'ml-4',
        className
      )}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {item.label}
            {item.value !== undefined && (
              <span className="ml-1 font-medium">({item.value})</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
