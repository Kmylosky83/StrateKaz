import React from 'react';
import {
  Building,
  Shield,
  Award,
  Users,
  Navigation,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVICE_COLORS } from '@/config/serviceColors.config';

/**
 * PricingHeroSection Component
 *
 * Hero section for the pricing page with animated content and metrics.
 * Features typing animation, rotating services, and key performance metrics.
 */
export const PricingHeroSection: React.FC = () => {
  const [currentServiceIndex, setCurrentServiceIndex] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const [displayedText, setDisplayedText] = React.useState('');
  const heroRef = React.useRef<HTMLElement>(null);

  // Orden: de gancho PYME (más buscado) a más técnico
  const services = [
    {
      name: 'Seguridad y Salud en el Trabajo',
      icon: Shield,
      ...SERVICE_COLORS.sst,
      benefit: 'Cumplimiento Decreto 1072',
      description: 'Protege tu equipo, garantiza el cumplimiento legal',
    },
    {
      name: 'Talento Humano',
      icon: Users,
      ...SERVICE_COLORS.coaching,
      benefit: 'Gestión integral de personal',
      description: 'Selección, nómina, desempeño y formación',
    },
    {
      name: 'PESV | Seguridad Vial',
      icon: Navigation,
      ...SERVICE_COLORS.pesv,
      benefit: 'Resolución 40595',
      description: 'Plan estratégico de seguridad vial completo',
    },
    {
      name: 'ISO Multi-Norma',
      icon: Award,
      ...SERVICE_COLORS.calidad,
      benefit: 'ISO 9001 + 14001 + 45001 + 27001',
      description: 'Certificación garantizada, 100% éxito',
    },
    {
      name: 'Gestión Ambiental',
      icon: Lightbulb,
      ...SERVICE_COLORS.ambiental,
      benefit: 'ISO 14001',
      description: 'Sostenibilidad rentable, impacto medible',
    },
  ];

  // Intersection Observer para animaciones de entrada
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Rotación de servicios con animación más fluida
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentServiceIndex(prevIndex => (prevIndex + 1) % services.length);
    }, 4000); // Tiempo aumentado para mejor lectura

    return () => clearInterval(interval);
  }, []);

  // Typing animation for the experience badge
  React.useEffect(() => {
    const fullText = '20+ años de experiencia';
    let currentIndex = 0;
    let isDeleting = false;

    const typeWriter = () => {
      if (!isDeleting) {
        if (currentIndex <= fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          setTimeout(() => {
            isDeleting = true;
          }, 2000);
        }
      } else {
        if (currentIndex > 0) {
          setDisplayedText(fullText.slice(0, currentIndex));
          currentIndex--;
        } else {
          isDeleting = false;
        }
      }
    };

    const interval = setInterval(typeWriter, isDeleting ? 50 : 100);
    return () => clearInterval(interval);
  }, []);

  const currentService = services[currentServiceIndex];
  const ServiceIcon = currentService.icon;

  return (
    <motion.section
      ref={heroRef}
      className='pt-section-xs pb-section-md lg:pt-section-sm lg:pb-section-lg relative overflow-hidden'
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Patrón sutil de fondo */}
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url(/src/assets/patterns/dots-pattern.svg)' }} />

      <div className='relative container-responsive'>
        <div className='text-center mb-8'>
          {/* Badge con typing animation mejorada */}
          <motion.div
            className='inline-flex items-center bg-black-card-soft px-4 py-2 rounded-full border border-black-border-soft mb-6'
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{
              opacity: isVisible ? 1 : 0,
              y: isVisible ? 0 : -20,
              scale: isVisible ? 1 : 0.8,
            }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Building className='h-5 w-5 text-system-yellow-500 mr-2' />
            </motion.div>
            <span className='text-white-text font-medium font-title'>
              {displayedText}
              <span className='animate-pulse text-system-yellow-500'>|</span>
            </span>
          </motion.div>

          <h1 className='text-fluid-3xl lg:text-fluid-4xl font-bold font-title text-white-text mb-6'>
            Consultoría Estratégica
            <span className='text-white-text block'>
              + Plataforma <span className='text-brand-500'>360°</span>
            </span>
          </h1>

          {/* Servicios dinámicos con contenedor mejorado */}
          <div className='max-w-content-responsive mx-auto mb-8'>
            <motion.p
              className='text-fluid-lg text-white-muted font-content text-center mb-4'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Consultoría 4.0 + Plataforma 360° en
            </motion.p>

            {/* Contenedor dinámico del servicio actual */}
            <motion.div
              className='bg-black-card-soft rounded-2xl p-6 border border-black-border-soft hover:border-brand-500/30 transition-all duration-500 max-w-2xl mx-auto'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: isVisible ? 1 : 0,
                scale: isVisible ? 1 : 0.9,
              }}
              transition={{ duration: 0.8, delay: 0.6 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
            >
              <div className='flex items-center justify-center space-x-4 mb-3'>
                <motion.div
                  key={currentServiceIndex}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentService.bgClass} border ${currentService.borderClass}`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ServiceIcon
                    className={`w-6 h-6 ${currentService.colorClass}`}
                  />
                </motion.div>

                <div className='text-center'>
                  <AnimatePresence mode='wait'>
                    <motion.h3
                      key={currentServiceIndex}
                      className='text-fluid-xl font-bold text-white-text font-title'
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.8 }}
                      transition={{ duration: 0.4 }}
                    >
                      {currentService.name}
                    </motion.h3>
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentServiceIndex}
                  className='text-center'
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div
                    className={`text-lg font-semibold ${currentService.colorClass} mb-1 font-title`}
                  >
                    {currentService.benefit}
                  </div>
                  <div className='text-white-muted-soft text-sm font-content'>
                    {currentService.description}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Indicador de progreso sutil */}
              <div className='flex justify-center space-x-2 mt-4'>
                {services.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentServiceIndex
                      ? 'bg-brand-500'
                      : 'bg-black-border-soft'
                      }`}
                    animate={{
                      scale: index === currentServiceIndex ? 1.2 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default PricingHeroSection;
