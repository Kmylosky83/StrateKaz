import React from 'react';
import { motion } from 'framer-motion';
import { HERO_CONTENT } from './heroData';
import { DURATION, EASING } from '@/lib/animations';

interface HeroContentProps {
  displayedWord: string;
}

export const HeroContent: React.FC<HeroContentProps> = ({ displayedWord }) => {
  return (
    <div className='space-y-section-xs'>
      {/* Main headline - Mobile optimized */}
      <div className='space-y-4 sm:space-y-8 lg:space-y-10'>
        <div className='min-h-[100px] xs:min-h-[120px] sm:min-h-[140px] lg:min-h-[160px] flex items-start'>
          <h1 className='text-fluid-3xl lg:text-fluid-4xl font-bold text-white-text leading-tight font-title'>
            {HERO_CONTENT.headline.main}{' '}
            <span className='text-brand-500'>
              {HERO_CONTENT.headline.highlight}
            </span>
            <br className='hidden sm:block' />
            <span className='sm:hidden'> </span>
            {HERO_CONTENT.headline.continuation}
            <br />
            <span className='text-white-text text-fluid-3xl lg:text-fluid-4xl'>
              {displayedWord}
              <span className='animate-pulse text-brand-500'>|</span>
            </span>
          </h1>
        </div>

        {/* Description - Condensed version on mobile */}
        <div className='w-full sm:max-w-content-normal'>
          <p className='text-sm sm:text-lg lg:text-xl text-white-muted leading-relaxed font-content line-clamp-2 sm:line-clamp-none'>
            {HERO_CONTENT.description}
          </p>
        </div>
      </div>

      {/* Key benefits - Show 2 on mobile, 4 on tablet+ */}
      <div className='grid grid-cols-2 gap-3 sm:gap-4'>
        {HERO_CONTENT.keyBenefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div key={index} className='flex items-center space-x-2 sm:space-x-3'>
              <Icon
                className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${benefit.color}`}
                aria-hidden='true'
              />
              <span className='text-sm sm:text-base text-white-text-soft font-content'>
                {benefit.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Trust indicators - Horizontal scroll on mobile, grid on tablet+ */}
      <div className='flex overflow-x-auto sm:grid sm:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-6 pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide'>
        {Object.entries(HERO_CONTENT.trustIndicators).map(
          ([key, indicator], index) => {
            const Icon = indicator.icon;
            const isRating = key === 'rating';

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: DURATION.slow, ease: EASING.smooth }}
                className='flex flex-col items-center space-y-1 sm:space-y-2 group p-2 sm:p-3 rounded-xl bg-black-card-soft/50 border border-black-border-soft hover:border-brand-500/30 transition-all duration-300 min-w-[80px] sm:min-w-0 min-h-[70px] sm:min-h-[90px] justify-center flex-shrink-0'
              >
                <motion.div
                  className='flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-black-card border border-black-border group-hover:border-brand-500/50 transition-all duration-300'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${indicator.color} transition-colors duration-300 ${isRating ? 'fill-current' : ''}`}
                    aria-hidden='true'
                  />
                </motion.div>

                <div className='text-center'>
                  <motion.div
                    className='text-xs sm:text-base font-semibold text-white-text font-title'
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: index * 0.1 + 0.2,
                      duration: 0.3,
                    }}
                  >
                    {indicator.text}
                  </motion.div>
                  <div className='text-[10px] sm:text-xs text-white-muted font-content leading-tight'>
                    {indicator.label}
                  </div>
                </div>
              </motion.div>
            );
          }
        )}
      </div>
    </div>
  );
};
