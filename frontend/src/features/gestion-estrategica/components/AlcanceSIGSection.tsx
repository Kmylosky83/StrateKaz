/**
 * Sección: Alcance del Sistema Integrado de Gestión — Autocontenida
 *
 * Muestra cobertura geográfica, procesos cubiertos y exclusiones.
 * Datos provienen de CorporateIdentity (campos alcance_*).
 *
 * Se usa en: Tab "Mi Sistema de Gestión" → subtab "alcance_sig"
 */
import { useState } from 'react';
import { Edit, Target, MapPin, Workflow, AlertTriangle, Plus } from 'lucide-react';
import { Card, Badge, Button, EmptyState, DynamicIcon } from '@/components/common';
import { DataSection } from '@/components/data-display';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import { useActiveIdentity } from '../hooks/useStrategic';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { IdentityFormModal } from './modals/IdentityFormModal';
import type { CorporateIdentity } from '../types/strategic.types';
import { cn } from '@/utils/cn';

export const AlcanceSIGSection = () => {
  const { data: identity, isLoading } = useActiveIdentity();
  const { canDo } = usePermissions();
  const canEdit = canDo(Modules.FUNDACION, Sections.ALCANCE, 'edit');
  const canCreate = canDo(Modules.FUNDACION, Sections.ALCANCE, 'create');
  const { color: moduleColor } = useModuleColor('fundacion');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const [showModal, setShowModal] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<CorporateIdentity | null>(null);

  const handleEdit = () => {
    setEditingIdentity(identity ?? null);
    setShowModal(true);
  };

  // Loading
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse-subtle space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </Card>
    );
  }

  // Sin identidad
  if (!identity) {
    return (
      <>
        <EmptyState
          icon={<DynamicIcon name="Target" size={48} />}
          title="Primero define tu identidad"
          description="Para definir el alcance del SIG, primero crea la identidad corporativa con misión y visión en la pestaña Direccionamiento."
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

  // Sin alcance declarado
  if (!identity.declara_alcance) {
    return (
      <>
        <EmptyState
          icon={<Target className="w-12 h-12 text-gray-400" />}
          title="Alcance del SIG no declarado"
          description="La organización aún no ha declarado el alcance de su Sistema Integrado de Gestión. Edita la identidad corporativa y activa la declaración de alcance."
          action={
            canEdit
              ? {
                  label: 'Configurar Alcance',
                  onClick: handleEdit,
                  icon: <Edit className="h-4 w-4" />,
                }
              : undefined
          }
        />
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
  }

  return (
    <>
      <div className="space-y-6">
        <DataSection
          icon={Target}
          iconBgClass={colorClasses.badge}
          iconClass={colorClasses.icon}
          title="Alcance del Sistema Integrado de Gestión"
          description="Cobertura y aplicabilidad del SIG"
          action={
            canEdit && (
              <Button variant="secondary" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )
          }
        />

        {/* Card Alcance — Glassmorphism verde */}
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl',
            'backdrop-blur-xl border border-white/20',
            'shadow-xl hover:shadow-2xl transition-all duration-300',
            'group'
          )}
          style={{
            background:
              'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
          }}
        >
          <div
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
            style={{ backgroundColor: '#10b981' }}
          />

          <div className="relative p-8">
            {/* Alcance General */}
            {identity.alcance_general && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Alcance General</span>
                </div>
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                  {identity.alcance_general}
                </p>
              </div>
            )}

            {/* Grid de campos */}
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

              {/* Procesos Cubiertos */}
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

            {/* Empty sub-state si no hay datos */}
            {!identity.alcance_general &&
              !identity.alcance_geografico &&
              (!identity.procesos_cubiertos || identity.procesos_cubiertos.length === 0) &&
              !identity.alcance_exclusiones && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    El alcance está habilitado pero sin datos. Edita para agregar la información.
                  </p>
                </div>
              )}
          </div>

          <div
            className="h-1 w-full"
            style={{
              background: 'linear-gradient(90deg, #10b981 0%, transparent 100%)',
            }}
          />
        </div>
      </div>

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
