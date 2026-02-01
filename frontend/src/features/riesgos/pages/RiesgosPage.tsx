import { Shield, TrendingUp, AlertTriangle, Leaf, Car, Landmark, Lock, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Spinner } from '@/components/common/Spinner';

const riskModules = [
  {
    title: 'Contexto Organizacional',
    description: 'Análisis DOFA, PESTEL y 5 Fuerzas de Porter',
    icon: TrendingUp,
    path: '/riesgos/contexto',
    color: 'orange',
  },
  {
    title: 'Riesgos y Oportunidades',
    description: 'Gestión de riesgos y oportunidades por proceso',
    icon: AlertTriangle,
    path: '/riesgos/procesos',
    color: 'orange',
  },
  {
    title: 'IPEVR (GTC-45)',
    description: 'Matriz de identificación de peligros y valoración de riesgos',
    icon: Shield,
    path: '/riesgos/ipevr',
    color: 'orange',
  },
  {
    title: 'Aspectos Ambientales',
    description: 'Identificación y evaluación de impactos ambientales',
    icon: Leaf,
    path: '/riesgos/ambientales',
    color: 'green',
  },
  {
    title: 'Riesgos Viales',
    description: 'Plan Estratégico de Seguridad Vial - PESV',
    icon: Car,
    path: '/riesgos/viales',
    color: 'blue',
  },
  {
    title: 'SAGRILAFT/PTEE',
    description: 'Sistema Antilavado de Activos y Contra el Terrorismo',
    icon: Landmark,
    path: '/riesgos/sagrilaft',
    color: 'purple',
  },
  {
    title: 'Seguridad de la Información',
    description: 'Gestión de riesgos de seguridad de la información ISO 27001',
    icon: Lock,
    path: '/riesgos/seguridad-info',
    color: 'red',
  },
  {
    title: 'Matriz de Riesgos Integrada',
    description: 'Vista consolidada de todos los riesgos organizacionales',
    icon: FileCheck,
    path: '/riesgos/matriz-integrada',
    color: 'orange',
  },
];

export default function RiesgosPage() {
  const { color: moduleColor, isLoading } = useModuleColor('MOTOR_RIESGOS');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 bg-${moduleColor}-100 rounded-lg`}>
          <Shield className={`h-8 w-8 text-${moduleColor}-600`} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riesgos</h1>
          <p className="text-gray-600">Motor de gestión integral de riesgos y oportunidades organizacionales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {riskModules.map((module) => {
          const Icon = module.icon;
          const colorClasses = {
            orange: 'bg-orange-50 border-orange-200 hover:border-orange-400 hover:shadow-orange-100',
            green: 'bg-green-50 border-green-200 hover:border-green-400 hover:shadow-green-100',
            blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-blue-100',
            purple: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:shadow-purple-100',
            red: 'bg-red-50 border-red-200 hover:border-red-400 hover:shadow-red-100',
          };

          const iconColorClasses = {
            orange: 'text-orange-600',
            green: 'text-green-600',
            blue: 'text-blue-600',
            purple: 'text-purple-600',
            red: 'text-red-600',
          };

          return (
            <Link
              key={module.path}
              to={module.path}
              className={`block p-6 border-2 rounded-xl transition-all hover:shadow-lg ${
                colorClasses[module.color as keyof typeof colorClasses]
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Icon className={`h-10 w-10 ${iconColorClasses[module.color as keyof typeof iconColorClasses]}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
                  <p className="text-sm text-gray-600">{module.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className={`bg-${moduleColor}-50 border border-${moduleColor}-200 rounded-lg p-6`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 bg-${moduleColor}-100 rounded-lg`}>
            <Shield className={`h-6 w-6 text-${moduleColor}-600`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold text-${moduleColor}-900 mb-2`}>Acerca del Módulo de Riesgos</h3>
            <p className={`text-${moduleColor}-800 text-sm leading-relaxed`}>
              El Motor de Riesgos integra todas las metodologías de gestión de riesgos requeridas por las normas ISO 9001,
              ISO 14001, ISO 45001, ISO 27001, y regulaciones colombianas como SAGRILAFT y PESV. Permite una visión
              holística del contexto organizacional, identificación, evaluación y tratamiento de riesgos y oportunidades
              en todos los niveles de la organización.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
