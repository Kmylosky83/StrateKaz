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
import { useModulesTree } from '@/features/gestion-estrategica/hooks/useModules';
import { ModuleCard, ModuleCardSkeleton, ModuleGrid } from '@/components/common';
import type { ModuleCardColor } from '@/components/common';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// UTILIDADES
// ============================================================================

const getIconComponent = (iconName: string | undefined): LucideIcon => {
  if (!iconName) return LucideIcons.Settings;
  const icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  return icon || LucideIcons.Settings;
};

const getModuleRoute = (module: { code: string; route?: string; tabs?: { code: string; is_enabled: boolean }[] }): string => {
  if (module.tabs && module.tabs.length > 0) {
    const firstTab = module.tabs.find(t => t.is_enabled) || module.tabs[0];
    const moduleSlug = module.code.toLowerCase().replace(/_/g, '-');
    const tabSlug = firstTab.code.toLowerCase().replace(/_/g, '-');
    return `/${moduleSlug}/${tabSlug}`;
  }
  if (module.route) return module.route;
  return `/${module.code.toLowerCase().replace(/_/g, '-')}`;
};

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const { companyName } = useBrandingConfig();
  const { data: modulesTree, isLoading } = useModulesTree();

  const enabledModules = useMemo(() => {
    if (!modulesTree?.modules) return [];
    return modulesTree.modules
      .filter(m => m.is_enabled)
      .sort((a, b) => a.order - b.order);
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
          Bienvenido, {user?.first_name || user?.username}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Sistema Integrado de Gestión •{' '}
          <span className="font-medium text-primary-600 dark:text-primary-400">
            {companyName}
          </span>
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
              sectionsCount={module.tabs?.filter(t => t.is_enabled).length}
              to={getModuleRoute(module)}
            />
          ))}
        </ModuleGrid>
      )}
    </motion.div>
  );
};
