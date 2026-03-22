import React from 'react';
import { Feature } from './types';

const getColorClasses = (color: string) => {
  switch (color) {
    case 'blue':
      return {
        active:
          'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20',
        inactive:
          'bg-black-card hover:bg-black-hover text-white-text-soft hover:text-white-text border-black-border hover:border-blue-500/50',
      };
    case 'green':
      return {
        active:
          'bg-green-500 text-white border-green-500 shadow-md shadow-green-500/20',
        inactive:
          'bg-black-card hover:bg-black-hover text-white-text-soft hover:text-white-text border-black-border hover:border-green-500/50',
      };
    case 'yellow':
      return {
        active:
          'bg-system-yellow-500 text-white border-system-yellow-500 shadow-md shadow-system-yellow-500/20',
        inactive:
          'bg-black-card hover:bg-black-hover text-white-text-soft hover:text-white-text border-black-border hover:border-system-yellow-500/50',
      };
    case 'red':
      return {
        active:
          'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20',
        inactive:
          'bg-black-card hover:bg-black-hover text-white-text-soft hover:text-white-text border-black-border hover:border-red-500/50',
      };
    case 'orange':
      return {
        active:
          'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20',
        inactive:
          'bg-black-card hover:bg-black-hover text-white-text-soft hover:text-white-text border-black-border hover:border-orange-500/50',
      };
    case 'purple':
      return {
        active:
          'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20',
        inactive:
          'bg-black-card hover:bg-black-hover text-white-text-soft hover:text-white-text border-black-border hover:border-purple-500/50',
      };
    default:
      return {
        active:
          'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20',
        inactive:
          'bg-black-card hover:bg-black-hover text-white-text-soft hover:text-white-text border-black-border hover:border-brand-500/50',
      };
  }
};

interface FeatureTabsProps {
  features: Feature[];
  activeFeature: number;
  onFeatureSelect: (index: number) => void;
}

export const FeatureTabs: React.FC<FeatureTabsProps> = ({
  features,
  activeFeature,
  onFeatureSelect,
}) => {
  return (
    <>
      {/* Mobile: Cards in grid */}
      <div className='sm:hidden grid grid-cols-3 gap-2 mb-6 px-2'>
        {features.map((feature, index) => {
          const colors = getColorClasses(feature.color);
          const isActive = activeFeature === index;

          return (
            <button
              key={feature.id}
              onClick={() => onFeatureSelect(index)}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 border ${
                isActive ? `${colors.active} scale-105` : colors.inactive
              }`}
              aria-pressed={isActive}
              aria-label={`Select ${feature.title}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 mb-2 transition-all duration-300`}
              >
                {React.cloneElement(feature.icon as React.ReactElement<any>, {
                  className: 'h-5 w-5',
                })}
              </div>
              <span className='font-content font-medium text-xs text-center leading-tight'>
                {feature.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop: Horizontal tabs */}
      <div className='hidden sm:flex flex-wrap justify-center gap-3 mb-8'>
        {features.map((feature, index) => {
          const colors = getColorClasses(feature.color);
          const isActive = activeFeature === index;

          return (
            <button
              key={feature.id}
              onClick={() => onFeatureSelect(index)}
              className={`group flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-300 min-h-[44px] border ${
                isActive ? colors.active : colors.inactive
              }`}
              aria-pressed={isActive}
              aria-label={`Select ${feature.title}`}
            >
              <div
                className={`flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'text-white'
                    : 'text-white-text-soft group-hover:text-white-text'
                }`}
              >
                {React.cloneElement(feature.icon as React.ReactElement<any>, {
                  className: 'h-5 w-5',
                })}
              </div>
              <span className='font-content font-medium text-sm'>
                {feature.title}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};
