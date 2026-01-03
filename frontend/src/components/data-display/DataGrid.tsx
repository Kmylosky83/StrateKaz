/**
 * DataGrid - Grid responsive para DataCards
 * Sistema de Gestión StrateKaz
 *
 * Grid responsive para organizar DataCards con configuración de columnas.
 *
 * @example
 * ```tsx
 * <DataGrid columns={3} gap="md">
 *   <DataCard title="Card 1" icon={FileText}>...</DataCard>
 *   <DataCard title="Card 2" icon={Users}>...</DataCard>
 *   <DataCard title="Card 3" icon={Settings}>...</DataCard>
 * </DataGrid>
 * ```
 */
import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

// ============================================================================
// TIPOS
// ============================================================================

export interface DataGridProps extends HTMLAttributes<HTMLDivElement> {
  /** DataCard components */
  children: ReactNode;
  /** Número de columnas en desktop */
  columns?: 2 | 3 | 4;
  /** Gap entre cards */
  gap?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// ESTILOS
// ============================================================================

const columnClasses: Record<2 | 3 | 4, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-2 xl:grid-cols-4',
};

const gapClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'gap-4',
  md: 'gap-5',
  lg: 'gap-6',
};

// ============================================================================
// COMPONENTE
// ============================================================================

export const DataGrid = ({
  children,
  columns = 3,
  gap = 'md',
  className,
  ...props
}: DataGridProps) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2',
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default DataGrid;
