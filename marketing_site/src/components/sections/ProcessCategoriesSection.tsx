import React from 'react';
import {
  Shield,
  FileCheck,
  Leaf,
  Settings,
  Users,
  BarChart3,
  TrendingUp,
  Zap,
  Award,
  Truck,
  Factory,
  HardHat,
  Workflow,
  FileSignature,
  Scale,
  UserCheck,
  Wallet,
  ClipboardCheck,
  Brain,
  ChevronRight,
} from 'lucide-react';

interface PlatformModule {
  name: string;
  description: string;
  icon: React.ReactNode;
  subApps: string[];
  color: string;
  borderColor: string;
  bgGradient: string;
}

interface ModuleLayer {
  name: string;
  description: string;
  modules: PlatformModule[];
}

// Orden: de lo más buscado (gancho PYME) a lo más técnico
const PLATFORM_LAYERS: ModuleLayer[] = [
  {
    name: 'Seguridad Laboral & Talento Humano',
    description: 'SST + HSEQ + Capital Humano | lo esencial',
    modules: [
      {
        name: 'Seguridad y Salud en el Trabajo',
        description: 'SG-SST, Decreto 1072, Resolución 0312',
        icon: <HardHat className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Accidentalidad', 'Seguridad Industrial', 'Higiene', 'Medicina', 'Emergencias', 'Comités'],
        color: 'text-red-400',
        borderColor: 'border-red-500/30',
        bgGradient: 'from-red-500/10 to-red-600/5',
      },
      {
        name: 'Talento Humano',
        description: 'Ciclo completo del colaborador',
        icon: <Users className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Selección', 'Onboarding', 'Formación', 'Desempeño', 'Nómina', 'Offboarding'],
        color: 'text-orange-400',
        borderColor: 'border-orange-500/30',
        bgGradient: 'from-orange-500/10 to-orange-600/5',
      },
      {
        name: 'Gestión Ambiental',
        description: 'ISO 14001, aspectos e impactos ambientales',
        icon: <Leaf className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Aspectos Ambientales', 'Programas', 'Indicadores', 'Residuos'],
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        bgGradient: 'from-emerald-500/10 to-emerald-600/5',
      },
      {
        name: 'Admin & Finanzas',
        description: 'Presupuesto, tesorería, nómina, activos',
        icon: <Wallet className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Presupuesto', 'Tesorería', 'Activos Fijos', 'Contabilidad'],
        color: 'text-lime-400',
        borderColor: 'border-lime-500/30',
        bgGradient: 'from-lime-500/10 to-lime-600/5',
      },
    ],
  },
  {
    name: 'Certificaciones & Cumplimiento',
    description: 'ISO Multi-Norma + PESV + GRC + SAGRILAFT',
    modules: [
      {
        name: 'ISO Multi-Norma',
        description: 'Trinorma + PESV + auditorías internas',
        icon: <Award className='h-6 w-6' aria-hidden='true' />,
        subApps: ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 27001', 'PESV'],
        color: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        bgGradient: 'from-blue-500/10 to-blue-600/5',
      },
      {
        name: 'Motor de Cumplimiento',
        description: 'Matriz legal, requisitos y evidencias',
        icon: <Scale className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Matriz Legal', 'Requisitos', 'Reglamentos', 'Evidencias'],
        color: 'text-cyan-400',
        borderColor: 'border-cyan-500/30',
        bgGradient: 'from-cyan-500/10 to-cyan-600/5',
      },
      {
        name: 'Motor de Riesgos',
        description: '6 tipos de riesgo con matrices automáticas',
        icon: <Shield className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Procesos', 'IPEVR/GTC-45', 'Ambiental', 'Vial', 'InfoSec', 'SAGRILAFT'],
        color: 'text-red-400',
        borderColor: 'border-red-500/30',
        bgGradient: 'from-red-500/10 to-red-600/5',
      },
      {
        name: 'Gestión Documental',
        description: '12 tipos de documento SGI con plantillas',
        icon: <FileCheck className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Políticas', 'Procedimientos', 'Manuales', 'Formatos', 'Registros'],
        color: 'text-indigo-400',
        borderColor: 'border-indigo-500/30',
        bgGradient: 'from-indigo-500/10 to-indigo-600/5',
      },
    ],
  },
  {
    name: 'Operaciones & Cadena de Valor',
    description: 'ERP completo + Logística + PESV + CRM',
    modules: [
      {
        name: 'Supply Chain',
        description: 'Proveedores, compras, almacenamiento',
        icon: <Truck className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Catálogos', 'Proveedores', 'Compras', 'Almacén', 'Abastecimiento'],
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        bgGradient: 'from-emerald-500/10 to-emerald-600/5',
      },
      {
        name: 'Production Ops',
        description: 'Recepción, procesamiento, producto terminado',
        icon: <Factory className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Recepción', 'Procesamiento', 'Producto Terminado', 'Mantenimiento'],
        color: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        bgGradient: 'from-amber-500/10 to-amber-600/5',
      },
      {
        name: 'Logística & PESV',
        description: 'Flota vehicular, transporte, seguridad vial',
        icon: <Settings className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Gestión Flota', 'Transporte', 'PESV Res. 40595'],
        color: 'text-teal-400',
        borderColor: 'border-teal-500/30',
        bgGradient: 'from-teal-500/10 to-teal-600/5',
      },
      {
        name: 'Sales CRM',
        description: 'Clientes, pipeline, pedidos, servicio',
        icon: <TrendingUp className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Clientes', 'Pipeline', 'Pedidos', 'Servicio al Cliente'],
        color: 'text-pink-400',
        borderColor: 'border-pink-500/30',
        bgGradient: 'from-pink-500/10 to-pink-600/5',
      },
    ],
  },
  {
    name: 'Automatización & Inteligencia',
    description: 'Workflows BPMN + Firma Digital + BI',
    modules: [
      {
        name: 'Workflow Engine',
        description: 'BPMN 2.0 con gateways y SLA',
        icon: <Workflow className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Diseñador', 'Ejecución', 'Monitoreo', 'Firma Digital'],
        color: 'text-purple-400',
        borderColor: 'border-purple-500/30',
        bgGradient: 'from-purple-500/10 to-purple-600/5',
      },
      {
        name: 'Firma Digital',
        description: 'SHA-256, canvas, delegación, versionado',
        icon: <FileSignature className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Firma Manuscrita', 'Verificación SHA-256', 'Delegación', 'Auditoría'],
        color: 'text-violet-400',
        borderColor: 'border-violet-500/30',
        bgGradient: 'from-violet-500/10 to-violet-600/5',
      },
      {
        name: 'Analytics & BI',
        description: 'KPIs, dashboards, tendencias, informes',
        icon: <BarChart3 className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Indicadores', 'Dashboard Gerencial', 'Tendencias', 'Exportación'],
        color: 'text-fuchsia-400',
        borderColor: 'border-fuchsia-500/30',
        bgGradient: 'from-fuchsia-500/10 to-fuchsia-600/5',
      },
      {
        name: 'Auditorías Internas',
        description: 'Planificación, ejecución, hallazgos',
        icon: <ClipboardCheck className='h-6 w-6' aria-hidden='true' />,
        subApps: ['Programa', 'Ejecución', 'Hallazgos', 'Seguimiento'],
        color: 'text-sky-400',
        borderColor: 'border-sky-500/30',
        bgGradient: 'from-sky-500/10 to-sky-600/5',
      },
    ],
  },
];

