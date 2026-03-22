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
  Swords,
  PenTool,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tabs, AnimatedPage, Badge, Card, Avatar, Skeleton, Button } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useIsExterno } from '@/hooks/useIsExterno';
import { useMiPerfil } from '../api/miPortalApi';
import { MiPerfilCard, MiPerfilEditForm, MisDocumentos, MiHSEQ, MiFirmaDigital } from '../components';
import { AvatarUploadModal } from '@/components/common/AvatarUploadModal';
import type { MiPortalTab } from '../types';

const GameEntryCard = lazy(() =>
  import('@/features/sst-game').then((m) => ({ default: m.GameEntryCard }))
);

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
  {
    id: 'juego_sst' as const,
    label: 'Héroes SST',
    icon: <Swords className="w-4 h-4" />,
  },
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

  return (
    <AnimatedPage>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card padding="none" className="overflow-hidden">
          {/* Gradient accent bar */}
          <div
            className="h-1.5"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}80)` }}
          />
          <div className="p-8 text-center space-y-6">
            {/* Icono */}
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <ShieldCheck className="w-8 h-8" style={{ color: primaryColor }} />
            </div>

            {/* Titulo y descripcion */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Portal del Administrador
              </h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Como administrador del sistema, no tienes un perfil de colaborador asociado a esta
                empresa. Usa la <strong>impersonaci&oacute;n</strong> para ver el portal como
                cualquier usuario.
              </p>
            </div>

            {/* Instrucciones de impersonacion */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-left">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4" />
                C&oacute;mo impersonar un usuario
              </h3>
              <ol className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                <li>
                  Ve a <strong>Usuarios</strong> en el men&uacute; lateral
                </li>
                <li>
                  Haz clic en el bot&oacute;n <Eye className="w-3 h-3 inline" /> del usuario que
                  deseas ver
                </li>
                <li>Ver&aacute;s el sistema exactamente como lo ve ese usuario</li>
              </ol>
            </div>

            {/* Acciones rapidas */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <LayoutDashboard className="w-4 h-4" />
                Ir al Dashboard
              </Link>
              <Link
                to="/usuarios"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Ver Usuarios
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </AnimatedPage>
  );
}

// ============================================================================
// USER PORTAL VIEW (usuario sin Colaborador pero con cargo)
// ============================================================================

function UserPortalView() {
  const user = useAuthStore((s) => s.user);
  const { primaryColor } = useBrandingConfig();
  const { isExterno } = useIsExterno();
  const { text: greetingText, Icon: GreetingIcon } = getGreeting();
  const currentDate = getCurrentDateFormatted();

  const firstName = user?.first_name || 'Usuario';
  const fullName = user?.full_name || user?.first_name || 'Usuario';

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
                  {user?.cargo?.name && <span>{user.cargo.name}</span>}
                  {user?.cargo?.name && user?.area_nombre && (
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
  const { isExterno } = useIsExterno();
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
  // NOTA: Usuarios portal-only (proveedor + PROVEEDOR_PORTAL cargo) NUNCA
  // llegan aqui — AdaptiveLayout los redirige a /proveedor-portal antes.
  // Los profesionales colocados (proveedor + cargo real) SI pueden llegar.
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
    // Usuario sin Colaborador (consultores colocados, usuarios nuevos)
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
          {safeActiveTab === 'juego_sst' && (
            <Suspense
              fallback={<div className="py-8 text-center text-gray-400 text-sm">Cargando...</div>}
            >
              <GameEntryCard />
            </Suspense>
          )}
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
