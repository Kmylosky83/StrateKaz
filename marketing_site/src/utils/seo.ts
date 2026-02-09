/**
 * SEO Utilities for Marketing Site
 * Provides meta tags, structured data, and SEO optimization
 */

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: Record<string, any>;
  noindex?: boolean;
  nofollow?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

class SEOManager {
  private baseUrl = import.meta.env.VITE_PUBLIC_URL || 'https://stratekaz.com';
  private siteName = 'StrateKaz';
  private defaultImage = '/images/og-default.jpg';

  /**
   * Set page SEO metadata
   */
  setPageSEO(data: SEOData) {
    // Set page title
    document.title = data.title;

    // Set meta description
    this.setMetaTag('description', data.description);

    // Set keywords
    if (data.keywords && data.keywords.length > 0) {
      this.setMetaTag('keywords', data.keywords.join(', '));
    }

    // Set canonical URL
    this.setCanonicalUrl(data.canonicalUrl || window.location.href);

    // Set Open Graph tags
    this.setOpenGraphTags(data);

    // Set Twitter Card tags
    this.setTwitterCardTags(data);

    // Set robots meta
    this.setRobotsMeta(data.noindex, data.nofollow);

    // Set structured data
    if (data.structuredData) {
      this.setStructuredData(data.structuredData);
    }
  }

  /**
   * Set meta tag
   */
  private setMetaTag(name: string, content: string, property?: boolean) {
    const attr = property ? 'property' : 'name';
    let meta = document.querySelector(
      `meta[${attr}="${name}"]`
    ) as HTMLMetaElement;

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, name);
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);
  }

  /**
   * Set canonical URL
   */
  private setCanonicalUrl(url: string) {
    let link = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  /**
   * Set Open Graph tags
   */
  private setOpenGraphTags(data: SEOData) {
    this.setMetaTag('og:site_name', this.siteName, true);
    this.setMetaTag('og:type', data.ogType || 'website', true);
    this.setMetaTag('og:title', data.ogTitle || data.title, true);
    this.setMetaTag(
      'og:description',
      data.ogDescription || data.description,
      true
    );
    this.setMetaTag('og:url', data.canonicalUrl || window.location.href, true);

    const imageUrl = data.ogImage || this.defaultImage;
    this.setMetaTag('og:image', this.getAbsoluteUrl(imageUrl), true);
    this.setMetaTag('og:image:width', '1200', true);
    this.setMetaTag('og:image:height', '630', true);
    this.setMetaTag('og:image:alt', data.title, true);
  }

  /**
   * Set Twitter Card tags
   */
  private setTwitterCardTags(data: SEOData) {
    this.setMetaTag('twitter:card', data.twitterCard || 'summary_large_image');
    this.setMetaTag('twitter:site', '@StrateKaz');
    this.setMetaTag('twitter:creator', '@StrateKaz');
    this.setMetaTag('twitter:title', data.twitterTitle || data.title);
    this.setMetaTag(
      'twitter:description',
      data.twitterDescription || data.description
    );

    const imageUrl = data.twitterImage || data.ogImage || this.defaultImage;
    this.setMetaTag('twitter:image', this.getAbsoluteUrl(imageUrl));
    this.setMetaTag('twitter:image:alt', data.title);
  }

  /**
   * Set robots meta tag
   */
  private setRobotsMeta(noindex?: boolean, nofollow?: boolean) {
    const directives = [];

    if (noindex) {
      directives.push('noindex');
    } else {
      directives.push('index');
    }

    if (nofollow) {
      directives.push('nofollow');
    } else {
      directives.push('follow');
    }

    this.setMetaTag('robots', directives.join(', '));
  }

  /**
   * Set structured data (JSON-LD)
   */
  setStructuredData(data: Record<string, any>) {
    // Remove existing structured data
    const existing = document.querySelector(
      'script[type="application/ld+json"]'
    );
    if (existing) {
      existing.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Generate organization structured data
   */
  getOrganizationStructuredData() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'StrateKaz',
      url: this.baseUrl,
      logo: this.getAbsoluteUrl('/images/logo.png'),
      description:
        'Complete Business Process Management Platform That Grows With Your Organization',
      foundingDate: '2023',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-123-4567',
        contactType: 'sales',
        email: 'sales@stratekaz.com',
        availableLanguage: ['English'],
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Technology Drive, Suite 456',
        addressLocality: 'San Francisco',
        addressRegion: 'CA',
        postalCode: '94105',
        addressCountry: 'US',
      },
      sameAs: [
        'https://twitter.com/stratekaz',
        'https://linkedin.com/company/stratekaz',
        'https://github.com/stratekaz',
      ],
    };
  }

  /**
   * Generate software application structured data
   */
  getSoftwareApplicationStructuredData() {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'StrateKaz',
      description:
        'Complete Business Process Management Platform That Grows With Your Organization',
      url: this.baseUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '79',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'RecurringCharge',
          price: '79',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '150',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Visual Workflow Builder',
        'Process Automation',
        'Real-time Analytics',
        'Multi-tenant Architecture',
        'Enterprise Security',
        'API Integrations',
      ],
    };
  }

  /**
   * Generate breadcrumb structured data
   */
  getBreadcrumbStructuredData(items: BreadcrumbItem[]) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: this.getAbsoluteUrl(item.url),
      })),
    };
  }

  /**
   * Generate FAQ structured data
   */
  getFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Generate pricing structured data
   */
  getPricingStructuredData() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'StrateKaz BPM Platform',
      description: 'Complete Business Process Management Platform',
      brand: {
        '@type': 'Brand',
        name: 'StrateKaz',
      },
      offers: [
        {
          '@type': 'Offer',
          name: 'Starter Plan',
          price: '29',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'RecurringCharge',
            price: '29',
            priceCurrency: 'USD',
            billingDuration: 'P1M',
          },
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'Professional Plan',
          price: '79',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'RecurringCharge',
            price: '79',
            priceCurrency: 'USD',
            billingDuration: 'P1M',
          },
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'Enterprise Plan',
          price: '199',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'RecurringCharge',
            price: '199',
            priceCurrency: 'USD',
            billingDuration: 'P1M',
          },
          availability: 'https://schema.org/InStock',
        },
      ],
    };
  }

  /**
   * Convert relative URL to absolute URL
   */
  private getAbsoluteUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}

