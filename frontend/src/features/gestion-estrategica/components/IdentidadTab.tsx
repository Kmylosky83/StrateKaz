/**
 * Tab de Identidad Corporativa
 *
 * Secciones dinámicas desde BD (TabSection.code):
 * - mision_vision: Misión y Visión
 * - valores: Valores Corporativos
 * - politica: Política Integral
 * - politicas: Políticas Específicas (por sistema de gestión)
 *
 * Usa Design System:
 * - Card para contenedores
 * - Badge para etiquetas
 * - Button para acciones
 * - Alert para mensajes
 * - EmptyState para estados vacíos
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
  Sparkles,
  FileText,
} from 'lucide-react';
import { Card, Badge, Button, Alert, EmptyState } from '@/components/common';
import { useActiveIdentity, useSignPolicy } from '../hooks/useStrategic';
import { IdentityFormModal } from './modals/IdentityFormModal';
import { ValueFormModal } from './modals/ValueFormModal';
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
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {identity.mission}
            </p>
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
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {identity.vision}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

// =============================================================================
// SECCIÓN: VALORES CORPORATIVOS
// =============================================================================
interface ValoresSectionProps {
  identity: CorporateIdentity;
  onAddValue: () => void;
  onEditValue: (value: CorporateValue) => void;
}

const ValoresSection = ({ identity, onAddValue, onEditValue }: ValoresSectionProps) => {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Valores Corporativos
            </h3>
            <Badge variant="gray" size="sm">
              {identity.values?.length || 0}
            </Badge>
          </div>
          <Button variant="primary" size="sm" onClick={onAddValue}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Valor
          </Button>
        </div>

        {identity.values && identity.values.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {identity.values.map((value) => (
              <div
                key={value.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer"
                onClick={() => onEditValue(value)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {value.name}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay valores corporativos definidos
          </div>
        )}
      </div>
    </Card>
  );
};

// =============================================================================
// SECCIÓN: POLÍTICA INTEGRAL
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

        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
          {identity.integral_policy}
        </p>
      </div>
    </Card>
  );
};

// =============================================================================
// SECCIÓN: POLÍTICAS ESPECÍFICAS (Por sistema de gestión)
// =============================================================================
const PoliticasSection = () => {
  // TODO: Implementar cuando existan modelos de políticas específicas
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Políticas Específicas
          </h3>
        </div>

        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Próximamente"
          description="Aquí podrás gestionar políticas específicas por sistema de gestión: SST, Calidad, Ambiental, PESV, etc."
        />
      </div>
    </Card>
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
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedValue, setSelectedValue] = useState<CorporateValue | null>(null);
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

  const handleEditValue = (value: CorporateValue) => {
    setSelectedValue(value);
    setShowValueModal(true);
  };

  const handleAddValue = () => {
    setSelectedValue(null);
    setShowValueModal(true);
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

  // Empty state
  if (!identity) {
    return (
      <>
        <EmptyState
          icon={<Compass className="h-12 w-12" />}
          title="Sin Identidad Corporativa"
          description="No hay una identidad corporativa configurada. Usa el botón 'Crear Identidad' en la parte superior para comenzar."
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
        return (
          <ValoresSection
            identity={identity}
            onAddValue={handleAddValue}
            onEditValue={handleEditValue}
          />
        );

      case SECTION_KEYS.POLITICA:
        return (
          <PoliticaSection
            identity={identity}
            onSign={handleSignPolicy}
            isSigningPolicy={signPolicyMutation.isPending}
          />
        );

      case SECTION_KEYS.POLITICAS:
        return <PoliticasSection />;

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

      {/* Modales */}
      <IdentityFormModal
        identity={editingIdentity}
        isOpen={showIdentityModal}
        onClose={() => {
          setShowIdentityModal(false);
          setEditingIdentity(null);
        }}
      />

      <ValueFormModal
        value={selectedValue}
        identityId={identity.id}
        isOpen={showValueModal}
        onClose={() => {
          setShowValueModal(false);
          setSelectedValue(null);
        }}
      />
    </>
  );
};
