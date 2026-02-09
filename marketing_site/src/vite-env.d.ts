/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_URL: string
  readonly VITE_GA_TRACKING_ID: string
  readonly VITE_GA_CONVERSION_ID: string
  readonly VITE_GTM_ID: string
  readonly VITE_HUBSPOT_ID: string
  readonly VITE_FB_PIXEL_ID: string
  readonly VITE_WHATSAPP_NUMBER: string
  readonly VITE_ENABLE_PWA: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_CHAT: string
  readonly VITE_ENV: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENVIRONMENT: string
  readonly VITE_GOOGLE_ANALYTICS_ID: string
  readonly VITE_HOTJAR_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}