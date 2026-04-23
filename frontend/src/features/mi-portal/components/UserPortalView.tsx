/**
 * UserPortalView — Vista de Mi Portal para usuarios SIN Colaborador vinculado.
 *
 * Caso: cuenta creada pero talento humano todavía no completó el perfil
 * de empleado. Muestra Hero + CTA al dashboard + contacto de soporte.
 */
import { Link } from 'react-router-dom';
import { User, Sun, Sunset, Moon, LayoutDashboard, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatedPage, Avatar, Badge, Card } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useIsExterno } from '@/hooks/useIsExterno';
import { useIsSuperAdmin } from '@/hooks/usePermissions';
import { JefePortalSection } from './JefePortalSection';

function getGreeting(): { text: string; Icon: LucideIcon } {
  const now = new Date();
  const hour = Number(
    now.toLocaleString('en-US', { timeZone: 'America/Bogota', hour: 'numeric', hour12: false })
  );
  if (hour >= 5 && hour < 12) return { text: 'Buenos días', Icon: Sun };
  if (hour >= 12 && hour < 18) return { text: 'Buenas tardes', Icon: Sunset };
  return { text: 'Buenas noches', Icon: Moon };
}

function getCurrentDateFormatted(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Bogota',
  });
}

export function UserPortalView() {
  const user = useAuthStore((s) => s.user);
  const { primaryColor } = useBrandingConfig();
  const { isExterno, isJefatura } = useIsExterno();
  const isSuperAdmin = useIsSuperAdmin();
  const { text: greetingText, Icon: GreetingIcon } = getGreeting();
  const currentDate = getCurrentDateFormatted();

  const firstName = user?.first_name || 'Usuario';
  const fullName = user?.full_name || user?.first_name || 'Usuario';
  const cargoLabel =
    user?.cargo?.name || (isSuperAdmin ? 'Administrador del Sistema' : 'Sin cargo asignado');

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* Hero */}
        <Card padding="none" className="overflow-hidden">
          <div
            className="h-1.5"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}80)` }}
          />
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar
                src={user?.photo_url || undefined}
                name={fullName}
                size="2xl"
                status={isExterno ? 'external' : 'active'}
                className="ring-4 ring-white dark:ring-gray-800 shadow-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <GreetingIcon className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {greetingText}, {firstName}
                  </span>
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {fullName}
                </h1>
                {user?.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {user.email}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {cargoLabel && <span>{cargoLabel}</span>}
                  {cargoLabel && user?.area_nombre && (
                    <span className="hidden md:inline text-gray-300 dark:text-gray-600">|</span>
                  )}
                  {user?.area_nombre && <span>{user.area_nombre}</span>}
                </div>
                {isExterno && (
                  <Badge variant="info" size="sm" className="mt-2">
                    Colaborador Externo
                  </Badge>
                )}
              </div>
              <div className="hidden md:flex flex-col items-end gap-3 flex-shrink-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 first-letter:uppercase">
                  {currentDate}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Sección Jefe */}
        {isJefatura && <JefePortalSection primaryColor={primaryColor} />}

        {/* Empty state perfil */}
        <Card padding="none" className="overflow-hidden">
          <div className="p-6 md:p-8 text-center space-y-4">
            <div
              className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <User className="w-7 h-7" style={{ color: primaryColor }} />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
                Perfil en proceso de configuración
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                Tu cuenta está activa pero el área de talento humano aún no ha completado tu perfil
                de colaborador. Mientras tanto, puedes acceder a los módulos asignados a tu cargo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <LayoutDashboard className="w-4 h-4" />
                Ir al Dashboard
              </Link>
              <a
                href="mailto:rh@empresa.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Mail className="w-4 h-4" />
                Contactar a Talento Humano
              </a>
            </div>
          </div>
        </Card>
      </div>
    </AnimatedPage>
  );
}
