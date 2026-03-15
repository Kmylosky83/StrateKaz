/**
 * Sección: Misión y Visión — Autocontenida
 *
 * Diseño glassmorphism con colores dinámicos del branding.
 * Incluye modal de edición/creación de identidad corporativa.
 *
 * Se usa en: Tab "Mi Empresa" → subtab "mision_vision"
 */
import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Plus, Edit, Compass } from 'lucide-react';
import { Card, Button, EmptyState, DynamicIcon } from '@/components/common';
import { DataSection } from '@/components/data-display';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import { useActiveIdentity } from '../hooks/useStrategic';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { IdentityFormModal } from './modals/IdentityFormModal';
import type { CorporateIdentity } from '../types/strategic.types';
import { cn } from '@/utils/cn';

/**
 * Convierte un color hex a RGB para usar en rgba()
 */
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '139, 92, 246';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

/**
 * Parsea una fecha ISO (YYYY-MM-DD) sin problemas de timezone.
 */
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// =============================================================================
// CONTENIDO VISUAL (recibe identity ya cargada)
// =============================================================================

interface MisionVisionContentProps {
  identity: CorporateIdentity;
  onEdit: () => void;
  canEdit: boolean;
}

const MisionVisionContent = ({ identity, onEdit, canEdit }: MisionVisionContentProps) => {
  const { primaryColor, secondaryColor, companyName } = useBrandingConfig();
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const primaryRgb = useMemo(() => hexToRgb(primaryColor), [primaryColor]);
  const secondaryRgb = useMemo(() => hexToRgb(secondaryColor), [secondaryColor]);

  return (
    <div className="space-y-6">
      {/* DataSection Header */}
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

      {/* Grid Misión y Visión — Glassmorphism */}
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
          <div
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          />
          <div className="relative p-8">
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
            <div className="h-1 w-16 rounded-full mb-6" style={{ backgroundColor: primaryColor }} />
            <div
              className={cn(
                'text-gray-700 dark:text-gray-200',
                'prose prose-lg max-w-none dark:prose-invert',
                'prose-p:leading-relaxed prose-p:text-base',
                'prose-strong:text-gray-900 dark:prose-strong:text-white'
              )}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(identity.mission) }}
            />
          </div>
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
          <div
            className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
            style={{ backgroundColor: secondaryColor }}
          />
          <div className="relative p-8">
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
            <div
              className="h-1 w-16 rounded-full mb-6"
              style={{ backgroundColor: secondaryColor }}
            />
            <div
              className={cn(
                'text-gray-700 dark:text-gray-200',
                'prose prose-lg max-w-none dark:prose-invert',
                'prose-p:leading-relaxed prose-p:text-base',
                'prose-strong:text-gray-900 dark:prose-strong:text-white'
              )}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(identity.vision) }}
            />
          </div>
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
// SECCIÓN AUTOCONTENIDA (fetch propio)
// =============================================================================

export const MisionVisionSection = () => {
  const { data: identity, isLoading } = useActiveIdentity();
  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.FUNDACION, Sections.MISION_VISION, 'edit');
  const canCreate = canDo(Modules.FUNDACION, Sections.MISION_VISION, 'create');

  const [showModal, setShowModal] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<CorporateIdentity | null>(null);

  const handleEdit = () => {
    setEditingIdentity(identity ?? null);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
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

  if (!identity) {
    return (
      <>
        <EmptyState
          icon={<DynamicIcon name="Compass" size={48} />}
          title="Sin Identidad Corporativa"
          description="No hay una identidad corporativa configurada. Crea una para definir la misión, visión y valores de la organización."
          action={
            canCreate
              ? {
                  label: 'Crear Identidad Corporativa',
                  onClick: () => setShowModal(true),
                  icon: <Plus className="h-4 w-4" />,
                }
              : undefined
          }
        />
        <IdentityFormModal identity={null} isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <>
      <MisionVisionContent identity={identity} onEdit={handleEdit} canEdit={canEdit} />
      <IdentityFormModal
        identity={editingIdentity}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingIdentity(null);
        }}
      />
    </>
  );
};
