import React from 'react';
import { Search, BookOpen, Download, Users } from 'lucide-react';

interface ResourcesHeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalResources: number;
}

export const ResourcesHeroSection: React.FC<ResourcesHeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  totalResources,
}) => {
  return (
    <section className='pt-section-xs pb-section-sm lg:pt-section-sm lg:pb-section-md'>
      <div className='container-responsive'>
        <div className='text-center'>
          {/* Badge */}
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6'>
            <BookOpen className='h-3.5 w-3.5' />
            Biblioteca de Recursos Gratuitos
          </div>

          {/* Title */}
          <h1 className='text-fluid-3xl lg:text-fluid-4xl font-title font-bold text-white-text mb-4'>
            Recursos para tu{' '}
            <span className='text-brand-500'>Gestion Empresarial</span>
          </h1>

          {/* Subtitle */}
          <div className='max-w-content-normal mx-auto mb-8'>
            <p className='text-base sm:text-fluid-lg font-content text-white-muted leading-relaxed'>
              Matrices, procedimientos, guias, prompts de IA y herramientas descargables gratis.
              Todo lo que necesitas para tu sistema de gestion integral.
            </p>
          </div>

          {/* Stats */}
          <div className='flex flex-wrap justify-center gap-6 sm:gap-10 mb-8'>
            <div className='flex items-center gap-2 text-sm text-white-muted'>
              <Download className='h-4 w-4 text-brand-400' />
              <span>
                <span className='font-semibold text-white-text'>{totalResources}+</span> recursos
              </span>
            </div>
            <div className='flex items-center gap-2 text-sm text-white-muted'>
              <BookOpen className='h-4 w-4 text-brand-400' />
              <span>
                <span className='font-semibold text-white-text'>9</span> categorias
              </span>
            </div>
            <div className='flex items-center gap-2 text-sm text-white-muted'>
              <Users className='h-4 w-4 text-brand-400' />
              <span>100% gratis</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className='max-w-lg mx-auto'>
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white-muted/50' />
              <input
                type='text'
                placeholder='Buscar recursos... (ej: "IPEVR", "prompts", "ISO 9001")'
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className='w-full pl-12 pr-4 py-3 rounded-xl bg-black-card border border-black-border text-white-text text-sm placeholder:text-white-muted/40 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all min-h-[48px]'
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-white-muted/50 hover:text-white-text text-xs'
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResourcesHeroSection;
