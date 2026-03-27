import { DollarSign, MessageCircle, BookOpen } from 'lucide-react';
import { NavigationItem, FooterLinks } from './types';

export const navigationItems: NavigationItem[] = [
  {
    name: 'Recursos',
    href: '/recursos',
    icon: BookOpen,
  },
  {
    name: 'Precios',
    href: '/precios',
    icon: DollarSign,
  },
  {
    name: 'Contacto',
    href: '/contacto',
    icon: MessageCircle,
  },
];

export const userMenuItems: NavigationItem[] = [];

export const footerLinks: FooterLinks = {
  services: [
    { name: 'Seguridad y Salud en el Trabajo', href: '/#services' },
    { name: 'Talento Humano', href: '/#services' },
    { name: 'PESV | Seguridad Vial', href: '/#services' },
    { name: 'Certificaciones ISO', href: '/#services' },
    { name: 'Firma Digital', href: '/#services' },
  ],
  clients: [
    { name: 'Empresas de Consultoría', href: '/#clients' },
    { name: 'Industria y Manufactura', href: '/#clients' },
    { name: 'Transporte y Logística', href: '/#clients' },
    { name: 'Empresas de Servicios', href: '/#clients' },
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
    { name: 'Contacto', href: '/contacto' },
  ],
};
