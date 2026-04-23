/**
 * AdminPortalView — Vista de Mi Portal para Superadmins sin Colaborador.
 *
 * Muestra saludo + stats del tenant + acciones rápidas + guía de impersonación.
 * No tiene tabs (el superadmin no es empleado).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Sun,
  Sunset,
  Moon,
  Eye,
  LayoutDashboard,
  ArrowRight,
  Pencil,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatedPage, Badge, Card, Skeleton, ProfileProgressBar } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useAdminStats } from '../api/miPortalApi';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  loading,
  color,
  icon,
}: {
  label: string;
  value?: number;
  loading: boolean;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Card padding="lg">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? 0}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export function AdminPortalView() {
  const { primaryColor } = useBrandingConfig();
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const [showImpersonation, setShowImpersonation] = useState(false);

  const { text: greeting, Icon: GreetingIcon } = getGreeting();
  const displayName = user?.first_name || user?.username || 'Administrador';

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero: saludo + rol */}
        <Card padding="none" className="overflow-hidden">
          <div
            className="h-1.5"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}80)` }}
          />
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <ShieldCheck className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <GreetingIcon className="w-4 h-4" />
                  <span>
                    {greeting}, {displayName}
                  </span>
                </div>
                <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  Administrador del Sistema
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 first-letter:uppercase">
                  {getCurrentDateFormatted()}
                </p>
              </div>
              <Badge variant="primary" size="sm">
                {user?.empresa_nombre || 'Tenant'}
              </Badge>
            </div>
          </div>
        </Card>

        <ProfileProgressBar />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Usuarios"
            value={stats?.total}
            loading={statsLoading}
            color={primaryColor}
            icon={<User className="w-5 h-5" />}
          />
          <StatCard
            label="Activos"
            value={stats?.active}
            loading={statsLoading}
            color="#10B981"
            icon={<ShieldCheck className="w-5 h-5" />}
          />
          <StatCard
            label="Inactivos"
            value={stats?.inactive}
            loading={statsLoading}
            color="#F59E0B"
            icon={<User className="w-5 h-5" />}
          />
          <StatCard
            label="Colaboradores"
            value={stats?.by_origen?.colaborador}
            loading={statsLoading}
            color="#6366F1"
            icon={<User className="w-5 h-5" />}
          />
        </div>

        {/* Acciones rápidas */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Acciones rápidas
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/usuarios"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <User className="w-4 h-4" />
              Ver Usuarios
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to="/perfil"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Pencil className="w-4 h-4" />
              Editar Perfil
            </Link>
          </div>
        </Card>

        {/* Impersonación colapsable */}
        <Card padding="none" className="overflow-hidden">
          <button
            onClick={() => setShowImpersonation(!showImpersonation)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Cómo impersonar un usuario
              </span>
            </div>
            <ArrowRight
              className={`w-4 h-4 text-gray-400 transition-transform ${showImpersonation ? 'rotate-90' : ''}`}
            />
          </button>
          {showImpersonation && (
            <div className="px-6 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                <li>
                  Ve a <strong>Usuarios</strong> en el menú lateral
                </li>
                <li>
                  Haz clic en el botón <Eye className="w-3 h-3 inline" /> del usuario que deseas ver
                </li>
                <li>Verás el sistema exactamente como lo ve ese usuario</li>
              </ol>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                La impersonación queda registrada en el log de auditoría del sistema.
              </p>
            </div>
          )}
        </Card>
      </div>
    </AnimatedPage>
  );
}
