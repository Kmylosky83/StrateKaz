import React from 'react';
import {
  Shield,
  FileCheck,
  Leaf,
  Settings,
  Search,
  Archive,
  Users,
  BarChart3,
  TrendingUp,
  Zap,
  Globe,
  Award,
} from 'lucide-react';

/**
 * Represents a process category in the library
 */
interface ProcessCategory {
  /** Display name of the category */
  name: string;
  /** Brief description of what this category covers */
  description: string;
  /** Icon component to display */
  icon: React.ReactNode;
  /** Whether this category should be highlighted with brand color */
  featured?: boolean;
  /** Number of processes in this category */
  processCount?: number;
}

/**
 * Content configuration for the Process Categories Section
 */
interface ProcessCategoriesContent {
  /** Main section title */
  title: string;
  /** Section subtitle/description */
  subtitle: string;
  /** List of available categories */
  categories: ProcessCategory[];
  /** Call-to-action button configuration */
  cta: {
    text: string;
    href?: string;
  };
}

/**
 * ISO/BPM Enterprise Process Categories Configuration
 * Focused on quality management, compliance, and enterprise systems
 */
const PROCESS_CATEGORIES_CONTENT: ProcessCategoriesContent = {
  title: 'Biblioteca de Procesos Lista para Usar',
  subtitle:
    '22+ categorías de procesos prediseñados que cubren todos los aspectos de las operaciones empresariales y cumplimiento ISO.',
  categories: [
    {
      name: 'Gestión de Calidad',
      description: 'ISO 9001, control de calidad, mejora continua',
      icon: <Award className='h-6 w-6' aria-hidden='true' />,
      processCount: 15,
    },
    {
      name: 'Gestión Ambiental',
      description: 'ISO 14001, sostenibilidad, impacto ambiental',
      icon: <Leaf className='h-6 w-6' aria-hidden='true' />,
      processCount: 12,
    },
    {
      name: 'Seguridad y SST',
      description: 'ISO 45001, prevención de riesgos laborales',
      icon: <Shield className='h-6 w-6' aria-hidden='true' />,
      processCount: 18,
    },
    {
      name: 'Gestión de Procesos',
      description: 'BPM, optimización, mapeo de procesos',
      icon: <Settings className='h-6 w-6' aria-hidden='true' />,
      processCount: 25,
    },
    {
      name: 'Auditorías y Cumplimiento',
      description: 'Auditorías internas, compliance, verificación',
      icon: <Search className='h-6 w-6' aria-hidden='true' />,
      processCount: 10,
    },
    {
      name: 'Control de Documentos',
      description: 'Gestión documental, versiones, aprobaciones',
      icon: <Archive className='h-6 w-6' aria-hidden='true' />,
      processCount: 8,
    },
    {
      name: 'Recursos Humanos',
      description: 'Selección, capacitación, evaluación',
      icon: <Users className='h-6 w-6' aria-hidden='true' />,
      processCount: 20,
    },
    {
      name: 'Finanzas y Contabilidad',
      description: 'Control financiero, presupuestos, reportes',
      icon: <BarChart3 className='h-6 w-6' aria-hidden='true' />,
      processCount: 16,
    },
    {
      name: 'Ventas y CRM',
      description: 'Gestión comercial, clientes, oportunidades',
      icon: <TrendingUp className='h-6 w-6' aria-hidden='true' />,
      processCount: 14,
    },
    {
      name: 'Operaciones',
      description: 'Producción, logística, cadena de suministro',
      icon: <Zap className='h-6 w-6' aria-hidden='true' />,
      processCount: 22,
    },
    {
      name: 'Marketing Digital',
      description: 'Campañas, contenido, análisis de mercado',
      icon: <Globe className='h-6 w-6' aria-hidden='true' />,
      processCount: 11,
    },
    {
      name: 'Conformidad Legal',
      description: 'Normativas, regulaciones, aspectos legales',
      icon: <FileCheck className='h-6 w-6' aria-hidden='true' />,
      processCount: 9,
    },
  ],
  cta: {
    text: 'Explorar Todas las Categorías',
    href: '/process-library',
  },
};

