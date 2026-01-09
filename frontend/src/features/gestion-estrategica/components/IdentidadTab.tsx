/**
 * Tab de Identidad Corporativa
 *
 * Secciones dinámicas desde BD (TabSection.code):
 * - mision_vision: Misión y Visión
 * - valores: Valores Corporativos (con Drag & Drop)
 * - politica: Política Integral (con workflow y firma digital)
 * - politicas: Políticas Específicas (por sistema de gestión)
 *
 * Mejoras implementadas:
 * - Editor de texto enriquecido (TipTap) para políticas
 * - Drag & Drop para reordenar valores corporativos
 * - Workflow completo de políticas: BORRADOR → EN_REVISION → VIGENTE → OBSOLETO
 * - Sistema de revisión periódica con alertas
 * - Firma digital SHA-256
 */
import { useState, useEffect } from 'react';
import {
  Compass,
  Eye,
  Heart,
  FileCheck,
  Edit,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Card, Badge, Button, Alert, EmptyState } from '@/components/common';
import {
  useActiveIdentity,
  useSignPolicy,
  useValues,
  useCreateValue,
  useUpdateValue,
  useDeleteValue,
  useReorderValues,
  usePoliticasIntegrales,
  useCreatePoliticaIntegral,
  useUpdatePoliticaIntegral,
  useDeletePoliticaIntegral,
  useSignPoliticaIntegral,
  usePublishPoliticaIntegral,
  usePoliticasEspecificas,
  useCreatePoliticaEspecifica,
  useUpdatePoliticaEspecifica,
  useDeletePoliticaEspecifica,
  useApprovePoliticaEspecifica,
} from '../hooks/useStrategic';
import { IdentityFormModal } from './modals/IdentityFormModal';
import { ValoresDragDrop } from './ValoresDragDrop';
import { PoliticasManager } from './PoliticasManager';
import type { CorporateIdentity, CorporateValue } from '../types/strategic.types';

interface IdentidadTabProps {
  /** Código de la sección activa (desde API/DynamicSections) */
  activeSection?: string;
  triggerNewForm?: number;
}

// =============================================================================
// SECCIÓN: MISIÓN Y VISIÓN
// =============================================================================
interface MisionVisionSectionProps {
  identity: CorporateIdentity;
  onEdit: () => void;
}

const MisionVisionSection = ({ identity, onEdit }: MisionVisionSectionProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={identity.is_signed ? 'success' : 'warning'} size="lg">
            {identity.is_signed ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Identidad Firmada
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-1" />
                Pendiente de Firma
              </>
            )}
          </Badge>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Versión {identity.version} - Vigente desde{' '}
            {new Date(identity.effective_date).toLocaleDateString()}
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Grid Misión y Visión */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Misión */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Compass className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Misión
              </h3>
            </div>
            <div
              className="text-gray-600 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: identity.mission }}
            />
          </div>
        </Card>

        {/* Visión */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Visión
              </h3>
            </div>
            <div
              className="text-gray-600 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: identity.vision }}
            />
          </div>
        </Card>
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
// SECCIÓN: POLÍTICA INTEGRAL (versión simplificada para backward compat)
// =============================================================================
interface PoliticaSectionProps {
  identity: CorporateIdentity;
  onSign: () => void;
  isSigningPolicy: boolean;
}

const PoliticaSection = ({ identity, onSign, isSigningPolicy }: PoliticaSectionProps) => {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Política Integral
            </h3>
          </div>
          {!identity.is_signed && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSign}
              isLoading={isSigningPolicy}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Firmar Digitalmente
            </Button>
          )}
        </div>

        {identity.is_signed && (
          <Alert
            variant="success"
            message={`Firmada por ${identity.signed_by_name} el ${new Date(identity.policy_signed_at!).toLocaleDateString()}`}
            className="mb-4"
          />
        )}

        <div
          className="text-gray-600 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: identity.integral_policy }}
        />
      </div>
    </Card>
  );
};

// =============================================================================
// SECCIÓN: POLÍTICAS (Manager completo con workflow)
// =============================================================================
interface PoliticasSectionProps {
  identity: CorporateIdentity;
}

