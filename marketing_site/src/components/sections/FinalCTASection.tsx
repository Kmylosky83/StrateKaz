import React from 'react';
import { TrialCTA } from '@components/CTAButton';

/**
 * Final CTA Section Content Configuration
 * Contenido empresarial enfocado en BPM/ISO compliance
 */
const FINAL_CTA_CONTENT = {
  title: '¿Estás listo para el siguiente nivel?',
  subtitle:
    'No diseñamos sistemas de gestión. Desatamos el potencial de tu empresa. Únete a StrateKaz.',
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
 * Optimizada para empresas que buscan compliance ISO y BPM profesional.
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

            {/* CTA único y poderoso */}
            <div>
              <TrialCTA
                size='xl'
                onClick={onTrialStart}
                className='font-title font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
              >
                {FINAL_CTA_CONTENT.cta.text}
              </TrialCTA>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