/**
 * Props for the ProcessCategoriesSection component
 */
interface ProcessCategoriesSectionProps {
  /** Custom content configuration (optional) */
  content?: ProcessCategoriesContent;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Process Categories Section Component
 *
 * Displays a grid of process categories with ISO/BPM focus.
 * Applies StrateKaz design system with black background and elegant styling.
 * One category can be featured with brand pink color.
 *
 * @param content - Custom content configuration
 * @param className - Additional CSS classes
 */
export const ProcessCategoriesSection: React.FC<
  ProcessCategoriesSectionProps
> = ({ content = PROCESS_CATEGORIES_CONTENT, className = '' }) => {
  return (
    <section
      className={`py-section-sm lg:py-section-md ${className}`}
    >
      <div className='container-responsive'>
        {/* Section Header - Mobile optimized */}
        <div className='text-center mb-4'>
          <h2 className='text-fluid-2xl lg:text-fluid-3xl font-bold font-title text-white-text mb-4'>
            <span className='sm:hidden'>Biblioteca de Recursos</span>
            <span className='hidden sm:inline'>{content.title}</span>
          </h2>
          <div className='hidden sm:block container-content'>
            <p className='text-xl text-white-muted'>{content.subtitle}</p>
          </div>
        </div>

        {/* Categories Grid - Mobile shows only 4 main pillars */}
        <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'>
          {/* Mobile: Show only first 4 categories - with description like PC */}
          <div className='sm:hidden contents'>
            {content.categories.slice(0, 4).map((category, index) => (
              <div
                key={index}
                className='group relative overflow-hidden rounded-xl p-4 bg-black-card-soft border border-black-border-soft transition-all duration-300 hover:border-neutral-600 hover:scale-105'
              >
                {/* Icon Container */}
                <div className='w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-black-hover text-brand-500 border border-black-border transition-all duration-300 group-hover:scale-110'>
                  {category.icon}
                </div>

                {/* Category Content - Like PC version */}
                <div className='space-y-2'>
                  <h3 className='font-title text-sm font-semibold text-white-text'>
                    {category.name}
                  </h3>
                  <p className='font-content text-xs text-white-muted-soft leading-relaxed'>
                    {category.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Show all categories */}
          {content.categories.map((category, index) => (
            <div
              key={index}
              className={`
                hidden sm:block group relative overflow-hidden rounded-xl p-4 lg:p-6
                bg-black-card-soft border border-black-border-soft
                hover:border-neutral-600 transition-all duration-500
                cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-brand-500/20
                ${category.featured
                  ? 'hover:shadow-2xl hover:shadow-brand-500/30 hover:scale-110'
                  : 'hover:bg-black-hover-soft hover:-translate-y-2 hover:shadow-brand-500/15'
                }
              `}
            >
              {/* Icon Container */}
              <div
                className={`
                  w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center mb-4
                  border border-black-border transition-all duration-500 group-hover:scale-125 group-hover:rotate-12
                  bg-black-hover text-brand-500 group-hover:bg-brand-500/10 group-hover:border-brand-500/50
                  ${category.featured
                    ? 'group-hover:shadow-lg group-hover:shadow-brand-500/30'
                    : ''
                  }
                `}
              >
                {category.icon}
              </div>

              {/* Category Content */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-title text-sm lg:text-base font-semibold text-white-text transition-all duration-300'>
                    {category.name}
                  </h3>
                  {category.processCount && (
                    <span className='font-content text-xs font-medium text-white-muted bg-black-hover px-2 py-1 rounded-full transition-all duration-300 group-hover:bg-brand-500/10 group-hover:text-brand-500'>
                      {category.processCount}
                    </span>
                  )}
                </div>

                <p className='font-content text-xs lg:text-sm text-white-muted-soft leading-relaxed'>
                  {category.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {content.cta && (
          <div className='mt-8 text-center sm:hidden'>
            <a
              href={content.cta.href}
              className='inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 transition-colors duration-300'
            >
              {content.cta.text}
            </a>
          </div>
        )}
      </div>
    </section >
  );
};

export default ProcessCategoriesSection;
