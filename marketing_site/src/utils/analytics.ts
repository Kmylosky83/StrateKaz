/**
 * Marketing Analytics Utilities
 * Provides conversion tracking, event logging, and analytics integration
 */

// Extend Window interface for analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: any;
    _fbq?: any;
    mixpanel?: any;
    dataLayer?: any[];
  }
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

export interface ConversionEvent {
  type:
    | 'trial_start'
    | 'demo_request'
    | 'contact_form'
    | 'download'
    | 'newsletter_signup';
  source: 'landing_page' | 'features_page' | 'pricing_page' | 'contact_page';
  campaign?: string;
  medium?: string;
  content?: string;
  value?: number;
  metadata?: Record<string, any>;
}

// Window interface already declared above

class MarketingAnalytics {
  // private _isProduction = process.env.NODE_ENV === 'production'
  private debug = import.meta.env.DEV;

  /**
   * Initialize analytics tracking
   */
  init() {
    if (typeof window === 'undefined') return;

    // Initialize Google Analytics 4
    this.initGoogleAnalytics();

    // Initialize Facebook Pixel
    this.initFacebookPixel();

    // Track page views
    this.trackPageView();

    // Track UTM parameters
    this.trackUTMParameters();

    if (this.debug) {
      console.log('Marketing Analytics initialized');
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  private initGoogleAnalytics() {
    const GA_ID = import.meta.env.VITE_GA_TRACKING_ID;

    if (!GA_ID) {
      if (this.debug) console.warn('Google Analytics ID not configured');
      return;
    }

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer!.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }

  /**
   * Initialize Facebook Pixel
   */
  private initFacebookPixel() {
    const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID;

    if (!FB_PIXEL_ID) {
      if (this.debug) console.warn('Facebook Pixel ID not configured');
      return;
    }

    // Facebook Pixel Code
    const initFacebookPixel = () => {
      if (window.fbq) return;
      const f = window as any;
      const n: any = (f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue?.push(arguments);
      });
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      }
    };
    initFacebookPixel();

    window.fbq!('init', FB_PIXEL_ID);
    window.fbq!('track', 'PageView');
  }

  /**
   * Track page views
   */
  trackPageView(path?: string) {
    const currentPath = path || window.location.pathname;

    // Google Analytics
    if (window.gtag) {
      window.gtag('config', import.meta.env.VITE_GA_TRACKING_ID!, {
        page_path: currentPath,
        page_title: document.title,
        page_location: window.location.href,
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }

    if (this.debug) {
      console.log('Page view tracked:', currentPath);
    }
  }

  /**
   * Track conversion events
   */
  trackConversion(event: ConversionEvent) {
    const { type, source, campaign, medium, content, value, metadata } = event;

    // Google Analytics conversion tracking
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: import.meta.env.VITE_GA_CONVERSION_ID,
        event_category: 'marketing',
        event_label: type,
        value: value || 0,
        currency: 'USD',
        custom_parameters: {
          source,
          campaign,
          medium,
          content,
          ...metadata,
        },
      });

      // Track specific events
      switch (type) {
        case 'trial_start':
          window.gtag('event', 'sign_up', {
            method: 'trial',
            value: value || 0,
          });
          break;
        case 'demo_request':
          window.gtag('event', 'generate_lead', {
            currency: 'USD',
            value: value || 100, // Estimated lead value
          });
          break;
        case 'contact_form':
          window.gtag('event', 'contact', {
            event_category: 'engagement',
          });
          break;
      }
    }

    // Facebook Pixel conversion tracking
    if (window.fbq) {
      switch (type) {
        case 'trial_start':
          window.fbq('track', 'StartTrial', {
            value: value || 0,
            currency: 'USD',
            content_name: 'Free Trial',
          });
          break;
        case 'demo_request':
          window.fbq('track', 'Schedule', {
            content_name: 'Demo Request',
          });
          break;
        case 'contact_form':
          window.fbq('track', 'Contact', {
            content_name: 'Contact Form',
          });
          break;
        case 'download':
          window.fbq('track', 'Download', {
            content_name: metadata?.resource_name || 'Resource',
          });
          break;
      }
    }

    // Mixpanel tracking
    if (window.mixpanel) {
      window.mixpanel.track(`Marketing ${type}`, {
        source,
        campaign,
        medium,
        content,
        value,
        ...metadata,
        distinct_id: this.getUserId(),
      });
    }

