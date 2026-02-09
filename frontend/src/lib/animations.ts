/**
 * Sistema de Animaciones - Design System
 *
 * Variantes de Framer Motion estandarizadas para el ERP
 * Incluye soporte para reducción de movimiento (accesibilidad)
 */
import type { Variants, Transition } from 'framer-motion';

// ============================================
// CONFIGURACIÓN BASE
// ============================================

/** Duración estándar de animaciones */
export const DURATION = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

/** Easings predefinidos - SINCRONIZADOS con marketing_site */
export const EASING = {
  // Curvas suaves para UI
  easeOut: [0.0, 0.0, 0.2, 1] as const,
  easeIn: [0.4, 0.0, 1, 1] as const,
  easeInOut: [0.4, 0.0, 0.2, 1] as const,
  // Curva personalizada compartida (usada en Login y Marketing)
  smooth: [0.25, 0.46, 0.45, 0.94] as const,
  // Curvas con bounce
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  // Spring-like
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  springGentle: { type: 'spring', stiffness: 200, damping: 25 },
  springBouncy: { type: 'spring', stiffness: 400, damping: 25 },
} as const;

// ============================================
// UTILIDADES DE ACCESIBILIDAD
// ============================================

/**
 * Detecta si el usuario prefiere reducción de movimiento
 */
export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Retorna variantes vacías si el usuario prefiere reducción de movimiento
 */
export const respectMotionPreference = <T extends Variants>(variants: T): T | Variants => {
  if (shouldReduceMotion()) {
    return {
      initial: {},
      animate: {},
      exit: {},
    };
  }
  return variants;
};

// ============================================
// TRANSICIONES PREDEFINIDAS
// ============================================

export const transitions = {
  /** Transición rápida para interacciones hover */
  hover: { duration: DURATION.fast, ease: EASING.easeOut },
  /** Transición estándar para UI */
  default: { duration: DURATION.normal, ease: EASING.easeOut },
  /** Transición suave para modales */
  modal: { duration: DURATION.normal, ease: EASING.easeInOut },
  /** Transición para listas */
  stagger: { staggerChildren: 0.05, delayChildren: 0.1 },
  /** Spring para elementos interactivos */
  spring: EASING.spring,
} as const satisfies Record<string, Transition>;

// ============================================
// VARIANTES DE PÁGINA
// ============================================

/** Animación de entrada/salida de páginas */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    },
  },
};

/** Variante alternativa con fade simple */
export const pageFadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast },
  },
};

// ============================================
// VARIANTES DE MODAL
// ============================================

/** Backdrop del modal (overlay oscuro) */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, delay: 0.1 },
  },
};

/** Contenido del modal con escala */
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    },
  },
};

/** Modal slide desde abajo (para móvil) */
export const modalSlideUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: '100%',
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 35,
    },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: {
      duration: DURATION.fast,
    },
  },
};

// ============================================
// VARIANTES DE SIDEBAR
// ============================================

/** Sidebar colapsable */
export const sidebarVariants: Variants = {
  expanded: {
    width: 280,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeInOut,
    },
  },
  collapsed: {
    width: 80,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeInOut,
    },
  },
};

/** Items del sidebar */
export const sidebarItemVariants: Variants = {
  expanded: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.fast },
  },
  collapsed: {
    opacity: 0,
    x: -10,
    transition: { duration: DURATION.fast },
  },
};

// ============================================
// VARIANTES DE CARDS
// ============================================

/** Card con hover interactivo */
export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeOut,
    },
  },
  tap: {
    scale: 0.98,
  },
};

/** Card con entrada animada */
export const cardEnterVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    },
  },
};

// ============================================
// VARIANTES DE LISTAS
// ============================================

/** Contenedor de lista con stagger */
export const listContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

/** Item individual de lista */
export const listItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: DURATION.fast,
    },
  },
};

/** Item de tabla */
export const tableRowVariants: Variants = {
  initial: {
    opacity: 0,
    backgroundColor: 'transparent',
  },
  animate: {
    opacity: 1,
    transition: {
      duration: DURATION.fast,
    },
  },
  hover: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATION.instant,
    },
  },
};

// ============================================
// VARIANTES DE TOAST/NOTIFICACIONES
// ============================================

/** Toast desde la derecha */
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: {
      duration: DURATION.fast,
    },
  },
};

