import { ReactNode } from 'react';
import { Circle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getIconComponent as getDynamicIcon } from '@/components/common/DynamicIcon';
import { getModuleColorClasses, type ModuleColor } from '@/utils/moduleColors';
import type { TabSection } from '@/features/gestion-estrategica/types/modules.types';

export interface PageHeaderProps {
  /** Titulo principal de la pagina */
  title: string;
  /** Descripcion o subtitulo opcional */
  description?: string;
  /** Acciones principales (botones) */
  actions?: ReactNode;
  /** Controles adicionales como toggles de vista */
  controls?: ReactNode;
  /** Tabs de navegacion (legacy - usar sections en su lugar) */
  tabs?: ReactNode;
  /** Secciones para tabs inline (nuevo) */
  sections?: TabSection[];
  /** Seccion activa */
  activeSection?: string;
  /** Callback al cambiar seccion */
  onSectionChange?: (code: string) => void;
  /** Color del modulo para tabs (del Design System centralizado) */
  moduleColor?: ModuleColor;
  /** Clases adicionales */
  className?: string;
}

// Helper para obtener icono
const getIcon = (iconName?: string | null) => {
  if (!iconName) return Circle;
  const icon = getDynamicIcon(iconName);
  return (icon as React.ElementType) ?? Circle;
};

/**
 * PageHeader - Componente reutilizable para headers de pagina
 *
 * Estructura con tabs en contenedor profesional:
 * +-------------------------------------------------------------+
 * | [Titulo]                      [Contenedor de Secciones]     |
 * | Descripcion                          [Tab1] [Tab2] [Tab3]   |
 * +-------------------------------------------------------------+
 *
 * Los tabs van en un contenedor visual alineado a la derecha.
 */
export function PageHeader({
  title,
  description,
  actions,
  controls,
  tabs,
  sections,
  activeSection,
  onSectionChange,
  moduleColor = 'purple',
  className,
}: PageHeaderProps) {
  // Colores del Design System centralizado
  const colors = getModuleColorClasses(moduleColor);
  const hasSections = sections && sections.length > 1;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header principal */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        {/* Lado izquierdo: Titulo y descripcion */}
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="font-body text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>

        {/* Lado derecho: Tabs en contenedor profesional + acciones */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
          {/* Contenedor de secciones - scroll horizontal en móvil */}
          {hasSections && (
            <nav
              className={cn(
                'flex md:inline-flex items-center gap-1 p-1',
                'rounded-lg border',
                // Mobile: scroll horizontal con snap, sin scrollbar visible
                'overflow-x-auto md:overflow-visible',
                'scrollbar-none',
                'snap-x snap-mandatory md:snap-none',
                // En móvil ocupar todo el ancho disponible
                'w-full md:w-auto',
                '-mx-1 px-1 md:mx-0',
                colors.container
              )}
            >
              {sections.map((section) => {
                const Icon = getIcon(section.icon);
                const isActive = activeSection === section.code;

                return (
                  <button
                    key={section.code}
                    onClick={() => onSectionChange?.(section.code)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5',
                      'text-sm font-medium whitespace-nowrap',
                      'rounded-md transition-all duration-200',
                      // Mobile: snap y no comprimir
                      'snap-start flex-shrink-0',
                      isActive ? colors.active : colors.inactive
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Controles y acciones */}
          {(controls || actions) && (
            <div className="flex items-center gap-2">
              {controls}
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Tabs legacy (si se pasa como prop tabs) */}
      {tabs && <div className="border-b border-gray-200 dark:border-gray-700 pt-2">{tabs}</div>}
    </div>
  );
}
