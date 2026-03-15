/**
 * Sección: Módulos y Funcionalidades — Autocontenida
 *
 * Permite activar/desactivar módulos del sistema por tenant.
 * Incluye UI settings (sidebar, dark mode, badges, tema).
 * Solo accesible por superadmin.
 *
 * Se usa en: Tab "Mi Sistema de Gestión" → subtab "modulos"
 */
import { useState, useMemo } from 'react';
import {
  Package,
  Palette,
  Settings2,
  Monitor,
  Moon,
  Sidebar,
  BadgeCheck,
  Circle,
  Lock,
  Blocks,
  type LucideIcon,
} from 'lucide-react';
import { getIconComponent as getDynamicIcon } from '@/components/common/DynamicIcon';
import {
  Card,
  Badge,
  FeatureToggleCard,
  FeatureToggleGrid,
  ConfirmDialog,
  SectionHeader,
  BrandedSkeleton,
} from '@/components/common';
import {
  useModulesTree,
  useToggleModule,
  useToggleTab,
  useToggleSection,
  useModuleDependents,
} from '../hooks/useModules';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types/modules.types';
import type { SystemModuleTree, ModuleColor } from '../types/modules.types';
import { usePermissions, useIsSuperAdmin } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import type { TenantUISettings } from '../types/strategic.types';
import { GenericSectionFallback } from '@/components/common';

// Clases Tailwind estáticas para colores de categorías
const CATEGORY_STYLE_CLASSES: Record<
  ModuleColor,
  { bgLight: string; bgDark: string; textLight: string; textDark: string }
> = {
  purple: {
    bgLight: 'bg-purple-100',
    bgDark: 'dark:bg-purple-900/30',
    textLight: 'text-purple-600',
    textDark: 'dark:text-purple-400',
  },
  blue: {
    bgLight: 'bg-blue-100',
    bgDark: 'dark:bg-blue-900/30',
    textLight: 'text-blue-600',
    textDark: 'dark:text-blue-400',
  },
  green: {
    bgLight: 'bg-green-100',
    bgDark: 'dark:bg-green-900/30',
    textLight: 'text-green-600',
    textDark: 'dark:text-green-400',
  },
  orange: {
    bgLight: 'bg-orange-100',
    bgDark: 'dark:bg-orange-900/30',
    textLight: 'text-orange-600',
    textDark: 'dark:text-orange-400',
  },
  gray: {
    bgLight: 'bg-gray-100',
    bgDark: 'dark:bg-gray-900/30',
    textLight: 'text-gray-600',
    textDark: 'dark:text-gray-400',
  },
  teal: {
    bgLight: 'bg-teal-100',
    bgDark: 'dark:bg-teal-900/30',
    textLight: 'text-teal-600',
    textDark: 'dark:text-teal-400',
  },
  red: {
    bgLight: 'bg-red-100',
    bgDark: 'dark:bg-red-900/30',
    textLight: 'text-red-600',
    textDark: 'dark:text-red-400',
  },
  yellow: {
    bgLight: 'bg-yellow-100',
    bgDark: 'dark:bg-yellow-900/30',
    textLight: 'text-yellow-600',
    textDark: 'dark:text-yellow-400',
  },
  pink: {
    bgLight: 'bg-pink-100',
    bgDark: 'dark:bg-pink-900/30',
    textLight: 'text-pink-600',
    textDark: 'dark:text-pink-400',
  },
  indigo: {
    bgLight: 'bg-indigo-100',
    bgDark: 'dark:bg-indigo-900/30',
    textLight: 'text-indigo-600',
    textDark: 'dark:text-indigo-400',
  },
};

const getIconComponent = (iconName?: string): LucideIcon => {
  if (!iconName) return Circle;
  const icon = getDynamicIcon(iconName);
  return (icon as LucideIcon) ?? Circle;
};

// UI Settings definitions
interface UISettingDefinition {
  key: keyof TenantUISettings;
  name: string;
  description: string;
  icon: LucideIcon;
}

