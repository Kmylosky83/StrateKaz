import React from 'react';

interface FeatureHeaderProps {
  title: string;
  subtitle: string;
}

export const FeatureHeader: React.FC<FeatureHeaderProps> = ({
  title,
  subtitle,
}) => {
  return (
    <div className='text-center mb-6 sm:mb-8'>
      <h2 className='text-fluid-3xl font-bold font-title text-white-text mb-3 sm:mb-4'>
        <span className='sm:hidden'>Servicios Profesionales</span>
        <span className='hidden sm:inline'>{title}</span>
      </h2>
      <div className='hidden sm:block container-content'>
        <p className='text-fluid-lg text-white-text-soft'>{subtitle}</p>
      </div>
    </div>
  );
};
