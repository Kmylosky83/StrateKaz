/**
 * MiPortalPage — Portal del empleado (ESS).
 *
 * Estructura:
 *   1. Hero — identidad + saludo contextual (nombre, cargo, email, fecha)
 *   2. ProfileProgressBar — se auto-oculta al 100%
 *   3. JefePortalSection — solo si cargo.is_jefatura
 *   4. Tabs con contadores — deep navigation; badge ámbar por tab indica
 *      pendientes del empleado (firmas, lecturas, encuestas).
 *
 * Branch de vistas:
 *   - Superadmin sin Colaborador → AdminPortalView
 *   - User sin Colaborador → UserPortalView
 *   - User con Colaborador → Portal completo (este componente)
 *
 * Portales externos (proveedores/clientes) viven en apps separadas bajo
 * apps/portales/ — ver H-PORTAL-02 (patrón de acceso externo).
 */

import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  BookOpen,
  Sun,
  Sunset,
  Moon,
  Camera,
  PenTool,
  ClipboardList,
  AtSign,
  UserCog,
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
import { useIsSuperAdmin } from '@/hooks/usePermissions';
import { useMiPerfil, useMiPortalResumen } from '../api/miPortalApi';
import {
  MisDocumentos,
  MiFirmaDigital,
  JefePortalSection,
  MisEncuestasPendientes,
  AdminPortalView,
  UserPortalView,
} from '../components';
import { AvatarUploadModal } from '@/components/common/AvatarUploadModal';
import type { MiPortalTab } from '../types';

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

// ============================================================================
// TABS BASE (sin counts — se injerta dinámicamente desde resumen)
// ============================================================================

const BASE_TABS: Array<{ id: MiPortalTab; label: string; icon: React.ReactNode }> = [
  { id: 'firma', label: 'Mi Firma', icon: <PenTool className="w-4 h-4" /> },
  { id: 'lecturas', label: 'Lecturas', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'encuestas', label: 'Encuestas', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'documentos', label: 'Documentos', icon: <FolderOpen className="w-4 h-4" /> },
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
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function MiPortalPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<MiPortalTab>('firma');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const { user, isLoadingUser } = useAuthStore(
    useShallow((s) => ({ user: s.user, isLoadingUser: s.isLoadingUser }))
  );
  const isSuperAdmin = useIsSuperAdmin();
  const { primaryColor } = useBrandingConfig();

  const { data: perfil, isLoading: perfilLoading } = useMiPerfil(!isSuperAdmin);
  const { isExterno, isJefatura } = useIsExterno();
  const { resumen } = useMiPortalResumen(!isSuperAdmin);

  const { text: greetingText, Icon: GreetingIcon } = getGreeting();
  const currentDate = getCurrentDateFormatted();

  const firstName = perfil?.nombre_completo?.split(' ')[0] || user?.first_name || 'Usuario';
  const fullName = perfil?.nombre_completo || user?.full_name || user?.first_name || 'Usuario';

  // Tabs con contadores dinámicos
  const visibleTabs = useMemo(
    () =>
      BASE_TABS.map((tab) => {
        if (tab.id === 'firma')
          return { ...tab, count: resumen.firmas, countTone: 'attention' as const };
        if (tab.id === 'lecturas')
          return { ...tab, count: resumen.lecturas, countTone: 'attention' as const };
        if (tab.id === 'encuestas')
          return { ...tab, count: resumen.encuestas, countTone: 'attention' as const };
        return tab;
      }),
    [resumen.firmas, resumen.lecturas, resumen.encuestas]
  );

  const safeActiveTab = visibleTabs.some((t) => t.id === activeTab) ? activeTab : 'firma';

  // Tab desde URL (?tab=X) — útil para deep links desde notificaciones
  const tabFromUrl = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') as MiPortalTab | null;
  }, [location.search]);

  useEffect(() => {
    if (!tabFromUrl) return;
    if (visibleTabs.some((t) => t.id === tabFromUrl)) setActiveTab(tabFromUrl);
  }, [tabFromUrl, visibleTabs]);

  // ── Sin Colaborador ────────────────────────────────────────────────────────
  if (!perfilLoading && perfil == null) {
    if (isLoadingUser || !user) {
      return (
        <AnimatedPage>
          <div className="space-y-6">
            <HeroSkeleton />
          </div>
        </AnimatedPage>
      );
    }
    if (isSuperAdmin) return <AdminPortalView />;
    return <UserPortalView />;
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* ================================================================
            HERO — identidad + saludo + fecha
            ================================================================ */}
        {perfilLoading && !perfil ? (
          <HeroSkeleton />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div
              className="h-1.5"
              style={{
                background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}80)`,
              }}
            />
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar con overlay de cambio de foto */}
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
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Button>

                {/* Identidad */}
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

                  {/* Cargo · Área */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {perfil?.cargo_nombre && (
                      <span className="font-medium">{perfil.cargo_nombre}</span>
                    )}
                    {perfil?.cargo_nombre && perfil?.area_nombre && (
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                    )}
                    {perfil?.area_nombre && <span>{perfil.area_nombre}</span>}
                  </div>

                  {/* Email del sistema — verificación visual */}
                  {(perfil?.email || user?.email) && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <AtSign className="w-3 h-3" />
                      <span className="truncate">{perfil?.email || user?.email}</span>
                    </div>
                  )}

                  {/* Badges: externo + jefe */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {isExterno && (
                      <Badge variant="info" size="sm">
                        Colaborador Externo
                      </Badge>
                    )}
                    {isJefatura && (
                      <Badge variant="primary" size="sm">
                        Jefe / Líder
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Fecha + Ver perfil (desktop) */}
                <div className="hidden md:flex flex-col items-end gap-3 flex-shrink-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400 first-letter:uppercase">
                    {currentDate}
                  </p>
                  <Link
                    to="/perfil"
                    className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: primaryColor }}
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    Ver mi perfil
                  </Link>
                </div>
              </div>

              {/* Mobile: fecha + ver perfil */}
              <div className="flex items-center justify-between mt-4 md:hidden">
                <p className="text-sm text-gray-500 dark:text-gray-400 first-letter:uppercase">
                  {currentDate}
                </p>
                <Link
                  to="/perfil"
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: primaryColor }}
                >
                  <UserCog className="w-3.5 h-3.5" />
                  Ver mi perfil
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* ================================================================
            PROFILE PROGRESS BAR — se auto-oculta al 100%
            ================================================================ */}
        <ProfileProgressBar />

        {/* ================================================================
            SECCIÓN JEFE (solo si is_jefatura)
            ================================================================ */}
        {isJefatura && <JefePortalSection primaryColor={primaryColor} />}

        {/* ================================================================
            TABS + CONTENIDO
            ================================================================ */}
        <div>
          <Tabs
            tabs={visibleTabs}
            activeTab={safeActiveTab}
            onChange={(tab) => setActiveTab(tab as MiPortalTab)}
            variant="underline"
          />

          <motion.div
            key={safeActiveTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-6"
          >
            {safeActiveTab === 'firma' && <MiFirmaDigital />}

            {safeActiveTab === 'encuestas' && <MisEncuestasPendientes />}

            {safeActiveTab === 'lecturas' && (
              <Suspense fallback={<Skeleton count={3} />}>
                <LecturasPendientesTab />
              </Suspense>
            )}
            {safeActiveTab === 'documentos' && <MisDocumentos />}
          </motion.div>
        </div>

        {/* ================================================================
            MODALES (solo foto — el edit de datos personales vive en /perfil)
            ================================================================ */}
        <AvatarUploadModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} />
      </div>
    </AnimatedPage>
  );
}
