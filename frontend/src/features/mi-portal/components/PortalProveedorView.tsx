/**
 * PortalProveedorView - Vista para usuarios de tipo proveedor sin Colaborador
 *
 * Muestra una interfaz informativa con features disponibles y próximas
 * en lugar del mensaje genérico de "perfil en configuración".
 */

import { Link } from 'react-router-dom';
import {
  Truck,
  FileText,
  BookOpen,
  PenTool,
  ShoppingCart,
  ClipboardCheck,
  FolderCheck,
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
    label: 'Órdenes de Compra',
    description: 'Consulta y gestiona tus órdenes de compra',
    icon: ShoppingCart,
    disabled: true,
  },
  {
    label: 'Evaluaciones',
    description: 'Revisa tus evaluaciones de desempeño',
    icon: ClipboardCheck,
    disabled: true,
  },
  {
    label: 'Documentación Requerida',
    description: 'Sube la documentación solicitada por la empresa',
    icon: FolderCheck,
    disabled: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PortalProveedorView() {
  const user = useAuthStore((s) => s.user);
  const { primaryColor, companyName } = useBrandingConfig();

  const proveedorNombre = user?.proveedor_nombre || 'Proveedor';
  const GREEN = '#10B981';

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <Card padding="none" className="overflow-hidden">
          <div
            className="h-1.5"
            style={{ background: `linear-gradient(90deg, ${GREEN}, ${GREEN}80)` }}
          />
          <div className="p-6 md:p-8 text-center space-y-4">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${GREEN}15` }}
            >
              <Truck className="w-8 h-8" style={{ color: GREEN }} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Portal del Proveedor
              </h1>
              <p className="text-lg font-medium" style={{ color: GREEN }}>
                {proveedorNombre}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                Bienvenido al portal de proveedores de{' '}
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
                  className="h-full transition-all duration-200 group-hover:shadow-md group-hover:border-emerald-200 dark:group-hover:border-emerald-800"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${GREEN}15` }}
                    >
                      <feature.icon className="w-6 h-6" style={{ color: GREEN }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feature.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {feature.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
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
