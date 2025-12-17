/**
 * DetailModal - Modal para visualizar detalles (solo lectura)
 *
 * Características:
 * - Solo lectura
 * - Helpers: DetailSection, DetailField, DetailGrid
 * - Acciones opcionales en footer
 * - Organización estructurada
 */
import { ReactNode } from 'react';
import { Edit, Trash2, Download, Printer } from 'lucide-react';
import { BaseModal, ModalSize } from './BaseModal';
import { Button } from '@/components/common/Button';

export interface DetailModalProps {
  /** Control de apertura del modal */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Título del modal */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Contenido del modal */
  children: ReactNode;
  /** Tamaño del modal */
  size?: ModalSize;
  /** Callback al editar */
  onEdit?: () => void;
  /** Callback al eliminar */
  onDelete?: () => void;
  /** Callback para imprimir */
  onPrint?: () => void;
  /** Callback para descargar */
  onDownload?: () => void;
  /** Acciones personalizadas adicionales */
  customActions?: ReactNode;
  /** Estado de carga */
  isLoading?: boolean;
}

export const DetailModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  onEdit,
  onDelete,
  onPrint,
  onDownload,
  customActions,
  isLoading = false,
}: DetailModalProps) => {
  const hasActions = onEdit || onDelete || onPrint || onDownload || customActions;

  const footer = hasActions ? (
    <>
      {customActions}
      {onPrint && (
        <Button
          type="button"
          variant="ghost"
          onClick={onPrint}
          disabled={isLoading}
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      )}
      {onDownload && (
        <Button
          type="button"
          variant="ghost"
          onClick={onDownload}
          disabled={isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="danger"
          onClick={onDelete}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
      )}
      {onEdit && (
        <Button
          type="button"
          variant="primary"
          onClick={onEdit}
          disabled={isLoading}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      )}
    </>
  ) : (
    <Button type="button" variant="outline" onClick={onClose}>
      Cerrar
    </Button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      footer={footer}
    >
      {children}
    </BaseModal>
  );
};

// ============================================
// COMPONENTES HELPER
// ============================================

interface DetailSectionProps {
  /** Título de la sección */
  title: string;
  /** Contenido de la sección */
  children: ReactNode;
  /** Clases adicionales */
  className?: string;
}

/**
 * Sección de detalles con título
 *
 * @example
 * <DetailSection title="Información General">
 *   <DetailField label="Nombre" value="Juan Pérez" />
 * </DetailSection>
 */
export const DetailSection = ({ title, children, className = '' }: DetailSectionProps) => (
  <div className={`mb-6 last:mb-0 ${className}`}>
    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
      {title}
    </h4>
    {children}
  </div>
);

interface DetailFieldProps {
  /** Etiqueta del campo */
  label: string;
  /** Valor del campo */
  value: ReactNode;
  /** Si el valor es vacío */
  emptyText?: string;
  /** Clases adicionales */
  className?: string;
}

/**
 * Campo de detalle individual
 *
 * @example
 * <DetailField label="Email" value="juan@example.com" />
 * <DetailField label="Teléfono" value={null} emptyText="No registrado" />
 */
export const DetailField = ({
  label,
  value,
  emptyText = 'No especificado',
  className = '',
}: DetailFieldProps) => (
  <div className={`py-2 ${className}`}>
    <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
      {value ?? <span className="text-gray-400 dark:text-gray-500 italic">{emptyText}</span>}
    </dd>
  </div>
);

interface DetailGridProps {
  /** Número de columnas */
  columns?: 1 | 2 | 3 | 4;
  /** Contenido de la grilla */
  children: ReactNode;
  /** Clases adicionales */
  className?: string;
}

const gridColumns = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Grilla para organizar campos de detalle
 *
 * @example
 * <DetailGrid columns={2}>
 *   <DetailField label="Nombre" value="Juan" />
 *   <DetailField label="Apellido" value="Pérez" />
 * </DetailGrid>
 */
export const DetailGrid = ({ columns = 2, children, className = '' }: DetailGridProps) => (
  <dl className={`grid ${gridColumns[columns]} gap-x-4 gap-y-2 ${className}`}>{children}</dl>
);

interface DetailBadgeProps {
  /** Texto del badge */
  children: ReactNode;
  /** Variante de color */
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
}

const badgeVariants = {
  success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
  danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400',
  info: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

/**
 * Badge para estados o etiquetas
 *
 * @example
 * <DetailBadge variant="success">Activo</DetailBadge>
 */
export const DetailBadge = ({ children, variant = 'gray' }: DetailBadgeProps) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeVariants[variant]}`}>
    {children}
  </span>
);
