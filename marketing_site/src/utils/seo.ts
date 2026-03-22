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
  private baseUrl = 'https://stratekaz.com';
  private siteName = 'StrateKaz';
  private defaultImage = '/og-image.png';

  /**
   * Set page SEO metadata
   */
  setPageSEO(data: SEOData) {
    document.title = data.title;
    this.setMetaTag('description', data.description);

    if (data.keywords && data.keywords.length > 0) {
      this.setMetaTag('keywords', data.keywords.join(', '));
    }

    this.setCanonicalUrl(data.canonicalUrl || `${this.baseUrl}${window.location.pathname}`);
    this.setOpenGraphTags(data);
    this.setTwitterCardTags(data);
    this.setRobotsMeta(data.noindex, data.nofollow);

    if (data.structuredData) {
      this.setStructuredData(data.structuredData);
    }
  }

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

  private setOpenGraphTags(data: SEOData) {
    const canonicalUrl = data.canonicalUrl || `${this.baseUrl}${window.location.pathname}`;
    this.setMetaTag('og:site_name', this.siteName, true);
    this.setMetaTag('og:type', data.ogType || 'website', true);
    this.setMetaTag('og:title', data.ogTitle || data.title, true);
    this.setMetaTag('og:description', data.ogDescription || data.description, true);
    this.setMetaTag('og:url', canonicalUrl, true);
    this.setMetaTag('og:locale', 'es_CO', true);

    const imageUrl = data.ogImage || this.defaultImage;
    this.setMetaTag('og:image', this.getAbsoluteUrl(imageUrl), true);
    this.setMetaTag('og:image:width', '1200', true);
    this.setMetaTag('og:image:height', '630', true);
    this.setMetaTag('og:image:alt', data.title, true);
  }

  private setTwitterCardTags(data: SEOData) {
    this.setMetaTag('twitter:card', data.twitterCard || 'summary_large_image');
    this.setMetaTag('twitter:title', data.twitterTitle || data.title);
    this.setMetaTag('twitter:description', data.twitterDescription || data.description);

    const imageUrl = data.twitterImage || data.ogImage || this.defaultImage;
    this.setMetaTag('twitter:image', this.getAbsoluteUrl(imageUrl));
    this.setMetaTag('twitter:image:alt', data.title);
  }

  private setRobotsMeta(noindex?: boolean, nofollow?: boolean) {
    const directives = [];
    directives.push(noindex ? 'noindex' : 'index');
    directives.push(nofollow ? 'nofollow' : 'follow');
    this.setMetaTag('robots', directives.join(', '));
  }

  setStructuredData(data: Record<string, any>) {
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

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

  private getAbsoluteUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}

export const seoManager = new SEOManager();

/** SEO data por página — español colombiano, datos reales */
export const marketingSEO = {
  landing: {
    title: 'StrateKaz | Consultoría 4.0 | SST, Talento Humano, PESV e ISO | Colombia',
    description:
      'Consultoría Estratégica + Plataforma de Gestión 360° para empresas colombianas. SST, Talento Humano, PESV, ISO 9001/14001/45001, Firma Digital y 84+ módulos integrados.',
    keywords: [
      'software SST Colombia',
      'SG-SST',
      'talento humano Colombia',
      'PESV seguridad vial',
      'ISO 9001 Colombia',
      'ISO 45001',
      'ISO 14001',
      'firma digital',
      'gestión integral',
      'stratekaz',
    ],
    canonicalUrl: 'https://stratekaz.com/',
    ogType: 'website' as const,
    twitterCard: 'summary_large_image' as const,
  },

  pricing: {
    title: 'StrateKaz | Precios | Consultoría 4.0 + Plataforma 360°',
    description:
      'Consultoría 4.0 con plataforma incluida o SaaS standalone desde $20.000 COP/usuario/mes. SST, Talento Humano, PESV, ISO y 84+ módulos.',
    keywords: [
      'precios software SST',
      'consultoría ISO Colombia precios',
      'software gestión integral precio',
      'SaaS empresarial Colombia',
    ],
    canonicalUrl: 'https://stratekaz.com/precios',
  },

  contact: {
    title: 'StrateKaz | Contacto | Solicita tu Demo',
    description:
      'Agenda una demostración personalizada de StrateKaz. Consultoría 4.0 + Plataforma de Gestión 360° para empresas colombianas. 20+ años de experiencia.',
    keywords: [
      'contacto stratekaz',
      'demo software SST',
      'consultoría ISO Colombia',
      'asesoría gestión integral',
    ],
    canonicalUrl: 'https://stratekaz.com/contacto',
  },
};

export function useSEO() {
  const setSEO = (data: SEOData) => {
    seoManager.setPageSEO(data);
  };

  const setStructuredData = (data: Record<string, any>) => {
    seoManager.setStructuredData(data);
  };

  return { setSEO, setStructuredData };
}
