import React from 'react';
import { Navigation } from './Navigation';
import { ServicesTab } from './ServicesTab';
import { ProfilesTab } from './ProfilesTab';
import { FAQTab } from './FAQTab';
import { TabType } from './types';

export const ConsultingServicesSection: React.FC = () => {
  const [selectedTab, setSelectedTab] = React.useState<TabType>('services');
  const [expandedFAQ, setExpandedFAQ] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState(
    'Servicios de Consultoría'
  );

  const handleConsultationRequest = (serviceId?: string) => {
    window.location.href = `/contacto?service=${serviceId || 'general'}&type=consultation`;
  };

  const toggleFAQ = (question: string) => {
    setExpandedFAQ(expandedFAQ === question ? null : question);
  };

  return (
    <>
      {/* Navigation Section */}
      <Navigation selectedTab={selectedTab} onTabChange={setSelectedTab} />

      {/* Tab Content */}
      <section className='pt-6 pb-8 sm:pt-8 sm:pb-12 lg:pt-12 lg:pb-16'>
        <div className='container-responsive'>
          {/* Services Tab */}
          {selectedTab === 'services' && (
            <ServicesTab onConsultationRequest={handleConsultationRequest} />
          )}

          {/* Profiles Tab */}
          {selectedTab === 'profiles' && <ProfilesTab />}

          {/* FAQ Tab */}
          {selectedTab === 'faq' && (
            <FAQTab
              selectedCategory={selectedCategory}
              expandedFAQ={expandedFAQ}
              onCategoryChange={setSelectedCategory}
              onToggleFAQ={toggleFAQ}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default ConsultingServicesSection;
