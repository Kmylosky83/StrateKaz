/**
 * HeaderTabs - Navegacion de secciones para el Header
 *
 * Tabs en un contenedor visual ordenado que:
 * - Se centra dinamicamente segun las secciones disponibles
 * - Muestra dropdown "Mas" cuando hay overflow
 * - Muestra solo iconos en pantallas pequenas
 * - Contenedor con bordes sutiles para orden visual
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { Circle, MoreHorizontal, Check } from 'lucide-react';
import { getIconComponent as getDynamicIcon } from '@/components/common/DynamicIcon';
import { useIsMobile } from '@/hooks/useResponsive';
import { cn } from '@/utils/cn';
import type { TabSection } from '@/hooks/useModules';

type ModuleColor =
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'gray'
  | 'teal'
  | 'red'
  | 'yellow'
  | 'pink'
  | 'indigo';

export interface HeaderTabsProps {
  /** Secciones a mostrar */
  sections: TabSection[];
  /** Seccion activa */
  activeSection: string;
  /** Callback al cambiar seccion */
  onSectionChange: (code: string) => void;
  /** Color del modulo */
  moduleColor?: ModuleColor;
  /** Esta cargando */
  isLoading?: boolean;
  /** Clases adicionales */
  className?: string;
}

// Estilos por color de modulo
const colorStyles: Record<ModuleColor, { active: string; inactive: string; dropdown: string }> = {
  purple: {
    active:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    inactive:
      'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400',
    dropdown: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
  },
  blue: {
    active:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    inactive:
      'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400',
    dropdown: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
  },
  green: {
    active:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    inactive:
      'text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400',
    dropdown: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  },
  orange: {
    active:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    inactive:
      'text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400',
    dropdown: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
  },
  gray: {
    active:
      'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
    dropdown: 'hover:bg-gray-100 dark:hover:bg-gray-700',
  },
  teal: {
    active:
      'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    inactive:
      'text-gray-600 dark:text-gray-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400',
    dropdown: 'hover:bg-teal-50 dark:hover:bg-teal-900/20',
  },
  red: {
    active:
      'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800',
    inactive:
      'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400',
    dropdown: 'hover:bg-red-50 dark:hover:bg-red-900/20',
  },
  yellow: {
    active:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    inactive:
      'text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400',
    dropdown: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
  },
  pink: {
    active:
      'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    inactive:
      'text-gray-600 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400',
    dropdown: 'hover:bg-pink-50 dark:hover:bg-pink-900/20',
  },
  indigo: {
    active:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    inactive:
      'text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400',
    dropdown: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
  },
};

// Maximo de tabs visibles antes de mostrar dropdown
const MAX_VISIBLE_TABS = 5;

export const HeaderTabs = ({
  sections,
  activeSection,
  onSectionChange,
  moduleColor = 'purple',
  isLoading = false,
  className,
}: HeaderTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE_TABS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const colors = colorStyles[moduleColor];
  const isMobile = useIsMobile(); // ✅ Hook centralizado

  // Calcular cuantos tabs caben en el contenedor
  const calculateVisibleTabs = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    // Cada tab ocupa aproximadamente 120px en desktop, 44px en mobile (solo icono)
    const tabWidth = isMobile ? 44 : 120;
    const moreButtonWidth = 44;

    // Calcular cuantos caben
    const maxTabs = Math.floor((containerWidth - moreButtonWidth) / tabWidth);
    setVisibleCount(Math.max(2, Math.min(maxTabs, sections.length)));
  }, [sections.length, isMobile]);

  useEffect(() => {
    calculateVisibleTabs();
    window.addEventListener('resize', calculateVisibleTabs);
    return () => window.removeEventListener('resize', calculateVisibleTabs);
  }, [calculateVisibleTabs]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Obtener icono de seccion
  const getIcon = (iconName?: string | null) => {
    if (!iconName) return Circle;
    const icon = getDynamicIcon(iconName);
    return (icon as React.ElementType) ?? Circle;
  };

  // Si no hay secciones o solo hay una, no mostrar nada
  if (!isLoading && (sections.length === 0 || sections.length === 1)) {
    return null;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center gap-1', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse-subtle"
          />
        ))}
      </div>
    );
  }

  // Separar tabs visibles y ocultos, asegurando que la seccion activa siempre este visible
  const { visibleSections, hiddenSections } = (() => {
    const activeIndex = sections.findIndex((s) => s.code === activeSection);

    // Si la seccion activa esta dentro del rango visible, usar orden normal
    if (activeIndex < visibleCount) {
      return {
        visibleSections: sections.slice(0, visibleCount),
        hiddenSections: sections.slice(visibleCount),
      };
    }

    // Si la seccion activa esta fuera del rango, incluirla en visibles
    // Tomamos las primeras (visibleCount - 1) secciones + la activa
    const visible = sections.slice(0, visibleCount - 1);
    const activeSection$ = sections[activeIndex];
    const hidden = sections.filter((s, i) => i >= visibleCount - 1 && i !== activeIndex);

    return {
      visibleSections: [...visible, activeSection$],
      hiddenSections: hidden,
    };
  })();

  const hasHiddenSections = hiddenSections.length > 0;

  const handleSectionClick = (code: string) => {
    onSectionChange(code);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className={cn('flex items-center justify-center', className)}>
      {/* Contenedor de tabs centrado - con scroll horizontal en móvil */}
      <div
        className={cn(
          'flex md:inline-flex items-center gap-1',
          'px-1.5 py-1.5',
          'bg-gray-100/80 dark:bg-gray-800/80',
          'backdrop-blur-sm',
          'rounded-xl',
          'border border-gray-200/50 dark:border-gray-700/50',
          // Mobile: scroll horizontal oculto
          'overflow-x-auto md:overflow-visible',
          'scrollbar-none',
          'snap-x snap-mandatory md:snap-none',
          'max-w-full'
        )}
      >
        {/* Tabs visibles */}
        {visibleSections.map((section) => {
          const Icon = getIcon(section.icon);
          const isActive = activeSection === section.code;

          return (
            <button
              key={section.code}
              onClick={() => handleSectionClick(section.code)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5',
                'text-sm font-medium whitespace-nowrap',
                'rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                'border border-transparent',
                'snap-start flex-shrink-0', // Mobile scroll support
                isActive ? colors.active : colors.inactive
              )}
              title={section.name}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">{section.name}</span>
            </button>
          );
        })}

        {/* Boton "Mas" con dropdown */}
        {hasHiddenSections && (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5',
                'text-sm font-medium',
                'rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                'border border-transparent',
                colors.inactive
              )}
              title={`${hiddenSections.length} mas`}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="hidden md:inline text-xs">+{hiddenSections.length}</span>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div
                className={cn(
                  'absolute top-full right-0 mt-2 z-50',
                  'min-w-[200px] py-1',
                  'bg-white dark:bg-gray-800',
                  'rounded-lg shadow-xl',
                  'border border-gray-200 dark:border-gray-700',
                  'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200'
                )}
              >
                {hiddenSections.map((section) => {
                  const Icon = getIcon(section.icon);
                  const isActive = activeSection === section.code;

                  return (
                    <button
                      key={section.code}
                      onClick={() => handleSectionClick(section.code)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2',
                        'text-sm text-left',
                        'transition-colors',
                        isActive
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300',
                        colors.dropdown
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{section.name}</span>
                      {isActive && <Check className="h-4 w-4 text-primary-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderTabs;
