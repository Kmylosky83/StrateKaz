/**
 * Performance Optimization Utilities
 * Provides tools for optimizing marketing site performance
 */

import React from 'react';

export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

class PerformanceManager {
  private metrics: PerformanceMetrics = {};
  // private _observer?: PerformanceObserver

  /**
   * Initialize performance monitoring
   */
  init() {
    this.measureWebVitals();
    this.optimizeImages();
    this.prefetchCriticalResources();
    this.setupIntersectionObserver();
  }

  /**
   * Measure Core Web Vitals
   */
  private measureWebVitals() {
    // Largest Contentful Paint (LCP)
    this.measureLCP();

    // First Input Delay (FID)
    this.measureFID();

    // Cumulative Layout Shift (CLS)
    this.measureCLS();

    // First Contentful Paint (FCP)
    this.measureFCP();

    // Time to First Byte (TTFB)
    this.measureTTFB();
  }

  /**
   * Measure Largest Contentful Paint
   */
  private measureLCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
      };

      if (lastEntry) {
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        this.reportMetric('lcp', this.metrics.lcp);
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  /**
   * Measure First Input Delay
   */
  private measureFID() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEntry & {
            processingStart?: number;
          };
          this.metrics.fid = fidEntry.processingStart
            ? fidEntry.processingStart - entry.startTime
            : 0;
          this.reportMetric('fid', this.metrics.fid);
        }
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
  }

  /**
   * Measure Cumulative Layout Shift
   */
  private measureCLS() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        if (entry.entryType === 'layout-shift') {
          const layoutShiftEntry = entry as PerformanceEntry & {
            value?: number;
            hadRecentInput?: boolean;
          };
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value || 0;
          }
        }
      });

      this.metrics.cls = clsValue;
      this.reportMetric('cls', this.metrics.cls);
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Measure First Contentful Paint
   */
  private measureFCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
          this.reportMetric('fcp', this.metrics.fcp);
        }
      });
    });

    observer.observe({ entryTypes: ['paint'] });
  }

  /**
   * Measure Time to First Byte
   */
  private measureTTFB() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
          this.reportMetric('ttfb', this.metrics.ttfb);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
  }

  /**
   * Report metric to analytics
   */
  private reportMetric(name: string, value: number) {
    // Report to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vitals', {
        custom_parameter: name,
        value: Math.round(value),
        metric_rating: this.getMetricRating(name, value),
      });
    }

    console.log(`${name.toUpperCase()}: ${Math.round(value)}ms`);
  }

  /**
   * Get metric rating (good/needs-improvement/poor)
   */
  private getMetricRating(metric: string, value: number): string {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Optimize images with lazy loading and WebP support
   */
  private optimizeImages() {
    // Add lazy loading to images
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      images.forEach(img => {
        const imgElement = img as HTMLImageElement;
        imgElement.src = imgElement.dataset.src || '';
      });
    }
  }

  /**
   * Prefetch critical resources
   */
  private prefetchCriticalResources() {
    const criticalResources = [
      '/fonts/inter-variable.woff2',
      '/images/hero-bg.webp',
      '/images/og-default.jpg',
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  /**
   * Setup intersection observer for animations and lazy content
   */
  private setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    // Observe elements with animation classes
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
  }

  /**
   * Preload critical CSS
   */
  preloadCriticalCSS() {
    const criticalCSS = `
      /* Critical above-the-fold styles */
      .hero-section {
        background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #fdf2f8 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
      }

      .hero-title {
        font-size: clamp(2rem, 5vw, 4rem);
        font-weight: 700;
        line-height: 1.2;
        margin-bottom: 1.5rem;
      }

      .hero-description {
        font-size: 1.25rem;
        line-height: 1.6;
        color: #64748b;
        margin-bottom: 2rem;
      }

      .cta-button {
        background: #ec268f;
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.75rem;
        font-weight: 600;
        transition: all 0.2s;
      }

      .cta-button:hover {
        background: #db2777;
        transform: translateY(-1px);
      }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  }

  /**
   * Optimize third-party scripts
   */
  optimizeThirdPartyScripts() {
    // Defer non-critical scripts
    const deferredScripts = [
      'https://www.googletagmanager.com/gtag/js',
      'https://connect.facebook.net/en_US/fbevents.js',
    ];

    deferredScripts.forEach(src => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });
  }

  /**
   * Resource hints for better performance
   */
  addResourceHints() {
    const hints = [
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
      { rel: 'dns-prefetch', href: '//connect.facebook.net' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossorigin) {
        link.crossOrigin = hint.crossorigin;
      }
      document.head.appendChild(link);
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const report = [];

    report.push('=== Performance Report ===');

    if (metrics.lcp) {
      report.push(
        `LCP: ${Math.round(metrics.lcp)}ms (${this.getMetricRating('lcp', metrics.lcp)})`
      );
    }

    if (metrics.fid) {
      report.push(
        `FID: ${Math.round(metrics.fid)}ms (${this.getMetricRating('fid', metrics.fid)})`
      );
    }

    if (metrics.cls) {
      report.push(
        `CLS: ${metrics.cls.toFixed(3)} (${this.getMetricRating('cls', metrics.cls)})`
      );
    }

    if (metrics.fcp) {
      report.push(
        `FCP: ${Math.round(metrics.fcp)}ms (${this.getMetricRating('fcp', metrics.fcp)})`
      );
    }

    if (metrics.ttfb) {
      report.push(
        `TTFB: ${Math.round(metrics.ttfb)}ms (${this.getMetricRating('ttfb', metrics.ttfb)})`
      );
    }

    return report.join('\n');
  }
}

// Create singleton instance
export const performanceManager = new PerformanceManager();

// Utility functions
export const optimizeImage = (
  src: string,
  _options: { width?: number; quality?: number } = {}
) => {
  // If using a CDN like Cloudinary or ImageKit, format the URL
  // For now, return the original src
  return src;
};

export const lazyLoadComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return React.lazy(importFunc);
};

// React hook for performance monitoring
export function usePerformance() {
  React.useEffect(() => {
    performanceManager.init();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const getMetrics = () => performanceManager.getMetrics();
  const generateReport = () => performanceManager.generateReport();

  return {
    getMetrics,
    generateReport,
  };
}

// Performance budget constants
export const PERFORMANCE_BUDGETS = {
  LCP: 2500, // milliseconds
  FID: 100, // milliseconds
  CLS: 0.1, // score
  FCP: 1800, // milliseconds
  TTFB: 800, // milliseconds
  BUNDLE_SIZE: 250, // kilobytes
  IMAGE_SIZE: 500, // kilobytes
};
