/**
 * Framer Motion variants for Showcase components
 * with prefers-reduced-motion support
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero Section Animations
export const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.8,
      staggerChildren: prefersReducedMotion ? 0 : 0.2,
    },
  },
};

export const heroItemVariants = {
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: 'easeOut',
    },
  },
};

// Valor Card Animations
export const valorContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.1,
    },
  },
};

export const valorCardVariants = {
  hidden: {
    opacity: 0,
    y: prefersReducedMotion ? 0 : 20,
    scale: prefersReducedMotion ? 1 : 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.5,
      ease: 'easeOut',
    },
  },
  hover: {
    scale: prefersReducedMotion ? 1 : 1.05,
    boxShadow: prefersReducedMotion
      ? '0 0 0 rgba(139, 92, 246, 0)'
      : '0 0 30px rgba(139, 92, 246, 0.3)',
    transition: {
      duration: 0.3,
    },
  },
};

// Timeline Animations
export const timelineContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.15,
    },
  },
};

export const timelineItemVariants = {
  hidden: {
    opacity: 0,
    x: prefersReducedMotion ? 0 : -30,
  },
  visible: (custom: 'left' | 'right') => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: 'easeOut',
    },
  }),
};

export const timelineLineVariants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: {
      duration: prefersReducedMotion ? 0 : 1.2,
      ease: 'easeInOut',
    },
  },
};

// Badge Animations
export const badgeContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.12,
    },
  },
};

export const badgeVariants = {
  hidden: {
    opacity: 0,
    scale: prefersReducedMotion ? 1 : 0.8,
    rotateY: prefersReducedMotion ? 0 : -15,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: 'easeOut',
    },
  },
  hover: {
    scale: prefersReducedMotion ? 1 : 1.1,
    rotateY: prefersReducedMotion ? 0 : 10,
    transition: {
      duration: 0.3,
    },
  },
};

// Navigation Dot Animations
export const navigationVariants = {
  hidden: {
    opacity: 0,
    x: prefersReducedMotion ? 0 : 50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.4,
    },
  },
  exit: {
    opacity: 0,
    x: prefersReducedMotion ? 0 : 50,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.3,
    },
  },
};

export const dotVariants = {
  inactive: {
    scale: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
  },
  active: {
    scale: 1.4,
    backgroundColor: 'rgba(139, 92, 246, 1)',
    transition: {
      duration: 0.3,
    },
  },
};

// Presentation Mode Animations
export const presentationSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? (prefersReducedMotion ? 0 : 1000) : prefersReducedMotion ? 0 : -1000,
    opacity: prefersReducedMotion ? 1 : 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.5,
      ease: 'easeInOut',
    },
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? (prefersReducedMotion ? 0 : 1000) : prefersReducedMotion ? 0 : -1000,
    opacity: prefersReducedMotion ? 1 : 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.5,
      ease: 'easeInOut',
    },
  }),
};

export const progressBarVariants = {
  initial: { scaleX: 0 },
  animate: (progress: number) => ({
    scaleX: progress,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.3,
      ease: 'easeOut',
    },
  }),
};

// Glassmorphism Card Animation
export const glassmorphismVariants = {
  hidden: {
    opacity: 0,
    y: prefersReducedMotion ? 0 : 20,
    backdropFilter: 'blur(0px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    backdropFilter: 'blur(12px)',
    transition: {
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: 'easeOut',
    },
  },
};

// Scroll Reveal Animation
export const scrollRevealVariants = {
  hidden: {
    opacity: 0,
    y: prefersReducedMotion ? 0 : 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: 'easeOut',
    },
  },
};