    if (this.debug) {
      console.log('Conversion tracked:', event);
    }
  }

  /**
   * Track custom events
   */
  trackEvent(event: AnalyticsEvent) {
    const { event: eventName, properties, userId, timestamp } = event;

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'marketing',
        event_timestamp: timestamp?.getTime(),
        custom_parameters: {
          user_id: userId,
          ...properties,
        },
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('trackCustom', eventName, properties);
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track(eventName, {
        ...properties,
        user_id: userId,
        timestamp: timestamp?.toISOString(),
      });
    }

    if (this.debug) {
      console.log('Event tracked:', event);
    }
  }

  /**
   * Track form interactions
   */
  trackFormInteraction(
    formType: string,
    action: 'start' | 'complete' | 'abandon',
    data?: any
  ) {
    this.trackEvent({
      event: 'form_interaction',
      properties: {
        form_type: formType,
        action,
        ...data,
      },
    });
  }

  /**
   * Track button clicks
   */
  trackButtonClick(
    buttonType: string,
    location: string,
    metadata?: Record<string, any>
  ) {
    this.trackEvent({
      event: 'button_click',
      properties: {
        button_type: buttonType,
        location,
        ...metadata,
      },
    });
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth(depth: number, page: string) {
    // Only track significant scroll milestones
    const milestones = [25, 50, 75, 100];
    if (milestones.includes(depth)) {
      this.trackEvent({
        event: 'scroll_depth',
        properties: {
          depth,
          page,
        },
      });
    }
  }

  /**
   * Track time on page
   */
  trackTimeOnPage(timeInSeconds: number, page: string) {
    this.trackEvent({
      event: 'time_on_page',
      properties: {
        time_seconds: timeInSeconds,
        page,
        time_bucket: this.getTimeBucket(timeInSeconds),
      },
    });
  }

  /**
   * Track UTM parameters
   */
  private trackUTMParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content'),
    };

    // Filter out null values
    const filteredUTM = Object.fromEntries(
      Object.entries(utmParams).filter(([_, value]) => value !== null)
    );

    if (Object.keys(filteredUTM).length > 0) {
      // Store UTM parameters in session storage for attribution
      sessionStorage.setItem('utm_params', JSON.stringify(filteredUTM));

      this.trackEvent({
        event: 'utm_tracked',
        properties: filteredUTM,
      });
    }
  }

  /**
   * Get stored UTM parameters
   */
  getUTMParameters(): Record<string, string> {
    try {
      const stored = sessionStorage.getItem('utm_params');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string) {
    if (window.gtag) {
      window.gtag('config', import.meta.env.VITE_GA_TRACKING_ID!, {
        user_id: userId,
      });
    }

    if (window.mixpanel) {
      window.mixpanel.identify(userId);
    }

    // Store user ID
    localStorage.setItem('analytics_user_id', userId);
  }

  /**
   * Get user ID
   */
  private getUserId(): string | null {
    return localStorage.getItem('analytics_user_id');
  }

  /**
   * Get time bucket for time tracking
   */
  private getTimeBucket(seconds: number): string {
    if (seconds < 30) return '0-30s';
    if (seconds < 60) return '30-60s';
    if (seconds < 120) return '1-2m';
    if (seconds < 300) return '2-5m';
    if (seconds < 600) return '5-10m';
    return '10m+';
  }

  /**
   * Track exit intent
   */
  trackExitIntent(page: string) {
    this.trackEvent({
      event: 'exit_intent',
      properties: {
        page,
        time_on_page:
          Date.now() -
          parseInt(sessionStorage.getItem('page_load_time') || '0'),
      },
    });
  }
}

// Create singleton instance
export const analytics = new MarketingAnalytics();

// React hook for analytics
export function useAnalytics() {
  const trackConversion = (event: ConversionEvent) => {
    analytics.trackConversion(event);
  };

  const trackEvent = (event: AnalyticsEvent) => {
    analytics.trackEvent(event);
  };

  const trackFormInteraction = (
    formType: string,
    action: 'start' | 'complete' | 'abandon',
    data?: any
  ) => {
    analytics.trackFormInteraction(formType, action, data);
  };

  const trackButtonClick = (
    buttonType: string,
    location: string,
    metadata?: Record<string, any>
  ) => {
    analytics.trackButtonClick(buttonType, location, metadata);
  };

  return {
    trackConversion,
    trackEvent,
    trackFormInteraction,
    trackButtonClick,
  };
}

// Utility functions for common tracking scenarios
export const trackTrialStart = (source: string, plan?: string) => {
  analytics.trackConversion({
    type: 'trial_start',
    source: source as any,
    value: plan === 'enterprise' ? 199 : plan === 'professional' ? 79 : 29,
    metadata: { plan },
  });
};

export const trackDemoRequest = (source: string) => {
  analytics.trackConversion({
    type: 'demo_request',
    source: source as any,
    value: 100, // Estimated lead value
  });
};

export const trackContactForm = (source: string, formType: string) => {
  analytics.trackConversion({
    type: 'contact_form',
    source: source as any,
    metadata: { form_type: formType },
  });
};
