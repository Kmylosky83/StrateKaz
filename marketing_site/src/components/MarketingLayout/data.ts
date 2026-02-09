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
    { name: 'Sistema de Gestión', href: '/#services' },
    { name: 'Cumplimiento Normativo', href: '/#services' },
    { name: 'Innovación', href: '/#services' },
    { name: 'Nuevos Desafíos', href: '/#services' },
  ],
  clients: [
    { name: 'Empresas de Consultoría', href: '/#clients' },
    { name: 'Profesionales Independientes', href: '/#clients' },
    { name: 'Empresas Directas', href: '/#clients' },
    { name: 'Emprendedores', href: '/#clients' },
  ],
  coverage: [
    { name: 'Cúcuta', href: '/#coverage' },
    { name: 'Bogotá', href: '/#coverage' },
    { name: 'Bucaramanga', href: '/#coverage' },
  ],
  company: [
    { name: 'Términos de Servicio', href: '/terms' },
    { name: 'Política de Privacidad', href: '/privacy' },
    { name: 'Política de Cookies', href: '/cookies' },
    { name: 'Contacto', href: '/contact' },
  ],
};
