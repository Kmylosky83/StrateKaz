/**
 * MiPortalPage - Portal del Empleado (ESS)
 * Pagina principal con hero personalizado, stats y tabs para autoservicio.
 *
 * INTELIGENTE: Filtra tabs segun tipo de cargo.
 * - Internos: todas las secciones (perfil, vacaciones, permisos, recibos, capacitaciones, evaluacion)
 * - Externos (contratistas, consultores): perfil, documentos, HSEQ, capacitaciones, evaluacion
 *
 * BRANDING: Usa primaryColor del tenant (NO moduleColor hardcoded)
 */

import { useState, useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useIsSuperAdmin } from '@/hooks/usePermissions';
import {
  User,
  Calendar,
  FileText,
  DollarSign,
  GraduationCap,
  BarChart3,
  FolderOpen,
  BookOpen,
  ShieldCheck,
  Pencil,
  Sun,
  Sunset,
  Moon,
  Camera,
  Eye,
  LayoutDashboard,
  ArrowRight,
  PenTool,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Tabs,
  AnimatedPage,
  Badge,
  Card,
  Avatar,
  Skeleton,
  Button,
  ProfileProgressBar,
} from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useIsExterno } from '@/hooks/useIsExterno';
import { useMiPerfil, useAdminStats } from '../api/miPortalApi';
import {
  MiPerfilCard,
  MiPerfilEditForm,
  MisDocumentos,
  MiHSEQ,
  MiFirmaDigital,
  PortalProveedorView,
  PortalClienteView,
  JefePortalSection,
} from '../components';
import { AvatarUploadModal } from '@/components/common/AvatarUploadModal';
import type { MiPortalTab } from '../types';

// Juego SST desactivado — requiere refactor completo antes de activar
// const GameEntryCard = lazy(() =>
//   import('@/features/sst-game').then((m) => ({ default: m.GameEntryCard }))
// );

const LecturasPendientesTab = lazy(
  () => import('@/features/gestion-documental/components/LecturasPendientesTab')
);

// ============================================================================
// HELPERS
// ============================================================================

