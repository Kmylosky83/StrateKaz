/**
 * Dashboard Principal - Página de inicio post-login
 *
 * Muestra módulos del sistema agrupados por capas funcionales (6 layers).
 * Incluye: banner de bienvenida (dismissible) y grid agrupado por layers.
 * Usa componentes del Design System para animaciones.
 */
import { useMemo, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useModulesTree } from '@/hooks/useModules';
import { ModuleCard, ModuleCardSkeleton, ModuleGrid, Alert } from '@/components/common';
import type { ModuleCardColor } from '@/components/common';
import { Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getIconComponent as getDynamicIcon } from '@/components/common/DynamicIcon';

// ============================================================================
// UTILIDADES
// ============================================================================

const getIconComponent = (iconName: string | undefined): LucideIcon => {
  if (!iconName) return Settings;
  const icon = getDynamicIcon(iconName);
  return (icon ?? Settings) as LucideIcon;
};

/**
 * Mapeo de módulos a sus rutas base
 * Sincronizado con routes/index.tsx y seed_estructura_final.py
 */
const MODULE_ROUTES: Record<string, string> = {
  fundacion: '/fundacion',
  planeacion_estrategica: '/planeacion-estrategica',
  sistema_gestion: '/sistema-gestion',
  motor_cumplimiento: '/cumplimiento',
  motor_riesgos: '/riesgos',
  workflow_engine: '/workflows',
  hseq_management: '/hseq',
  supply_chain: '/supply-chain',
  production_ops: '/produccion',
  logistics_fleet: '/logistica',
  sales_crm: '/ventas',
  talent_hub: '/talento',
  admin_finance: '/finanzas',
  accounting: '/contabilidad',
  analytics: '/analytics',
  revision_direccion: '/revision-direccion',
  audit_system: '/auditoria',
};

/**
 * Mapeo de tabs a sus rutas (slug)
 * Solo para tabs que tienen ruta diferente al código
 */
const TAB_ROUTES: Record<string, string> = {
  // Cumplimiento
  matriz_legal: 'matriz-legal',
  requisitos_legales: 'requisitos-legales',
  reglamentos_internos: 'reglamentos-internos',
  // Riesgos
  riesgos_procesos: 'procesos',
  aspectos_ambientales: 'ambientales',
  riesgos_viales: 'viales',
  sagrilaft_ptee: 'sagrilaft',
  seguridad_informacion: 'seguridad-info',
  // Workflows
  disenador_flujos: 'disenador',
  // HSEQ
  sistema_documental: 'sistema-documental',
  planificacion_hseq: 'planificacion',
  medicina_laboral: 'medicina-laboral',
  seguridad_industrial: 'seguridad-industrial',
  higiene_industrial: 'higiene-industrial',
  gestion_comites: 'comites',
  gestion_ambiental: 'gestion-ambiental',
  mejora_continua: 'mejora-continua',
  // Sistema de Gestión
  gestion_documental: 'documentos',
  planificacion_sistema: 'planificacion',
  auditorias_internas: 'auditorias',
  acciones_mejora: 'acciones',
  // Planeación Estratégica
  gestion_proyectos: 'proyectos',
  riesgos_oportunidades: 'riesgos-oportunidades',
  // Supply Chain
  materia_prima: 'materia-prima',
  productos_servicios: 'productos-servicios',
  pruebas_acidez: 'pruebas-acidez',
  // Producción
  producto_terminado: 'producto-terminado',
  // Logística
  control_tiempo: 'control-tiempo',
  // Talento
  off_boarding: 'off-boarding',
  // Finanzas
  activos_fijos: 'activos-fijos',
  servicios_generales: 'servicios-generales',
  // Analytics
  config_indicadores: 'configuracion',
  dashboard_gerencial: 'dashboards',
  indicadores_area: 'indicadores',
  analisis_tendencias: 'analisis',
  generador_informes: 'informes',
  acciones_indicador: 'acciones',
  // Auditoría
  logs_sistema: 'logs',
};

const getModuleRoute = (module: {
  code: string;
  route?: string;
  tabs?: {
    code: string;
    route?: string;
    is_enabled: boolean;
  }[];
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
// PÁGINA PRINCIPAL
// ============================================================================

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const tenantUser = useAuthStore((state) => state.tenantUser);
  const { companyName } = useBrandingConfig();
  const { data: modulesTree, isLoading } = useModulesTree();

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

  // Agrupar módulos por layers del backend
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

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.25, staggerChildren: 0.03 } },
      }}
    >
      {/* Banner de bienvenida (dismissible) */}
      {showWelcome && (
        <motion.div variants={headerVariants}>
          <Alert
            variant="info"
            title="¡Bienvenido a StrateKaz!"
            message="Tu sistema de gestión integral está listo. Comienza configurando tu empresa en Fundación → Configuración Organizacional, luego explora los módulos disponibles."
            closable
            onClose={dismissWelcome}
          />
        </motion.div>
      )}

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

      {/* Grid de módulos agrupados por layers */}
      {isLoading ? (
        <motion.section variants={headerVariants}>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Módulos del Sistema
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ModuleCardSkeleton key={i} />
            ))}
          </div>
        </motion.section>
      ) : layeredModules ? (
        <div className="space-y-6">
          {layeredModules.map((layer) => {
            const LayerIcon = getIconComponent(layer.icon);
            return (
              <motion.section key={layer.code} variants={headerVariants}>
                <div className="flex items-center gap-2 mb-3">
                  <LayerIcon className="h-4 w-4 flex-shrink-0" style={{ color: layer.color }} />
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {layer.name}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
                <ModuleGrid>
                  {layer.modules.map((module) => (
                    <ModuleCard
                      key={module.code}
                      icon={getIconComponent(module.icon)}
                      title={module.name}
                      description={module.description}
                      color={module.color as ModuleCardColor}
                      sectionsCount={module.tabs?.filter((t) => t.is_enabled).length}
                      to={getModuleRoute(module)}
                    />
                  ))}
                </ModuleGrid>
              </motion.section>
            );
          })}
        </div>
      ) : (
        /* Fallback: grid plano si el backend no retorna layers */
        <motion.section variants={headerVariants}>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Módulos del Sistema
          </h2>
          <ModuleGrid>
            {enabledModules.map((module) => (
              <ModuleCard
                key={module.code}
                icon={getIconComponent(module.icon)}
                title={module.name}
                description={module.description}
                color={module.color as ModuleCardColor}
                sectionsCount={module.tabs?.filter((t) => t.is_enabled).length}
                to={getModuleRoute(module)}
              />
            ))}
          </ModuleGrid>
        </motion.section>
      )}
    </motion.div>
  );
};
