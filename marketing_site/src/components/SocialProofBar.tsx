import React from 'react';
import {
  Shield,
  Award,
  AlertTriangle,
  Lightbulb,
  Rocket,
  CheckCircle,
  Clock,
} from 'lucide-react';

// TypeScript interfaces for Strategic Pillars
interface StrategicPillar {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface StrategicStat {
  value: number;
  suffix: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface StrategicContent {
  headline: {
    text: string;
    subtext: string;
  };
  pillars: StrategicPillar[];
  stats: StrategicStat[];
}

// Strategic Pillars content constants
const STRATEGIC_CONTENT: StrategicContent = {
  headline: {
    text: 'Pilares Estratégicos',
    subtext:
      'Soluciones integrales que transforman la gestión empresarial con tecnología especializada',
  },
  pillars: [
    {
      name: 'Sistemas de Gestión',
      description: 'ISO 9001 | ISO 14001 | ISO 45001 | ISO 27001',
      icon: Award,
      color: 'text-system-blue-500',
      bgColor: 'bg-system-blue-500/10',
    },
    {
      name: 'Cumplimiento Normativo',
      description: 'SGSST | PESV | Reforma Laboral',
      icon: AlertTriangle,
      color: 'text-system-red-500',
      bgColor: 'bg-system-red-500/10',
    },
    {
      name: 'Innovación',
      description: 'Transformación Digital | Proyectos | BI',
      icon: Lightbulb,
      color: 'text-system-orange-500',
      bgColor: 'bg-system-orange-500/10',
    },
    {
      name: 'Nuevos Desafíos',
      description: 'Servicios Emergentes | Nuevas Ideas | Retos',
      icon: Rocket,
      color: 'text-system-purple-500',
      bgColor: 'bg-system-purple-500/10',
    },
  ],
  stats: [
    {
      value: 40,
      suffix: '%',
      label: 'Menos tiempo de implementación',
      description: 'Optimización de procesos',
      icon: Clock,
    },
    {
      value: 95,
      suffix: '%',
      label: 'Reducción de errores',
      description: 'Calidad garantizada',
      icon: CheckCircle,
    },
    {
      value: 100,
      suffix: '%',
      label: 'Cumplimiento normativo',
      description: 'Auditorías exitosas',
      icon: Shield,
    },
  ],
};

/**
 * SocialProofBar Component
 *
 * A professional strategic pillars section following StrateKaz design system.
 * Features strategic pillars and key statistics with animated counters.
 *
 * Design System:
 * - Uses black-deep background with system colors (blue, red, orange, purple)
 * - Consistent spacing with Hero section (py-4 lg:py-8)
 * - Responsive grid layouts for pillars and stats
 * - Animated counters and hover effects for interactivity
 * - Professional color coding for different management areas
 */
export const SocialProofBar: React.FC = () => {
  return (
    <>
      <section className='py-section-sm lg:py-section-md'>
        <div className='container-responsive'>
          {/* Header */}
          <div className='text-center mb-8'>
            <h2 className='text-fluid-2xl lg:text-fluid-3xl font-bold font-title text-white-text mb-4'>
              {STRATEGIC_CONTENT.headline.text}
            </h2>
            <div className='container-content'>
              <p className='text-xl text-white-muted'>
                {STRATEGIC_CONTENT.headline.subtext}
              </p>
            </div>
          </div>

          {/* Strategic Pillars Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12'>
            {STRATEGIC_CONTENT.pillars.map(pillar => {
              const IconComponent = pillar.icon;
              return (
                <div
                  key={pillar.name}
                  className='group bg-black-card-soft border border-black-border-soft rounded-xl p-4 lg:p-6 hover:border-neutral-600 transition-all duration-300 hover:bg-black-hover-soft hover:scale-105 hover:shadow-medium'
                >
                  <div className='flex flex-col items-center text-center space-y-4'>
                    <div
                      className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${pillar.bgColor}`}
                    >
                      <IconComponent
                        className={`w-6 h-6 lg:w-7 lg:h-7 ${pillar.color} transition-colors`}
                      />
                    </div>
                    <div className='space-y-2'>
                      <div className='text-sm lg:text-base font-semibold mb-2 font-subtitle text-white-text transition-colors'>
                        {pillar.name}
                      </div>
                      <div className='text-xs lg:text-sm text-white-muted-soft font-content leading-relaxed'>
                        {pillar.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats Grid with Animated Counters */}
          <div
            id='stats-section'
            className='grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8'
          >
            {STRATEGIC_CONTENT.stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className='text-center bg-black-card-soft rounded-xl p-6 lg:p-8 border border-black-border-soft hover:border-neutral-600 transition-all duration-300 hover:scale-105 hover:shadow-medium'
                >
                  <div className='flex justify-center mb-4'>
                    <div className='w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 bg-neutral-800'>
                      <IconComponent className='w-6 h-6 transition-colors text-accent-icon' />
                    </div>
                  </div>
                  <div className='text-fluid-2xl lg:text-fluid-3xl font-bold mb-2 font-title transition-all duration-300 text-accent-highlight'>
                    {stat.value}
                    {stat.suffix}
                  </div>
                  <div className='text-sm lg:text-base font-medium text-white-text-soft mb-1 font-subtitle'>
                    {stat.label}
                  </div>
                  <div className='text-xs lg:text-sm text-white-muted-soft font-content'>
                    {stat.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};
