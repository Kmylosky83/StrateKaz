import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Card } from '@components/ui/card';
import { userProfiles, getColorClasses } from './data';

export const ProfilesTab: React.FC = () => {
  return (
    <div className='space-y-6 sm:space-y-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
        {userProfiles.map(profile => {
          const colors = getColorClasses(profile.color);
          return (
            <Card
              key={profile.id}
              className={`bg-black-card-soft border border-black-border-soft ${colors.hoverBorder} transition-all duration-500 hover:shadow-xl ${colors.hoverShadow}`}
            >
              <div className='p-card-md lg:p-card-lg'>
                <div className='flex items-center space-x-4 mb-6'>
                  <div
                    className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text}`}
                  >
                    {profile.icon}
                  </div>
                  <div>
                    <h3 className='text-fluid-xl lg:text-fluid-2xl font-bold text-white-text mb-2 font-title'>
                      {profile.title}
                    </h3>
                    <p className='text-white-muted font-content'>
                      {profile.description}
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <h4 className='font-semibold text-white-text mb-3 font-title'>
                      Beneficios:
                    </h4>
                    <div className='space-y-2'>
                      {profile.benefits.map((benefit, i) => (
                        <div key={i} className='flex items-center space-x-3'>
                          <CheckCircle
                            className={`h-4 w-4 ${colors.text} flex-shrink-0`}
                            aria-hidden='true'
                          />
                          <span className='text-white-muted-soft text-sm font-content'>
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className='font-semibold text-white-text mb-3 font-title'>
                      Casos de Uso:
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {profile.useCases.map((useCase, i) => (
                        <span
                          key={i}
                          className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-medium border ${colors.border}`}
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
