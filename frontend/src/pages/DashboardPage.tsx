/**
 * Dashboard Principal - Página de inicio post-login
 *
 * Muestra módulos del sistema agrupados por capas funcionales (6 layers).
 * Incluye: banner de bienvenida (dismissible), accesos rápidos y grid agrupado.
 * Usa componentes del Design System para animaciones.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useModulesTree } from '@/hooks/useModules';
import { ModuleCard, ModuleCardSkeleton, ModuleGrid, Alert, Card } from '@/components/common';
import type { ModuleCardColor } from '@/components/common';
import {
  Settings,
  AlertTriangle,
  FolderOpen,
  CheckSquare,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
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
// ACCESOS RÁPIDOS
// ============================================================================

interface QuickAccessItem {
  label: string;
  description: string;
  icon: LucideIcon;
  to: string;
  moduleCode: string;
  color: string;
}

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    label: 'Gestión de Riesgos',
    description: 'Ver y registrar riesgos del sistema',
    icon: AlertTriangle,
    to: '/riesgos/procesos',
    moduleCode: 'motor_riesgos',
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
  },
  {
    label: 'Documentos',
    description: 'Acceder al sistema documental',
    icon: FolderOpen,
    to: '/sistema-gestion/documentos',
    moduleCode: 'sistema_gestion',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  },
  {
    label: 'No Conformidades',
    description: 'Registrar y hacer seguimiento',
    icon: CheckSquare,
    to: '/sistema-gestion/acciones',
    moduleCode: 'sistema_gestion',
    color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  },
  {
    label: 'Indicadores',
    description: 'Ver KPIs y dashboards gerenciales',
    icon: BarChart3,
    to: '/analytics/indicadores',
    moduleCode: 'analytics',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  },
  {
    label: 'Cumplimiento Legal',
    description: 'Matriz de requisitos legales',
    icon: ShieldCheck,
    to: '/cumplimiento/matriz-legal',
    moduleCode: 'motor_cumplimiento',
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  },
];

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

  const enabledModuleCodes = useMemo(
    () => new Set(enabledModules.map((m) => m.code)),
    [enabledModules]
  );

  const visibleQuickAccess = useMemo(
    () => QUICK_ACCESS_ITEMS.filter((item) => enabledModuleCodes.has(item.moduleCode)),
    [enabledModuleCodes]
  );

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

      {/* Accesos rápidos */}
      {visibleQuickAccess.length > 0 && (
        <motion.section variants={headerVariants}>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {visibleQuickAccess.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to}>
                  <Card className="group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer h-full">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${item.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-primary-500 transition-colors mt-0.5" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.section>
      )}

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