function getGreeting(): { text: string; Icon: LucideIcon } {
  const now = new Date();
  const hour = Number(
    now.toLocaleString('en-US', { timeZone: 'America/Bogota', hour: 'numeric', hour12: false })
  );
  if (hour >= 5 && hour < 12) return { text: 'Buenos dias', Icon: Sun };
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

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

/** Tabs que solo aplican a empleados internos (no contratistas) */
const INTERNAL_ONLY_TABS = new Set<MiPortalTab>(['vacaciones', 'permisos', 'recibos']);

/** Tabs que solo aplican a externos (contratistas, consultores) */
const EXTERNAL_ONLY_TABS = new Set<MiPortalTab>(['hseq']);

/**
 * Tabs que requieren apps L60 (talent_hub: novedades, nomina, formacion, desempeno).
 * Se ocultan hasta que se active el Level 60 en INSTALLED_APPS.
 */
const L60_TABS = new Set<MiPortalTab>([
  'vacaciones',
  'permisos',
  'recibos',
  'capacitaciones',
  'evaluacion',
]);

const ALL_PORTAL_TABS = [
  { id: 'perfil' as const, label: 'Mis datos', icon: <User className="w-4 h-4" /> },
  { id: 'firma' as const, label: 'Mi Firma', icon: <PenTool className="w-4 h-4" /> },
  { id: 'lecturas' as const, label: 'Lecturas Pendientes', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'documentos' as const, label: 'Documentos', icon: <FolderOpen className="w-4 h-4" /> },
  { id: 'hseq' as const, label: 'HSEQ', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'vacaciones' as const, label: 'Vacaciones', icon: <Calendar className="w-4 h-4" /> },
  { id: 'permisos' as const, label: 'Permisos', icon: <FileText className="w-4 h-4" /> },
  { id: 'recibos' as const, label: 'Recibos', icon: <DollarSign className="w-4 h-4" /> },
  {
    id: 'capacitaciones' as const,
    label: 'Capacitaciones',
    icon: <GraduationCap className="w-4 h-4" />,
  },
  { id: 'evaluacion' as const, label: 'Evaluación', icon: <BarChart3 className="w-4 h-4" /> },
  // Juego SST desactivado — requiere refactor completo
  // {
  //   id: 'juego_sst' as const,
  //   label: 'Héroes SST',
  //   icon: <Swords className="w-4 h-4" />,
  // },
];

// ============================================================================
// HERO SKELETON
// ============================================================================

function HeroSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="hidden md:flex flex-col items-end gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// ADMIN PORTAL VIEW (Super admin sin Colaborador)
// ============================================================================

function AdminPortalView() {
  const { primaryColor } = useBrandingConfig();
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const [showImpersonation, setShowImpersonation] = useState(false);

  const { text: greeting, Icon: GreetingIcon } = getGreeting();
  const displayName = user?.first_name || user?.username || 'Administrador';

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero: Saludo + rol */}
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  Administrador del Sistema
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {getCurrentDateFormatted()}
                </p>
              </div>
              <Badge variant="primary" size="sm">
                {user?.empresa_nombre || 'Tenant'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Profile progress */}
        <ProfileProgressBar />

        {/* Stats Grid */}
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

        {/* Acciones rapidas */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Acciones r&aacute;pidas
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

        {/* Impersonacion - colapsable */}
        <Card padding="none" className="overflow-hidden">
          <button
            onClick={() => setShowImpersonation(!showImpersonation)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                C&oacute;mo impersonar un usuario
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
                  Ve a <strong>Usuarios</strong> en el men&uacute; lateral
                </li>
                <li>
                  Haz clic en el bot&oacute;n <Eye className="w-3 h-3 inline" /> del usuario que
                  deseas ver
                </li>
                <li>Ver&aacute;s el sistema exactamente como lo ve ese usuario</li>
              </ol>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                La impersonaci&oacute;n queda registrada en el log de auditor&iacute;a del sistema.
              </p>
            </div>
          )}
        </Card>
      </div>
    </AnimatedPage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD (admin dashboard)
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

// ============================================================================
// USER PORTAL VIEW (usuario sin Colaborador pero con cargo)
// ============================================================================

function UserPortalView() {
  const user = useAuthStore((s) => s.user);
  const { primaryColor } = useBrandingConfig();
  const { isExterno, isJefatura } = useIsExterno();
  const isSuperAdmin = useIsSuperAdmin();
  const { text: greetingText, Icon: GreetingIcon } = getGreeting();
  const currentDate = getCurrentDateFormatted();

  const firstName = user?.first_name || 'Usuario';
  const fullName = user?.full_name || user?.first_name || 'Usuario';

  // Etiqueta del cargo: "Administrador del Sistema" para superadmins sin cargo asignado
  const cargoLabel =
    user?.cargo?.name || (isSuperAdmin ? 'Administrador del Sistema' : 'Sin cargo asignado');

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* Hero con datos del User */}
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
                    {greetingText}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {firstName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {cargoLabel && <span>{cargoLabel}</span>}
                  {cargoLabel && user?.area_nombre && (
                    <span className="hidden md:inline text-gray-300 dark:text-gray-600">|</span>
                  )}
                  {user?.area_nombre && <span>{user.area_nombre}</span>}
                  {user?.proveedor_nombre && (
                    <>
                      <span className="hidden md:inline text-gray-300 dark:text-gray-600">|</span>
                      <span>{user.proveedor_nombre}</span>
                    </>
                  )}
                </div>
                {isExterno && (
                  <Badge variant="info" size="sm" className="mt-2">
                    Colaborador Externo
                  </Badge>
                )}
              </div>
              <div className="hidden md:flex flex-col items-end gap-3 flex-shrink-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{currentDate}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Sección Jefe/Líder — funciona sin Colaborador, solo necesita Cargo */}
        {isJefatura && <JefePortalSection />}

        {/* Info: perfil pendiente */}
        <Card padding="none" className="overflow-hidden">
          <div className="p-6 md:p-8 text-center space-y-4">
            <div
              className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <User className="w-7 h-7" style={{ color: primaryColor }} />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Perfil en proceso de configuraci&oacute;n
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                Tu cuenta est&aacute; activa pero el &aacute;rea de talento humano a&uacute;n no ha
                completado tu perfil de colaborador. Mientras tanto, puedes acceder a los
                m&oacute;dulos asignados a tu cargo.
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
            </div>
          </div>
        </Card>
      </div>
    </AnimatedPage>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function MiPortalPage() {
  const [activeTab, setActiveTab] = useState<MiPortalTab>('perfil');
  const [showEditPerfil, setShowEditPerfil] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Auth store for quick name access (already loaded, no API call)
  const user = useAuthStore((s) => s.user);
  const isLoadingUser = useAuthStore((s) => s.isLoadingUser);
  const isSuperAdmin = useIsSuperAdmin();

  // Branding
  const { primaryColor } = useBrandingConfig();

  // Perfil del colaborador — no disparar para superadmins (nunca tienen Colaborador)
  const { data: perfil, isLoading: perfilLoading } = useMiPerfil(!isSuperAdmin);
  const { isExterno, isJefatura } = useIsExterno();
  const _hasPerfil = !!perfil;

  // Greeting
  const { text: greetingText, Icon: GreetingIcon } = getGreeting();
  const currentDate = getCurrentDateFormatted();

  // Nombre para el hero
  const firstName = perfil?.nombre_completo?.split(' ')[0] || user?.first_name || 'Usuario';
  const fullName = perfil?.nombre_completo || user?.full_name || user?.first_name || 'Usuario';

  // Filtrar tabs: excluir L60 (apps apagadas) + por tipo de cargo
  const visibleTabs = useMemo(() => {
    return ALL_PORTAL_TABS.filter((tab) => {
      // Ocultar tabs de apps L60 (no liberadas aún)
      if (L60_TABS.has(tab.id)) return false;
      // Filtrar por interno/externo
      if (isExterno && INTERNAL_ONLY_TABS.has(tab.id)) return false;
      if (!isExterno && EXTERNAL_ONLY_TABS.has(tab.id)) return false;
      return true;
    });
  }, [isExterno]);

  // Si el tab activo fue filtrado, volver a 'perfil'
  const safeActiveTab = visibleTabs.some((t) => t.id === activeTab) ? activeTab : 'perfil';

  // ── Sin Colaborador vinculado ─────────────────────────────────────────────
  // Orden de prioridad de vista:
  // 1. Superadmin sin colaborador → AdminPortalView
  // 2. Proveedor (user.proveedor) sin colaborador → PortalProveedorView
  // 3. Cliente (user.cliente) sin colaborador → PortalClienteView
  // 4. User sin colaborador genérico → UserPortalView
  // 5. User con colaborador → Full Portal (tabs)
  if (!perfilLoading && perfil == null) {
    // Si el User aun no se ha cargado, mostrar skeleton (evitar render prematuro)
    if (isLoadingUser || !user) {
      return (
        <AnimatedPage>
          <div className="space-y-6">
            <HeroSkeleton />
          </div>
        </AnimatedPage>
      );
    }
    // Super admin sin Colaborador → vista informativa de admin
    if (isSuperAdmin) {
      return <AdminPortalView />;
    }
    // Proveedor sin Colaborador → vista informativa de proveedor
    if (user.proveedor) {
      return <PortalProveedorView />;
    }
    // Cliente sin Colaborador → vista informativa de cliente
    if (user.cliente) {
      return <PortalClienteView />;
    }
    // Usuario sin Colaborador genérico (usuarios nuevos sin entidad externa)
    // → vista simplificada con datos del User
    return <UserPortalView />;
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* ================================================================
            HERO SECTION
            ================================================================ */}
        {perfilLoading && !perfil ? (
          <HeroSkeleton />
        ) : (
          <Card padding="none" className="overflow-hidden">
            {/* Gradient accent bar */}
            <div
              className="h-1.5"
              style={{
                background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}80)`,
              }}
            />
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar — clickeable para abrir AvatarUploadModal */}
                <Button
                  variant="ghost"
                  onClick={() => setShowAvatarModal(true)}
                  className="relative group focus:outline-none flex-shrink-0 p-0 h-auto rounded-full hover:bg-transparent"
                  title="Cambiar foto de perfil"
                >
                  <Avatar
                    src={perfil?.foto_url || user?.photo_url || undefined}
                    name={fullName}
                    size="2xl"
                    status={isExterno ? 'external' : 'active'}
                    className="ring-4 ring-white dark:ring-gray-800 shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Button>

                {/* Greeting & Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <GreetingIcon className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {greetingText}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                    {firstName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {perfil?.cargo_nombre && <span>{perfil.cargo_nombre}</span>}
                    {perfil?.cargo_nombre && perfil?.area_nombre && (
                      <span className="hidden md:inline text-gray-300 dark:text-gray-600">|</span>
                    )}
                    {perfil?.area_nombre && <span>{perfil.area_nombre}</span>}
                  </div>
                  {isExterno && (
                    <Badge variant="info" size="sm" className="mt-2">
                      Colaborador Externo
                    </Badge>
                  )}
                </div>

                {/* Right side: Date + Edit (desktop only) */}
                <div className="hidden md:flex flex-col items-end gap-3 flex-shrink-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {currentDate}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditPerfil(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80 p-0 h-auto"
                    style={{ color: primaryColor }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar perfil
                  </Button>
                </div>
              </div>

              {/* Mobile: date + edit button */}
              <div className="flex items-center justify-between mt-4 md:hidden">
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{currentDate}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditPerfil(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80 p-0 h-auto"
                  style={{ color: primaryColor }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar perfil
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ================================================================
            BARRA DE COMPLETITUD DEL PERFIL
            Se auto-oculta cuando el perfil llega al 100%
            ================================================================ */}
        <ProfileProgressBar />

        {/* ================================================================
            SECCION JEFE/LIDER (solo si is_jefatura)
            Stats, equipo directo, aprobaciones pendientes
            ================================================================ */}
        {isJefatura && <JefePortalSection />}

        {/* ================================================================
            TABS
            ================================================================ */}
        <Tabs
          tabs={visibleTabs}
          activeTab={safeActiveTab}
          onChange={(tab) => setActiveTab(tab as MiPortalTab)}
          variant="underline"
        />

        {/* ================================================================
            TAB CONTENT (animated)
            ================================================================ */}
        <motion.div
          key={safeActiveTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {safeActiveTab === 'perfil' && (
            <MiPerfilCard
              perfil={perfil}
              isLoading={perfilLoading}
              onEdit={() => setShowEditPerfil(true)}
              onAvatarClick={() => setShowAvatarModal(true)}
            />
          )}

          {safeActiveTab === 'firma' && <MiFirmaDigital />}

          {safeActiveTab === 'lecturas' && (
            <Suspense fallback={<Skeleton count={3} />}>
              <LecturasPendientesTab />
            </Suspense>
          )}
          {safeActiveTab === 'documentos' && <MisDocumentos />}
          {safeActiveTab === 'hseq' && isExterno && <MiHSEQ />}
          {/* Juego SST desactivado — requiere refactor completo */}
        </motion.div>

        {/* ================================================================
            MODAL EDITAR DATOS PERSONALES (Colaborador)
            ================================================================ */}
        <MiPerfilEditForm
          isOpen={showEditPerfil}
          onClose={() => setShowEditPerfil(false)}
          perfil={perfil}
        />

        {/* ================================================================
            MODAL CAMBIAR FOTO (Avatar — mismo modal que en /perfil)
            ================================================================ */}
        <AvatarUploadModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} />
      </div>
    </AnimatedPage>
  );
}
