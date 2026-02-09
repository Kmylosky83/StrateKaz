import React from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  MessageCircle,
  Instagram,
  Facebook,
  Linkedin,
  Mail,
  MapPin,
} from 'lucide-react';
import { TikTokIcon } from '../icons/TikTokIcon';
import { COMPANY_INFO } from '@/config/theme.config';
import { FooterProps } from './types';
import { footerLinks } from './data';

export const Footer: React.FC<FooterProps> = ({
  showTermsModal: _showTermsModal,
  setShowTermsModal,
  showPrivacyModal: _showPrivacyModal,
  setShowPrivacyModal,
  showCookiesModal: _showCookiesModal,
  setShowCookiesModal,
}) => {
  return (
    <footer className='bg-black-deep border-t border-black-border w-full'>
      <div className='container-responsive py-8 sm:py-12'>
        {/* Mobile: Only company info and legal links */}
        <div className='sm:hidden space-y-6'>
          {/* Company Info */}
          <div>
            <div className='flex flex-col mb-4'>
              <span className='text-lg font-bold text-brand-500 font-title'>
                {COMPANY_INFO.name}
              </span>
              <span className='text-xs text-white-muted font-content -mt-1'>
                {COMPANY_INFO.tagline}
              </span>
            </div>

            <p className='text-sm text-white-muted-soft mb-6 font-content'>
              {COMPANY_INFO.description}
            </p>

            <div className='flex flex-wrap gap-3'>
              <a
                href={COMPANY_INFO.social.whatsapp}
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 bg-black-card-soft border border-black-border-soft rounded-lg flex items-center justify-center text-white-muted hover:bg-green-500/10 hover:text-green-500 transition-all duration-300'
                aria-label='WhatsApp'
              >
                <MessageCircle className='h-4 w-4' aria-hidden='true' />
              </a>
              <a
                href={COMPANY_INFO.social.instagram}
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 bg-black-card-soft border border-black-border-soft rounded-lg flex items-center justify-center text-white-muted hover:bg-brand-500/10 hover:text-brand-500 transition-all duration-300'
                aria-label='Instagram'
              >
                <Instagram className='h-4 w-4' aria-hidden='true' />
              </a>
              <a
                href={COMPANY_INFO.social.tiktok}
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 bg-black-card-soft border border-black-border-soft rounded-lg flex items-center justify-center text-white-muted hover:bg-black-800/10 hover:text-white-text transition-all duration-300'
                aria-label='TikTok'
              >
                <TikTokIcon className='h-4 w-4' aria-hidden='true' />
              </a>
            </div>
          </div>

          {/* Legal Links Only */}
          <div>
            <div className='flex flex-wrap gap-x-6 gap-y-2 text-xs text-white-muted'>
              <button
                onClick={() => setShowTermsModal(true)}
                className='hover:text-brand-500 transition-colors duration-300'
              >
                Términos
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className='hover:text-brand-500 transition-colors duration-300'
              >
                Privacidad
              </button>
              <button
                onClick={() => setShowCookiesModal(true)}
                className='hover:text-brand-500 transition-colors duration-300'
              >
                Cookies
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: Full footer */}
        <div className='hidden sm:grid sm:grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-8'>
          {/* Company Info */}
          <div className='lg:col-span-2 sm:col-span-2'>
            <div className='flex flex-col mb-4'>
              <span className='text-lg sm:text-xl font-bold text-brand-500 font-title'>
                {COMPANY_INFO.name}
              </span>
              <span className='text-xs text-white-muted font-content -mt-1'>
                {COMPANY_INFO.tagline}
              </span>
            </div>

            <p className='text-sm sm:text-base text-white-muted-soft mb-6 w-full sm:max-w-sm font-content'>
              {COMPANY_INFO.description}
            </p>

            <div className='flex flex-wrap gap-3'>
              <a
                href={COMPANY_INFO.social.whatsapp}
                target='_blank'
                rel='noopener noreferrer'
                className='w-11 h-11 bg-black-card-soft border border-black-border-soft rounded-lg flex items-center justify-center text-white-muted hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-green-500/20'
                aria-label='WhatsApp'
              >
                <MessageCircle className='h-5 w-5' aria-hidden='true' />
              </a>
              <a
                href={COMPANY_INFO.social.instagram}
                target='_blank'
                rel='noopener noreferrer'
                className='w-11 h-11 bg-black-card-soft border border-black-border-soft rounded-lg flex items-center justify-center text-white-muted hover:bg-brand-500/10 hover:text-brand-500 hover:border-brand-500/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-brand-500/20'
                aria-label='Instagram'
              >
                <Instagram className='h-5 w-5' aria-hidden='true' />
              </a>
              <a
                href={COMPANY_INFO.social.facebook}
                target='_blank'
                rel='noopener noreferrer'
                className='w-11 h-11 bg-black-card-soft border border-black-border-soft rounded-lg flex items-center justify-center text-white-muted hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20'
                aria-label='Facebook'
              >
                <Facebook className='h-5 w-5' aria-hidden='true' />
              </a>
              <a
                href={COMPANY_INFO.social.tiktok}
                target='_blank'
                rel='noopener noreferrer'
                className='w-11 h-11 bg-black-card-soft border border-black-border-soft rounded-lg flex items-center justify-center text-white-muted hover:bg-white/10 hover:text-white hover:border-white/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/20'
                aria-label='TikTok'
              >
                <TikTokIcon className='h-5 w-5' aria-hidden='true' />
              </a>
              <a
                href={COMPANY_INFO.social.linkedin}
                target='_blank'
                rel='noopener noreferrer'
                className='w-11 h-11 bg-black-card-soft border border-black-border-soft rounded-lg flex items-center justify-center text-white-muted hover:bg-blue-600/10 hover:text-blue-600 hover:border-blue-600/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-600/20'
                aria-label='LinkedIn'
              >
                <Linkedin className='h-5 w-5' aria-hidden='true' />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          <div>
            <h3 className='text-sm font-semibold text-white-text uppercase tracking-wide mb-4 font-title'>
              Servicios
            </h3>
            <ul className='space-y-3'>
              {footerLinks.services.map(link => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className='text-white-muted-soft hover:text-brand-500 transition-all duration-300 font-content text-sm hover:translate-x-1 inline-block'
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-white-text uppercase tracking-wide mb-4 font-title'>
              Clientes
            </h3>
            <ul className='space-y-3'>
              {footerLinks.clients.map(link => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className='text-white-muted-soft hover:text-brand-500 transition-all duration-300 font-content text-sm hover:translate-x-1 inline-block'
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-white-text uppercase tracking-wide mb-4 font-title'>
              Cobertura
            </h3>
            <ul className='space-y-3'>
              {footerLinks.coverage.map(link => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className='text-white-muted-soft hover:text-brand-500 transition-all duration-300 font-content text-sm hover:translate-x-1 inline-block'
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-white-text uppercase tracking-wide mb-4 font-title'>
              Empresa
            </h3>
            <ul className='space-y-3'>
              {footerLinks.company.map(link => (
                <li key={link.name}>
                  {link.name === 'Términos de Servicio' ? (
                    <button
                      onClick={() => setShowTermsModal(true)}
                      className='text-white-muted-soft hover:text-brand-500 transition-all duration-300 font-content text-sm hover:translate-x-1 block text-left w-full'
                    >
                      {link.name}
                    </button>
                  ) : link.name === 'Política de Privacidad' ? (
                    <button
                      onClick={() => setShowPrivacyModal(true)}
                      className='text-white-muted-soft hover:text-brand-500 transition-all duration-300 font-content text-sm hover:translate-x-1 block text-left w-full'
                    >
                      {link.name}
                    </button>
                  ) : link.name === 'Política de Cookies' ? (
                    <button
                      onClick={() => setShowCookiesModal(true)}
                      className='text-white-muted-soft hover:text-brand-500 transition-all duration-300 font-content text-sm hover:translate-x-1 block text-left w-full'
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link
                      to={link.href}
                      className='text-white-muted-soft hover:text-brand-500 transition-all duration-300 font-content text-sm hover:translate-x-1 inline-block'
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className='mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-black-border-soft'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
            <div className='group flex items-center space-x-3 p-4 sm:p-6 bg-black-card-soft rounded-lg border border-black-border-soft hover:border-brand-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/20'>
              <div className='w-11 h-11 bg-black-hover rounded-lg flex items-center justify-center group-hover:bg-brand-500/10 transition-all duration-300 flex-shrink-0'>
                <Mail
                  className='h-5 w-5 text-brand-500'
                  aria-label='Icono de correo electrónico'
                />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='text-sm font-medium text-white-text font-title'>
                  Escríbenos
                </div>
                <a
                  href={`mailto:${COMPANY_INFO.email}`}
                  className='text-white-muted-soft hover:text-brand-500 transition-all duration-300 font-content text-sm block truncate'
                >
                  {COMPANY_INFO.email}
                </a>
              </div>
            </div>

            <div className='group flex items-center space-x-3 p-4 sm:p-6 bg-black-card-soft rounded-lg border border-black-border-soft hover:border-brand-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/20'>
              <div className='w-11 h-11 bg-black-hover rounded-lg flex items-center justify-center group-hover:bg-brand-500/10 transition-all duration-300 flex-shrink-0'>
                <MessageCircle
                  className='h-5 w-5 text-brand-500'
                  aria-label='Icono de WhatsApp'
                />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='text-sm font-medium text-white-text font-title'>
                  WhatsApp
                </div>
                <a
                  href={COMPANY_INFO.phoneHref}
                  className='text-white-muted-soft hover:text-brand-500 transition-all duration-300 font-content text-sm'
                >
                  {COMPANY_INFO.phone}
                </a>
              </div>
            </div>

            <div className='group flex items-center space-x-3 p-4 sm:p-6 bg-black-card-soft rounded-lg border border-black-border-soft hover:border-brand-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/20 sm:col-span-2 lg:col-span-1'>
              <div className='w-11 h-11 bg-black-hover rounded-lg flex items-center justify-center group-hover:bg-brand-500/10 transition-all duration-300 flex-shrink-0'>
                <MapPin
                  className='h-5 w-5 text-brand-500'
                  aria-label='Icono de ubicación'
                />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='text-sm font-medium text-white-text font-title'>
                  Impactando en
                </div>
                <div className='text-white-muted-soft font-content text-sm'>
                  {COMPANY_INFO.location}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-black-border-soft flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
          <div className='text-white-muted-soft text-xs sm:text-sm font-content text-center md:text-left'>
            © {COMPANY_INFO.year} {COMPANY_INFO.name} | {COMPANY_INFO.brand} |
            Todos los derechos reservados.
          </div>

          <div className='flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6'>
            <div className='flex items-center space-x-2 text-sm text-white-muted-soft font-content group hover:text-brand-500 transition-all duration-300 cursor-pointer'>
              <Globe
                className='h-4 w-4 group-hover:rotate-12 transition-all duration-300'
                aria-hidden='true'
              />
              <span>Español</span>
            </div>

            <div className='text-sm text-white-muted-soft font-content flex items-center space-x-2'>
              <div className='w-2 h-2 bg-brand-500 rounded-full animate-pulse' />
              <span className='text-center'>{COMPANY_INFO.slogan}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
