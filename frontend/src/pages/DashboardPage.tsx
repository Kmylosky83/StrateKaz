/**
 * Dashboard Principal - Página de inicio post-login
 *
 * Muestra todos los módulos del sistema en un grid uniforme.
 * Usa componentes del Design System para animaciones.
 */
import { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useModulesTree } from '@/hooks/useModules';
import { ModuleCard, ModuleCardSkeleton, ModuleGrid } from '@/components/common';
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
 * Mapeo hardcodeado de módulos a sus rutas base
 * Sincronizado con routes/index.tsx y seed_estructura_final.py
 */
const MODULE_ROUTES: Record<string, string> = {
  // Nivel 1-2: Fundacion + Estructura
  gestion_estrategica: '/gestion-estrategica',
  // Nivel 3: Direccion Estrategica (soporte redirige a HSEQ)
  soporte_estrategico: '/hseq',
  // Nivel 4: Talento Humano
  talent_hub: '/talento',
  // Nivel 5: Riesgos y Cumplimiento
  motor_cumplimiento: '/cumplimiento',
  motor_riesgos: '/riesgos',
  workflow_engine: '/workflows',
  // Nivel 6: Gestion HSEQ
  hseq_management: '/hseq',
  // Nivel 7: Operaciones y Soporte
  supply_chain: '/supply-chain',
  production_ops: '/produccion',
  logistics_fleet: '/logistica',
  sales_crm: '/ventas',
  admin_finance: '/finanzas',
  accounting: '/contabilidad',
  analytics: '/analytics',
  audit_system: '/auditoria',
};

/**
 * Mapeo hardcodeado de tabs a sus rutas (slug)
 * Solo para tabs que tienen ruta diferente al código
 */
const TAB_ROUTES: Record<string, string> = {
  // Cumplimiento
  matriz_legal: 'matriz-legal',
  requisitos_legales: 'requisitos-legales',
  partes_interesadas: 'partes-interesadas',
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
  // Dirección Estratégica
  gestion_documental: 'gestion-documental',
  planificacion_sistema: 'planificacion-sistema',
  gestion_proyectos: 'proyectos',
  revision_direccion: 'revision-direccion',
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
  // Usar mapeo hardcodeado para la ruta base del módulo
  const baseRoute =
    MODULE_ROUTES[module.code] ||
    module.route ||
    `/${module.code.toLowerCase().replace(/_/g, '-')}`;

  // Si el módulo tiene tabs, navegar al primer tab habilitado
  if (module.tabs && module.tabs.length > 0) {
    const firstTab = module.tabs.find((t) => t.is_enabled) || module.tabs[0];
    // Usar mapeo hardcodeado para el tab, luego el route del API, luego convertir código
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

  const enabledModules = useMemo(() => {
    if (!modulesTree?.modules) return [];
    return modulesTree.modules.filter((m) => m.is_enabled).sort((a, b) => a.order - b.order);
  }, [modulesTree]);

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

      {/* Grid de módulos */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ModuleCardSkeleton key={i} />
          ))}
        </div>
      ) : (
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
      )}
    </motion.div>
  );
};
