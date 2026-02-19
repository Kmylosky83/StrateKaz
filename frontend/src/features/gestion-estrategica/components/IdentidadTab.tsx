/**
 * Tab de Identidad Corporativa
 *
 * Secciones dinámicas desde BD (TabSection.code):
 * - mision_vision: Misión y Visión (con glassmorphism y branding dinámico)
 * - valores: Valores Corporativos (con Drag & Drop)
 * - politicas: Políticas vigentes (read-only desde Gestión Documental)
 *
 * v4.0 - Mejoras:
 * - Diseño glassmorphism con colores del branding de la empresa
 * - Sistema unificado de políticas (modal único para todos los tipos)
 * - Eliminado código legacy de políticas integrales/específicas separadas
 * - Políticas ahora son read-only desde Gestión Documental
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Calendar,
  Shield,
  Compass,
  Target,
  MapPin,
  Workflow,
  AlertTriangle,
  Heart,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState, DynamicIcon } from '@/components/common';
import { DataSection } from '@/components/data-display';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import {
  useActiveIdentity,
  useValues,
  useCreateValue,
  useUpdateValue,
  useDeleteValue,
  useReorderValues,
} from '../hooks/useStrategic';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { IdentityFormModal } from './modals/IdentityFormModal';
import { ValoresDragDrop, type ViewMode } from './ValoresDragDrop';
import { useDocumentos } from '../hooks/useGestionDocumental';
import type { Documento } from '../types/gestion-documental.types';
import type { CorporateIdentity } from '../types/strategic.types';
import { cn } from '@/utils/cn';

interface IdentidadTabProps {
  /** Código de la sección activa (desde API/DynamicSections) */
  activeSection?: string;
  triggerNewForm?: number;
}

// =============================================================================
// SECCIÓN: MISIÓN Y VISIÓN (v3.0 - Glassmorphism + Branding Dinámico)
// =============================================================================
interface MisionVisionSectionProps {
  identity: CorporateIdentity;
  onEdit: () => void;
  canEdit: boolean;
}

/**
 * Convierte un color hex a RGB para usar en rgba()
 */
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '139, 92, 246'; // Fallback purple
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

