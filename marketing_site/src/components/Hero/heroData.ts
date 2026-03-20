import {
  AlertTriangle,
  Star,
  Users,
  Shield,
  Award,
  Calendar,
  Trophy,
  Zap,
  Settings,
  Activity,
  Boxes,
  FileSignature,
  BarChart3,
  Truck,
} from 'lucide-react';

export const HERO_CONTENT = {
  socialProof: {
    text: 'Plataforma de Gestión Empresarial 360°',
    icon: Award,
  },
  headline: {
    main: 'Consultoría',
    highlight: 'Estratégica',
    continuation: '+ Plataforma',
    dynamicWords: [
      'de Gestión 360°',
      'ISO Multi-Norma',
      'ERP Integrado',
      'GRC & Compliance',
      'de Firma Digital',
      'HSEQ Inteligente',
    ],
    structure: {
      lineBreakAfterBPM: true,
      lineBreakBeforeDynamic: true,
    },
  },
  description:
    'Consultoría 4.0 respaldada por una plataforma con 84+ módulos integrados: SGI, ERP, GRC, HSEQ, Talento Humano, Firma Digital y Business Intelligence en un solo ecosistema.',
  keyBenefits: [
    {
      text: 'ISO Multi-Norma',
      icon: Award,
      color: 'text-system-blue-500',
    },
    {
      text: 'GRC & Debida Diligencia',
      icon: Shield,
      color: 'text-system-red-500',
    },
    {
      text: 'ERP & Cadena de Valor',
      icon: Boxes,
      color: 'text-system-orange-500',
    },
    {
      text: 'Firma Digital SHA-256',
      icon: FileSignature,
      color: 'text-system-purple-500',
    },
  ],
  trustIndicators: {
    companies: {
      text: '30+',
      label: 'Empresas',
      icon: Users,
      color: 'text-system-blue-500',
    },
    experience: {
      text: '20+',
      label: 'Años de Experiencia',
      icon: Calendar,
      color: 'text-system-yellow-500',
    },
    certifications: {
      text: '84+',
      label: 'Módulos Integrados',
      icon: Trophy,
      color: 'text-system-orange-500',
    },
    rating: {
      text: '4.9/5',
      label: 'Satisfacción Cliente',
      icon: Star,
      color: 'text-brand-500',
    },
  },
  riskReversal: {
    main: 'Transformación Digital',
    highlight: '360°',
    description:
      'SGI + ERP + GRC + HSEQ + BI — todo integrado, todo en uno',
    icon: Zap,
  },
  dashboardStats: [
    { value: '98%', label: 'Cumplimiento' },
    { value: '84+', label: 'Módulos' },
  ],
  managementSystems: [
    {
      category: 'Gobierno & Cumplimiento',
      systems: [
        {
          name: 'ISO 9001',
          description: 'Calidad',
          target: 95,
          current: 0,
          color: 'blue',
          icon: Award,
          status: 'active',
        },
        {
          name: 'ISO 45001',
          description: 'SST',
          target: 92,
          current: 0,
          color: 'red',
          icon: AlertTriangle,
          status: 'active',
        },
        {
          name: 'SAGRILAFT',
          description: 'Debida Diligencia',
          target: 89,
          current: 0,
          color: 'purple',
          icon: Shield,
          status: 'active',
        },
        {
          name: 'Firma Digital',
          description: 'SHA-256',
          target: 96,
          current: 0,
          color: 'green',
          icon: FileSignature,
          status: 'active',
        },
      ],
    },
    {
      category: 'Operaciones & ERP',
      systems: [
        {
          name: 'Supply Chain',
          description: 'Cadena de Valor',
          target: 85,
          current: 0,
          color: 'orange',
          icon: Truck,
          status: 'active',
        },
        {
          name: 'Producción',
          description: 'Production Ops',
          target: 88,
          current: 0,
          color: 'blue',
          icon: Activity,
          status: 'active',
        },
        {
          name: 'Logística',
          description: 'Fleet & Transport',
          target: 82,
          current: 0,
          color: 'green',
          icon: Settings,
          status: 'in_progress',
        },
        {
          name: 'Analytics',
          description: 'BI & Dashboards',
          target: 91,
          current: 0,
          color: 'purple',
          icon: BarChart3,
          status: 'active',
        },
      ],
    },
  ],
  layout: {
    headlineContainer:
      'min-h-[6rem] sm:min-h-[8rem] lg:min-h-[10rem] flex items-start',
  },
  floatingElements: {
    topBadge: {
      text: 'Plataforma de Gestión Empresarial 360°',
      icon: Award,
      position: '-top-6 -right-6',
      style:
        'bg-black-card border border-black-border p-4 rounded-xl shadow-lg hover:scale-105 transition-all duration-300',
      textStyle: 'text-xs font-medium text-white-muted',
    },
    bottomBadge: {
      baseText: 'Módulo',
      dynamicWords: [
        'Supply Chain',
        'Firma Digital',
        'SAGRILAFT',
        'HSEQ',
        'Talento Humano',
        'Analytics & BI',
      ],
      position: '-bottom-4 -left-4',
      style:
        'bg-white border border-system-red-500 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow animate-border-glow',
      textStyle: 'text-sm font-medium text-system-red-600',
    },
  },
};
