import React from 'react';
import { TrialCTA } from '@components/CTAButton';

/**
 * Final CTA Section Content Configuration
 * Contenido empresarial enfocado en Consultoría 4.0 + Plataforma 360°
 */
const FINAL_CTA_CONTENT = {
  title: 'Seguridad Laboral, Talento Humano, ISO y más | todo en uno.',
  subtitle:
    'Una sola plataforma para SST, PESV, Talento Humano, ISO Multi-Norma, Firma Digital y 84+ módulos más. Empieza hoy.',
  cta: {
    text: 'Agendar Reunión',
    subtext: '',
  },
} as const;

/**
 * Props for FinalCTASection component
 */
interface FinalCTASectionProps {
  /** Handler for trial start button click */
  onTrialStart: () => void;
  /** Handler for demo request button click - keeping for compatibility */
  onDemoClick?: () => void;
  /** Optional custom title override */
  title?: string;
  /** Optional custom subtitle override */
  subtitle?: string;
}

/**
 * FinalCTASection Component
 *
 * Sección final de call-to-action con design system StrateKaz minimalista.
 * Optimizada para empresas que buscan Consultoría 4.0 + Plataforma de Gestión 360°.
 *
 * Design principles:
 * - Fondo negro profundo (bg-black-deep)
 * - Card principal con bg-black-card
 * - Rosa SOLO para icono Award y TrialCTA button
 * - Tipografía elegante con font-title y font-content
 * - Layout centrado y profesional
 *
 * @param props - Component props
 * @returns JSX.Element
 */
export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  onTrialStart,
  onDemoClick: _onDemoClick,
  title = FINAL_CTA_CONTENT.title,
  subtitle = FINAL_CTA_CONTENT.subtitle,
}) => {
  return (
    <section className='py-section-sm lg:py-section-md'>
      <div className='container-responsive'>
        <div className='text-center'>
          {/* Diseño minimalista ultra limpio - Mobile optimized */}
          <div className='w-full sm:max-w-2xl mx-auto space-y-6 sm:space-y-8'>
            {/* Título principal con animación genial */}
            <h2 className='text-fluid-2xl lg:text-fluid-3xl font-title font-bold text-white-text leading-tight transform hover:scale-105 transition-all duration-500 hover:text-brand-500 cursor-default'>
              {title}
            </h2>

            {/* Subtítulo poderoso - Visible on all devices */}
            <div className='w-full sm:max-w-content-normal mx-auto'>
              <p className='text-base sm:text-fluid-xl font-content text-white-muted leading-relaxed'>
                {subtitle}
              </p>
            </div>

            {/* CTAs */}
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <TrialCTA
                size='xl'
                onClick={onTrialStart}
                className='font-title font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
              >
                {FINAL_CTA_CONTENT.cta.text}
              </TrialCTA>
              <a
                href='/precios'
                className='inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-black-border-soft hover:border-neutral-500 text-white-muted hover:text-white-text font-medium font-title text-base transition-all duration-200 min-h-[48px]'
              >
                Ver Precios →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
