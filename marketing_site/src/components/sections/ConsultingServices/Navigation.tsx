import React from 'react';
import { Award, Users, HelpCircle } from 'lucide-react';
import { TabType } from './types';

interface NavigationProps {
  selectedTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  selectedTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'services' as const,
      label: 'Paquetes de Servicios',
      shortLabel: 'Servicios',
      icon: Award,
    },
    {
      id: 'profiles' as const,
      label: 'Perfiles de Usuario',
      shortLabel: 'Perfiles',
      icon: Users,
    },
    {
      id: 'faq' as const,
      label: 'Preguntas Frecuentes',
      shortLabel: 'FAQ',
      icon: HelpCircle,
    },
  ];

  return (
    <section className='py-8 sm:py-12 lg:py-16'>
      <div className='container-responsive'>
        <div className='text-center mb-6 sm:mb-12'>
          {/* Title - Mobile simplified */}
          <div className='flex flex-col sm:flex-row items-center justify-center gap-3 mb-4'>
            <Award
              className='h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-brand-500 flex-shrink-0'
              aria-label='Servicios de consultoría especializada'
            />
            <h2 className='text-fluid-2xl lg:text-fluid-3xl font-bold text-white-text text-center'>
              <span className='sm:hidden'>Servicios Profesionales</span>
              <span className='hidden sm:inline'>
                Servicios de Consultoría Especializada
              </span>
            </h2>
          </div>

          {/* Navigation Buttons - Mobile as large icons */}
          <div className='sm:hidden flex justify-center gap-4'>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-300 min-w-[80px] ${selectedTab === tab.id
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-105'
                      : 'bg-black-card text-white-text-soft hover:bg-black-hover hover:text-white-text border border-black-border'
                    }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg mb-2 transition-all duration-300 ${selectedTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'text-brand-500'
                      }`}
                  >
                    <Icon className='w-5 h-5' aria-hidden='true' />
                  </div>
                  <span className='font-medium text-xs font-ui text-center leading-tight'>
                    {tab.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop navigation - unchanged */}
          <div className='hidden sm:flex flex-wrap justify-center gap-2 sm:gap-3'>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`group flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-300 min-h-[44px] ${selectedTab === tab.id
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'bg-black-card hover:bg-black-hover text-white-text-soft hover:text-white-text border border-black-border hover:border-black-border-soft'
                    }`}
                >
                  <div
                    className={`flex items-center justify-center w-5 h-5 rounded-md transition-all duration-300 ${selectedTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-transparent text-brand-500 group-hover:bg-brand-500/10'
                      }`}
                  >
                    <Icon className='w-3 h-3' aria-hidden='true' />
                  </div>
                  <span className='font-medium text-base font-ui'>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