const PoliticasSection = ({ identity }: PoliticasSectionProps) => {
  // Hooks para políticas integrales
  const { data: politicasIntegralesData, isLoading: loadingIntegrales } = usePoliticasIntegrales({
    identity: identity.id,
  });
  const createIntegralMutation = useCreatePoliticaIntegral();
  const updateIntegralMutation = useUpdatePoliticaIntegral();
  const deleteIntegralMutation = useDeletePoliticaIntegral();
  const signIntegralMutation = useSignPoliticaIntegral();
  const publishIntegralMutation = usePublishPoliticaIntegral();

  // Hooks para políticas específicas
  const { data: politicasEspecificasData, isLoading: loadingEspecificas } = usePoliticasEspecificas({
    identity: identity.id,
  });
  const createEspecificaMutation = useCreatePoliticaEspecifica();
  const updateEspecificaMutation = useUpdatePoliticaEspecifica();
  const deleteEspecificaMutation = useDeletePoliticaEspecifica();
  const approveEspecificaMutation = useApprovePoliticaEspecifica();

  if (loadingIntegrales || loadingEspecificas) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <PoliticasManager
      identityId={identity.id}
      // Políticas Integrales
      politicasIntegrales={politicasIntegralesData?.results || []}
      onCreateIntegral={async (data) => {
        await createIntegralMutation.mutateAsync(data);
      }}
      onUpdateIntegral={async (id, data) => {
        await updateIntegralMutation.mutateAsync({ id, data });
      }}
      onDeleteIntegral={async (id) => {
        await deleteIntegralMutation.mutateAsync(id);
      }}
      onSignIntegral={async (id) => {
        await signIntegralMutation.mutateAsync(id);
      }}
      onPublishIntegral={async (id) => {
        await publishIntegralMutation.mutateAsync(id);
      }}
      // Políticas Específicas
      politicasEspecificas={politicasEspecificasData?.results || []}
      onCreateEspecifica={async (data) => {
        await createEspecificaMutation.mutateAsync(data);
      }}
      onUpdateEspecifica={async (id, data) => {
        await updateEspecificaMutation.mutateAsync({ id, data });
      }}
      onDeleteEspecifica={async (id) => {
        await deleteEspecificaMutation.mutateAsync(id);
      }}
      onApproveEspecifica={async (id) => {
        await approveEspecificaMutation.mutateAsync(id);
      }}
      isLoading={
        createIntegralMutation.isPending ||
        updateIntegralMutation.isPending ||
        deleteIntegralMutation.isPending ||
        signIntegralMutation.isPending ||
        publishIntegralMutation.isPending ||
        createEspecificaMutation.isPending ||
        updateEspecificaMutation.isPending ||
        deleteEspecificaMutation.isPending ||
        approveEspecificaMutation.isPending
      }
    />
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

/**
 * Mapeo de códigos de sección a componentes
 * Los códigos deben coincidir con los de la BD (TabSection.code)
 */
const SECTION_KEYS = {
  MISION_VISION: 'mision_vision',
  VALORES: 'valores',
  POLITICA: 'politica',
  POLITICAS: 'politicas',
} as const;

export const IdentidadTab = ({ activeSection, triggerNewForm }: IdentidadTabProps) => {
  const { data: identity, isLoading } = useActiveIdentity();
  const signPolicyMutation = useSignPolicy();

  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<CorporateIdentity | null>(null);

  // Trigger desde el header para abrir modal de nueva versión
  useEffect(() => {
    if (triggerNewForm && triggerNewForm > 0) {
      setEditingIdentity(null);
      setShowIdentityModal(true);
    }
  }, [triggerNewForm]);

  const handleSignPolicy = async () => {
    if (!identity) return;
    if (window.confirm('Esta acción firmará digitalmente la Política Integral. ¿Desea continuar?')) {
      await signPolicyMutation.mutateAsync(identity.id);
    }
  };

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
          icon={<Compass className="h-12 w-12" />}
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

      case SECTION_KEYS.POLITICA:
        return (
          <PoliticaSection
            identity={identity}
            onSign={handleSignPolicy}
            isSigningPolicy={signPolicyMutation.isPending}
          />
        );

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
