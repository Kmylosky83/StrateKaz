import React, { useState, useMemo } from 'react';
import { ResourcesHeroSection } from '@components/sections/ResourcesHeroSection';
import { ResourcesGridSection } from '@components/sections/ResourcesGridSection';
import { NewsletterSection } from '@components/sections/NewsletterSection';
import { FinalCTASection } from '@components/sections/FinalCTASection';
import { ResourceModal } from '@components/resources/ResourceModal';
import { seoManager, marketingSEO } from '@/utils/seo';
import {
  resources,
  searchResources,
  type Resource,
  type ResourceCategoryCode,
} from '@/data/resources';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const ResourcesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ResourceCategoryCode | 'all'>('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // SEO
  React.useEffect(() => {
    seoManager.setPageSEO(marketingSEO.recursos);

    seoManager.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Biblioteca de Recursos Gratuitos | StrateKaz',
      description: marketingSEO.recursos.description,
      url: 'https://stratekaz.com/recursos',
      provider: {
        '@type': 'Organization',
        name: 'StrateKaz',
        url: 'https://stratekaz.com',
      },
    });
  }, []);

  // Filter resources
  const filteredResources = useMemo(() => {
    let result = searchQuery ? searchResources(searchQuery) : [...resources];

    if (activeCategory !== 'all') {
      result = result.filter(r => r.category === activeCategory);
    }

    // Featured first, then new, then alphabetical
    return result.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [searchQuery, activeCategory]);

  const handleDownload = (resource: Resource) => {
    setSelectedResource(resource);
  };

  const handleTrialStart = () => {
    window.open('/contacto', '_self');
  };

  return (
    <div className='min-h-screen'>
      {/* Hero Section with Search */}
      <ResourcesHeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalResources={resources.length}
      />

      {/* Grid Section with Filters */}
      <ResourcesGridSection
        resources={filteredResources}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onDownload={handleDownload}
        searchQuery={searchQuery}
      />

      {/* Newsletter Section */}
      <NewsletterSection apiBaseUrl={API_BASE_URL} />

      {/* Final CTA */}
      <FinalCTASection
        onTrialStart={handleTrialStart}
        title='Estos recursos son solo el comienzo'
        subtitle='StrateKaz automatiza todo esto y mas: 84+ modulos, firma digital, IA integrada y gestion 360 en una sola plataforma.'
      />

      {/* Download Modal */}
      <ResourceModal
        resource={selectedResource}
        isOpen={selectedResource !== null}
        onClose={() => setSelectedResource(null)}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
};

export default ResourcesPage;
export { ResourcesPage };
