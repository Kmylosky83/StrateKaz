import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { servicePackages, getColorClasses } from './data';

interface ServicesTabProps {
  onConsultationRequest: (serviceId: string) => void;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  onConsultationRequest,
}) => {
  return (
    <div className='space-y-4 sm:space-y-8'>
      {/* Mobile: Simplified cards - only essential info */}
      <div className='sm:hidden space-y-4'>
        {servicePackages.map((service, _index) => {
          const colors = getColorClasses(service.color);
          return (
            <Card
              key={service.id}
              className={`group relative overflow-hidden bg-black-card-soft border border-black-border-soft ${colors.hoverBorder} transition-all duration-300`}
            >
              <div className='p-4'>
                <div className='flex items-center space-x-3 mb-3'>
                  <div
                    className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center ${colors.text} flex-shrink-0`}
                  >
                    {React.cloneElement(
                      service.icon as React.ReactElement<any>,
                      { className: 'h-5 w-5' }
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h3 className='text-base font-bold text-white-text font-title leading-tight'>
                      {service.title}
                    </h3>
                  </div>
                </div>

                {/* Only show dynamic placeholders on mobile */}
                <div className='grid grid-cols-2 gap-3 mb-3'>
                  <div className='bg-black-hover p-3 rounded-lg text-center'>
                    <div className='text-xs text-white-muted-soft mb-1 font-content'>
                      Duración
                    </div>
                    <div className='font-semibold text-sm text-white-text font-title'>
                      {service.timeline}
                    </div>
                  </div>
                  <div className='bg-black-hover p-3 rounded-lg text-center'>
                    <div className='text-xs text-white-muted-soft mb-1 font-content'>
                      Inversión
                    </div>
                    <div
                      className={`font-semibold text-sm ${colors.text} font-title`}
                    >
                      {service.investment}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => onConsultationRequest(service.id)}
                  className={`w-full ${colors.button} hover:${colors.buttonHover} text-white transition-all duration-300`}
                  size='sm'
                >
                  Consultar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Desktop: Full detailed cards */}
      <div className='hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
        {servicePackages.map((service, _index) => {
          const colors = getColorClasses(service.color);
          return (
            <Card
              key={service.id}
              className={`group relative overflow-hidden bg-black-card-soft border border-black-border-soft ${colors.hoverBorder} transition-all duration-500 hover:shadow-xl ${colors.hoverShadow} ${
                service.popular ? `ring-2 ${colors.ring}` : ''
              }`}
            >
              {service.popular && (
                <div
                  className={`absolute top-4 right-4 ${colors.badge} text-white px-3 py-1 rounded-full text-sm font-bold font-title`}
                >
                  Más Solicitado
                </div>
              )}

              <div className='p-6 lg:p-8'>
                <div className='flex flex-row items-center space-x-4 mb-6'>
                  <div
                    className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} group-hover:scale-110 transition-all duration-300 flex-shrink-0`}
                  >
                    {React.cloneElement(
                      service.icon as React.ReactElement<any>,
                      { className: 'h-8 w-8' }
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h3 className='text-fluid-xl lg:text-fluid-2xl font-bold text-white-text mb-2 font-title leading-tight'>
                      {service.title}
                    </h3>
                    <p className='text-base text-white-muted font-content'>
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 mb-6'>
                  <div className='bg-black-hover p-3 rounded-lg'>
                    <div className='text-sm text-white-muted-soft mb-1 font-content'>
                      Duración
                    </div>
                    <div className='font-semibold text-base text-white-text font-title'>
                      {service.timeline}
                    </div>
                  </div>
                  <div className='bg-black-hover p-3 rounded-lg'>
                    <div className='text-sm text-white-muted-soft mb-1 font-content'>
                      Inversión
                    </div>
                    <div
                      className={`font-semibold text-base ${colors.text} font-title`}
                    >
                      {service.investment}
                    </div>
                  </div>
                </div>

                <div className='space-y-4 mb-4 sm:mb-6'>
                  <div>
                    <h4 className='font-semibold text-sm sm:text-base text-white-text mb-3 font-title'>
                      Incluye:
                    </h4>
                    <div className='grid grid-cols-1 gap-2'>
                      {service.includes.slice(0, 4).map((item, i) => (
                        <div key={i} className='flex items-start space-x-3'>
                          <CheckCircle
                            className={`h-4 w-4 ${colors.text} flex-shrink-0 mt-0.5`}
                            aria-hidden='true'
                          />
                          <span className='text-white-muted-soft text-xs sm:text-sm font-content leading-relaxed'>
                            {item}
                          </span>
                        </div>
                      ))}
                      {service.includes.length > 4 && (
                        <div className='text-xs text-white-muted-soft font-content mt-2'>
                          +{service.includes.length - 4} elementos más
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className='font-semibold text-sm sm:text-base text-white-text mb-3 font-title'>
                      Industrias:
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {service.industries.slice(0, 3).map((industry, i) => (
                        <span
                          key={i}
                          className={`${colors.bg} ${colors.text} px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${colors.border}`}
                        >
                          {industry}
                        </span>
                      ))}
                      {service.industries.length > 3 && (
                        <span
                          className={`${colors.bg} ${colors.text} px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${colors.border}`}
                        >
                          +{service.industries.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className='mt-4 sm:mt-6'>
                  <Button
                    onClick={() => onConsultationRequest(service.id)}
                    className='w-full sm:w-auto min-h-[44px]'
                    variant='outline'
                  >
                    Consultar Servicio
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
