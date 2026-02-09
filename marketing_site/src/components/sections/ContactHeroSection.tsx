import React from 'react';
import {
  Search,
  Lightbulb,
  Settings,
  BarChart3,
  TrendingUp,
  Trophy,
  PersonStanding,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react';

interface ProcessStep {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  x: number;
  delay: number;
  color: string;
}

const processSteps: ProcessStep[] = [
  { name: 'Diagnóstico', icon: Search, x: 8, delay: 0, color: 'text-blue-400' },
  {
    name: 'Diseño',
    icon: Lightbulb,
    x: 25,
    delay: 1,
    color: 'text-system-yellow-400',
  },
  {
    name: 'Implementación',
    icon: Settings,
    x: 42,
    delay: 2,
    color: 'text-orange-400',
  },
  {
    name: 'Evaluación',
    icon: BarChart3,
    x: 59,
    delay: 3,
    color: 'text-purple-400',
  },
  {
    name: 'Mejora',
    icon: TrendingUp,
    x: 76,
    delay: 4,
    color: 'text-green-400',
  },
  { name: 'Éxito', icon: Trophy, x: 92, delay: 5, color: 'text-brand-400' },
];

/**
 * ContactHeroSection Component
 *
 * Hero section for contact page with typing animation and process timeline.
 * Features dynamic text rotation and animated process visualization.
 */
export const ContactHeroSection: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [personPosition, setPersonPosition] = React.useState({
    x: processSteps[0].x,
  });

  const rotatingTexts = [
    'Sistema de Gestión',
    'Dirección Estratégica',
    'Proceso de Selección',
    'Programa de Capacitación',
    'Nuevo Proyecto',
  ];

  const [currentTextIndex, setCurrentTextIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const currentText = rotatingTexts[currentTextIndex];
    const speed = isDeleting ? 50 : 100;
    const delay = isDeleting ? 0 : currentText === displayText ? 3000 : 0;

    const timer = setTimeout(() => {
      if (!isDeleting && displayText === currentText) {
        setIsDeleting(true);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setCurrentTextIndex(prev => (prev + 1) % rotatingTexts.length);
      } else if (isDeleting) {
        setDisplayText(currentText.substring(0, displayText.length - 1));
      } else {
        setDisplayText(currentText.substring(0, displayText.length + 1));
      }
    }, speed + delay);

    return () => clearTimeout(timer);
  }, [currentTextIndex, displayText, isDeleting]);

  // Animación del proceso - persona moviéndose por las etapas
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        const nextIndex = (prev + 1) % processSteps.length;
        setPersonPosition({ x: processSteps[nextIndex].x });
        return nextIndex;
      });
    }, 2500); // Cambiar de paso cada 2.5 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className='pt-section-xs pb-section-sm lg:pt-section-sm lg:pb-section-md'>
        <div className='container-responsive'>
          <div className='text-center mb-8'>
            <h1 className='text-fluid-3xl lg:text-fluid-4xl font-bold text-white-text mb-6'>
              Hablemos sobre tu
              <span className='text-brand-500 block min-h-[1.2em]'>
                {displayText}
                <span className='animate-pulse'>|</span>
              </span>
            </h1>

            {/* Description and benefits - Hidden on mobile */}
            <div className='hidden sm:block container-content mb-6'>
              <p className='text-xl text-white-muted'>
                ¿Listo para potenciar tu organización? Nosotros estamos aquí
                para ayudarte con consultoría especializada y tecnología
                innovadora.
              </p>
            </div>

            <div className='hidden sm:flex flex-wrap justify-center gap-section-xs text-sm text-white-muted'>
              <div className='flex items-center space-x-2'>
                <CheckCircle
                  className='h-4 w-4 text-success-600'
                  aria-hidden='true'
                />
                <span>Consulta gratuita</span>
              </div>
              <div className='flex items-center space-x-2'>
                <Clock
                  className='h-4 w-4 text-success-600'
                  aria-hidden='true'
                />
                <span>En tiempo récord</span>
              </div>
              <div className='flex items-center space-x-2'>
                <Shield
                  className='h-4 w-4 text-success-600'
                  aria-hidden='true'
                />
                <span>Sin compromiso</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Animation Section */}
      <section className='pb-section-sm'>
        <div className='container-responsive'>
          {/* Process Timeline */}
          <div className='relative'>
            {/* Progress Line - Desktop Only */}
            <div className='hidden md:block absolute top-1/2 left-0 right-0 h-px bg-black-border transform -translate-y-1/2'></div>
            <div
              className='hidden md:block absolute top-1/2 left-0 h-px bg-brand-500 transform -translate-y-1/2 transition-all duration-[2500ms] ease-in-out opacity-60'
              style={{
                width: `${(currentStepIndex + 1) * (100 / processSteps.length)}%`,
              }}
            ></div>

            {/* Process Steps - Desktop */}
            <div className='hidden md:flex relative justify-between items-center py-6'>
              {processSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index <= currentStepIndex;

                return (
                  <div
                    key={step.name}
                    className='flex flex-col items-center text-center'
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-500 ${isActive
                          ? `bg-black-card ${step.color}`
                          : 'bg-black-border text-white-muted'
                        }`}
                    >
                      <IconComponent className='h-6 w-6' aria-hidden='true' />
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors duration-500 ${isActive ? 'text-white-text' : 'text-white-muted'
                        }`}
                    >
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Process Steps - Mobile */}
            <div className='md:hidden space-y-4 py-6'>
              {processSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index <= currentStepIndex;
                const _isCurrent = index === currentStepIndex;

                return (
                  <div
                    key={step.name}
                    className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-500 ${isActive
                        ? 'bg-black-card-soft border border-black-border'
                        : 'bg-black-hover'
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${isActive
                          ? `bg-black-card ${step.color}`
                          : 'bg-black-border text-white-muted'
                        }`}
                    >
                      <IconComponent className='h-5 w-5' aria-hidden='true' />
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors duration-500 ${isActive ? 'text-white-text' : 'text-white-muted'
                        }`}
                    >
                      {step.name}
                    </span>
                    {_isCurrent && (
                      <PersonStanding
                        className='h-8 w-8 text-system-yellow-500 animate-bounce ml-auto'
                        aria-label='Persona en progreso'
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Moving Person - Desktop Only */}
            <div
              className='hidden md:block absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out'
              style={{
                left: `${personPosition.x}%`,
                transform: 'translate(-50%, -50%) translateY(-12px)',
              }}
            >
              <PersonStanding
                className='h-10 w-10 text-system-yellow-500 opacity-90 animate-bounce drop-shadow-lg'
                aria-label='Persona navegando el proceso'
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactHeroSection;
