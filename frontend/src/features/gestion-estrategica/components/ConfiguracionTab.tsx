/**
 * Tab de Configuracion del Sistema
 *
 * Muestra: Branding, Modulos y Features (dinámico desde BD), Consecutivos
 * Usa SubNavigation del Design System para navegacion de segundo nivel
 *
 * Usa Design System:
 * - SubNavigation para sub-navegacion (pills)
 * - Card para contenedores
 * - Badge para estados
 * - FeatureToggleCard para toggle de modulos y features
 * - Button para acciones
 */
import { useState, useMemo } from 'react';
import {
  Package,
  Palette,
  Edit,
  Settings2,
  Monitor,
  Moon,
  Sidebar,
  BadgeCheck,
  Circle,
  Lock,
  Droplet,
  Image,
  Blocks,
  type LucideIcon,
} from 'lucide-react';
import { getIconComponent as getDynamicIcon } from '@/components/common/DynamicIcon';
import {
  Card,
  Badge,
  Button,
  FeatureToggleCard,
  FeatureToggleGrid,
  GenericSectionFallback,
  ConfirmDialog,
  SectionHeader,
  BrandedSkeleton,
} from '@/components/common';
import { useActiveBranding } from '../hooks/useStrategic';
import {
  useModulesTree,
  useToggleModule,
  useToggleTab,
  useToggleSection,
  useModuleDependents,
} from '../hooks/useModules';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types/modules.types';
import type { SystemModuleTree } from '../types/modules.types';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { BrandingFormModal } from './modals/BrandingFormModal';
import { EmpresaSection } from './EmpresaSection';
import { SedesSection } from './SedesSection';
import { IntegracionesSection } from './IntegracionesSection';
import { NormasISOSection } from './NormasISOSection';
// NOTA: UnidadesMedidaSection y ConsecutivosSection fueron migrados a OrganizacionTab
import type { TenantUISettings } from '../types/strategic.types';
import type { ModuleColor } from '../types/modules.types';
import { DataSection, DataGrid, DataCard, DataField } from '@/components/data-display';

// =============================================================================
// MAPEO DE CLASES TAILWIND ESTÁTICAS (evita purge en producción)
// =============================================================================

/**
 * Clases Tailwind para colores de categorías
 * IMPORTANTE: No usar interpolación de strings con Tailwind (ej: `bg-${color}-100`)
 * porque las clases dinámicas son purgadas en producción.
 * Usar este mapeo estático en su lugar.
 */
const CATEGORY_STYLE_CLASSES: Record<
  ModuleColor,
  {
    bgLight: string;
    bgDark: string;
    textLight: string;
    textDark: string;
  }
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

// =============================================================================
// SECCION DE BRANDING - Vista 1 (Cards de Información)
// =============================================================================

/**
 * Componente de color individual para la paleta
 */
