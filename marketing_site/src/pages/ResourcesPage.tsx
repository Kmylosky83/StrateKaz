import React, { useState } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { cn } from '@utils/cn';
import { CategoryModal } from '@components/resources/CategoryModal';
import { FinalCTASection } from '@components/sections/FinalCTASection';
import { seoManager, marketingSEO } from '@/utils/seo';
import { resourceCategories } from '@/data/resources';
import type { ResourceCategory } from '@/data/resources';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://app.stratekaz.com';

const ResourcesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  React.useEffect(() => {
    seoManager.setPageSEO(marketingSEO.recursos);
    seoManager.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Biblioteca de Recursos Gratuitos | StrateKaz',
      description: marketingSEO.recursos.description,
      url: 'https://stratekaz.com/recursos',
      provider: { '@type': 'Organization', name: 'StrateKaz', url: 'https://stratekaz.com' },
    });
  }, []);

  const handleOpenCategory = (cat: ResourceCategory) => {
    setSelectedCategory(cat);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedCategory(null), 300);
  };

  return (
    <div className='min-h-screen bg-black-deep'>
      {/* Hero */}
      <section className='py-section-lg px-4 text-center'>
        <div className='max-w-3xl mx-auto'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-sm font-medium mb-6'>
            <BookOpen className='h-4 w-4' />
            Biblioteca de Recursos Gratuitos
          </div>

          <h1 className='font-title font-bold text-fluid-3xl lg:text-fluid-4xl text-white-text leading-tight mb-4'>
            Herramientas listas para usar
            <span className='block text-brand-500'>en tu empresa</span>
          </h1>

          <p className='text-white-muted text-base sm:text-lg leading-relaxed max-w-2xl mx-auto'>
            Plantillas, matrices y guías elaboradas por expertos en gestión empresarial colombiana.
            Descárgalas gratis, sin letra pequeña.
          </p>

          <div className='flex items-center justify-center gap-8 mt-8 text-sm text-white-muted'>
            <span>
              <span className='font-bold text-white-text text-lg'>9</span> categorías
            </span>
            <span className='w-px h-4 bg-black-border' />
            <span>
              <span className='font-bold text-white-text text-lg'>100+</span> recursos
            </span>
            <span className='w-px h-4 bg-black-border' />
            <span>
              <span className='font-bold text-white-text text-lg'>100%</span> gratis
            </span>
          </div>
        </div>
      </section>

      {/* Grid de categorías */}
      <section className='pb-section-lg px-4'>
        <div className='max-w-5xl mx-auto'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'>
            {resourceCategories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.code}
                  onClick={() => handleOpenCategory(cat)}
                  className={cn(
                    'group text-left p-6 rounded-2xl border bg-black-card',
                    'transition-all duration-300',
                    'hover:bg-black-card-soft hover:scale-[1.02]',
                    cat.borderClass,
                  )}
                >
                  {/* Icono + count */}
                  <div className='flex items-start justify-between mb-4'>
                    <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl border', cat.bgClass, cat.borderClass)}>
                      <Icon className={cn('h-6 w-6', cat.colorClass)} />
                    </div>
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', cat.bgClass, cat.colorClass)}>
                      {cat.resourceCount} recursos
                    </span>
                  </div>

                  {/* Nombre */}
                  <h3 className='font-title font-semibold text-white-text text-base leading-tight mb-2'>
                    {cat.name}
                  </h3>

                  {/* Descripción */}
                  <p className='text-sm text-white-muted leading-relaxed line-clamp-3 mb-4'>
                    {cat.description}
                  </p>

                  {/* Formatos */}
                  <div className='flex items-center gap-1.5 flex-wrap mb-4'>
                    {cat.formats.map(fmt => (
                      <span
                        key={fmt}
                        className='px-2 py-0.5 rounded-md bg-black-hover text-white-muted/70 text-[10px] font-medium border border-black-border'
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className={cn('flex items-center gap-1.5 text-sm font-medium transition-colors', cat.colorClass)}>
                    Ver recursos
                    <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <FinalCTASection
        onTrialStart={() => window.open('/contacto', '_self')}
        title='Estos recursos son solo el comienzo'
        subtitle='StrateKaz automatiza todo esto y más: 84+ módulos, firma digital, IA integrada y gestión 360 en una sola plataforma.'
      />

      {/* Modal */}
      <CategoryModal
        category={selectedCategory}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
};

export default ResourcesPage;
export { ResourcesPage };