/**
 * Parsea una fecha ISO (YYYY-MM-DD) sin problemas de timezone.
 * Evita el bug donde new Date("2026-01-15") se interpreta como UTC
 * y al mostrar en timezone local (ej: UTC-5) muestra el día anterior.
 */
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const MisionVisionSection = ({ identity, onEdit, canEdit }: MisionVisionSectionProps) => {
  const { primaryColor, secondaryColor, companyName } = useBrandingConfig();
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Convertir colores hex a RGB para gradientes con transparencia
  const primaryRgb = useMemo(() => hexToRgb(primaryColor), [primaryColor]);
  const secondaryRgb = useMemo(() => hexToRgb(secondaryColor), [secondaryColor]);

  return (
    <div className="space-y-6">
      {/* DataSection Header - Consistencia con otras secciones */}
      <DataSection
        icon={Compass}
        iconBgClass={colorClasses.badge}
        iconClass={colorClasses.icon}
        title="Misión y Visión"
        description={`Versión ${identity.version} • Vigente desde ${parseLocalDate(
          identity.effective_date
        ).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`}
        action={
          canEdit && (
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )
        }
      />

      {/* Grid Misión y Visión - Diseño Glassmorphism */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Misión */}
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl',
            'backdrop-blur-xl border border-white/20',
            'shadow-xl hover:shadow-2xl transition-all duration-300',
            'group'
          )}
          style={{
            background: `linear-gradient(135deg, rgba(${primaryRgb}, 0.15) 0%, rgba(${primaryRgb}, 0.05) 100%)`,
          }}
        >
          {/* Decorative gradient orb */}
          <div
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="relative p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="p-4 rounded-2xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, rgba(${primaryRgb}, 0.7) 100%)`,
                }}
              >
                <DynamicIcon name="Compass" size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Nuestra Misión</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Razón de ser de {companyName}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-1 w-16 rounded-full mb-6" style={{ backgroundColor: primaryColor }} />

            {/* Content */}
            <div
              className={cn(
                'text-gray-700 dark:text-gray-200',
                'prose prose-lg max-w-none dark:prose-invert',
                'prose-p:leading-relaxed prose-p:text-base',
                'prose-strong:text-gray-900 dark:prose-strong:text-white'
              )}
              dangerouslySetInnerHTML={{ __html: identity.mission }}
            />
          </div>

          {/* Bottom accent line */}
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(90deg, ${primaryColor} 0%, transparent 100%)`,
            }}
          />
        </div>

        {/* Card Visión */}
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl',
            'backdrop-blur-xl border border-white/20',
            'shadow-xl hover:shadow-2xl transition-all duration-300',
            'group'
          )}
          style={{
            background: `linear-gradient(135deg, rgba(${secondaryRgb}, 0.15) 0%, rgba(${secondaryRgb}, 0.05) 100%)`,
          }}
        >
          {/* Decorative gradient orb */}
          <div
            className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
            style={{ backgroundColor: secondaryColor }}
          />

          <div className="relative p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="p-4 rounded-2xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${secondaryColor} 0%, rgba(${secondaryRgb}, 0.7) 100%)`,
                }}
              >
                <DynamicIcon name="Eye" size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Nuestra Visión</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hacia dónde nos dirigimos
                </p>
              </div>
            </div>

            {/* Divider */}
            <div
              className="h-1 w-16 rounded-full mb-6"
              style={{ backgroundColor: secondaryColor }}
            />

            {/* Content */}
            <div
              className={cn(
                'text-gray-700 dark:text-gray-200',
                'prose prose-lg max-w-none dark:prose-invert',
                'prose-p:leading-relaxed prose-p:text-base',
                'prose-strong:text-gray-900 dark:prose-strong:text-white'
              )}
              dangerouslySetInnerHTML={{ __html: identity.vision }}
            />
          </div>

          {/* Bottom accent line */}
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(90deg, ${secondaryColor} 0%, transparent 100%)`,
            }}
          />
        </div>
      </div>

      {/* Card de Alcance del SIG - Solo si declara_alcance es true */}
      {identity.declara_alcance && identity.alcance_general && (
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl',
            'backdrop-blur-xl border border-white/20',
            'shadow-xl hover:shadow-2xl transition-all duration-300',
            'group'
          )}
          style={{
            background: `linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)`,
          }}
        >
          {/* Decorative gradient orb */}
          <div
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
            style={{ backgroundColor: '#10b981' }}
          />

          <div className="relative p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="p-4 rounded-2xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, #10b981 0%, rgba(16, 185, 129, 0.7) 100%)`,
                }}
              >
                <Target size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Alcance del Sistema Integrado de Gestión
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cobertura y aplicabilidad del SIG
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-1 w-16 rounded-full mb-6" style={{ backgroundColor: '#10b981' }} />

            {/* Alcance General */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Alcance General</span>
              </div>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                {identity.alcance_general}
              </p>
            </div>

            {/* Grid de campos opcionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cobertura Geográfica */}
              {identity.alcance_geografico && (
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Cobertura Geográfica</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {identity.alcance_geografico}
                  </p>
                </div>
              )}

              {/* Procesos Cubiertos - Badges dinámicos desde ManyToMany */}
              {identity.procesos_cubiertos && identity.procesos_cubiertos.length > 0 && (
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 md:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-3">
                    <Workflow className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Procesos Cubiertos</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({identity.procesos_cubiertos.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {identity.procesos_cubiertos.map((proceso) => (
                      <Badge
                        key={proceso.id}
                        variant="secondary"
                        className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                      >
                        {proceso.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Exclusiones */}
              {identity.alcance_exclusiones && (
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-sm">Exclusiones Generales</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {identity.alcance_exclusiones}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom accent line */}
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(90deg, #10b981 0%, transparent 100%)`,
            }}
          />
        </div>
      )}
    </div>
  );
};

// =============================================================================
// SECCIÓN: VALORES (con Drag & Drop) - Vista 2B Especial
// =============================================================================
interface ValoresSectionProps {
  identity: CorporateIdentity;
  canEdit: boolean;
}

const ValoresSection = ({ identity, canEdit }: ValoresSectionProps) => {
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);
  const { primaryColor } = useBrandingConfig();

  // Estado controlado para vista y creación
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isCreating, setIsCreating] = useState(false);

  const { data: valuesData, isLoading } = useValues(identity.id);
  const createValueMutation = useCreateValue();
  const updateValueMutation = useUpdateValue();
  const deleteValueMutation = useDeleteValue();
  const reorderMutation = useReorderValues(identity.id);

  const values = valuesData?.results || identity.values || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DataSection
          icon={Heart}
          iconBgClass={colorClasses.badge}
          iconClass={colorClasses.icon}
          title="Valores Corporativos"
          description="Cargando valores..."
        />
        <Card className="p-6">
          <div className="animate-pulse-subtle space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DataSection Header - Vista 2B Especial */}
      <DataSection
        icon={Heart}
        iconBgClass={colorClasses.badge}
        iconClass={colorClasses.icon}
        title="Valores Corporativos"
        description={`${values.length} valor${values.length !== 1 ? 'es' : ''} definido${values.length !== 1 ? 's' : ''} • Arrastra para reordenar`}
        action={
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
                style={viewMode === 'list' ? { color: primaryColor } : undefined}
                title="Vista de lista"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
                style={viewMode === 'cards' ? { color: primaryColor } : undefined}
                title="Vista de tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Botón Agregar */}
            {canEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreating(true)}
                disabled={isCreating}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Valor
              </Button>
            )}
          </div>
        }
      />

      {/* Card con contenido Drag & Drop */}
      <ValoresDragDrop
        values={values}
        identityId={identity.id}
        onReorder={async (newOrder) => {
          await reorderMutation.mutateAsync(newOrder);
        }}
        onCreate={async (data) => {
          await createValueMutation.mutateAsync(data);
        }}
        onUpdate={async (id, data) => {
          await updateValueMutation.mutateAsync({ id, data });
        }}
        onDelete={async (id) => {
          await deleteValueMutation.mutateAsync(id);
        }}
        isLoading={
          createValueMutation.isPending ||
          updateValueMutation.isPending ||
          deleteValueMutation.isPending ||
          reorderMutation.isPending
        }
        readOnly={!canEdit}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isCreating={isCreating}
        onCreateToggle={setIsCreating}
      />
    </div>
  );
};