const ColorSwatch = ({ label, color }: { label: string; color?: string | null }) => (
  <div className="text-center">
    <div
      className={`w-14 h-14 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${!color ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
      style={color ? { backgroundColor: color } : undefined}
    />
    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{label}</span>
    <span className="text-xs font-mono text-gray-400">{color || '-'}</span>
  </div>
);

/**
 * Componente de preview de imagen para logos
 */
const ImagePreview = ({
  src,
  alt,
  label,
  darkBg = false,
}: {
  src: string;
  alt: string;
  label: string;
  darkBg?: boolean;
}) => (
  <div className="text-center">
    <div
      className={`p-3 rounded-lg border flex items-center justify-center h-20 ${
        darkBg
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
      }`}
    >
      <img src={src} alt={alt} className="h-12 object-contain" />
    </div>
    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{label}</span>
  </div>
);

const BrandingSection = () => {
  const { canDo } = usePermissions();
  const { data: branding, isLoading } = useActiveBranding();
  const [showModal, setShowModal] = useState(false);

  // MB-002: Validación de permiso view
  const canView = canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'view');

  if (!canView) {
    return (
      <Card>
        <div className="p-6">
          <Alert
            variant="warning"
            message="No tienes permisos para ver la configuración de marca."
          />
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return <BrandedSkeleton height="h-80" logoSize="xl" showText />;
  }

  const hasLogos = branding?.logo || branding?.logo_white || branding?.favicon;
  const hasPWAIcons =
    branding?.pwa_icon_192 || branding?.pwa_icon_512 || branding?.pwa_icon_maskable;

  return (
    <>
      <DataSection
        title="Configuración de Marca"
        description="Identidad visual, branding y configuración PWA de la empresa"
        icon={Palette}
        iconVariant="purple"
        action={
          canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'edit') ? (
            <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : undefined
        }
      >
        <DataGrid columns={3} gap="md">
          {/* Información de Marca */}
          <DataCard
            title="Información de Marca"
            icon={Palette}
            variant="purple"
            elevated
            accentBorder
          >
            <DataField
              label="Nombre de la Empresa"
              value={branding?.company_name}
              valueVariant="bold"
            />
            <DataField label="Nombre Corto" value={branding?.company_short_name} />
            <DataField
              label="Slogan"
              value={
                branding?.company_slogan ? (
                  <span className="italic">"{branding.company_slogan}"</span>
                ) : null
              }
              valueVariant="muted"
            />
            <DataField
              label="Versión"
              value={branding?.app_version}
              valueVariant="muted"
              icon={Package}
            />
          </DataCard>

          {/* Paleta de Colores */}
          <DataCard title="Paleta de Colores" icon={Droplet} variant="blue" accentBorder>
            <div className="flex gap-3 justify-center pt-2">
              <ColorSwatch label="Primario" color={branding?.primary_color} />
              <ColorSwatch label="Secundario" color={branding?.secondary_color} />
              <ColorSwatch label="Acento" color={branding?.accent_color} />
            </div>
          </DataCard>

          {/* Logos e Imágenes */}
          <DataCard title="Logos e Imágenes" icon={Image} variant="green" accentBorder>
            {hasLogos ? (
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                {branding?.logo && (
                  <ImagePreview src={branding.logo} alt="Logo" label="Principal" />
                )}
                {branding?.logo_white && (
                  <ImagePreview src={branding.logo_white} alt="Logo Blanco" label="Blanco" darkBg />
                )}
                {branding?.favicon && (
                  <ImagePreview src={branding.favicon} alt="Favicon" label="Favicon" />
                )}
              </div>
            ) : (
              <DataField label="Logos" value={null} emptyText="Sin logos configurados" />
            )}
          </DataCard>

          {/* Configuración PWA */}
          <DataCard title="Configuración PWA" icon={Monitor} variant="teal" accentBorder>
            <DataField
              label="Nombre de la App"
              value={branding?.pwa_name}
              emptyText="No configurado"
            />
            <DataField
              label="Nombre Corto"
              value={branding?.pwa_short_name}
              emptyText="No configurado"
            />
            <DataField
              label="Descripción"
              value={branding?.pwa_description}
              emptyText="No configurado"
              truncate
            />
          </DataCard>

          {/* Colores PWA */}
          <DataCard title="Colores PWA" icon={Droplet} variant="purple" accentBorder>
            <div className="flex gap-3 justify-center pt-2">
              <ColorSwatch label="Tema" color={branding?.pwa_theme_color} />
              <ColorSwatch label="Fondo" color={branding?.pwa_background_color} />
            </div>
          </DataCard>

          {/* Iconos PWA */}
          <DataCard title="Iconos PWA" icon={Monitor} variant="orange" accentBorder>
            {hasPWAIcons ? (
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                {branding?.pwa_icon_192 && (
                  <ImagePreview src={branding.pwa_icon_192} alt="Icono PWA 192" label="192x192" />
                )}
                {branding?.pwa_icon_512 && (
                  <ImagePreview src={branding.pwa_icon_512} alt="Icono PWA 512" label="512x512" />
                )}
                {branding?.pwa_icon_maskable && (
                  <ImagePreview
                    src={branding.pwa_icon_maskable}
                    alt="Icono Maskable"
                    label="Maskable"
                  />
                )}
              </div>
            ) : (
              <DataField label="Iconos" value={null} emptyText="Sin iconos PWA configurados" />
            )}
          </DataCard>
        </DataGrid>
      </DataSection>

      <BrandingFormModal
        branding={branding || null}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Helper para obtener el componente de icono de Lucide por nombre
 * Usa DynamicIcon del design system para reutilizar la lógica centralizada
 * Retorna Circle si el icono no existe o no se especifica
 */
const getIconComponent = (iconName?: string): LucideIcon => {
  if (!iconName) return Circle;
  const icon = getDynamicIcon(iconName);
  return (icon as LucideIcon) ?? Circle;
};

// =============================================================================
// SECCION DE MODULOS Y FEATURES (DINAMICO)
// =============================================================================

/**
 * Definicion de UI settings (configuraciones de interfaz)
 * Estos se mantienen como configuración estática por ahora
 * ya que son settings de UI, no módulos funcionales
 */
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

const ModulosAndFeaturesSection = () => {
  const { canDo } = usePermissions();
  const { data: tree, isLoading } = useModulesTree();
  const toggleModule = useToggleModule();
  const toggleTab = useToggleTab();
  const toggleSection = useToggleSection();

  // MM-003: Estado para confirmación de desactivación
  const [moduleToDisable, setModuleToDisable] = useState<SystemModuleTree | null>(null);
  const { data: dependentsInfo, isLoading: loadingDependents } = useModuleDependents(
    moduleToDisable?.id ?? 0,
    !!moduleToDisable
  );

  const canEditModules = canDo(Modules.GESTION_ESTRATEGICA, Sections.MODULOS, 'edit');

  // MM-003: Handler para toggle de módulo con confirmación
  const handleModuleToggle = (module: SystemModuleTree) => {
    if (module.is_enabled) {
      // Si está habilitado y se quiere desactivar, mostrar confirmación
      setModuleToDisable(module);
    } else {
      // Si está deshabilitado, activar directamente
      toggleModule.mutate({ id: module.id, isEnabled: true });
    }
  };

  // MM-003: Confirmar desactivación
  const confirmDisable = () => {
    if (moduleToDisable) {
      toggleModule.mutate({ id: moduleToDisable.id, isEnabled: false });
      setModuleToDisable(null);
    }
  };

  // Agrupar módulos por categoría usando useMemo para optimización
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
      {/* Section Header - fuera de cualquier contenedor */}
      <SectionHeader
        icon={<Blocks className="h-5 w-5" />}
        title="Módulos del Sistema"
        description="Activa o desactiva los módulos disponibles para tu organización"
      />

      {/* Renderizar módulos agrupados por categoría */}
      {Object.entries(modulesByCategory).map(([category, modules]) => {
        const categoryColor = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'gray';
        const styleClasses = CATEGORY_STYLE_CLASSES[categoryColor];

        return (
          <Card key={category}>
            <div className="p-6">
              {/* Header de categoría */}
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

              {/* Grid de módulos */}
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

              {/* Tabs y Secciones expandibles por módulo */}
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
                            {/* Toggle del Tab */}
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

                            {/* Secciones del tab (si existen) */}
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

      {/* Configuración de Interfaz - UI Settings */}
      <UISettingsCard />

      {/* MM-003: Diálogo de confirmación para desactivar módulo */}
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
        confirmVariant="destructive"
        isLoading={toggleModule.isPending}
      />
    </div>
  );
};

/**
 * Card separado para UI Settings
 * Mantiene la funcionalidad anterior para configuraciones de interfaz
 */
const UISettingsCard = () => {
  // TODO: Implementar hooks para UI settings cuando estén disponibles
  // Por ahora, mostramos los settings como read-only o con localStorage
  const [uiSettings, setUiSettings] = useState<Partial<TenantUISettings>>({
    sidebar_collapsed_default: false,
    show_module_badges: true,
    dark_mode_enabled: true,
    custom_theme_enabled: false,
  });

  const handleToggle = (key: keyof TenantUISettings) => {
    setUiSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    // TODO: Llamar a API cuando esté disponible
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

// =============================================================================
// COMPONENTE PRINCIPAL EXPORTADO
// =============================================================================

/**
 * Props del ConfiguracionTab
 * activeSection viene desde usePageHeader en la pagina padre
 */
interface ConfiguracionTabProps {
  /** Codigo de la seccion activa (desde API) */
  activeSection?: string;
  /** Query de busqueda desde el Header */
  searchQuery?: string;
}

/**
 * Mapeo de códigos de sección a componentes
 * Los códigos deben coincidir con los de la BD (TabSection.code)
 * NOTA: Los códigos en BD están en minúsculas
 * NOTA: consecutivos y unidades_medida fueron migrados a OrganizacionTab
 */
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  empresa: EmpresaSection,
  sedes: SedesSection,
  integraciones: IntegracionesSection,
  'normas-iso': NormasISOSection,
  branding: BrandingSection,
  modulos: ModulosAndFeaturesSection,
};

export const ConfiguracionTab = ({ activeSection, searchQuery }: ConfiguracionTabProps) => {
  // Renderizar el componente de la seccion activa
  const ActiveComponent = activeSection ? SECTION_COMPONENTS[activeSection] : null;

  // MM-002: Si hay sección activa pero no existe componente, mostrar fallback genérico
  if (activeSection && !ActiveComponent) {
    return (
      <div className="space-y-6">
        <GenericSectionFallback sectionCode={activeSection} parentName="Configuración" />
      </div>
    );
  }

  // Si no hay sección activa, mostrar empresa por defecto
  if (!ActiveComponent) {
    return <EmpresaSection />;
  }

  // TODO: Propagar searchQuery a los componentes que lo soporten
  // Por ahora se pasa como contexto futuro
  return (
    <div className="space-y-6">
      <ActiveComponent />
    </div>
  );
};
