/**
 * Sistema de Animaciones - Marketing Site
 *
 * Constantes y utilidades de animacion compartidas.
 * Solo contiene exports que son usados activamente por componentes.
 */

// ============================================
// CONFIGURACION BASE
// ============================================

/** Duracion estandar de animaciones */
export const DURATION = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

/** Easings predefinidos */
export const EASING = {
  easeOut: [0.0, 0.0, 0.2, 1] as const,
  easeIn: [0.4, 0.0, 1, 1] as const,
  easeInOut: [0.4, 0.0, 0.2, 1] as const,
  smooth: [0.25, 0.46, 0.45, 0.94] as const,
} as const;

// ============================================
// UTILIDADES DE ACCESIBILIDAD
// ============================================

/**
 * Detecta si el usuario prefiere reduccion de movimiento.
 * Usado por: useHeroAnimations, HeroDashboard, ThreeBackground
 */
export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Detecta si el dispositivo es de bajo rendimiento (mobile/tablet).
 * Usado por: ThreeBackground (para reducir particulas)
 */
export const isLowPerformanceDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const lowCores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
  const smallScreen = window.innerWidth < 768;
  const lowMemory = (navigator as any).deviceMemory ? (navigator as any).deviceMemory < 4 : false;
  return lowCores || smallScreen || lowMemory;
};

// ============================================
// CONFIGURACION PARTICULAS 3D
// ============================================

/** Configuracion del fondo de red 3D. Usado por: ThreeBackground */
export const PARTICLE_CONFIG = {
  desktopCount: 80,
  mobileCount: 45,
  connectionDistance: 25,
  speed: 0.04,
  brandColor: '#ec268f',
  primaryColorRatio: 0.7,
} as const;