/** Toast desde arriba */
export const toastTopVariants: Variants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.9,
    transition: {
      duration: DURATION.fast,
    },
  },
};

// ============================================
// VARIANTES DE DROPDOWN/MENÚ
// ============================================

/** Dropdown que aparece hacia abajo */
export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: DURATION.instant,
    },
  },
};

/** Dropdown con stagger en items */
export const dropdownContainerVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.fast,
      staggerChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATION.instant,
    },
  },
};

export const dropdownItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: -10,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
  },
};

// ============================================
// VARIANTES DE SKELETON/LOADING
// ============================================

/** Animación pulse para skeleton */
export const skeletonVariants: Variants = {
  initial: {
    opacity: 0.5,
  },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/** Shimmer effect */
export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================
// VARIANTES DE COLLAPSE/ACCORDION
// ============================================

/** Contenido colapsable */
export const collapseVariants: Variants = {
  initial: {
    height: 0,
    opacity: 0,
  },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: DURATION.normal,
        ease: EASING.easeOut,
      },
      opacity: {
        duration: DURATION.fast,
        delay: 0.1,
      },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: DURATION.fast,
        ease: EASING.easeIn,
      },
      opacity: {
        duration: DURATION.instant,
      },
    },
  },
};

// ============================================
// VARIANTES DE FADE
// ============================================

/** Fade simple */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast },
  },
};

/** Fade con scale */
export const fadeScaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: DURATION.fast,
    },
  },
};

// ============================================
// VARIANTES DE BOTÓN
// ============================================

/** Botón con feedback táctil */
export const buttonTapVariants: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.95 },
  hover: { scale: 1.02 },
};

/** Botón con loading spinner */
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================
// VARIANTES DE TABS
// ============================================

/** Indicador de tab activo */
export const tabIndicatorVariants: Variants = {
  initial: false as any,
  animate: {
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

/** Contenido de tab */
export const tabContentVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: DURATION.fast,
    },
  },
};

// ============================================
// VARIANTES DE TOOLTIP
// ============================================

export const tooltipVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: DURATION.instant,
    },
  },
};

// ============================================
// VARIANTES DE MODULE CARD (Dashboard)
// ============================================

/** Contenedor de grid de módulos */
export const moduleGridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      staggerChildren: 0.05,
    },
  },
};

/** Card de módulo con entrada escalonada */
export const moduleCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: EASING.easeOut,
    },
  },
};

/** Animación hover de card de módulo */
export const moduleCardHoverVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  tap: {
    scale: 0.98,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
};

/** Animación del icono en hover */
export const moduleIconVariants: Variants = {
  idle: {
    scale: 1,
    rotate: 0,
    y: 0,
  },
  hover: {
    scale: 1.1,
    rotate: [0, -5, 5, 0],
    y: -2,
    transition: {
      scale: { type: 'spring', stiffness: 400, damping: 15 },
      rotate: { duration: 0.4, ease: 'easeInOut' },
      y: { type: 'spring', stiffness: 300, damping: 20 },
    },
  },
};

/** Animación del chevron/flecha */
export const moduleChevronVariants: Variants = {
  idle: { x: 0, opacity: 0.5 },
  hover: {
    x: 3,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
};

/** Animación del badge */
export const moduleBadgeVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
};

// ============================================
// UTILIDADES DE RENDIMIENTO
// ============================================

/**
 * Detecta si el dispositivo es de bajo rendimiento (mobile/tablet)
 */
export const isLowPerformanceDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const lowCores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
  const smallScreen = window.innerWidth < 768;
  const lowMemory = (navigator as any).deviceMemory ? (navigator as any).deviceMemory < 4 : false;
  return lowCores || smallScreen || lowMemory;
};

// ============================================
// CONSTANTES DE PARTICULAS 3D (Sincronizadas con marketing_site)
// ============================================

/** Configuración del fondo de red 3D - COMPARTIDA con marketing_site */
export const PARTICLE_CONFIG = {
  /** Número de partículas en desktop */
  desktopCount: 80,
  /** Número de partículas en móvil (rendimiento) */
  mobileCount: 45,
  /** Distancia máxima para conectar partículas */
  connectionDistance: 25,
  /** Velocidad de movimiento de partículas */
  speed: 0.04,
  /** Color de marca primario */
  brandColor: '#ec268f',
  /** Ratio de colores: % partículas de color primario */
  primaryColorRatio: 0.7,
} as const;
