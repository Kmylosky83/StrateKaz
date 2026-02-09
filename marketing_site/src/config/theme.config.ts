/**
 * StrateKaz Theme Configuration
 * ===============================
 * Central configuration for all design system values
 * NO HARDCODED VALUES ALLOWED IN COMPONENTS
 */

export const BRAND_COLORS = {
  // Primary brand color - USE SPARINGLY
  primary: '#ec268f', // Rosa StrateKaz
  primaryRgb: '236, 38, 143',
  primaryHover: '#db2777',
  primaryDark: '#be185d',

  // Only for CTAs, BPM highlights, critical actions
  get '500'() {
    return this.primary;
  },
  get '600'() {
    return this.primaryHover;
  },
  get '700'() {
    return this.primaryDark;
  },
} as const;

export const SYSTEM_COLORS = {
  // ISO Management System Colors
  blue: '#3b82f6', // ISO 9001 - Quality
  green: '#22c55e', // ISO 14001 - Environment
  red: '#ef4444', // ISO 45001 - Safety
  orange: '#f97316', // Innovation
  purple: '#a855f7', // New Challenges
} as const;

export const TYPOGRAPHY = {
  // Font families - configured in index.html
  families: {
    title: 'Montserrat', // h1-h3
    subtitle: 'Montserrat', // h4-h6
    content: 'Inter', // body text
    ui: 'Inter', // buttons, labels
  },
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

export const ANIMATIONS = {
  // Animation durations (synced with lib/animations.ts DURATION constants)
  durations: {
    instant: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    verySlow: '800ms',
  },
  // Animation easings (synced with lib/animations.ts EASING constants)
  easings: {
    default: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // easeOut
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // smooth (shared with frontend)
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

export const COMPANY_INFO = {
  name: 'StrateKaz',
  tagline: 'Consultoría 4.0',
  slogan: 'Sin Miedo al Éxito!',
  description:
    'Consultoría estratégica + Plataforma de Gestión Integral que busca modernizar la gestión empresarial con herramientas de vanguardia.',
  ceo: 'Camilo Rubiano Bustos',
  experience: '20+ años de experiencia',
  successRate: '100% de éxito en certificaciones',
  copyright:
    '© 2026 StrateKaz | Marca Kmylosky | Todos los derechos reservados.',

  // Contact
  email: 'info@stratekaz.com',
  phone: '+57 311 535 1944',
  phoneHref: 'tel:+573115351944',
  whatsapp: '+573115351944',
  location: 'Cúcuta - Bogotá - Bucaramanga',
  year: '2026',
  brand: 'Marca Kmylosky',

  // Social Media
  social: {
    whatsapp: 'https://wa.me/573115351944',
    instagram: 'https://instagram.com/kmylosky',
    facebook: 'https://facebook.com/stratekaz',
    tiktok: 'https://tiktok.com/@kmylosky',
    linkedin: 'https://www.linkedin.com/in/camilo-rubiano-bustos-7276596b',
  },

  // Cities presence
  cities: {
    active: ['Bogotá', 'Medellín', 'Cali', 'Cúcuta'],
    future: ['Barranquilla', 'Cartagena', 'Bucaramanga'],
  },
} as const;

export const SERVICES = {
  consultation: {
    name: 'Consultoría',
    free: true,
    description: 'Evaluación inicial sin costo',
  },
  bpm: {
    name: 'Plataforma de Gestión Integral',
    included: 'Con consultoría activa',
    description: 'Plataforma completa de gestión',
  },
  iso: {
    name: 'Certificaciones ISO',
    guarantee: '100% éxito garantizado',
    types: ['9001', '14001', '45001', '27001'],
  },
  sst: {
    name: 'SST y PESV',
    description: 'Cumplimiento normativo especializado',
  },
} as const;

// Export everything as a single config object
export const THEME_CONFIG = {
  brand: BRAND_COLORS,
  system: SYSTEM_COLORS,
  typography: TYPOGRAPHY,
  animations: ANIMATIONS,
  company: COMPANY_INFO,
  services: SERVICES,
} as const;

export default THEME_CONFIG;
