import {
  AlertTriangle,
  Star,
  Users,
  Shield,
  Award,
  Lightbulb,
  Rocket,
  Calendar,
  Trophy,
  Zap,
  Settings,
  Navigation,
  Activity,
} from 'lucide-react';

export const HERO_CONTENT = {
  socialProof: {
    text: 'Gestión Empresarial de Alto Impacto',
    icon: Award,
  },
  headline: {
    main: 'Consultoría',
    highlight: 'Estratégica',
    continuation: 'para la gestión',
    dynamicWords: ['De Calidad', 'Ambiental', 'De SST', 'Del PESV'],
    structure: {
      lineBreakAfterBPM: true,
      lineBreakBeforeDynamic: true,
    },
  },
  description:
    'Diseñamos sistemas de gestión eficientes y escalables, potenciados por nuestra propia Plataforma de Gestión Integral para garantizar resultados sostenibles.',
  keyBenefits: [
    { text: 'Sistemas de Gestión', icon: Award, color: 'text-system-blue-500' },
    {
      text: 'Cumplimiento Normativo',
      icon: AlertTriangle,
      color: 'text-system-red-500',
    },
    { text: 'Innovación', icon: Lightbulb, color: 'text-system-orange-500' },
    { text: 'Nuevos Desafíos', icon: Rocket, color: 'text-system-purple-500' },
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
      text: '20+',
      label: 'Certificaciones ISO',
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
    highlight: 'Garantizada',
    description: 'Sistemas inteligentes que evolucionan con tu empresa',
    icon: Zap,
  },
  dashboardStats: [
    { value: '98%', label: 'Cumplimiento' },
    { value: '15x', label: 'Más Eficiente' },
  ],
  managementSystems: [
    {
      category: 'Gestión ISO',
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
          name: 'ISO 14001',
          description: 'Medio Ambiente',
          target: 88,
          current: 0,
          color: 'green',
          icon: Shield,
          status: 'active',
        },
        {
          name: 'ISO 45001',
          description: 'Seguridad',
          target: 92,
          current: 0,
          color: 'red',
          icon: AlertTriangle,
          status: 'active',
        },
        {
          name: 'ISO 27001',
          description: 'Info Security',
          target: 89,
          current: 0,
          color: 'purple',
          icon: Settings,
          status: 'active',
        },
      ],
    },
    {
      category: 'Sistemas Especializados',
      systems: [
        {
          name: 'SST',
          description: 'Seguridad y Salud en el Trabajo',
          target: 85,
          current: 0,
          color: 'orange',
          icon: Activity,
          status: 'in_progress',
        },
        {
          name: 'PESV',
          description: 'Plan Estratégico de Seguridad Vial',
          target: 78,
          current: 0,
          color: 'purple',
          icon: Navigation,
          status: 'planning',
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
      text: 'Gestión Empresarial de Alto Impacto',
      icon: Award,
      position: '-top-6 -right-6',
      style:
        'bg-black-card border border-black-border p-4 rounded-xl shadow-lg hover:scale-105 transition-all duration-300',
      textStyle: 'text-xs font-medium text-white-muted',
    },
    bottomBadge: {
      baseText: 'Auditoría',
      dynamicWords: [
        'Activa',
        'Riesgos y Oportunidades',
        'Indicadores',
        'Matriz Legal',
        'Acciones de Mejora',
        'Gestión del Cambio',
      ],
      position: '-bottom-4 -left-4',
      style:
        'bg-white border border-system-red-500 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow animate-border-glow',
      textStyle: 'text-sm font-medium text-system-red-600',
    },
  },
};