const UI_SETTINGS_DEFINITIONS: UISettingDefinition[] = [
  {
    key: 'sidebar_collapsed_default',
    name: 'Sidebar Colapsado',
    description: 'Iniciar con el sidebar colapsado por defecto',
    icon: Sidebar,
  },
  {
    key: 'show_module_badges',
    name: 'Mostrar Badges',
    description: 'Mostrar badges de modulos en el sidebar',
    icon: BadgeCheck,
  },
  {
    key: 'dark_mode_enabled',
    name: 'Modo Oscuro',
    description: 'Habilitar opcion de modo oscuro para usuarios',
    icon: Moon,
  },
  {
    key: 'custom_theme_enabled',
    name: 'Tema Personalizado',
    description: 'Permitir personalizacion de colores del tema',
    icon: Palette,
  },
];

const UISettingsCard = () => {
  const [uiSettings, setUiSettings] = useState<Partial<TenantUISettings>>({
    sidebar_collapsed_default: false,
    show_module_badges: true,
    dark_mode_enabled: true,
    custom_theme_enabled: false,
  });

  const handleToggle = (key: keyof TenantUISettings) => {
    setUiSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Configuración de Interfaz
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Preferencias de visualización para todos los usuarios
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {UI_SETTINGS_DEFINITIONS.map((setting) => (
            <FeatureToggleCard
              key={setting.key}
              icon={setting.icon}
              title={setting.name}
              description={setting.description}
              checked={uiSettings[setting.key] ?? false}
              onChange={() => handleToggle(setting.key)}
              color="gray"
              layout="row"
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export const ModulosSection = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const { canDo } = usePermissions();
  const { data: tree, isLoading } = useModulesTree();
  const toggleModule = useToggleModule();
  const toggleTab = useToggleTab();
  const toggleSection = useToggleSection();

  const [moduleToDisable, setModuleToDisable] = useState<SystemModuleTree | null>(null);
  const { data: dependentsInfo, isLoading: loadingDependents } = useModuleDependents(
    moduleToDisable?.id ?? 0,
    !!moduleToDisable
  );

  const canEditModules = canDo(Modules.FUNDACION, Sections.MODULOS, 'edit');

  // Solo superadmin puede ver esta sección
  if (!isSuperAdmin) {
    return <GenericSectionFallback sectionCode="modulos" parentName="Mi Sistema de Gestión" />;
  }

  const handleModuleToggle = (module: SystemModuleTree) => {
    if (module.is_enabled) {
      setModuleToDisable(module);
    } else {
      toggleModule.mutate({ id: module.id, isEnabled: true });
    }
  };

  const confirmDisable = () => {
    if (moduleToDisable) {
      toggleModule.mutate({ id: moduleToDisable.id, isEnabled: false });
      setModuleToDisable(null);
    }
  };

  const modulesByCategory = useMemo(() => {
    if (!tree) return {};
    return tree.modules.reduce(
      (acc, module) => {
        const cat = module.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(module);
        return acc;
      },
      {} as Record<string, SystemModuleTree[]>
    );
  }, [tree]);

  if (isLoading) {
    return <BrandedSkeleton height="h-96" logoSize="xl" showText />;
  }

  const isPending = toggleModule.isPending || toggleTab.isPending || toggleSection.isPending;

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<Blocks className="h-5 w-5" />}
        title="Módulos del Sistema"
        description="Personaliza qué módulos y funcionalidades estarán activos en tu organización"
      />

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Blocks className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>¿Para qué sirve esta sección?</strong> Aquí puedes activar o desactivar los
              módulos contratados según las necesidades de tu organización. Los módulos desactivados
              no aparecerán en el menú lateral.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Los módulos marcados como "Core" son esenciales para el funcionamiento del sistema y
              no pueden desactivarse.
            </p>
          </div>
        </div>
      </div>

      {Object.entries(modulesByCategory).map(([category, modules]) => {
        const categoryColor = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'gray';
        const styleClasses = CATEGORY_STYLE_CLASSES[categoryColor];

        return (
          <Card key={category}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${styleClasses.bgLight} ${styleClasses.bgDark}`}>
                  <Package
                    className={`h-5 w-5 ${styleClasses.textLight} ${styleClasses.textDark}`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {modules.length} módulo{modules.length !== 1 ? 's' : ''} disponible
                    {modules.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <FeatureToggleGrid columns={3}>
                {modules.map((module) => {
                  const IconComponent = getIconComponent(module.icon);
                  return (
                    <FeatureToggleCard
                      key={module.id}
                      icon={IconComponent}
                      title={
                        <span className="flex items-center gap-2">
                          {module.name}
                          {module.is_core && (
                            <Badge
                              variant="gray"
                              size="sm"
                              className="inline-flex items-center gap-1"
                            >
                              <Lock className="h-3 w-3" />
                              Core
                            </Badge>
                          )}
                        </span>
                      }
                      description={
                        module.is_core
                          ? 'Módulo core del sistema - No puede ser desactivado'
                          : module.description || `Módulo ${module.name}`
                      }
                      checked={module.is_enabled}
                      onChange={() => handleModuleToggle(module)}
                      color={module.color || categoryColor}
                      disabled={!canEditModules || module.is_core || isPending}
                    />
                  );
                })}
              </FeatureToggleGrid>

              {modules.map((module) => {
                if (module.tabs.length === 0) return null;
                return (
                  <div
                    key={`tabs-${module.id}`}
                    className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Settings2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tabs de {module.name}
                      </h4>
                      <Badge variant="gray" size="sm">
                        {module.enabled_tabs_count}/{module.total_tabs_count}
                      </Badge>
                    </div>
                    <div className="space-y-3 ml-6">
                      {module.tabs.map((tab) => {
                        const TabIcon = getIconComponent(tab.icon);
                        return (
                          <div key={tab.id} className="space-y-2">
                            <FeatureToggleCard
                              layout="row"
                              icon={TabIcon}
                              title={tab.name}
                              description={tab.description}
                              checked={tab.is_enabled}
                              onChange={() =>
                                toggleTab.mutate({
                                  id: tab.id,
                                  isEnabled: !tab.is_enabled,
                                })
                              }
                              color={module.color || categoryColor}
                              disabled={
                                !canEditModules || tab.is_core || isPending || !module.is_enabled
                              }
                            />
                            {tab.sections.length > 0 && (
                              <div className="ml-8 space-y-2">
                                {tab.sections.map((section) => {
                                  const SectionIcon = getIconComponent(section.icon);
                                  return (
                                    <FeatureToggleCard
                                      key={section.id}
                                      layout="row"
                                      icon={SectionIcon}
                                      title={section.name}
                                      description={section.description}
                                      checked={section.is_enabled}
                                      onChange={() =>
                                        toggleSection.mutate({
                                          id: section.id,
                                          isEnabled: !section.is_enabled,
                                        })
                                      }
                                      color={module.color || categoryColor}
                                      disabled={
                                        !canEditModules ||
                                        section.is_core ||
                                        isPending ||
                                        !tab.is_enabled
                                      }
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      <UISettingsCard />

      <ConfirmDialog
        isOpen={!!moduleToDisable}
        onClose={() => setModuleToDisable(null)}
        onConfirm={confirmDisable}
        title={`Desactivar ${moduleToDisable?.name || 'módulo'}`}
        message={
          loadingDependents ? (
            <div className="flex items-center gap-2 text-gray-500">
              <span className="animate-spin">⏳</span>
              Verificando dependencias...
            </div>
          ) : dependentsInfo?.warning_message ? (
            <div className="space-y-3">
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                {dependentsInfo.warning_message}
              </p>
              {dependentsInfo.children.tabs.enabled > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • {dependentsInfo.children.tabs.enabled} tab(s) activo(s) serán desactivados
                </p>
              )}
              {dependentsInfo.children.sections.enabled > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • {dependentsInfo.children.sections.enabled} sección(es) activa(s) serán
                  desactivadas
                </p>
              )}
              {dependentsInfo.dependents.enabled.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Módulos dependientes que serán afectados:
                  </p>
                  <ul className="mt-1 text-sm text-red-600 dark:text-red-300 list-disc list-inside">
                    {dependentsInfo.dependents.enabled.map((dep) => (
                      <li key={dep.id}>{dep.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p>¿Estás seguro de que deseas desactivar el módulo "{moduleToDisable?.name}"?</p>
          )
        }
        confirmText="Desactivar"
        variant="danger"
        isLoading={toggleModule.isPending}
      />
    </div>
  );
};
