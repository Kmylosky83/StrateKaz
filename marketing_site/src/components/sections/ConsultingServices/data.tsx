import {
  TrendingUp,
  Shield,
  Users,
  Award,
  Building,
  Crown,
  Car,
  Rocket,
} from 'lucide-react';
import {
  ServicePackage,
  UserProfile,
  FAQCategory,
  ColorClasses,
} from './types';

export const servicePackages: ServicePackage[] = [
  {
    id: 'iso-management',
    title: 'Sistemas Integrados de Gestión ISO',
    description: 'Implementación completa de ISO 9001, 14001, 45001, 27001',
    timeline: '4-12 meses',
    investment: 'Desde $150 USD',
    icon: <Award className='h-8 w-8' aria-hidden='true' />,
    color: 'blue',
    popular: true,
    includes: [
      'Diagnóstico y evaluación inicial',
      'Diseño de documentación completa',
      'Capacitación de equipos internos',
      'Auditorías internas preparatorias',
      'Acompañamiento hasta certificación',
      'Plataforma de Gestión Integral GRATIS',
    ],
    deliverables: [
      'Manual de calidad integrado',
      'Procedimientos y formatos',
      'Plan de implementación',
      'Programa de auditorías internas',
      'Plataforma configurada y personalizada',
    ],
    industries: [
      'Manufactura',
      'Servicios',
      'Construcción',
      'Alimentos',
      'Salud',
    ],
  },
  {
    id: 'sst-colombia',
    title: 'Seguridad y Salud en el Trabajo',
    description: 'Cumplimiento normativo SST según legislación colombiana',
    timeline: '4-12 meses',
    investment: 'Desde $130 USD',
    icon: <Shield className='h-8 w-8' aria-hidden='true' />,
    color: 'yellow',
    includes: [
      'Matriz de identificación de peligros',
      'Programa de capacitaciones SST',
      'Procedimientos de emergencia',
      'Indicadores y seguimiento',
      'Plan de trabajo anual SST',
      'Plataforma de Gestión Integral GRATIS',
    ],
    deliverables: [
      'SG-SST completo y documentado',
      'Matriz IPER actualizada',
      'Plan de emergencias',
      'Cronograma de capacitaciones',
      'Plataforma configurada para SST',
    ],
    industries: [
      'Construcción',
      'Manufactura',
      'Servicios',
      'Minería',
      'Transporte',
    ],
  },
  {
    id: 'pesv',
    title: 'Plan Estratégico de Seguridad Vial',
    description: 'PESV completo según Resolución 40595 de 2022',
    timeline: '4-12 meses',
    investment: 'Desde $130 USD',
    icon: <Car className='h-8 w-8' aria-hidden='true' />,
    color: 'red',
    includes: [
      'Diagnóstico inicial de riesgos viales',
      'Plan estratégico documentado',
      'Capacitaciones especializadas',
      'Indicadores de gestión vial',
      'Seguimiento y mejora continua',
      'Plataforma de Gestión Integral GRATIS',
    ],
    deliverables: [
      'PESV completo y aprobado',
      'Matriz de riesgos viales',
      'Plan de capacitaciones',
      'Sistema de indicadores',
      'Plataforma para gestión PESV',
    ],
    industries: [
      'Transporte',
      'Logística',
      'Servicios',
      'Construcción',
      'Comercio',
    ],
  },
  {
    id: 'digital-transformation',
    title: 'Transformación Digital y BI',
    description: 'Digitalización de procesos y Business Intelligence',
    timeline: '6-18 meses',
    investment: 'Desde $200 USD',
    icon: <TrendingUp className='h-8 w-8' aria-hidden='true' />,
    color: 'orange',
    includes: [
      'Diagnóstico de madurez digital',
      'Roadmap de transformación',
      'Implementación de BI',
      'Automatización de procesos',
      'Desarrollo de aplicativos',
      'Plataforma de Gestión Integral GRATIS',
    ],
    deliverables: [
      'Plan de transformación digital',
      'Dashboards de BI configurados',
      'Procesos automatizados',
      'Aplicativos desarrollados',
      'Plataforma BPM completa',
    ],
    industries: [
      'Finanzas',
      'Retail',
      'Manufactura',
      'Servicios',
      'Tecnología',
    ],
  },
];

