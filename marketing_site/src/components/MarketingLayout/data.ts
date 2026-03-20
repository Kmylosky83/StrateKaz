import { DollarSign, MessageCircle } from 'lucide-react';
import { NavigationItem, FooterLinks } from './types';

export const navigationItems: NavigationItem[] = [
  {
    name: 'Precios',
    href: '/pricing',
    icon: DollarSign,
  },
  {
    name: 'Contacto',
    href: '/contact',
    icon: MessageCircle,
  },
];

export const userMenuItems: NavigationItem[] = [];

export const footerLinks: FooterLinks = {
  services: [
    { name: 'Consultoría 4.0', href: '/#services' },
    { name: 'Plataforma SGI 360°', href: '/#services' },
    { name: 'Certificaciones ISO', href: '/#services' },
    { name: 'Firma Digital', href: '/#services' },
    { name: 'SAGRILAFT', href: '/#services' },
  ],
  clients: [
    { name: 'Empresas de Consultoría', href: '/#clients' },
    { name: 'Industria & Manufactura', href: '/#clients' },
    { name: 'Empresas de Servicios', href: '/#clients' },
    { name: 'Sector Público', href: '/#clients' },
  ],
  coverage: [
    { name: 'Cúcuta', href: '/#coverage' },
    { name: 'Bogotá', href: '/#coverage' },
    { name: 'Bucaramanga', href: '/#coverage' },
    { name: 'Tibú', href: '/#coverage' },
    { name: 'Mocoa', href: '/#coverage' },
  ],
  company: [
    { name: 'Términos de Servicio', href: '/terms' },
    { name: 'Política de Privacidad', href: '/privacy' },
    { name: 'Política de Cookies', href: '/cookies' },
    { name: 'Contacto', href: '/contact' },
  ],
};