// Create singleton instance
export const seoManager = new SEOManager();

// Pre-defined SEO data for marketing pages
export const marketingSEO = {
  landing: {
    title: 'StrateKaz | Suite Empresarial',
    description:
      'Streamline operations with 60% faster process execution. Bank-level security meets intuitive drag-and-drop workflows. Start your free trial today.',
    keywords: [
      'business process management',
      'workflow automation',
      'BPM platform',
      'process optimization',
      'workflow builder',
      'business automation',
      'process management platform',
    ],
    ogType: 'website' as const,
    twitterCard: 'summary_large_image' as const,
  },

  features: {
    title: 'StrateKaz | Características',
    description:
      'Discover all the features that make StrateKaz the complete BPM platform. Visual workflow builder, automation, analytics, security, and more.',
    keywords: [
      'workflow builder',
      'process automation',
      'business analytics',
      'enterprise security',
      'multi-tenant platform',
      'API integrations',
    ],
  },

  pricing: {
    title: 'StrateKaz | Precios',
    description:
      'Choose the perfect plan for your organization. Starter, Professional, and Enterprise plans with 30-day free trials. No setup fees.',
    keywords: [
      'BPM pricing',
      'workflow platform pricing',
      'business process management cost',
      'enterprise platform pricing',
    ],
  },

  contact: {
    title: 'StrateKaz | Contacto',
    description:
      'Ready to transform your operations? Contact our team for a personalized demo or consultation. Response within 2 hours guaranteed.',
    keywords: [
      'contact sales',
      'BPM consultation',
      'workflow demo',
      'business process consulting',
    ],
  },
};

// React hook for SEO
export function useSEO() {
  const setSEO = (data: SEOData) => {
    seoManager.setPageSEO(data);
  };

  const setStructuredData = (data: Record<string, any>) => {
    seoManager.setStructuredData(data);
  };

  return {
    setSEO,
    setStructuredData,
  };
}
