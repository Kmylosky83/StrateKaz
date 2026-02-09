import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, CheckCircle, Settings, Activity } from 'lucide-react';
import { HERO_CONTENT } from './heroData';
import { EASING, shouldReduceMotion } from '@/lib/animations';

interface HeroDashboardProps {
  systemProgress: number[];
  currentSystemCategory: number;
  displayedText: string;
  auditDisplayedWord: string;
}

export const HeroDashboard: React.FC<HeroDashboardProps> = ({
  systemProgress,
  currentSystemCategory,
  displayedText,
  auditDisplayedWord,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'in_progress':
        return 'text-system-orange-500';
      case 'planning':
        return 'text-system-purple-500';
      default:
        return 'text-neutral-500';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className='w-3 h-3' aria-label='Sistema activo' />;
      case 'in_progress':
        return (
          <Settings
            className='w-3 h-3 animate-spin'
            aria-label='Sistema en progreso'
          />
        );
      case 'planning':
        return (
          <Activity className='w-3 h-3' aria-label='Sistema en planificación' />
        );
      default:
        return null;
    }
  };

  const getProgressGradient = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-gradient-to-r from-blue-500 to-blue-400';
      case 'green':
        return 'bg-gradient-to-r from-green-500 to-green-400';
      case 'red':
        return 'bg-gradient-to-r from-red-500 to-red-400';
      case 'orange':
        return 'bg-gradient-to-r from-orange-500 to-orange-400';
      case 'purple':
        return 'bg-gradient-to-r from-purple-500 to-purple-400';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-400';
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const reduceMotion = useMemo(() => shouldReduceMotion(), []);

  return (
    <div className='lg:pl-8 mt-8 lg:mt-0'>
      <motion.div
        className='relative'
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 50 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: EASING.easeOut }}
      >
        {/* Dashboard Container */}
        <motion.div
          className='relative bg-black-card-soft rounded-xl lg:rounded-2xl shadow-hard border border-black-border-soft overflow-visible'
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className='min-h-fit max-h-[50vh] bg-black-card-soft flex items-start justify-center rounded-xl lg:rounded-2xl overflow-y-auto'>
            {/* Dashboard preview */}
            <div className='w-full h-auto pt-1 px-2 pb-2 sm:pt-1.5 sm:px-3 sm:pb-3 lg:pt-2 lg:px-4 lg:pb-4 space-y-2 sm:space-y-3 flex flex-col'>
              {/* Header with icons */}
              <div className='h-6 sm:h-8 flex items-center justify-between'>
                {/* Empty space on the left */}
                <div></div>
                {/* Icons on the right */}
                <motion.div
                  className='flex items-center space-x-2'
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className='p-1 rounded-lg bg-black-hover-soft/40'
                  >
                    <Shield
                      className='w-3 h-3 sm:w-4 sm:h-4 text-white-muted-soft'
                      aria-label='Seguridad'
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className='p-1 rounded-lg bg-black-hover-soft/40'
                  >
                    <Users
                      className='w-3 h-3 sm:w-4 sm:h-4 text-white-muted-soft'
                      aria-label='Usuarios'
                    />
                  </motion.div>
                </motion.div>
              </div>

              {/* Dynamic Management Systems */}
              <div className='flex-1 space-y-2 overflow-hidden'>
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={currentSystemCategory}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className='space-y-2'
                  >
                    {/* Category Header */}
                    <motion.div
                      className='flex items-center justify-between mb-3'
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className='text-xs font-semibold text-brand-500 font-ui uppercase tracking-wider'>
                        {HERO_CONTENT.managementSystems[currentSystemCategory]
                          ?.category || 'Gestión'}
                      </span>
                      <motion.div
                        className='flex space-x-1'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {HERO_CONTENT.managementSystems.map((_, index) => (
                          <div
                            key={`indicator-${index}`}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              index === currentSystemCategory
                                ? 'bg-brand-500 scale-125'
                                : 'bg-neutral-600'
                            }`}
                          />
                        ))}
                      </motion.div>
                    </motion.div>

                    {/* Systems in Current Category */}
                    {HERO_CONTENT.managementSystems[
                      currentSystemCategory
                    ]?.systems?.map((system, i) => {
                      const globalIndex =
                        HERO_CONTENT.managementSystems
                          .slice(0, currentSystemCategory)
                          .reduce((acc, cat) => acc + cat.systems.length, 0) +
                        i;
                      const Icon = system.icon;
                      const progress = systemProgress[globalIndex] || 0;

                      return (
                        <motion.div
                          key={`${currentSystemCategory}-${i}`}
                          className='group bg-black-hover-soft/60 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-transparent hover:border-white/20 transition-all duration-300 cursor-pointer'
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.4,
                            delay: 0.4 + i * 0.1,
                            type: 'spring',
                            stiffness: 300,
                          }}
                          whileHover={{
                            scale: 1.02,
                            transition: { duration: 0.2 },
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* System Header */}
                          <div className='flex justify-between items-center mb-2'>
                            <div className='flex items-center space-x-2'>
                              <motion.div
                                className={`p-1.5 rounded-md transition-colors duration-300 ${
                                  system.color === 'blue'
                                    ? 'bg-system-blue-500/20'
                                    : system.color === 'green'
                                      ? 'bg-green-500/20'
                                      : system.color === 'red'
                                        ? 'bg-red-500/20'
                                        : system.color === 'orange'
                                          ? 'bg-orange-500/20'
                                          : 'bg-purple-500/20'
                                }`}
                                whileHover={{ rotate: 5 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Icon
                                  className={`w-3 h-3 ${
                                    system.color === 'blue'
                                      ? 'text-system-blue-500'
                                      : system.color === 'green'
                                        ? 'text-green-500'
                                        : system.color === 'red'
                                          ? 'text-red-500'
                                          : system.color === 'orange'
                                            ? 'text-orange-500'
                                            : 'text-purple-500'
                                  }`}
                                  aria-label={`${system.name}: ${system.description}`}
                                />
                              </motion.div>
                              <motion.span
                                className='text-xs sm:text-sm font-medium text-white-text-soft font-ui'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                              >
                                {system.name}
                              </motion.span>
                            </div>

                            <div className='flex items-center space-x-2'>
                              <motion.div
                                className={getStatusColor(system.status)}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  delay: 0.7 + i * 0.1,
                                  type: 'spring',
                                }}
                              >
                                {getStatusIndicator(system.status)}
                              </motion.div>
                              <motion.span
                                className='text-xs font-bold text-white-text font-content'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 + i * 0.1 }}
                              >
                                {progress}%
                              </motion.span>
                            </div>
                          </div>

                          {/* System Description */}
                          <motion.div
                            className='text-xs text-white-muted-soft mb-2 sm:mb-3 font-content'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.1 }}
                          >
                            <span className='hidden sm:inline'>
                              {system.description}
                            </span>
                            <span className='sm:hidden'>
                              {system.description
                                .split(' ')
                                .slice(0, 2)
                                .join(' ')}
                            </span>
                          </motion.div>

                          {/* Progress Bar */}
                          <div className='relative'>
                            <div className='w-full bg-neutral-800 rounded-full h-2 overflow-hidden'>
                              <motion.div
                                className={`h-full rounded-full ${getProgressGradient(system.color)} relative overflow-hidden`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{
                                  duration: 1.8,
                                  delay: 0.9 + i * 0.2,
                                  ease: 'easeOut',
                                }}
                              >
                                {/* Shimmer effect */}
                                <motion.div
                                  className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: 'loop',
                                    ease: 'linear',
                                    delay: 1.5 + i * 0.3,
                                  }}
                                  style={{ width: '30%' }}
                                />
                              </motion.div>
                            </div>

                            {/* Progress indicator */}
                            <motion.div
                              className='absolute -top-6 text-xs text-white-muted-soft font-content'
                              style={{
                                left: `${Math.min(progress, 90)}%`,
                              }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.2 + i * 0.2 }}
                            >
                              {progress > 0 && `${progress}%`}
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Floating elements - Mobile optimized */}
          <motion.div
            className='absolute -top-2 -left-2 sm:-top-4 sm:-left-4 lg:-top-6 lg:-left-6 bg-black-card-soft border border-black-border-soft p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl shadow-lg z-10'
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            whileHover={{
              scale: 1.05,
              rotate: 2,
              transition: { duration: 0.2 },
            }}
          >
            <div className='flex items-center space-x-1 sm:space-x-2'>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <HERO_CONTENT.floatingElements.topBadge.icon
                  className='h-3 w-3 sm:h-4 sm:w-4 text-brand-500 fill-current'
                  aria-label='Premio - Gestión Empresarial de Alto Impacto'
                />
              </motion.div>
              <span className='text-xs font-medium text-white-muted-soft font-ui max-w-[100px] sm:max-w-[140px] lg:max-w-none leading-tight'>
                <span className='hidden sm:inline'>{displayedText}</span>
                <span className='sm:hidden'>Alto Impacto</span>
                <span className='animate-pulse text-brand-500'>|</span>
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom audit banner - below container */}
        <motion.div
          className='mt-4 sm:mt-6 bg-black-card-soft border border-black-border-soft p-3 lg:p-4 rounded-xl shadow-lg'
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          whileHover={{
            scale: 1.02,
            y: -2,
            transition: { duration: 0.2 },
          }}
        >
          <div className='flex items-center justify-center space-x-2'>
            <motion.div
              className='w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full flex-shrink-0'
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span className='text-xs sm:text-sm font-medium text-white-muted-soft font-ui text-center'>
              <span className='hidden sm:inline'>
                {HERO_CONTENT.floatingElements.bottomBadge.baseText}{' '}
                {auditDisplayedWord}
              </span>
              <span className='sm:hidden'>
                Auditoría {auditDisplayedWord.split(' ')[0]}
              </span>
              <span className='animate-pulse text-red-500'>|</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
