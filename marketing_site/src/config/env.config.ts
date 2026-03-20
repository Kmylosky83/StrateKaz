/**
 * Environment Configuration
 *
 * Centralized configuration for environment variables.
 * Uses Vite's import.meta.env for type-safe access.
 */

interface EnvironmentConfig {
  environment: 'development' | 'production' | 'staging';
  appName: string;
  appVersion: string;
  appDescription: string;
  appLoginUrl: string;
  appDashboardUrl: string;
  analytics: {
    googleAnalyticsId?: string;
    hotjarId?: string;
  };
}

const env: EnvironmentConfig = {
  environment: (import.meta.env.VITE_ENVIRONMENT || 'development') as
    | 'development'
    | 'production'
    | 'staging',
  appName: import.meta.env.VITE_APP_NAME || 'StrateKaz',
  appVersion: import.meta.env.VITE_APP_VERSION || '5.3.0',
  appDescription:
    import.meta.env.VITE_APP_DESCRIPTION ||
    'Consultoría 4.0 + Plataforma de Gestión Empresarial 360°',
  appLoginUrl: import.meta.env.VITE_APP_LOGIN_URL || 'http://localhost:3010/login',
  appDashboardUrl: import.meta.env.VITE_APP_DASHBOARD_URL || 'http://localhost:3010/dashboard',
  analytics: {
    googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
    hotjarId: import.meta.env.VITE_HOTJAR_ID,
  },
};

export default env;