// =============================================================================
// SECCIÓN: POLÍTICAS (v4.0 - Read-only desde Gestión Documental)
// =============================================================================

const PoliticasSection = ({ identity }: { identity: CorporateIdentity }) => {
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Obtener documentos tipo POL (políticas) vigentes desde Gestion Documental
  const { data: documentosData, isLoading } = useDocumentos({ tipo_documento_codigo: 'POL' });
  const documentos: Documento[] = Array.isArray(documentosData)
    ? documentosData
    : (documentosData?.results ?? []);

  // Agrupar por norma ISO
  const grouped = useMemo(() => {
    const groups: Record<string, Documento[]> = {};
    for (const doc of documentos) {
      const key = doc.norma_iso_nombre || 'General';
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    }
    return groups;
  }, [documentos]);

  const totalPolicies = documentos.length;

  return (
    <div className="space-y-6">
      <DataSection
        icon={Shield}
        iconBgClass={colorClasses.badge}
        iconClass={colorClasses.icon}
        title="Políticas"
        description={`${totalPolicies} política${totalPolicies !== 1 ? 's' : ''} registrada${totalPolicies !== 1 ? 's' : ''} en Gestión Documental`}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="p-4 animate-pulse-subtle">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : totalPolicies === 0 ? (
        <EmptyState
          icon={<Shield className="w-12 h-12 text-gray-400" />}
          title="Sin políticas registradas"
          description="Las políticas se crean y gestionan desde el módulo Sistema de Gestión > Documentos. Crea un documento de tipo 'Política' para verlo aquí."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([norma, docs]) => (
            <div key={norma}>
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {norma}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500">{doc.codigo}</span>
                            <Badge
                              variant={
                                doc.estado === 'PUBLICADO' || doc.estado === 'APROBADO'
                                  ? 'success'
                                  : doc.estado === 'BORRADOR'
                                    ? 'default'
                                    : 'warning'
                              }
                              size="sm"
                            >
                              {doc.estado}
                            </Badge>
                            {doc.es_politica_integral && (
                              <Badge variant="info" size="sm">
                                Integral
                              </Badge>
                            )}
                          </div>
                          <h5 className="font-medium text-gray-900 dark:text-white truncate">
                            {doc.titulo}
                          </h5>
                          <p className="text-xs text-gray-500 mt-1">
                            v{doc.version_actual} &middot;{' '}
                            {doc.fecha_publicacion
                              ? new Date(doc.fecha_publicacion).toLocaleDateString('es-CO')
                              : 'Sin publicar'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

/**
 * Mapeo de códigos de sección a componentes
 * Los códigos deben coincidir con los de la BD (TabSection.code)
 *
 * NOTA v3.0: La sección 'politica' legacy fue eliminada.
 * Las políticas se gestionan desde 'politicas' con PoliticasManager.
 */
const SECTION_KEYS = {
  MISION_VISION: 'mision_vision',
  VALORES: 'valores',
  POLITICAS: 'politicas',
} as const;

export const IdentidadTab = ({ activeSection, triggerNewForm }: IdentidadTabProps) => {
  const { data: identity, isLoading } = useActiveIdentity();
  const { canDo } = usePermissions();

  const canEditIdentity = canDo(
    Modules.GESTION_ESTRATEGICA,
    Sections.IDENTIDAD_CORPORATIVA,
    'edit'
  );
  const canEditValues = canDo(Modules.GESTION_ESTRATEGICA, Sections.VALORES, 'edit');
  const canCreateIdentity = canDo(
    Modules.GESTION_ESTRATEGICA,
    Sections.IDENTIDAD_CORPORATIVA,
    'create'
  );

  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<CorporateIdentity | null>(null);

  // Trigger desde el header para abrir modal de nueva versión
  useEffect(() => {
    if (triggerNewForm && triggerNewForm > 0) {
      setEditingIdentity(null);
      setShowIdentityModal(true);
    }
  }, [triggerNewForm]);

  const handleEditIdentity = () => {
    setEditingIdentity(identity ?? null);
    setShowIdentityModal(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <div className="p-6 animate-pulse-subtle">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state - con botón para crear
  if (!identity) {
    return (
      <>
        <EmptyState
          icon={<DynamicIcon name="Compass" size={48} />}
          title="Sin Identidad Corporativa"
          description="No hay una identidad corporativa configurada. Crea una para definir la misión, visión y valores de la organización."
          action={
            canCreateIdentity
              ? {
                  label: 'Crear Identidad Corporativa',
                  onClick: () => setShowIdentityModal(true),
                  icon: <Plus className="h-4 w-4" />,
                }
              : undefined
          }
        />
        <IdentityFormModal
          identity={null}
          isOpen={showIdentityModal}
          onClose={() => setShowIdentityModal(false)}
        />
      </>
    );
  }

  // Renderizar sección según activeSection
  const renderSection = () => {
    switch (activeSection) {
      case SECTION_KEYS.MISION_VISION:
        return (
          <MisionVisionSection
            identity={identity}
            onEdit={handleEditIdentity}
            canEdit={canEditIdentity}
          />
        );

      case SECTION_KEYS.VALORES:
        return <ValoresSection identity={identity} canEdit={canEditValues} />;

      case SECTION_KEYS.POLITICAS:
        return <PoliticasSection identity={identity} />;

      default:
        // Si no hay sección activa, mostrar Misión y Visión por defecto
        if (activeSection) {
          console.warn(
            `[IdentidadTab] Sección "${activeSection}" no encontrada en SECTION_KEYS. ` +
              `Secciones disponibles: ${Object.values(SECTION_KEYS).join(', ')}`
          );
        }
        return (
          <MisionVisionSection
            identity={identity}
            onEdit={handleEditIdentity}
            canEdit={canEditIdentity}
          />
        );
    }
  };

  return (
    <>
      <div className="space-y-6">{renderSection()}</div>

      {/* Modal de Identidad */}
      <IdentityFormModal
        identity={editingIdentity}
        isOpen={showIdentityModal}
        onClose={() => {
          setShowIdentityModal(false);
          setEditingIdentity(null);
        }}
      />
    </>
  );
};
