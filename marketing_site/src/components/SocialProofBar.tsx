import React from 'react';
import {
  Shield,
  Award,
  CheckCircle,
  Clock,
  Boxes,
  HardHat,
  Workflow,
  BarChart3,
  Users2,
  FileSignature,
} from 'lucide-react';

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

const STRATEGIC_CONTENT: StrategicContent = {
  headline: {
    text: 'Pilares de la Plataforma',
    subtext:
      '6 ejes que cubren el 100% de la gestión empresarial — desde cumplimiento normativo hasta inteligencia de negocio',
  },
  pillars: [
    {
      name: 'Gobierno & Cumplimiento',
      description: 'ISO 9001 | 14001 | 45001 | 27001 | SAGRILAFT',
      icon: Award,
      color: 'text-system-blue-500',
      bgColor: 'bg-system-blue-500/10',
    },
    {
      name: 'Operaciones & Cadena de Valor',
      description: 'Supply Chain | Producción | Logística | CRM',
      icon: Boxes,
      color: 'text-system-green-500',
      bgColor: 'bg-system-green-500/10',
    },
    {
      name: 'Capital Humano',
      description: 'Selección | Nómina | Desempeño | Formación',
      icon: Users2,
      color: 'text-system-orange-500',
      bgColor: 'bg-system-orange-500/10',
    },
    {
      name: 'HSEQ & SST',
      description: 'Accidentalidad | Higiene | Emergencias | Ambiental',
      icon: HardHat,
      color: 'text-system-red-500',
      bgColor: 'bg-system-red-500/10',
    },
    {
      name: 'Automatización & Flujos',
      description: 'Workflows BPMN | Firma Digital | Alertas',
      icon: Workflow,
      color: 'text-system-purple-500',
      bgColor: 'bg-system-purple-500/10',
    },
    {
      name: 'Inteligencia de Negocio',
      description: 'KPIs | Dashboards | Informes | Tendencias',
      icon: BarChart3,
      color: 'text-system-yellow-500',
      bgColor: 'bg-system-yellow-500/10',
    },
  ],
  stats: [
    {
      value: 84,
      suffix: '+',
      label: 'Módulos integrados',
      description: 'SGI + ERP + GRC + HSEQ + BI',
      icon: CheckCircle,
    },
    {
      value: 100,
      suffix: '%',
      label: 'Éxito en certificaciones',
      description: 'Auditorías aprobadas',
      icon: Shield,
    },
    {
      value: 20,
      suffix: '+',
      label: 'Años de experiencia',
      description: 'Consultoría especializada',
      icon: Clock,
    },
    {
      value: 5,
      suffix: ' min',
      label: 'Firma Digital SHA-256',
      description: 'Documentos firmados al instante',
      icon: FileSignature,
    },
  ],
};

/**
 * SocialProofBar Component
 *
 * Shows the 6 real strategic pillars of the StrateKaz platform
 * and key stats with animated counters.
 */
export const SocialProofBar: React.FC = () => {
  return (
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

        {/* 6 Strategic Pillars Grid */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5 mb-12'>
          {STRATEGIC_CONTENT.pillars.map(pillar => {
            const IconComponent = pillar.icon;
            return (
              <div
                key={pillar.name}
                className='group bg-black-card-soft border border-black-border-soft rounded-xl p-4 lg:p-5 hover:border-neutral-600 transition-all duration-300 hover:bg-black-hover-soft hover:scale-105 hover:shadow-medium'
              >
                <div className='flex flex-col items-center text-center space-y-3'>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${pillar.bgColor}`}
                  >
                    <IconComponent
                      className={`w-6 h-6 ${pillar.color} transition-colors`}
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <div className='text-sm font-semibold font-subtitle text-white-text transition-colors'>
                      {pillar.name}
                    </div>
                    <div className='text-xs text-white-muted-soft font-content leading-relaxed'>
                      {pillar.description}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div
          id='stats-section'
          className='grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6'
        >
          {STRATEGIC_CONTENT.stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className='text-center bg-black-card-soft rounded-xl p-5 lg:p-6 border border-black-border-soft hover:border-neutral-600 transition-all duration-300 hover:scale-105 hover:shadow-medium'
              >
                <div className='flex justify-center mb-3'>
                  <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-neutral-800'>
                    <IconComponent className='w-5 h-5 text-accent-icon' />
                  </div>
                </div>
                <div className='text-fluid-xl lg:text-fluid-2xl font-bold mb-1 font-title text-accent-highlight'>
                  {stat.value}
                  {stat.suffix}
                </div>
                <div className='text-sm font-medium text-white-text-soft mb-0.5 font-subtitle'>
                  {stat.label}
                </div>
                <div className='text-xs text-white-muted-soft font-content'>
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
