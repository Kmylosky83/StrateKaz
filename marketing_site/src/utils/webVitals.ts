import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// Web Vitals metrics interface
interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

// Enhanced analytics for Web Vitals
class WebVitalsMonitor {
  private isProduction = import.meta.env.PROD;
  private enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

  /**
   * Initialize Web Vitals monitoring
   */
  init() {
    if (typeof window === 'undefined') return;

    // Monitor all Core Web Vitals
    onCLS(this.sendToAnalytics.bind(this, 'CLS'));
    onFCP(this.sendToAnalytics.bind(this, 'FCP'));
    onINP(this.sendToAnalytics.bind(this, 'INP'));
    onLCP(this.sendToAnalytics.bind(this, 'LCP'));
    onTTFB(this.sendToAnalytics.bind(this, 'TTFB'));

    // Log initialization
    if (!this.isProduction) {
      console.log('📊 Web Vitals monitoring initialized');
    }
  }

  /**
   * Send Web Vitals data to analytics
   */
  private sendToAnalytics(metricName: string, metric: any) {
    const webVitalData: WebVitalMetric = {
      name: metricName,
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: Math.round(metric.delta),
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
    };

    // Log to console in development
    if (!this.isProduction) {
      const emoji = this.getMetricEmoji(webVitalData.rating);
      console.log(`${emoji} ${metricName}:`, {
        value: `${webVitalData.value}ms`,
        rating: webVitalData.rating,
        threshold: this.getThresholds(metricName),
      });
    }

    // Send to Google Analytics if enabled
    if (this.enableAnalytics && this.isProduction && window.gtag) {
      window.gtag('event', metricName, {
        custom_parameter_1: webVitalData.value,
        custom_parameter_2: webVitalData.rating,
        custom_parameter_3: webVitalData.navigationType,
      });
    }

    // Send to custom analytics endpoint if configured
    this.sendToCustomAnalytics(webVitalData);

    // Store in localStorage for debugging
    this.storeMetric(webVitalData);
  }

  /**
   * Send to custom analytics endpoint (disabled - no backend)
   */
  private async sendToCustomAnalytics(_metric: WebVitalMetric) {
    // Custom analytics endpoint disabled - marketing site is standalone
    return;
  }

  /**
   * Store metric in localStorage for debugging
   */
  private storeMetric(metric: WebVitalMetric) {
    try {
      const stored = localStorage.getItem('webVitalsMetrics');
      const metrics = stored ? JSON.parse(stored) : [];

      metrics.push({
        ...metric,
        timestamp: Date.now(),
        page: window.location.pathname,
      });

      // Keep only last 50 metrics
      if (metrics.length > 50) {
        metrics.splice(0, metrics.length - 50);
      }

      localStorage.setItem('webVitalsMetrics', JSON.stringify(metrics));
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Get metric emoji for logging
   */
  private getMetricEmoji(rating: string): string {
    switch (rating) {
      case 'good':
        return '✅';
      case 'needs-improvement':
        return '⚠️';
      case 'poor':
        return '❌';
      default:
        return '📊';
    }
  }

  /**
   * Get performance thresholds for metrics
   */
  private getThresholds(metricName: string): string {
    const thresholds: Record<string, string> = {
      CLS: 'Good: <0.1, Poor: >0.25',
      FCP: 'Good: <1.8s, Poor: >3.0s',
      INP: 'Good: <200ms, Poor: >500ms',
      LCP: 'Good: <2.5s, Poor: >4.0s',
      TTFB: 'Good: <800ms, Poor: >1800ms',
    };
    return thresholds[metricName] || 'Unknown';
  }

  /**
   * Get stored metrics for debugging
   */
  getStoredMetrics(): any[] {
    try {
      const stored = localStorage.getItem('webVitalsMetrics');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): Record<string, any> {
    const metrics = this.getStoredMetrics();
    const summary: Record<string, any> = {};

    metrics.forEach((metric: any) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          totalValue: 0,
          ratings: { good: 0, 'needs-improvement': 0, poor: 0 },
        };
      }

      summary[metric.name].count++;
      summary[metric.name].totalValue += metric.value;
      summary[metric.name].ratings[metric.rating]++;
    });

    // Calculate averages
    Object.keys(summary).forEach(key => {
      summary[key].average = Math.round(
        summary[key].totalValue / summary[key].count
      );
    });

    return summary;
  }

  /**
   * Clear stored metrics
   */
  clearStoredMetrics() {
    localStorage.removeItem('webVitalsMetrics');
  }
}

// Export singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();

// Export for debugging in development
if (typeof window !== 'undefined' && !import.meta.env.PROD) {
  (window as any).webVitalsMonitor = webVitalsMonitor;
}