export const userProfiles: UserProfile[] = [
  {
    id: 'consulting-firms',
    title: 'Empresas Consultoras',
    description: 'Plataforma de Gestión Integral para gestionar múltiples clientes y proyectos',
    icon: <Building className='h-6 w-6' aria-hidden='true' />,
    color: 'blue',
    benefits: [
      'Gestión de múltiples empresas cliente',
      'Plantillas predefinidas por industria',
      'Reportes automáticos de avance',
      'Portal de clientes personalizado',
      'Integración con herramientas de proyecto',
    ],
    useCases: [
      'Consultoría ISO',
      'Asesoría en SST',
      'Implementación PESV',
      'Servicios de auditoría',
    ],
  },
  {
    id: 'direct-companies',
    title: 'Empresas Directas',
    description:
      'Automatización de sistemas de gestión sin consultoría externa',
    icon: <Users className='h-6 w-6' aria-hidden='true' />,
    color: 'yellow',
    benefits: [
      'Automatizaciones predefinidas',
      'Workflows específicos por norma',
      'Indicadores en tiempo real',
      'Alertas y notificaciones',
      'Soporte técnico incluido',
    ],
    useCases: [
      'Gestión ISO interna',
      'Seguimiento SST',
      'Control PESV',
      'Mejora continua',
    ],
  },
  {
    id: 'independent-professionals',
    title: 'Profesionales Independientes',
    description: 'Herramientas para consultores y auditores independientes',
    icon: <Crown className='h-6 w-6' aria-hidden='true' />,
    color: 'green',
    benefits: [
      'Gestión de cartera de clientes',
      'Plantillas personalizables',
      'Reportes profesionales',
      'Seguimiento de proyectos',
      'Facturación integrada',
    ],
    useCases: [
      'Consultoría independiente',
      'Auditorías internas',
      'Capacitaciones',
      'Asesorías especializadas',
    ],
  },
  {
    id: 'entrepreneurs',
    title: 'Emprendedores',
    description: 'Soluciones completas incluyendo desarrollo de apps',
    icon: <Rocket className='h-6 w-6' aria-hidden='true' />,
    color: 'purple',
    benefits: [
      'Desarrollo de aplicativos',
      'Soluciones móviles',
      'Integración con e-commerce',
      'Automatización de ventas',
      'Escalabilidad garantizada',
    ],
    useCases: [
      'Apps móviles',
      'Plataformas web',
      'E-commerce',
      'Sistemas de gestión',
    ],
  },
];

export const faqs: FAQCategory[] = [
  {
    category: 'Servicios de Consultoría',
    items: [
      {
        question: '¿Qué incluye exactamente la Plataforma de Gestión Integral gratuita?',
        answer:
          'Nuestra Plataforma de Gestión Integral incluye gestión completa de documentos, workflows automatizados, tableros de control, reportes en tiempo real, y todas las funcionalidades necesarias para gestionar sistemas ISO, SST y PESV, así como para optimizar sus procesos sin tener que pensar en certificaciones que mantener a largo tiempo.',
      },
      {
        question: '¿Cuánto tiempo toma una implementación ISO completa?',
        answer:
          'Depende del alcance y complejidad de la organización. ISO 9001 típicamente toma 4-6 meses, mientras que sistemas integrados (9001+14001+45001) pueden tomar 8-12 meses. Incluimos acompañamiento hasta la certificación exitosa.',
      },
      {
        question: '¿Ofrecen garantía de certificación?',
        answer:
          'Sí, garantizamos el éxito en la certificación siguiendo nuestro metodología probada. En caso de no aprobación en la primera auditoría, continuamos el acompañamiento sin costo adicional hasta lograr la certificación.',
      },
      {
        question:
          '¿Es posible organizar mi empresa sin buscar certificaciones?',
        answer:
          'Absolutamente. Nuestra plataforma está diseñada precisamente para eso: optimizar y organizar sus procesos operativos, eliminar tareas repetitivas mediante automatización, y mejorar el seguimiento y control de todas sus actividades empresariales, independientemente de si busca certificaciones o no.',
      },
    ],
  },
  {
    category: 'Plataforma de Gestión Integral',
    items: [
      {
        question: '¿Puedo usar la plataforma sin contratar consultoría?',
        answer:
          'Sí, nuestra Plataforma de Gestión Integral funciona como SaaS (Software as a Service) con licencias independientes. Los valores se calculan por planes según la cantidad de integrantes de su organización, ofreciendo escalabilidad desde pequeñas empresas hasta corporaciones.',
      },
      {
        question: '¿La plataforma funciona en la nube o on-premise?',
        answer:
          'Ofrecemos ambas modalidades. La versión cloud es inmediata y escalable, mientras que la versión on-premise es ideal para empresas con requerimientos específicos de seguridad y control de datos.',
      },
      {
        question: '¿Qué soporte técnico incluye?',
        answer:
          'Todos los planes incluyen soporte técnico vía email y chat. Los planes Enterprise incluyen soporte telefónico 24/7 y asignación de account manager dedicado.',
      },
    ],
  },
  {
    category: 'Inversión y ROI',
    items: [
      {
        question: '¿Cómo calculan el ROI de sus servicios?',
        answer:
          'Medimos ROI considerando reducción de tiempos de proceso (40-60%), disminución de no conformidades (70-85%), ahorro en multas y sanciones, y mejora en eficiencia operacional. El promedio de nuestros clientes ve ROI positivo en 6-8 meses.',
      },
      {
        question: '¿Ofrecen planes de financiamiento?',
        answer:
          'Sí, trabajamos con diferentes modalidades de pago: pago contra entregables, financiamiento directo hasta 24 meses, y esquemas de pago por resultados para proyectos grandes.',
      },
    ],
  },
];