const EXTRA_CAPABILITIES = [
  { icon: <Zap className='h-4 w-4' aria-hidden='true' />, text: 'Multi-Tenant' },
  { icon: <Leaf className='h-4 w-4' aria-hidden='true' />, text: 'PWA Offline' },
  { icon: <UserCheck className='h-4 w-4' aria-hidden='true' />, text: 'RBAC Granular' },
  { icon: <Brain className='h-4 w-4' aria-hidden='true' />, text: 'IA Integrada' },
];

/**
 * ProcessCategoriesSection — Platform Modules Showcase
 *
 * Replaces the old generic BPM process library with a real
 * showcase of all 16+ platform modules organized by layer.
 */
export const ProcessCategoriesSection: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const [expandedLayer, setExpandedLayer] = React.useState<number>(0);

  return (
    <section className={`py-section-sm lg:py-section-md ${className}`}>
      <div className='container-responsive'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h2 className='text-fluid-2xl lg:text-fluid-3xl font-bold font-title text-white-text mb-4'>
            <span className='sm:hidden'>84+ Módulos en Una Plataforma</span>
            <span className='hidden sm:inline'>
              Seguridad Laboral, Talento Humano, ISO y mucho más
            </span>
          </h2>
          <div className='hidden sm:block container-content'>
            <p className='text-xl text-white-muted'>
              84+ módulos integrados: SST, Talento Humano, PESV, ISO, Firma Digital, ERP y BI | todo lo que tu empresa necesita en un solo lugar
            </p>
          </div>
        </div>

        {/* Layer Tabs - Desktop */}
        <div className='hidden lg:flex items-center justify-center gap-2 mb-8'>
          {PLATFORM_LAYERS.map((layer, idx) => (
            <button
              key={layer.name}
              onClick={() => setExpandedLayer(idx)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border ${
                expandedLayer === idx
                  ? 'bg-brand-500/20 border-brand-500/50 text-brand-400 shadow-lg shadow-brand-500/10'
                  : 'bg-black-card-soft border-black-border-soft text-white-muted hover:border-neutral-600 hover:text-white-text'
              }`}
            >
              {layer.name}
            </button>
          ))}
        </div>

        {/* Mobile: Accordion style */}
        <div className='lg:hidden space-y-3 mb-6'>
          {PLATFORM_LAYERS.map((layer, idx) => (
            <div key={layer.name}>
              <button
                onClick={() => setExpandedLayer(idx)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-300 border ${
                  expandedLayer === idx
                    ? 'bg-brand-500/10 border-brand-500/40 text-brand-400'
                    : 'bg-black-card-soft border-black-border-soft text-white-muted'
                }`}
              >
                <div>
                  <div className='font-semibold text-sm'>{layer.name}</div>
                  <div className='text-xs text-white-muted-soft'>
                    {layer.modules.length} módulos
                  </div>
                </div>
                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-300 ${
                    expandedLayer === idx ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {expandedLayer === idx && (
                <div className='grid grid-cols-2 gap-3 mt-3'>
                  {layer.modules.map(mod => (
                    <div
                      key={mod.name}
                      className={`bg-gradient-to-br ${mod.bgGradient} border ${mod.borderColor} rounded-xl p-3`}
                    >
                      <div className={`${mod.color} mb-2`}>{mod.icon}</div>
                      <div className='text-xs font-semibold text-white-text mb-1'>
                        {mod.name}
                      </div>
                      <div className='text-xs text-white-muted-soft leading-relaxed'>
                        {mod.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop: Module Cards Grid */}
        <div className='hidden lg:grid grid-cols-4 gap-5'>
          {PLATFORM_LAYERS[expandedLayer].modules.map(mod => (
            <div
              key={mod.name}
              className={`group relative bg-gradient-to-br ${mod.bgGradient} border ${mod.borderColor} rounded-xl p-5 transition-all duration-500 hover:scale-105 hover:shadow-xl cursor-default`}
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-black-card/50 ${mod.color} transition-all duration-300 group-hover:scale-110`}
              >
                {mod.icon}
              </div>

              {/* Content */}
              <h3 className='text-sm font-bold text-white-text mb-1.5'>
                {mod.name}
              </h3>
              <p className='text-xs text-white-muted-soft mb-3 leading-relaxed'>
                {mod.description}
              </p>

              {/* Sub-apps tags */}
              <div className='flex flex-wrap gap-1.5'>
                {mod.subApps.map(app => (
                  <span
                    key={app}
                    className={`text-xs px-2 py-0.5 rounded-full bg-black-card/40 ${mod.color} border ${mod.borderColor}`}
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Extra Capabilities Bar */}
        <div className='mt-8 flex flex-wrap items-center justify-center gap-3 lg:gap-4'>
          {EXTRA_CAPABILITIES.map(cap => (
            <div
              key={cap.text}
              className='flex items-center gap-2 bg-black-card-soft border border-black-border-soft rounded-full px-4 py-2 text-xs text-white-muted'
            >
              <span className='text-brand-500'>{cap.icon}</span>
              {cap.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessCategoriesSection;
