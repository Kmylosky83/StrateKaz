import React from 'react';
import { ContactHeroSection } from '@components/sections/ContactHeroSection';
import { ContactFormSection } from '@components/sections/ContactFormSection';
import { PresenceMapSection } from '@components/sections/PresenceMapSection';

/**
 * ContactPage Component
 *
 * Main contact page with separated sections for better modularity.
 * Includes: Hero, Contact Form, and Presence Map.
 */
const ContactPage: React.FC = () => {
  React.useEffect(() => {
    document.title = 'StrateKaz | Agendar Reunión';
  }, []);

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <ContactHeroSection />

      {/* Contact Form Section */}
      <ContactFormSection />

      {/* Professional Bridge - Desktop Only */}
      <div className='hidden sm:block py-section-xs'>
        <div className='container-responsive'>
          <div className='flex items-center justify-center space-x-8 text-sm text-white-muted/80'>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-brand-500 rounded-full animate-pulse' />
              <span>Metodología probada</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-system-blue-500 rounded-full animate-pulse' />
              <span>Presencia nacional</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-system-yellow-500 rounded-full animate-pulse' />
              <span>Expansión continua</span>
            </div>
          </div>
        </div>
      </div>

      {/* Presence Map Section */}
      <PresenceMapSection />
    </div>
  );
};

export default ContactPage;
export { ContactPage };
