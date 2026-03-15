/**
 * Sección: Valores Corporativos — Autocontenida
 *
 * Drag & Drop para reordenar valores. Vista cards/list.
 * Requiere CorporateIdentity activa para funcionar.
 *
 * Se usa en: Tab "Mi Empresa" → subtab "valores"
 */
import { useState } from 'react';
import { Plus, Heart, LayoutGrid, LayoutList } from 'lucide-react';
import { Card, Button, EmptyState, DynamicIcon } from '@/components/common';
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
import { ValoresDragDrop, type ViewMode } from './ValoresDragDrop';
import { IdentityFormModal } from './modals/IdentityFormModal';
import { cn } from '@/utils/cn';

export const ValoresSection = () => {
  const { data: identity, isLoading: identityLoading } = useActiveIdentity();
  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.FUNDACION, Sections.VALORES, 'edit');
  const canCreate = canDo(Modules.FUNDACION, Sections.VALORES, 'create');
  const { color: moduleColor } = useModuleColor('fundacion');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);
  const { primaryColor } = useBrandingConfig();

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isCreating, setIsCreating] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  const { data: valuesData, isLoading: valuesLoading } = useValues(identity?.id ?? 0);
  const createValueMutation = useCreateValue();
  const updateValueMutation = useUpdateValue();
  const deleteValueMutation = useDeleteValue();
  const reorderMutation = useReorderValues(identity?.id ?? 0);

  const values = Array.isArray(valuesData) ? valuesData : identity?.values || [];

  // Loading
  if (identityLoading || (identity && valuesLoading)) {
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

  // Sin identidad → crear primero
  if (!identity) {
    return (
      <>
        <EmptyState
          icon={<DynamicIcon name="Heart" size={48} />}
          title="Primero define tu identidad"
          description="Para agregar valores corporativos, primero crea la identidad corporativa con misión y visión en la pestaña Direccionamiento."
          action={
            canCreate
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

  return (
    <div className="space-y-6">
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  '!p-1.5 !min-h-0 rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
                style={viewMode === 'list' ? { color: primaryColor } : undefined}
                title="Vista de lista"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('cards')}
                className={cn(
                  '!p-1.5 !min-h-0 rounded-md transition-colors',
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
                style={viewMode === 'cards' ? { color: primaryColor } : undefined}
                title="Vista de tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>

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
