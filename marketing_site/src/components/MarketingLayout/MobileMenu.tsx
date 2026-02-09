import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { cn } from '@utils/cn';
import env from '@/config/env.config';
import { MobileMenuProps } from './types';
import { navigationItems } from './data';

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  isActivePage,
}) => {
  if (!isOpen) return null;

  return (
    <div className='md:hidden bg-neutral-900 border-t border-neutral-700 shadow-lg'>
      <div className='px-4 py-6 space-y-2 max-h-[calc(100vh-3.5rem)] overflow-y-auto'>
        {navigationItems.map(item => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center space-x-3 px-4 py-4 text-base font-medium rounded-lg transition-colors min-h-[44px]',
                isActivePage(item.href)
                  ? 'text-brand-400 bg-neutral-800'
                  : 'text-neutral-300 hover:text-brand-400 hover:bg-neutral-800'
              )}
            >
              <IconComponent
                className='h-5 w-5 flex-shrink-0'
                aria-label={item.name}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Login Button - Mobile */}
        <a
          href={env.appLoginUrl}
          onClick={onClose}
          className='flex items-center space-x-3 px-4 py-4 text-base font-medium rounded-lg transition-colors min-h-[44px] text-white bg-brand-500 hover:bg-brand-600 mt-4'
        >
          <LogIn className='h-5 w-5 flex-shrink-0' aria-hidden='true' />
          <span>Iniciar Sesión</span>
        </a>
      </div>
    </div>
  );
};
