/**
 * Tab de Configuracion del Sistema
 *
 * Muestra: Branding, Empresa, Sedes, Integraciones, Normas ISO
 * Usa SubNavigation del Design System para navegacion de segundo nivel
 *
 * NOTA: La sección de Módulos fue migrada a Admin Global (/admin-global)
 * Solo superusuarios tienen acceso a la gestión de módulos del sistema
 *
 * Usa Design System:
 * - SubNavigation para sub-navegacion (pills)
 * - Card para contenedores
 * - Badge para estados
 * - Button para acciones
 */
import { useState } from 'react';
import {
  Package,
  Palette,
  Edit,
  Droplet,
  Image,
} from 'lucide-react';
import {
  Card,
  Button,
  GenericSectionFallback,
  BrandedSkeleton,
} from '@/components/common';
import { useActiveBranding } from '../hooks/useStrategic';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { BrandingFormModal } from './modals/BrandingFormModal';
import { EmpresaSection } from './EmpresaSection';
import { SedesSection } from './SedesSection';
import { IntegracionesSection } from './IntegracionesSection';
import { NormasISOSection } from './NormasISOSection';
import { DataSection, DataGrid, DataCard, DataField } from '@/components/data-display';

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
 * NOTA: modulos fue migrado a Admin Global (/admin-global) - solo superusuarios
 */
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  empresa: EmpresaSection,
  sedes: SedesSection,
  integraciones: IntegracionesSection,
  'normas-iso': NormasISOSection,
  branding: BrandingSection,
  // MIGRADO: modulos ahora está en /admin-global (solo superusuarios)
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
