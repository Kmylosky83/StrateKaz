/**
 * Dashboard Principal - Página de inicio post-login
 *
 * Muestra módulos del sistema agrupados en carriles horizontales por capa,
 * organizados bajo super-headers del ciclo PHVA (Planear → Hacer → Verificar + Actuar).
 * Cada carril tiene una barra de color identificadora de la capa.
 * Usa Framer Motion para animaciones stagger y hover.
 */
import { lazy, Suspense, useMemo, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useModulesTree } from '@/hooks/useModules';
import { FundacionChecklist, useFundacionProgress } from '@/features/gestion-estrategica';
import { ModuleCardSkeleton, Alert } from '@/components/common';
import type { ModuleCardColor } from '@/components/common';
import { ChevronRight, Settings, ClipboardList, Cog, SearchCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getIconComponent as getDynamicIcon } from '@/components/common/DynamicIcon';
import { cn } from '@/utils/cn';
import { getMappedColorSafe } from '@/utils/moduleColors';
import { PHVA_COLORS } from '@/constants/defaults';
import { useIsSuperAdmin } from '@/hooks/usePermissions';

import { TwoFactorSuggestionBanner } from '@/components/common/TwoFactorSuggestionBanner';
const SmartOnboardingChecklist = lazy(() => import('@/components/common/SmartOnboardingChecklist'));
import { useOnboarding, useReopenOnboarding } from '@/hooks/useOnboarding';
import { useHabeasDataStatus } from '@/features/gestion-documental/hooks/useAceptacionDocumental';

import {
  moduleCardHoverVariants,
  moduleIconVariants,
  moduleChevronVariants,
  transitions,
} from '@/lib/animations';

// ============================================================================
// UTILIDADES
// ============================================================================

const getIconComponent = (iconName: string | undefined): LucideIcon => {
  if (!iconName) return Settings;
  const icon = getDynamicIcon(iconName);
  return (icon ?? Settings) as LucideIcon;
};

const MODULE_ROUTES: Record<string, string> = {
  // ═══ PLANEAR ═══
  fundacion: '/fundacion',
  gestion_documental: '/gestion-documental',
  workflow_engine: '/workflows',
  mi_equipo: '/mi-equipo',
  planificacion_operativa: '/planificacion-operativa',
  planeacion_estrategica: '/planeacion-estrategica',
  // ═══ HACER ═══
  proteccion_cumplimiento: '/proteccion',
  gestion_integral: '/gestion-integral',
  supply_chain: '/supply-chain',
  production_ops: '/produccion',
  logistics_fleet: '/logistica',
  sales_crm: '/ventas',
  talent_hub: '/talento',
  administracion: '/administracion',
  tesoreria: '/tesoreria',
  accounting: '/contabilidad',
  // ═══ VERIFICAR + ACTUAR ═══
  analytics: '/analytics',
  revision_direccion: '/revision-direccion',
  acciones_mejora: '/acciones-mejora',
  // ═══ INFRAESTRUCTURA ═══
  audit_system: '/auditoria',
};

const TAB_ROUTES: Record<string, string> = {
  // ── Fundación ──
  mi_empresa: 'mi-empresa',
  contexto_identidad: 'contexto-identidad',
  organizacion: 'organizacion',
  // ── Gestión Documental ──
  gestion_documental: 'documentos',
  auditorias_internas: 'auditorias',
  // ── Workflows ──
  disenador_flujos: 'disenador',
  // ── Mi Equipo ──
  perfiles_cargo: 'perfiles-cargo',
  seleccion_contratacion: 'seleccion',
  colaboradores: 'colaboradores',
  onboarding_induccion: 'onboarding',
  // ── Planificación Operativa ──
  planificacion_sistema: 'planificacion',
  // ── Planeación Estratégica ──
  riesgos_oportunidades: 'riesgos-oportunidades',
  gestion_proyectos: 'proyectos',
  // ── Protección y Cumplimiento ──
  cumplimiento_legal: 'cumplimiento-legal',
  riesgos_procesos: 'riesgos-procesos',
  ipevr: 'ipevr',
  aspectos_ambientales: 'aspectos-ambientales',
  riesgos_viales: 'riesgos-viales',
  sagrilaft_ptee: 'sagrilaft',
  seguridad_informacion: 'seguridad-info',
  // ── Gestión Integral (HSEQ) ──
  medicina_laboral: 'medicina-laboral',
  seguridad_industrial: 'seguridad-industrial',
  higiene_industrial: 'higiene-industrial',
  gestion_comites: 'comites',
  accidentalidad: 'accidentalidad',
  emergencias: 'emergencias',
  gestion_ambiental: 'gestion-ambiental',
  // ── Production Ops ──
  producto_terminado: 'producto-terminado',
  mantenimiento_industrial: 'mantenimiento',
  // ── Logistics Fleet ──
  gestion_transporte: 'transporte',
  gestion_flota: 'flota',
  pesv_operativo: 'pesv',
  // ── Talent Hub ──
  formacion_reinduccion: 'formacion',
  desempeno: 'desempeno',
  control_tiempo: 'control-tiempo',
  novedades_nomina: 'novedades-nomina',
  proceso_disciplinario: 'disciplinario',
  off_boarding: 'off-boarding',
  consultores_externos: 'consultores-externos',
  // ── Administración ──
  activos_fijos: 'activos-fijos',
  servicios_generales: 'servicios-generales',
  presupuesto: 'presupuesto',
  // ── Tesorería ──
  tesoreria: 'tesoreria',
  pagos: 'pagos',
  // ── Contabilidad ──
  config_contable: 'configuracion',
  informes_contables: 'informes',
  // ── Analytics ──
  dashboard_gerencial: 'dashboards',
  indicadores_area: 'indicadores',
  analisis_tendencias: 'analisis',
  generador_informes: 'informes',
  acciones_indicador: 'acciones',
  // ── Audit System ──
  logs_sistema: 'logs',
};

