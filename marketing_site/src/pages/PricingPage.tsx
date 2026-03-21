import React from 'react';
import { Card } from '@components/ui/card';
import {
  CheckCircle,
  Calculator,
  TrendingUp,
  Shield,
  Users,
  Zap,
  Globe,
  Award,
  DollarSign,
  Building,
  Crown,
  ChevronDown,
  HelpCircle,
  Car,
  Rocket,
  Settings,
  Bot,
  ShieldCheck,
  BarChart3,
  Target,
  Brain,
  Workflow,
  Lock,
  Sparkles,
} from 'lucide-react';

interface ServicePackage {
  id: string;
  title: string;
  description: string;
  timeline: string;
  investment: string;
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
  includes: string[];
  deliverables: string[];
  industries: string[];
}

interface UserProfile {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
  useCases: string[];
}

const servicePackages: ServicePackage[] = [
  {
    id: 'iso-management',
    title: 'Sistemas Integrados de Gestión ISO',
    description: 'Implementación completa de ISO 9001, 14001, 45001, 27001',
    timeline: '4-12 meses',
    investment: 'Por cotización',
    icon: <Award className='h-8 w-8' />,
    color: 'blue',
    popular: true,
    includes: [
      'Diagnóstico y evaluación inicial',
      'Diseño de documentación completa',
      'Capacitación de equipos internos',
      'Auditorías internas preparatorias',
      'Acompañamiento hasta certificación',
      'Plataforma de Gestión 360° incluida',
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
    investment: 'Por cotización',
    icon: <Shield className='h-8 w-8' />,
    color: 'yellow',
    includes: [
      'Matriz de identificación de peligros',
      'Programa de capacitaciones SST',
      'Procedimientos de emergencia',
      'Indicadores y seguimiento',
      'Plan de trabajo anual SST',
      'Plataforma de Gestión 360° incluida',
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
    investment: 'Por cotización',
    icon: <Car className='h-8 w-8' />,
    color: 'red',
    includes: [
      'Diagnóstico inicial de riesgos viales',
      'Plan estratégico documentado',
      'Capacitaciones especializadas',
      'Indicadores de gestión vial',
      'Seguimiento y mejora continua',
      'Plataforma de Gestión 360° incluida',
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
    investment: 'Por cotización',
    icon: <TrendingUp className='h-8 w-8' />,
    color: 'orange',
    includes: [
      'Diagnóstico de madurez digital',
      'Roadmap de transformación',
      'Implementación de BI',
      'Automatización de procesos',
      'Desarrollo de aplicativos',
      'Plataforma de Gestión 360° incluida',
    ],
    deliverables: [
      'Plan de transformación digital',
      'Dashboards de BI configurados',
      'Procesos automatizados',
      'Aplicativos desarrollados',
      'Plataforma de Gestión completa',
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

const userProfiles: UserProfile[] = [
  {
    id: 'consulting-firms',
    title: 'Empresas Consultoras',
    description: 'Plataforma de Gestión Integral para gestionar múltiples clientes y proyectos',
    icon: <Building className='h-6 w-6' />,
    color: 'blue',
    benefits: [
      'Gestión de múltiples empresas cliente',
      'Plantillas predefinidas por industria',
      'Reportes automáticos de avance',
      'Portal de clientes personalizado',
      'Workflows y firma digital integrados',
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
    icon: <Users className='h-6 w-6' />,
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
    icon: <Crown className='h-6 w-6' />,
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
    id: 'transport-logistics',
    title: 'Transporte y Logística',
    description: 'Gestión integral de flotas, PESV y cadena de suministro',
    icon: <Rocket className='h-6 w-6' />,
    color: 'purple',
    benefits: [
      'Gestión de flota vehicular',
      'PESV según Resolución 40595',
      'Control de rutas y despachos',
      'Mantenimiento preventivo',
      'Indicadores de seguridad vial',
    ],
    useCases: [
      'Empresas de transporte',
      'Operadores logísticos',
      'Distribuidoras',
      'Flotas corporativas',
    ],
  },
];

const faqCategories = [
  {
    id: 'consultoria',
    title: 'Servicios de Consultoría',
    color: 'brand',
    icon: Building,
  },
  {
    id: 'plataforma',
    title: 'Plataforma y Tecnología',
    color: 'blue',
    icon: Settings,
  },
  {
    id: 'precios',
    title: 'Precios y Planes',
    color: 'green',
    icon: DollarSign,
  },
] as const;

const faqs = [
  {
    category: 'Servicios de Consultoría',
    items: [
      {
        question: '¿Qué incluye la Plataforma de Gestión 360° con la consultoría?',
        answer:
          'Al contratar consultoría, la Plataforma de Gestión 360° viene incluida con acceso completo a los módulos relevantes: gestión documental, workflows automatizados, tableros de control, reportes en tiempo real, firma digital SHA-256 y todas las funcionalidades necesarias para gestionar sistemas ISO, SST, PESV y más. También puede adquirirse como SaaS independiente.',
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
    category: 'Plataforma y Tecnología',
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
      {
        question: '¿La plataforma se integra con otros sistemas?',
        answer:
          'Nuestra plataforma es un ecosistema completo con 84+ módulos que cubren SGI, ERP, GRC, HSEQ, Talento Humano y BI. Al integrar todo en una sola plataforma, eliminamos la necesidad de conectar múltiples herramientas externas. Además, contamos con API REST documentada para integraciones específicas según las necesidades de cada cliente.',
      },
      {
        question: '¿Qué nivel de personalización permite?',
        answer:
          'La plataforma es altamente configurable: workflows personalizados, campos customizados, reportes a medida, dashboard personalizados, y branding corporativo. Para necesidades muy específicas, ofrecemos desarrollo de módulos adicionales.',
      },
      {
        question: '¿Cómo garantizan la seguridad de los datos?',
        answer:
          'Implementamos metodologías basadas en ISO 27001, cifrado de datos, autenticación JWT con 2FA, respaldos automáticos diarios, firma digital SHA-256 y arquitectura multi-tenant con aislamiento por schema. La plataforma cuenta con RBAC granular, auditoría completa de acciones y monitoreo con Sentry.',
      },
    ],
  },
  {
    category: 'Precios y Planes',
    items: [
      {
        question: '¿Cómo calculan el ROI de sus servicios?',
        answer:
          'Medimos ROI considerando reducción de tiempos de proceso (40-60%), disminución de no conformidades (70-85%), ahorro en multas y sanciones, y mejora en eficiencia operacional. El promedio de nuestros clientes ve ROI positivo en 6-8 meses.',
      },
      {
        question: '¿Ofrecen planes de financiamiento?',
        answer:
          'Tenemos modalidades flexibles de pago adaptadas a cada servicio: nuestra plataforma SaaS funciona bajo demanda con facturación mensual, las consultorías se cobran mes vencido una vez contratadas, y para proyectos especiales manejamos un esquema de 50% inicial y el resto contra entregables específicos.',
      },
      {
        question: '¿Qué incluye exactamente cada paquete de precios?',
        answer:
          'Cada paquete incluye consultoría especializada, documentación completa, capacitación de equipos, Plataforma de Gestión 360° incluida, y acompañamiento hasta lograr los objetivos. Los precios se calculan por cotización según el alcance, nivel de riesgo, número de trabajadores y complejidad del proyecto.',
      },
      {
        question: '¿Hay costos ocultos o adicionales?',
        answer:
          'No. Nuestros precios son transparentes e incluyen todo lo necesario para el éxito del proyecto. Los únicos costos adicionales serían modificaciones de alcance solicitadas por el cliente o certificaciones externas opcionales con organismos certificadores.',
      },
      {
        question: '¿Ofrecen descuentos por múltiples servicios?',
        answer:
          'Absolutamente. Todos nuestros precios y descuentos son bajo negociación según el alcance del proyecto. Evaluamos cada caso de manera personalizada para ofrecer la mejor propuesta económica que se ajuste a sus necesidades y presupuesto.',
      },
      {
        question: '¿Cuándo empiezo a ver resultados de mi inversión?',
        answer:
          'Los primeros resultados se ven entre 30-60 días (optimización de procesos inmediatos), el ROI positivo típicamente en 6-8 meses, y el impacto completo del proyecto se materializa en 12-18 meses con beneficios sostenidos a largo plazo.',
      },
    ],
  },
];

const getColorClasses = (color: string) => {
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
      };
  }
};

const navigationButtons = [
  {
    id: 'overview',
    title: 'Servicios',
    icon: Building,
    color: 'brand',
    description: 'Paquetes de consultoría',
  },
  {
    id: 'profiles',
    title: 'Perfiles de Usuario',
    icon: Users,
    color: 'blue',
    description: 'Tipos de clientes',
  },
  {
    id: 'calculator',
    title: 'Calculadora ROI',
    icon: Calculator,
    color: 'green',
    description: 'Retorno de inversión',
  },
  {
    id: 'faq',
    title: 'Preguntas',
    icon: HelpCircle,
    color: 'purple',
    description: 'Dudas frecuentes',
  },
] as const;

type TabType = 'overview' | 'calculator' | 'profiles' | 'faq';

// Inspirational quotes with icons and colors from design system
interface InspirationalQuoteData {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  glowColor: string;
}

const inspirationalQuotes: InspirationalQuoteData[] = [
  {
    text: 'La automatización no es el futuro, es el presente de la gestión empresarial exitosa',
    icon: Bot,
    colorClass: 'text-brand-500',
    glowColor: 'rgba(236, 38, 143, 0.5)',
  },
  {
    text: 'Un sistema de gestión robusto es la columna vertebral de toda empresa competitiva',
    icon: Workflow,
    colorClass: 'text-system-blue-500',
    glowColor: 'rgba(59, 130, 246, 0.5)',
  },
  {
    text: 'La seguridad laboral no es un gasto, es la inversión más rentable en tu equipo',
    icon: ShieldCheck,
    colorClass: 'text-system-green-500',
    glowColor: 'rgba(34, 197, 94, 0.5)',
  },
  {
    text: 'Transformar procesos manuales en flujos digitales multiplica la productividad',
    icon: Zap,
    colorClass: 'text-system-yellow-500',
    glowColor: 'rgba(250, 204, 21, 0.5)',
  },
  {
    text: 'La calidad no es casualidad, es el resultado de sistemas bien implementados',
    icon: Award,
    colorClass: 'text-system-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.5)',
  },
  {
    text: 'Prevenir riesgos laborales hoy, es garantizar la continuidad del negocio mañana',
    icon: Lock,
    colorClass: 'text-system-red-500',
    glowColor: 'rgba(239, 68, 68, 0.5)',
  },
  {
    text: 'Los datos sin análisis son ruido; con BI se convierten en decisiones estratégicas',
    icon: BarChart3,
    colorClass: 'text-system-orange-500',
    glowColor: 'rgba(251, 146, 60, 0.5)',
  },
  {
    text: 'Cada certificación ISO es un escalón hacia la excelencia operacional',
    icon: Target,
    colorClass: 'text-brand-500',
    glowColor: 'rgba(236, 38, 143, 0.5)',
  },
  {
    text: 'La mejora continua no es una meta, es una cultura organizacional',
    icon: TrendingUp,
    colorClass: 'text-system-blue-500',
    glowColor: 'rgba(59, 130, 246, 0.5)',
  },
  {
    text: 'Digitalizar no es solo tecnología, es reimaginar cómo trabajamos',
    icon: Brain,
    colorClass: 'text-system-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.5)',
  },
];

// Component for displaying rotating inspirational quotes with icons
const InspirationalQuote: React.FC = () => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(true);

  const currentQuote = inspirationalQuotes[currentQuoteIndex];
  const IconComponent = currentQuote.icon;

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentQuoteIndex(
          prevIndex => (prevIndex + 1) % inspirationalQuotes.length
        );
        setIsVisible(true);
      }, 500);
    }, 5000); // Change quote every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 transition-all duration-500 ${isVisible
        ? 'opacity-100 transform scale-100'
        : 'opacity-0 transform scale-95'
        }`}
    >
      <div
        className={`flex-shrink-0 p-2 sm:p-3 rounded-xl bg-black-card-soft border border-black-border ${currentQuote.colorClass}`}
        style={{
          boxShadow: isVisible
            ? `0 0 20px ${currentQuote.glowColor}, 0 0 40px ${currentQuote.glowColor.replace('0.5', '0.2')}`
            : 'none',
          transition: 'box-shadow 1s ease-in-out',
        }}
      >
        <IconComponent className='h-5 w-5 sm:h-6 sm:w-6 animate-pulse' />
      </div>

      <p className='text-sm sm:text-lg font-medium text-white-text text-center sm:text-left max-w-2xl'>
        <Sparkles
          className={`inline h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${currentQuote.colorClass} animate-pulse`}
        />
        <span className='inline-block'>{currentQuote.text}</span>
        <Sparkles
          className={`inline h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 ${currentQuote.colorClass} animate-pulse`}
        />
      </p>
    </div>
  );
};

export const PricingPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = React.useState<TabType>('overview');
  const [expandedFAQ, setExpandedFAQ] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState(
    'Servicios de Consultoría'
  );
  const [currentServiceIndex, setCurrentServiceIndex] = React.useState(0);

  const services = [
    {
      title: 'Seguridad y Salud en el Trabajo',
      subtitle: 'Protección integral',
      description: 'Crea entornos laborales seguros y saludables',
      icon: Shield,
      color: 'text-system-red-500',
    },
    {
      title: 'Gestión de Calidad',
      subtitle: 'Excelencia operacional',
      description: 'Optimiza procesos y satisface a tus clientes',
      icon: Award,
      color: 'text-system-blue-500',
    },
    {
      title: 'SAGRILAFT',
      subtitle: 'Debida diligencia',
      description: 'Cumplimiento antilavado y gestión de riesgos LA/FT',
      icon: Users,
      color: 'text-system-yellow-500',
    },
    {
      title: 'Gestión Ambiental',
      subtitle: 'Sostenibilidad empresarial',
      description: 'Protege el medio ambiente y reduce costos',
      icon: Globe,
      color: 'text-system-green-500',
    },
    {
      title: 'PESV',
      subtitle: 'Seguridad vial estratégica',
      description: 'Reduce riesgos viales en tu organización',
      icon: Car,
      color: 'text-orange-500',
    },
  ];

  React.useEffect(() => {
    document.title = 'StrateKaz | Consultoría SST, Talento Humano, PESV e ISO — Precios Colombia';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Servicios de consultoría y plataforma StrateKaz: Seguridad y Salud en el Trabajo, Talento Humano, PESV, ISO 9001/14001/45001, Firma Digital. Desde $20.000 COP/usuario/mes. Empresas colombianas.');
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentServiceIndex(prevIndex => (prevIndex + 1) % services.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const toggleFAQ = (question: string) => {
    setExpandedFAQ(expandedFAQ === question ? null : question);
  };

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='pt-section-xs pb-section-sm lg:pt-section-sm lg:pb-section-md'>
        <div className='container-responsive'>
          <div className='text-center mb-8'>
            <div className='inline-flex items-center bg-black-card-soft px-4 py-2 rounded-full border border-black-border-soft mb-6'>
              <Building className='h-5 w-5 text-system-yellow-500 mr-2' />
              <span className='text-white-text font-medium font-title overflow-hidden whitespace-nowrap'>
                <span
                  className='inline-block'
                  style={{
                    animation: 'typing 6s steps(25, end) infinite',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    width: '0',
                    borderRight: '2px solid transparent',
                  }}
                >
                  20+ años de experiencia
                </span>
              </span>
            </div>

            <style>{`
              @keyframes typing {
                0% {
                  width: 0;
                  border-right-color: var(--white-text);
                }
                25% {
                  width: 100%;
                  border-right-color: var(--white-text);
                }
                75% {
                  width: 100%;
                  border-right-color: transparent;
                }
                100% {
                  width: 100%;
                  border-right-color: transparent;
                }
              }
            `}</style>

            <h1 className='text-fluid-3xl lg:text-fluid-4xl font-bold text-white-text leading-tight font-title'>
              <span className='text-brand-500'>Rentabilidad</span> en cada Proyecto
            </h1>
          </div>

          <div className='max-w-2xl mx-auto mb-8'>
            <div className='relative h-48 flex items-center justify-center'>
              <div
                className='bg-black-card-soft border border-black-border-soft rounded-2xl p-8 transition-all duration-700 ease-in-out transform hover:scale-105'
                style={{
                  boxShadow:
                    '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className='flex items-center space-x-6'>
                  <div
                    className={`w-16 h-16 rounded-2xl bg-black-card border border-black-border flex items-center justify-center ${services[currentServiceIndex].color} transition-all duration-500`}
                    style={{
                      animation: 'glow 2s ease-in-out infinite alternate',
                    }}
                  >
                    {React.createElement(services[currentServiceIndex].icon, {
                      className: 'h-8 w-8',
                    })}
                  </div>

                  <div className='flex-1 text-left'>
                    <h3 className='text-fluid-lg lg:text-fluid-xl font-bold text-white-text mb-1 font-title'>
                      {services[currentServiceIndex].title}
                    </h3>
                    <p
                      className={`text-sm font-semibold mb-2 font-subtitle ${services[currentServiceIndex].color}`}
                    >
                      {services[currentServiceIndex].subtitle}
                    </p>
                    <p className='text-white-muted text-sm font-content leading-relaxed'>
                      {services[currentServiceIndex].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspirational Dynamic Quotes - Responsive */}
          <div className='max-w-4xl mx-auto mt-8 mb-4 px-4 sm:px-0'>
            <InspirationalQuote />
          </div>

          <style>{`
              @keyframes glow {
                from {
                  text-shadow:
                    0 0 20px rgba(250, 183, 24, 0.3),
                    0 0 30px rgba(250, 183, 24, 0.2),
                    0 0 40px rgba(250, 183, 24, 0.1);
                }
                to {
                  text-shadow:
                    0 0 30px rgba(250, 183, 24, 0.5),
                    0 0 40px rgba(250, 183, 24, 0.3),
                    0 0 50px rgba(250, 183, 24, 0.2);
                }
              }
            `}</style>
        </div>
      </section>

      {/* Navigation Section */}
      <section className='py-section-sm'>
        <div className='container-responsive'>
          <div className='text-center space-y-section-xs'>
            <h2 className='text-fluid-2xl lg:text-fluid-3xl font-bold text-white-text font-title'>
              Servicios Especializados
            </h2>

            {/* Navigation Buttons */}
            <div className='flex flex-wrap justify-center gap-4'>
              {navigationButtons.map(button => {
                const colors = getColorClasses(button.color);
                const IconComponent = button.icon;
                const isActive = selectedTab === button.id;

                return (
                  <button
                    key={button.id}
                    onClick={() => setSelectedTab(button.id as TabType)}
                    className={`group relative px-6 py-4 rounded-xl font-title font-medium transition-all duration-300 border backdrop-blur-sm ${isActive
                      ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg ${colors.hoverShadow} ring-2 ${colors.ring}`
                      : `bg-black-card-soft/50 border-black-border-soft text-white-muted hover:text-white hover:bg-black-hover hover:${colors.border}/50`
                      }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <IconComponent
                        className={`h-5 w-5 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                      />
                      <div className='text-left'>
                        <div className='font-semibold'>{button.title}</div>
                        <div
                          className={`text-xs mt-1 ${isActive ? 'opacity-90' : 'opacity-70'}`}
                        >
                          {button.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className='py-section-md lg:py-section-lg'>
        <div className='container-responsive'>
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className='space-y-8'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {servicePackages.map(service => {
                  const colors = getColorClasses(service.color);
                  return (
                    <Card
                      key={service.id}
                      className={`group relative overflow-hidden bg-black-card-soft border border-black-border-soft ${colors.hoverBorder} transition-all duration-500 hover:shadow-xl ${colors.hoverShadow} ${service.popular ? `ring-2 ${colors.ring}` : ''
                        }`}
                    >
                      {service.popular && (
                        <div
                          className={`absolute top-4 right-4 ${colors.badge} text-white px-3 py-1 rounded-full text-sm font-bold font-title`}
                        >
                          Más Solicitado
                        </div>
                      )}

                      <div className='p-6 lg:p-8'>
                        <div className='flex items-center space-x-4 mb-6'>
                          <div
                            className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} group-hover:scale-110 transition-all duration-300`}
                          >
                            {service.icon}
                          </div>
                          <div>
                            <h3 className='text-xl font-bold text-white-text mb-2 font-title'>
                              {service.title}
                            </h3>
                            <p className='text-white-muted font-content'>
                              {service.description}
                            </p>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4 mb-6'>
                          <div className='bg-black-hover p-3 rounded-lg'>
                            <div className='text-sm text-white-muted-soft mb-1 font-content'>
                              Duración
                            </div>
                            <div className='font-semibold text-white-text font-title'>
                              {service.timeline}
                            </div>
                          </div>
                          <div className='bg-black-hover p-3 rounded-lg'>
                            <div className='text-sm text-white-muted-soft mb-1 font-content'>
                              Inversión
                            </div>
                            <div
                              className={`font-semibold ${colors.text} font-title`}
                            >
                              {service.investment}
                            </div>
                          </div>
                        </div>

                        <div className='space-y-4 mb-6'>
                          <div>
                            <h4 className='font-semibold text-white-text mb-3 font-title'>
                              Incluye:
                            </h4>
                            <div className='grid grid-cols-1 gap-2'>
                              {service.includes.map((item, i) => (
                                <div
                                  key={i}
                                  className='flex items-center space-x-3'
                                >
                                  <CheckCircle
                                    className={`h-4 w-4 ${colors.text} flex-shrink-0`}
                                  />
                                  <span className='text-white-muted-soft text-sm font-content'>
                                    {item}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className='font-semibold text-white-text mb-3 font-title'>
                              Industrias:
                            </h4>
                            <div className='flex flex-wrap gap-2'>
                              {service.industries.map((industry, i) => (
                                <span
                                  key={i}
                                  className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-medium border ${colors.border}`}
                                >
                                  {industry}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* User Profiles Tab */}
          {selectedTab === 'profiles' && (
            <div className='space-y-8'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {userProfiles.map(profile => {
                  const colors = getColorClasses(profile.color);
                  return (
                    <Card
                      key={profile.id}
                      className={`bg-black-card-soft border border-black-border-soft ${colors.hoverBorder} transition-all duration-500 hover:shadow-xl ${colors.hoverShadow}`}
                    >
                      <div className='p-6 lg:p-8'>
                        <div className='flex items-center space-x-4 mb-6'>
                          <div
                            className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text}`}
                          >
                            {profile.icon}
                          </div>
                          <div>
                            <h3 className='text-xl font-bold text-white-text mb-2 font-title'>
                              {profile.title}
                            </h3>
                            <p className='text-white-muted font-content'>
                              {profile.description}
                            </p>
                          </div>
                        </div>

                        <div className='space-y-4'>
                          <div>
                            <h4 className='font-semibold text-white-text mb-3 font-title'>
                              Beneficios:
                            </h4>
                            <div className='space-y-2'>
                              {profile.benefits.map((benefit, i) => (
                                <div
                                  key={i}
                                  className='flex items-center space-x-3'
                                >
                                  <CheckCircle
                                    className={`h-4 w-4 ${colors.text} flex-shrink-0`}
                                  />
                                  <span className='text-white-muted-soft text-sm font-content'>
                                    {benefit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className='font-semibold text-white-text mb-3 font-title'>
                              Casos de Uso:
                            </h4>
                            <div className='flex flex-wrap gap-2'>
                              {profile.useCases.map((useCase, i) => (
                                <span
                                  key={i}
                                  className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-medium border ${colors.border}`}
                                >
                                  {useCase}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ROI Calculator Tab */}
          {selectedTab === 'calculator' && (
            <div className='space-y-8'>
              <div className='max-w-4xl mx-auto'>
                <Card className='bg-black-card-soft border border-black-border-soft hover:border-green-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-green-500/20'>
                  <div className='p-8'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-8'>
                      <div className='text-center'>
                        <div className='w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                          <TrendingUp className='h-8 w-8 text-green-500' />
                        </div>
                        <div className='text-3xl font-bold text-green-500 mb-2 font-title'>
                          6-8 meses
                        </div>
                        <div className='text-white-muted font-content'>
                          Periodo de recuperación promedio
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                          <DollarSign className='h-8 w-8 text-green-500' />
                        </div>
                        <div className='text-3xl font-bold text-green-500 mb-2 font-title'>
                          280%
                        </div>
                        <div className='text-white-muted font-content'>
                          ROI promedio primer año
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                          <Zap className='h-8 w-8 text-green-500' />
                        </div>
                        <div className='text-3xl font-bold text-green-500 mb-2 font-title'>
                          45%
                        </div>
                        <div className='text-white-muted font-content'>
                          Reducción de costos operativos
                        </div>
                      </div>
                    </div>

                    <div className='bg-black-hover rounded-xl p-6'>
                      <h3 className='text-xl font-bold text-white-text mb-4 font-title'>
                        Beneficios Cuantificables
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {[
                          'Reducción 60% tiempos de proceso',
                          'Disminución 70% no conformidades',
                          'Ahorro 100% multas y sanciones',
                          'Mejora 40% eficiencia operacional',
                          'Reducción 30% costos de calidad',
                          'Incremento 25% satisfacción cliente',
                        ].map((benefit, i) => (
                          <div key={i} className='flex items-center space-x-3'>
                            <CheckCircle className='h-4 w-4 text-green-500 flex-shrink-0' />
                            <span className='text-white-muted font-content'>
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {selectedTab === 'faq' && (
            <div className='space-y-8'>
              <div className='max-w-4xl mx-auto'>
                {/* Category Selector */}
                <div className='flex flex-wrap justify-center gap-4 mb-8'>
                  {faqCategories.map(category => {
                    const colors = getColorClasses(category.color);
                    const IconComponent = category.icon;
                    const isActive = selectedCategory === category.title;

                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.title)}
                        className={`group relative px-6 py-4 rounded-xl font-title font-medium transition-all duration-300 border backdrop-blur-sm ${isActive
                          ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg ${colors.hoverShadow} ring-2 ${colors.ring}`
                          : `bg-black-card-soft/50 border-black-border-soft text-white-muted hover:text-white hover:bg-black-hover hover:${colors.border}/50`
                          }`}
                      >
                        <div className='flex items-center space-x-3'>
                          <IconComponent
                            className={`h-5 w-5 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                          />
                          <div className='font-semibold'>{category.title}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* FAQ Items */}
                <div className='space-y-4'>
                  {faqs
                    .find(cat => cat.category === selectedCategory)
                    ?.items.map((faq, index) => (
                      <Card
                        key={index}
                        className='bg-black-card-soft border border-black-border-soft hover:border-brand-500/50 transition-all duration-300'
                      >
                        <button
                          onClick={() => toggleFAQ(faq.question)}
                          className='w-full p-6 text-left flex items-center justify-between'
                        >
                          <h3 className='text-lg font-semibold text-white-text font-title pr-4'>
                            {faq.question}
                          </h3>
                          <ChevronDown
                            className={`h-5 w-5 text-white-muted-soft transition-transform duration-300 flex-shrink-0 ${expandedFAQ === faq.question ? 'rotate-180' : ''
                              }`}
                          />
                        </button>
                        {expandedFAQ === faq.question && (
                          <div className='px-6 pb-6'>
                            <p className='text-white-muted font-content leading-relaxed'>
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
