/**
 * PortalClienteView - Vista para usuarios de tipo cliente sin Colaborador
 *
 * Muestra una interfaz informativa con features disponibles y próximas
 * en lugar del mensaje genérico de "perfil en configuración".
 */

import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  BookOpen,
  PenTool,
  Package,
  Receipt,
  HelpCircle,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatedPage, Badge, Card } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

// ============================================================================
// TYPES
// ============================================================================

interface FeatureCard {
  label: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  disabled?: boolean;
}

// ============================================================================
// CONFIG
// ============================================================================

const AVAILABLE_FEATURES: FeatureCard[] = [
  {
    label: 'Mis Documentos',
    description: 'Accede a los documentos compartidos contigo',
    icon: FileText,
    to: '/mi-portal?tab=documentos',
  },
  {
    label: 'Lecturas Pendientes',
    description: 'Revisa los documentos que requieren tu lectura',
    icon: BookOpen,
    to: '/mi-portal?tab=lecturas',
  },
  {
    label: 'Mi Firma Digital',
    description: 'Gestiona tu firma digital y documentos por firmar',
    icon: PenTool,
    to: '/mi-portal?tab=firma',
  },
];

const UPCOMING_FEATURES: FeatureCard[] = [
  {
    label: 'Mis Pedidos',
    description: 'Consulta el estado de tus pedidos',
    icon: Package,
    disabled: true,
  },
  {
    label: 'Facturas',
    description: 'Revisa y descarga tus facturas',
    icon: Receipt,
    disabled: true,
  },
  {
    label: 'Soporte',
    description: 'Solicita ayuda o reporta incidencias',
    icon: HelpCircle,
    disabled: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PortalClienteView() {
  const user = useAuthStore((s) => s.user);
  const { primaryColor, companyName } = useBrandingConfig();

  const clienteNombre = user?.cliente_nombre || 'Cliente';
  const BLUE = '#3B82F6';

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <Card padding="none" className="overflow-hidden">
          <div
            className="h-1.5"
            style={{ background: `linear-gradient(90deg, ${BLUE}, ${BLUE}80)` }}
          />
          <div className="p-6 md:p-8 text-center space-y-4">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${BLUE}15` }}
            >
              <Users className="w-8 h-8" style={{ color: BLUE }} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Portal del Cliente
              </h1>
              <p className="text-lg font-medium" style={{ color: BLUE }}>
                {clienteNombre}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                Bienvenido al portal de clientes de{' '}
                <strong className="text-gray-700 dark:text-gray-300">{companyName}</strong>. Desde
                aquí puedes acceder a los recursos disponibles para tu gestión.
              </p>
            </div>
          </div>
        </Card>

        {/* Features disponibles */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recursos disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_FEATURES.map((feature) => (
              <Link key={feature.label} to={feature.to!} className="block group">
                <Card
                  padding="lg"
                  className="h-full transition-all duration-200 group-hover:shadow-md group-hover:border-blue-200 dark:group-hover:border-blue-800"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${BLUE}15` }}
                    >
                      <feature.icon className="w-6 h-6" style={{ color: BLUE }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feature.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {feature.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Features próximas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Próximamente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {UPCOMING_FEATURES.map((feature) => (
              <Card key={feature.label} padding="lg" className="h-full opacity-50 cursor-default">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <feature.icon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feature.label}
                      </h3>
                      <Badge variant="default" size="sm">
                        Próximamente
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Acción: ir al dashboard */}
        <div className="flex justify-center pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <LayoutDashboard className="w-4 h-4" />
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </AnimatedPage>
  );
}
