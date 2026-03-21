import React from 'react';
import { Hero } from '../components/Hero';
import { SocialProofBar } from '../components/SocialProofBar';
import { TrustedBySection } from '../components/sections/TrustedBySection';
import { FeatureShowcase } from '../components/FeatureShowcase';
import { ProcessCategoriesSection } from '../components/sections/ProcessCategoriesSection';
import { FinalCTASection } from '../components/sections/FinalCTASection';

const LandingPage: React.FC = () => {
  React.useEffect(() => {
    document.title = 'StrateKaz | Consultoría 4.0 — SST, Talento Humano, PESV e ISO | Colombia';
  }, []);

  const handleTrialStart = async (_tierId?: string) => {
    // Navigate to contact page for trial request
    window.location.href = '/contact';
  };

  const handleDemoClick = () => {
    // Navigate to contact page for demo request
    window.location.href = '/contact';
  };

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <Hero />

      {/* Social Proof Bar - Pilares Estratégicos */}
      <div id="services">
        <SocialProofBar />
      </div>

      {/* Trusted By - Client Logos */}
      <div id="clients">
        <TrustedBySection />
      </div>

      {/* Feature Showcase - Servicios Profesionales */}
      <FeatureShowcase />

      {/* Process Categories - Biblioteca de Procesos */}
      <ProcessCategoriesSection />

      {/* Final CTA Section */}
      <div id="coverage">
        <FinalCTASection
          onTrialStart={() => handleTrialStart()}
          onDemoClick={handleDemoClick}
        />
      </div>
    </div>
  );
};

export default LandingPage;
export { LandingPage };