export const getColorClasses = (color: string): ColorClasses => {
  switch (color) {
    case 'blue':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500/30',
        ring: 'ring-blue-500/30',
        hoverBorder: 'hover:border-blue-500/50',
        hoverShadow: 'hover:shadow-blue-500/20',
        badge: 'bg-blue-500',
        button: 'bg-blue-500',
        buttonHover: 'bg-blue-600',
      };
    case 'yellow':
      return {
        bg: 'bg-system-yellow-500/10',
        text: 'text-system-yellow-500',
        border: 'border-system-yellow-500/30',
        ring: 'ring-system-yellow-500/30',
        hoverBorder: 'hover:border-system-yellow-500/50',
        hoverShadow: 'hover:shadow-system-yellow-500/20',
        badge: 'bg-system-yellow-500',
        button: 'bg-system-yellow-500',
        buttonHover: 'bg-system-yellow-600',
      };
    case 'red':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        border: 'border-red-500/30',
        ring: 'ring-red-500/30',
        hoverBorder: 'hover:border-red-500/50',
        hoverShadow: 'hover:shadow-red-500/20',
        badge: 'bg-red-500',
        button: 'bg-red-500',
        buttonHover: 'bg-red-600',
      };
    case 'orange':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-500',
        border: 'border-orange-500/30',
        ring: 'ring-orange-500/30',
        hoverBorder: 'hover:border-orange-500/50',
        hoverShadow: 'hover:shadow-orange-500/20',
        badge: 'bg-orange-500',
        button: 'bg-orange-500',
        buttonHover: 'bg-orange-600',
      };
    case 'green':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-500',
        border: 'border-green-500/30',
        ring: 'ring-green-500/30',
        hoverBorder: 'hover:border-green-500/50',
        hoverShadow: 'hover:shadow-green-500/20',
        badge: 'bg-green-500',
        button: 'bg-green-500',
        buttonHover: 'bg-green-600',
      };
    case 'purple':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-500',
        border: 'border-purple-500/30',
        ring: 'ring-purple-500/30',
        hoverBorder: 'hover:border-purple-500/50',
        hoverShadow: 'hover:shadow-purple-500/20',
        badge: 'bg-purple-500',
        button: 'bg-purple-500',
        buttonHover: 'bg-purple-600',
      };
    default:
      return {
        bg: 'bg-brand-500/10',
        text: 'text-brand-500',
        border: 'border-brand-500/30',
        ring: 'ring-brand-500/30',
        hoverBorder: 'hover:border-brand-500/50',
        hoverShadow: 'hover:shadow-brand-500/20',
        badge: 'bg-brand-500',
        button: 'bg-brand-500',
        buttonHover: 'bg-brand-600',
      };
  }
};
