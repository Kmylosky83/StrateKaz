import React from 'react';
import { CheckCircle, Zap } from 'lucide-react';
import { Feature } from './types';

interface FeatureContentProps {
  feature: Feature;
}

export const FeatureContent: React.FC<FeatureContentProps> = ({ feature }) => {
  return (
    <div className='grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start lg:items-center min-h-[500px] sm:min-h-[600px]'>
      {/* Feature content */}
      <div className='space-y-4 sm:space-y-6 order-2 lg:order-1'>
        <div className='space-y-3 sm:space-y-4'>
          <div className='flex items-center space-x-3'>
            <div className='w-12 h-12 sm:w-10 sm:h-10 bg-black-card border border-black-border rounded-lg flex items-center justify-center text-white-text-soft flex-shrink-0'>
              {React.cloneElement(feature.icon as React.ReactElement<any>, {
                className: 'w-6 h-6',
              })}
            </div>
            <div className='min-w-0 flex-1'>
              <h3 className='text-fluid-2xl font-title font-bold text-white-text leading-tight'>
                {feature.title}
              </h3>
            </div>
          </div>

          <div className='container-content'>
            <p className='text-fluid-base text-white-text-soft font-content leading-relaxed'>
              {feature.description}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className='bg-black-card border border-black-border rounded-xl sm:rounded-2xl p-4 sm:p-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
            <div className='text-center sm:text-left'>
              <div className='text-2xl sm:text-3xl font-title font-bold text-brand-500 mb-1'>
                {feature.metrics.primary}
              </div>
              <div className='text-sm sm:text-base text-white-text-soft font-content'>
                {feature.metrics.secondary}
              </div>
            </div>
            <div className='space-y-2 sm:space-y-3'>
              {feature.benefits.slice(0, 2).map((benefit, index) => (
                <div key={index} className='flex items-start space-x-2'>
                  <CheckCircle
                    className='h-4 w-4 sm:h-5 sm:w-5 text-accent-success flex-shrink-0 mt-0.5'
                    aria-hidden='true'
                  />
                  <span className='text-xs sm:text-sm text-white-text-soft font-content leading-relaxed'>
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits list */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
          {feature.benefits.map((benefit, index) => (
            <div
              key={index}
              className='flex items-start space-x-3 p-3 bg-black-card-soft/50 rounded-lg border border-black-border-soft'
            >
              <CheckCircle
                className='h-4 w-4 sm:h-5 sm:w-5 text-accent-success flex-shrink-0 mt-0.5'
                aria-hidden='true'
              />
              <span className='text-sm sm:text-base text-white-text-soft font-content leading-relaxed'>
                {benefit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature preview */}
      <div className='lg:pl-6 flex items-center justify-center order-1 lg:order-2'>
        <div className='relative w-full'>
          <div className='bg-black-card border border-black-border rounded-xl p-4 sm:p-6 shadow-xl min-h-[200px] sm:min-h-[280px] flex items-center'>
            <div className='w-full'>{feature.preview}</div>
          </div>

          {/* Decorative element */}
          <div className='absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-5 h-5 sm:w-6 sm:h-6 bg-black-hover border border-brand-500/30 rounded-md rotate-12 flex items-center justify-center'>
            <Zap
              className='w-2 h-2 sm:w-3 sm:h-3 text-brand-500 -rotate-12'
              aria-label='Innovación tecnológica'
            />
          </div>
        </div>
      </div>
    </div>
  );
};
