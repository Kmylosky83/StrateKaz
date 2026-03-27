import React, { useState } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@utils/cn';
import { CategoryModal } from '@components/resources/CategoryModal';
import { FinalCTASection } from '@components/sections/FinalCTASection';
import { seoManager, marketingSEO } from '@/utils/seo';
import { resourceCategories } from '@/data/resources';
import type { ResourceCategory } from '@/data/resources';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://app.stratekaz.com';

// Frases que rotan en la typing animation del badge
const TYPING_PHRASES = [
  'Biblioteca de Recursos Gratuitos',
  'Plantillas para SST y ISO',
  'Matrices listas para usar',
  'Sin registro obligatorio',
  '100% gratuito, sin letra pequeña',
];

const STATS = [
  { value: '9', label: 'categorías' },
  { value: '100+', label: 'recursos' },
  { value: '100%', label: 'gratis' },
];

const ResourcesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const heroRef = React.useRef<HTMLElement>(null);

  // SEO
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

  // IntersectionObserver — igual que PricingHeroSection
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 },
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  // Typing animation — igual que PricingHeroSection
  React.useEffect(() => {
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const tick = () => {
      const current = TYPING_PHRASES[phraseIndex];
      if (!isDeleting) {
        setDisplayedText(current.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex === current.length) {
          setTimeout(() => { isDeleting = true; }, 2200);
        }
      } else {
        setDisplayedText(current.slice(0, charIndex - 1));
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % TYPING_PHRASES.length;
        }
      }
    };

    const interval = setInterval(tick, isDeleting ? 45 : 90);
    return () => clearInterval(interval);
  }, []);

  // Rotación de categoría destacada — igual que PricingHeroSection
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCategoryIndex(i => (i + 1) % resourceCategories.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleOpenCategory = (cat: ResourceCategory) => {
    setSelectedCategory(cat);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedCategory(null), 300);
  };

  const activeCat = resourceCategories[currentCategoryIndex];
  const ActiveIcon = activeCat.icon;

  return (
    <div className='min-h-screen bg-black-deep'>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        className='pt-section-xs pb-section-md lg:pt-section-sm lg:pb-section-lg relative overflow-hidden'
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className='relative container-responsive text-center'>

          {/* Badge con typing animation */}
          <motion.div
            className='inline-flex items-center bg-black-card-soft px-4 py-2 rounded-full border border-black-border-soft mb-6'
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20, scale: isVisible ? 1 : 0.8 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <BookOpen className='h-4 w-4 text-brand-500 mr-2' />
            </motion.div>
            <span className='text-white-text font-medium font-title text-sm'>
              {displayedText}
              <span className='animate-pulse text-brand-500'>|</span>
            </span>
          </motion.div>

          {/* Título */}
          <motion.h1
            className='font-title font-bold text-fluid-3xl lg:text-fluid-4xl text-white-text leading-tight mb-4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            Herramientas listas para usar
            <span className='block text-brand-500'>en tu empresa</span>
          </motion.h1>

          {/* Descripción */}
          <motion.p
            className='text-white-muted text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            Plantillas, matrices y guías elaboradas por expertos en gestión empresarial colombiana.
            Descárgalas gratis, sin letra pequeña.
          </motion.p>

          {/* Categoría destacada rotante — igual que Precios */}
          <motion.div
            className='bg-black-card-soft rounded-2xl p-5 border border-black-border-soft hover:border-brand-500/30 transition-all duration-500 max-w-sm mx-auto mb-8'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
          >
            <div className='flex items-center justify-center gap-3 mb-2'>
              <motion.div
                key={currentCategoryIndex}
                className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', activeCat.bgClass, activeCat.borderClass)}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ActiveIcon className={cn('w-5 h-5', activeCat.colorClass)} />
              </motion.div>

              <AnimatePresence mode='wait'>
                <motion.span
                  key={currentCategoryIndex}
                  className='font-title font-bold text-white-text text-base'
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.9 }}
                  transition={{ duration: 0.35 }}
                >
                  {activeCat.name}
                </motion.span>
              </AnimatePresence>
            </div>

            <AnimatePresence mode='wait'>
              <motion.p
                key={currentCategoryIndex}
                className='text-xs text-white-muted text-center'
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, delay: 0.08 }}
              >
                {activeCat.resourceCount} recursos disponibles · {activeCat.formats.join(' · ')}
              </motion.p>
            </AnimatePresence>

            {/* Dots indicadores */}
            <div className='flex justify-center gap-1.5 mt-3'>
              {resourceCategories.map((_, i) => (
                <motion.div
                  key={i}
                  className={cn('w-1.5 h-1.5 rounded-full transition-all duration-300', i === currentCategoryIndex ? 'bg-brand-500' : 'bg-black-border-soft')}
                  animate={{ scale: i === currentCategoryIndex ? 1.3 : 1 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Stats con stagger */}
          <div className='flex items-center justify-center gap-8 text-sm text-white-muted'>
            {STATS.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <span className='w-px h-4 bg-black-border' />}
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                >
                  <span className='font-bold text-white-text text-lg'>{stat.value}</span> {stat.label}
                </motion.span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── GRID DE CATEGORÍAS ────────────────────────────────── */}
      <section className='pb-section-lg px-4'>
        <div className='max-w-5xl mx-auto'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'>
            {resourceCategories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.code}
                  onClick={() => handleOpenCategory(cat)}
                  className={cn(
                    'group text-left p-6 rounded-2xl border bg-black-card',
                    'transition-colors duration-300',
                    cat.borderClass,
                  )}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 24 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.07 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.25 } }}
                >
                  {/* Icono + count */}
                  <div className='flex items-start justify-between mb-4'>
                    <motion.div
                      className={cn('flex items-center justify-center w-12 h-12 rounded-xl border', cat.bgClass, cat.borderClass)}
                      whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
                    >
                      <Icon className={cn('h-6 w-6', cat.colorClass)} />
                    </motion.div>
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
                  <div className={cn('flex items-center gap-1.5 text-sm font-medium', cat.colorClass)}>
                    Ver recursos
                    <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                  </div>
                </motion.button>
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
