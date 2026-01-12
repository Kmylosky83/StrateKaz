/**
 * Tab de Identidad Corporativa
 *
 * Secciones dinámicas desde BD (TabSection.code):
 * - mision_vision: Misión y Visión (con glassmorphism y branding dinámico)
 * - valores: Valores Corporativos (con Drag & Drop)
 * - politicas: Sistema Unificado de Políticas
 *
 * v3.0 - Mejoras:
 * - Diseño glassmorphism con colores del branding de la empresa
 * - Sistema unificado de políticas (modal único para todos los tipos)
 * - Eliminado código legacy de políticas integrales/específicas separadas
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Calendar,
  Shield,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState, DynamicIcon } from '@/components/common';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import {
  useActiveIdentity,
  useValues,
  useCreateValue,
  useUpdateValue,
  useDeleteValue,
  useReorderValues,
} from '../hooks/useStrategic';
import { IdentityFormModal } from './modals/IdentityFormModal';
import { ValoresDragDrop } from './ValoresDragDrop';
import { PoliciesList } from './politicas';
import type { CorporateIdentity } from '../types/strategic.types';
import { cn } from '@/lib/utils';

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

const MisionVisionSection = ({ identity, onEdit }: MisionVisionSectionProps) => {
  const { primaryColor, secondaryColor, companyName } = useBrandingConfig();

  // Convertir colores hex a RGB para gradientes con transparencia
  const primaryRgb = useMemo(() => hexToRgb(primaryColor), [primaryColor]);
  const secondaryRgb = useMemo(() => hexToRgb(secondaryColor), [secondaryColor]);

  return (
    <div className="space-y-6">
      {/* Header con metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="primary" size="lg" className="font-semibold">
            <Shield className="h-4 w-4 mr-1.5" />
            v{identity.version}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>
              Vigente desde {parseLocalDate(identity.effective_date).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

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
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Nuestra Misión
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Razón de ser de {companyName}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div
              className="h-1 w-16 rounded-full mb-6"
              style={{ backgroundColor: primaryColor }}
            />

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
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Nuestra Visión
                </h3>
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
    </div>
  );
};

// =============================================================================
// SECCIÓN: VALORES (con Drag & Drop)
// =============================================================================
interface ValoresSectionProps {
  identity: CorporateIdentity;
}

const ValoresSection = ({ identity }: ValoresSectionProps) => {
  const { data: valuesData, isLoading } = useValues(identity.id);
  const createValueMutation = useCreateValue();
  const updateValueMutation = useUpdateValue();
  const deleteValueMutation = useDeleteValue();
  const reorderMutation = useReorderValues();

  const values = valuesData?.results || identity.values || [];

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  return (
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
    />
  );
};

// =============================================================================
// SECCIÓN: POLÍTICAS (Sistema Unificado v3.0)
// =============================================================================
interface PoliticasSectionProps {
  identity: CorporateIdentity;
}

const PoliticasSection = ({ identity }: PoliticasSectionProps) => {
  return <PoliciesList identityId={identity.id} />;
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
            <div className="p-6 animate-pulse">
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
          action={{
            label: 'Crear Identidad Corporativa',
            onClick: () => setShowIdentityModal(true),
            icon: <Plus className="h-4 w-4" />,
          }}
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
          />
        );

      case SECTION_KEYS.VALORES:
        return <ValoresSection identity={identity} />;

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
