import React from 'react';

interface HeroBackgroundProps {
  children: React.ReactNode;
}

export const HeroBackground: React.FC<HeroBackgroundProps> = ({ children }) => {
  return (
    <div className='relative overflow-hidden'>
      {/* Patrón sutil de fondo */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlYzI2OGYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      <div className='container-responsive pt-6 xxs:pt-8 xs:pt-10 sm:pt-12 md:pt-14 lg:pt-16 xl:pt-20 2xl:pt-24 pb-8 xxs:pb-10 xs:pb-12 sm:pt-14 sm:pb-16 lg:pb-20 xl:pb-24 2xl:pb-28'>
        <div className='grid lg:grid-cols-2 gap-6 xxs:gap-8 xs:gap-10 sm:gap-12 lg:gap-14 xl:gap-16 2xl:gap-20 items-start'>
          {children}
        </div>
      </div>
    </div>
  );
};