const getModuleRoute = (module: {
  code: string;
  route?: string;
  tabs?: { code: string; route?: string; is_enabled: boolean }[];
}): string => {
  const baseRoute =
    MODULE_ROUTES[module.code] ||
    module.route ||
    `/${module.code.toLowerCase().replace(/_/g, '-')}`;

  if (module.tabs && module.tabs.length > 0) {
    const firstTab = module.tabs.find((t) => t.is_enabled) || module.tabs[0];
    const tabSlug =
      TAB_ROUTES[firstTab.code] || firstTab.route || firstTab.code.toLowerCase().replace(/_/g, '-');
    return `${baseRoute}/${tabSlug}`;
  }

  return baseRoute;
};

// ============================================================================
// COLORES PARA CARDS (inline, reutiliza moduleColors pattern)
// ============================================================================

const cardColorConfig: Record<
  string,
  { bg: string; icon: string; border: string; badge: string; ring: string }
> = {
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    ring: 'ring-purple-200 dark:ring-purple-800',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    ring: 'ring-blue-200 dark:ring-blue-800',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    ring: 'ring-orange-200 dark:ring-orange-800',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
    ring: 'ring-teal-200 dark:ring-teal-800',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    ring: 'ring-red-200 dark:ring-red-800',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    icon: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    ring: 'ring-gray-200 dark:ring-gray-700',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    ring: 'ring-yellow-200 dark:ring-yellow-800',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    icon: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    ring: 'ring-pink-200 dark:ring-pink-800',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    ring: 'ring-indigo-200 dark:ring-indigo-800',
  },
};

const getCardColors = (color: string | undefined | null) => {
  const mapped = getMappedColorSafe(color);
  return cardColorConfig[mapped] || cardColorConfig.blue;
};

// ============================================================================
// LANE MODULE CARD (inline — optimizado para layout horizontal)
// ============================================================================

interface LaneModuleCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  color?: string;
  sectionsCount?: number;
  to: string;
}

function LaneModuleCard({
  icon: Icon,
  title,
  description,
  color,
  sectionsCount,
  to,
}: LaneModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = getCardColors(color);

  const shortDesc = description
    ? description.length > 70
      ? description.substring(0, 67) + '...'
      : description
    : null;

  return (
    <motion.div
      variants={moduleCardHoverVariants}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="flex-shrink-0 w-[260px] sm:w-[280px]"
    >
      <Link
        to={to}
        className={cn(
          'block h-full rounded-xl border bg-white dark:bg-gray-800',
          'transition-shadow duration-300',
          colors.border,
          isHovered && 'shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50'
        )}
      >
        <div className="p-4">
          {/* Icon + Title + Chevron */}
          <div className="flex items-start gap-3">
            <motion.div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                colors.bg,
                'transition-all duration-200',
                isHovered && 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800',
                isHovered && colors.ring
              )}
              variants={moduleIconVariants}
              animate={isHovered ? 'hover' : 'idle'}
            >
              <Icon className={cn('w-5 h-5', colors.icon)} strokeWidth={2} />
            </motion.div>
            <div className="flex-grow min-w-0">
              <h3
                className={cn(
                  'font-semibold text-sm text-gray-900 dark:text-white truncate',
                  'transition-colors duration-200',
                  isHovered && colors.icon
                )}
              >
                {title}
              </h3>
              {shortDesc && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                  {shortDesc}
                </p>
              )}
            </div>
            <motion.div variants={moduleChevronVariants} animate={isHovered ? 'hover' : 'idle'}>
              <ChevronRight
                className={cn(
                  'flex-shrink-0 w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5',
                  'transition-colors duration-200',
                  isHovered && colors.icon
                )}
              />
            </motion.div>
          </div>

          {/* Badge */}
          {sectionsCount !== undefined && sectionsCount > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colors.badge)}>
                {sectionsCount} {sectionsCount === 1 ? 'sección' : 'secciones'}
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// LANE SKELETON
// ============================================================================

function LaneSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex">
        <div className="w-1.5 bg-gray-200 dark:bg-gray-700 animate-pulse-subtle flex-shrink-0" />
        <div className="flex-1 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse-subtle" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse-subtle" />
          </div>
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[260px] flex-shrink-0">
                <ModuleCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const tenantUser = useAuthStore((state) => state.tenantUser);
  const { companyName } = useBrandingConfig();
  const { data: modulesTree, isLoading } = useModulesTree();
  const { data: fundacionProgress } = useFundacionProgress();
  const isSuperAdmin = useIsSuperAdmin();

  const { data: onboardingData } = useOnboarding();
  const reopenMutation = useReopenOnboarding();
  const { data: habeasData } = useHabeasDataStatus();

  const [showWelcome, setShowWelcome] = useState(
    !localStorage.getItem('stratekaz_welcome_dismissed')
  );

  const dismissWelcome = () => {
    localStorage.setItem('stratekaz_welcome_dismissed', 'true');
    setShowWelcome(false);
  };

  const enabledModules = useMemo(() => {
    if (!modulesTree?.modules) return [];
    return modulesTree.modules.filter((m) => m.is_enabled).sort((a, b) => a.orden - b.orden);
  }, [modulesTree]);

  const layeredModules = useMemo(() => {
    if (!modulesTree?.layers?.length || !enabledModules.length) return null;

    return modulesTree.layers
      .map((layer) => {
        const layerCodes = new Set(layer.module_codes);
        const modules = enabledModules.filter((m) => layerCodes.has(m.code));
        return { ...layer, modules };
      })
      .filter((layer) => layer.modules.length > 0);
  }, [modulesTree, enabledModules]);

  /** Agrupar layers por fase PHVA para super-headers */
  const phvaGroups = useMemo(() => {
    if (!layeredModules) return null;

    const phaseOrder: Array<{ key: string; label: string; icon: LucideIcon; color: string }> = [
      { key: 'PLANEAR', label: 'Planear', icon: ClipboardList, color: PHVA_COLORS.PLANEAR },
      { key: 'HACER', label: 'Hacer', icon: Cog, color: PHVA_COLORS.HACER },
      {
        key: 'VERIFICAR_ACTUAR',
        label: 'Verificar + Actuar',
        icon: SearchCheck,
        color: PHVA_COLORS.VERIFICAR_ACTUAR,
      },
    ];

    return phaseOrder
      .map((phase) => {
        const layers = layeredModules.filter((l) => l.phase === phase.key);
        return { ...phase, layers };
      })
      .filter((g) => g.layers.length > 0);
  }, [layeredModules]);

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  const laneVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  const cardStaggerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { ...transitions.stagger, staggerChildren: 0.06 },
    },
  };

  const cardItemVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.25, staggerChildren: 0.08 } },
      }}
    >
      {/* Banner de bienvenida */}
      {showWelcome && (
        <motion.div variants={headerVariants}>
          <Alert
            variant="info"
            title="¡Bienvenido a StrateKaz!"
            message="Tu sistema de gestión integral está listo. Comienza configurando tu empresa en Fundación, luego explora los módulos disponibles."
            closable
            onClose={dismissWelcome}
          />
        </motion.div>
      )}

      {/* Onboarding checklist inteligente — personalizado por tipo de usuario */}
      <Suspense fallback={null}>
        <motion.div variants={headerVariants}>
          <SmartOnboardingChecklist />
        </motion.div>
      </Suspense>

      {/* D3: Botón para reabrir checklist descartado pero no completado */}
      {onboardingData?.dismissed && !onboardingData?.completed && (
        <motion.div variants={headerVariants}>
          <button
            type="button"
            onClick={() => reopenMutation.mutate()}
            disabled={reopenMutation.isPending}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline transition-colors disabled:opacity-50"
          >
            {reopenMutation.isPending ? 'Reabriendo...' : 'Reabrir checklist de configuración'}
          </button>
        </motion.div>
      )}

      {/* Banner Habeas Data — solo para admins si la política no está publicada */}
      {isSuperAdmin && habeasData && habeasData.estado !== 'PUBLICADO' && (
        <motion.div variants={headerVariants}>
          <Alert
            variant="warning"
            title="Política de Datos Personales pendiente"
            message={
              habeasData.mensaje ||
              'Su empresa no tiene Política de Tratamiento de Datos Personales publicada. Publíquela desde Gestión Documental para cumplir con la Ley 1581/2012.'
            }
            closable
          />
        </motion.div>
      )}

      {/* Sugerencia de 2FA para superadmins sin verificación en dos pasos */}
      <motion.div variants={headerVariants}>
        <TwoFactorSuggestionBanner />
      </motion.div>

      {/* Header */}
      <motion.header variants={headerVariants}>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Bienvenido,{' '}
          {user?.first_name || tenantUser?.first_name || tenantUser?.email?.split('@')[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Sistema Integrado de Gestión •{' '}
          <span className="font-medium text-primary-600 dark:text-primary-400">{companyName}</span>
        </p>
      </motion.header>

      {/* Checklist de Fundación — oculto para superadmins (SmartOnboarding admin ya lo cubre) */}
      {fundacionProgress && !isSuperAdmin && (
        <motion.div variants={headerVariants}>
          <FundacionChecklist data={fundacionProgress} />
        </motion.div>
      )}

      {/* Carriles de módulos agrupados por ciclo PHVA */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <LaneSkeleton key={i} />
          ))}
        </div>
      ) : phvaGroups ? (
        <div className="space-y-6">
          {phvaGroups.map((phase) => {
            const PhaseIcon = phase.icon;
            return (
              <motion.div key={phase.key} variants={laneVariants} className="space-y-3">
                {/* Super-header PHVA — sutil separador de fase */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${phase.color}12` }}
                  >
                    <PhaseIcon
                      className="w-3.5 h-3.5"
                      style={{ color: phase.color }}
                      strokeWidth={2.5}
                    />
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: phase.color }}
                  >
                    {phase.label}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: `${phase.color}20` }} />
                </div>

                {/* Lanes de esta fase */}
                <div className="space-y-3">
                  {phase.layers.map((layer) => {
                    const LayerIcon = getIconComponent(layer.icon);
                    return (
                      <motion.section
                        key={layer.code}
                        variants={laneVariants}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
                      >
                        <div className="flex">
                          <div
                            className="w-1.5 flex-shrink-0 rounded-l-xl"
                            style={{ backgroundColor: layer.color }}
                          />
                          <div className="flex-1 min-w-0 p-4">
                            <div className="flex items-center gap-2.5 mb-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${layer.color}15` }}
                              >
                                <LayerIcon
                                  className="h-4.5 w-4.5"
                                  style={{ color: layer.color }}
                                  strokeWidth={2}
                                />
                              </div>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                  {layer.name}
                                </h2>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {layer.modules.length}{' '}
                                  {layer.modules.length === 1 ? 'módulo' : 'módulos'}
                                </span>
                                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700/50" />
                              </div>
                            </div>
                            <motion.div
                              className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
                              variants={cardStaggerVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {layer.modules.map((module) => (
                                <motion.div key={module.code} variants={cardItemVariants}>
                                  <LaneModuleCard
                                    icon={getIconComponent(module.icon)}
                                    title={module.name}
                                    description={module.description}
                                    color={module.color as ModuleCardColor}
                                    sectionsCount={module.tabs?.filter((t) => t.is_enabled).length}
                                    to={getModuleRoute(module)}
                                  />
                                </motion.div>
                              ))}
                            </motion.div>
                          </div>
                        </div>
                      </motion.section>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Fallback: carriles simples si el backend no retorna layers */
        <motion.section variants={headerVariants}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-3">
              Módulos del Sistema
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {enabledModules.map((module) => (
                <LaneModuleCard
                  key={module.code}
                  icon={getIconComponent(module.icon)}
                  title={module.name}
                  description={module.description}
                  color={module.color as ModuleCardColor}
                  sectionsCount={module.tabs?.filter((t) => t.is_enabled).length}
                  to={getModuleRoute(module)}
                />
              ))}
            </div>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
};
