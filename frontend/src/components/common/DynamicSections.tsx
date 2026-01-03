/**
 * DynamicSections - Sub-navegación dinámica desde API
 *
 * Carga secciones habilitadas de un tab y las muestra como tabs pill
 * Posición: Después de PageHeader, antes de StatsGrid
 *
 * Características:
 * - Sin hardcoding: secciones vienen de la API
 * - Control granular: desactivar sección en ConfiguracionTab → desaparece
 * - Iconos dinámicos desde Lucide
 * - Compatible con Design System (usa variante pills)
 */
import { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Circle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { TabSection } from '@/features/gestion-estrategica/types/modules.types';

export interface DynamicSectionsProps {
  /** Secciones habilitadas del tab */
  sections: TabSection[];
  /** Código de la sección activa */
  activeSection: string;
  /** Callback cuando cambia la sección */
  onChange: (sectionCode: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Variante visual */
  variant?: 'pills' | 'underline';
  /** Color del módulo para estilizado */
  moduleColor?: 'purple' | 'blue' | 'green' | 'orange' | 'gray' | 'teal' | 'red' | 'yellow' | 'pink' | 'indigo';
  /** Clases adicionales */
  className?: string;
}

/**
 * Obtener componente de icono de Lucide por nombre
 */
const getIconComponent = (iconName?: string | null): React.ElementType => {
  if (!iconName) return Circle;
  const icon = LucideIcons[iconName as keyof typeof LucideIcons];
  // Los iconos de Lucide React son objetos (ForwardRefExoticComponent), no funciones puras
  if (icon && typeof icon === 'object' && '$$typeof' in icon) {
    return icon as React.ElementType;
  }
  return Circle;
};

/**
 * Colores por módulo - Sincronizado con los 6 niveles del sistema
 */
const colorStyles = {
  purple: {
    active: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/10',
    border: 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400',
  },
  blue: {
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/10',
    border: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400',
  },
  green: {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10',
    border: 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400',
  },
  orange: {
    active: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/10',
    border: 'border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400',
  },
  gray: {
    active: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
    border: 'border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400',
  },
  teal: {
    active: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-teal-50 dark:hover:bg-teal-900/10',
    border: 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400',
  },
  red: {
    active: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10',
    border: 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400',
  },
  yellow: {
    active: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10',
    border: 'border-yellow-600 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
  },
  pink: {
    active: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/10',
    border: 'border-pink-600 text-pink-600 dark:border-pink-400 dark:text-pink-400',
  },
  indigo: {
    active: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10',
    border: 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400',
  },
};

export const DynamicSections = ({
  sections,
  activeSection,
  onChange,
  isLoading = false,
  variant = 'pills',
  moduleColor = 'purple',
  className,
}: DynamicSectionsProps) => {
  const colors = colorStyles[moduleColor];

  // Convertir secciones a formato de tabs con iconos
  const tabs = useMemo(() => {
    return sections.map((section) => {
      const Icon = getIconComponent(section.icon);
      return {
        id: section.code,
        label: section.name,
        icon: <Icon className="h-4 w-4" />,
      };
    });
  }, [sections]);

  // Si no hay secciones, no mostrar nada
  if (!isLoading && sections.length === 0) {
    return null;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Cargando secciones...</span>
      </div>
    );
  }

  // Si solo hay una sección, no mostrar tabs (no tiene sentido)
  if (sections.length === 1) {
    return null;
  }

  // Variante Pills
  if (variant === 'pills') {
    return (
      <div className={cn('inline-flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg', className)}>
        {tabs.map((tab) => {
          const isActive = activeSection === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                isActive
                  ? cn(colors.active, 'shadow-sm')
                  : colors.inactive
              )}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Variante Underline
  return (
    <div className={cn('border-b border-gray-200 dark:border-gray-700', className)}>
      <nav className="-mb-px flex gap-6" aria-label="Secciones">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-all',
                'focus:outline-none',
                isActive
                  ? colors.border
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default DynamicSections;
