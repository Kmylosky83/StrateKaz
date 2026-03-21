import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import { COMPANY_INFO } from '@/config/theme.config';
import env from '@/config/env.config';
import { cn } from '@utils/cn';
import { HeaderProps } from './types';
import { navigationItems } from './data';
import { MobileMenu } from './MobileMenu';

export const Header: React.FC<HeaderProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isActivePage,
}) => {
  return (
    <>
      <header className='fixed top-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-700 w-full'>
        <div className='container-responsive'>
          <div className='flex items-center justify-between h-14 sm:h-16'>
            {/* Logo */}
            <div className='flex items-center'>
              <Link to='/' className='flex flex-col'>
                <img
                  src='/logo-light.png'
                  alt={COMPANY_INFO.name}
                  className='h-8 sm:h-10 w-auto'
                  width={160}
                  height={40}
                />
                <span className='text-xs font-medium text-brand-500 tracking-wide'>
                  Consultoría 4.0
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className='hidden md:flex items-center space-x-6'>
              {navigationItems.map(item => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-brand-400',
                      isActivePage(item.href)
                        ? 'text-brand-400'
                        : 'text-neutral-300'
                    )}
                  >
                    <IconComponent className='h-4 w-4' aria-label={item.name} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Login Button */}
              <a
                href={env.appLoginUrl}
                className='flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors'
              >
                <LogIn className='h-4 w-4' aria-hidden='true' />
                <span>Iniciar Sesión</span>
              </a>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='md:hidden p-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center'
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {isMobileMenuOpen ? (
                <X className='h-6 w-6' aria-hidden='true' />
              ) : (
                <Menu className='h-6 w-6' aria-hidden='true' />
              )}
            </button>
          </div>
        </div>

        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isActivePage={isActivePage}
        />
      </header>
    </>
  );
};
