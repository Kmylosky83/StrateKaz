/**
 * SplashScreen Component - Enterprise Level
 *
 * Pantalla de carga inicial que muestra el logo StrateKaz mientras
 * se carga la configuración de branding de la empresa cliente.
 *
 * Características:
 * - Animaciones suaves y profesionales con Framer Motion
 * - Logo con efecto de respiración (pulse)
 * - Barra de progreso animada
 * - Transición fade-out elegante
 * - Respeta preferencias de reducción de movimiento
 * - Soporte completo para dark mode
 */
import { motion, AnimatePresence } from 'framer-motion';
import { DURATION, EASING, shouldReduceMotion } from '@/lib/animations';

export interface SplashScreenProps {
  /** Si el splash está visible */
  isVisible: boolean;
  /** Mensaje de estado (opcional) */
  statusMessage?: string;
  /** Mostrar indicador de progreso */
  showProgress?: boolean;
  /** Callback cuando termina la animación de salida */
  onExitComplete?: () => void;
}

// Variantes de animación para el contenedor principal
const containerVariants = {
  initial: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASING.easeInOut,
      when: 'afterChildren',
    },
  },
};

// Variantes para el logo
const logoVariants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeIn,
    },
  },
};

// Variantes para el efecto pulse del logo
const pulseVariants = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.9, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Variantes para el texto
const textVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3,
      duration: DURATION.normal,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATION.fast,
    },
  },
};

// Variantes para la barra de progreso
const progressBarVariants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: {
      scaleX: {
        duration: 2.5,
        ease: 'easeInOut',
      },
      opacity: {
        duration: DURATION.fast,
      },
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast },
  },
};

// Variantes para el status message
const statusVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Variantes reducidas para usuarios que prefieren menos movimiento
const reducedMotionVariants = {
  container: {
    initial: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  },
  logo: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  },
};

export const SplashScreen = ({
  isVisible,
  statusMessage = 'Cargando...',
  showProgress = true,
  onExitComplete,
}: SplashScreenProps) => {
  const reduceMotion = shouldReduceMotion();

  // Seleccionar variantes según preferencia de movimiento
  const containerV = reduceMotion ? reducedMotionVariants.container : containerVariants;
  const logoV = reduceMotion ? reducedMotionVariants.logo : logoVariants;

  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          key="splash-screen"
          variants={containerV}
          initial="initial"
          animate="animate"
          exit="exit"
          className="
            fixed inset-0 z-[9999]
            flex flex-col items-center justify-center
            bg-gradient-to-br from-gray-50 via-white to-gray-100
            dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
          "
        >
          {/* Background Pattern (sutil) */}
          <div
            className="
              absolute inset-0 opacity-[0.02] dark:opacity-[0.05]
              bg-[radial-gradient(circle_at_1px_1px,_currentColor_1px,_transparent_0)]
              bg-[length:24px_24px]
            "
            aria-hidden="true"
          />

          {/* Logo Container */}
          <motion.div
            variants={logoV}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative"
          >
            {/* Glow Effect (solo en dark mode) */}
            <div
              className="
                absolute -inset-8 opacity-0 dark:opacity-30
                bg-primary-500/20 blur-3xl rounded-full
              "
              aria-hidden="true"
            />

            {/* Logo con efecto pulse */}
            <motion.div
              variants={reduceMotion ? {} : pulseVariants}
              animate="animate"
              className="relative"
            >
              <img
                src="/logo-dark.png"
                alt="StrateKaz Logo"
                className="
                  h-24 w-auto
                  sm:h-28 md:h-32
                  dark:hidden
                  drop-shadow-lg
                "
              />
              <img
                src="/logo-light.png"
                alt="StrateKaz Logo"
                className="
                  h-24 w-auto
                  sm:h-28 md:h-32
                  hidden dark:block
                  drop-shadow-lg
                "
              />
            </motion.div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            variants={reduceMotion ? {} : textVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="
              mt-6 text-lg sm:text-xl font-medium
              text-gray-600 dark:text-gray-300
              tracking-wide
            "
          >
            Consultoría 4.0
          </motion.p>

          {/* Progress Bar */}
          {showProgress && (
            <div className="mt-8 w-48 sm:w-56">
              <div
                className="
                  h-1 w-full overflow-hidden rounded-full
                  bg-gray-200 dark:bg-gray-700
                "
              >
                <motion.div
                  variants={reduceMotion ? {} : progressBarVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="
                    h-full w-full origin-left rounded-full
                    bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500
                  "
                  style={{ transformOrigin: 'left' }}
                />
              </div>

              {/* Status Message */}
              <motion.p
                variants={reduceMotion ? {} : statusVariants}
                initial="initial"
                animate="animate"
                className="
                  mt-3 text-center text-sm
                  text-gray-500 dark:text-gray-400
                "
              >
                {statusMessage}
              </motion.p>
            </div>
          )}

          {/* Version Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
            exit={{ opacity: 0 }}
            className="
              absolute bottom-6
              text-xs text-gray-400 dark:text-gray-500
            "
          >
            v2.0.0
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
