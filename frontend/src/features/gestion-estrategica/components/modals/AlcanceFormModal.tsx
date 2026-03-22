/**
 * Modal para editar Alcance del Sistema Integrado de Gestión
 *
 * Separado de IdentityFormModal para evitar confusión con Misión/Visión.
 * Solo edita campos alcance_* sobre una identidad existente.
 *
 * Usa Design System: BaseModal, Input, Textarea, Switch, Button
 */
import { useState, useEffect } from 'react';
import { Target, MapPin, Workflow, AlertTriangle, Check } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/forms/Textarea';
import { useUpdateIdentity } from '../../hooks/useStrategic';
import { useAreas } from '../../hooks/useAreas';
import type { CorporateIdentity } from '../../types/strategic.types';
import { cn } from '@/utils/cn';

interface AlcanceFormModalProps {
  identity: CorporateIdentity | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AlcanceFormModal = ({ identity, isOpen, onClose }: AlcanceFormModalProps) => {
  const [formData, setFormData] = useState({
    declara_alcance: true,
    alcance_general: '',
    alcance_geografico: '',
    alcance_exclusiones: '',
    procesos_cubiertos_ids: [] as number[],
  });

  const { data: areasData } = useAreas({ is_active: true });
  const areas = areasData?.results || [];

  const updateMutation = useUpdateIdentity();

  useEffect(() => {
    if (identity) {
      setFormData({
        declara_alcance: true,
        alcance_general: identity.alcance_general ?? '',
        alcance_geografico: identity.alcance_geografico ?? '',
        alcance_exclusiones: identity.alcance_exclusiones ?? '',
        procesos_cubiertos_ids: identity.procesos_cubiertos?.map((p) => p.id) || [],
      });
    }
  }, [identity, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) return;

    await updateMutation.mutateAsync({
      id: identity.id,
      data: {
        declara_alcance: true,
        alcance_general: formData.alcance_general,
        alcance_geografico: formData.alcance_geografico,
        alcance_exclusiones: formData.alcance_exclusiones,
        procesos_cubiertos_ids: formData.procesos_cubiertos_ids,
      },
    });

    onClose();
  };

  const handleAreaToggle = (areaId: number) => {
    const current = formData.procesos_cubiertos_ids;
    const updated = current.includes(areaId)
      ? current.filter((id) => id !== areaId)
      : [...current, areaId];
    setFormData({ ...formData, procesos_cubiertos_ids: updated });
  };

  const isValid = formData.alcance_general.trim().length > 0;
  const isLoading = updateMutation.isPending;

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !isValid}
        isLoading={isLoading}
      >
        Guardar Alcance
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Alcance del Sistema Integrado de Gestión"
      subtitle="Define el alcance, cobertura geográfica y procesos del SIG"
      size="3xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Toggle de Alcance */}
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Declarar Alcance del SIG
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active para definir el alcance del Sistema Integrado de Gestión
              </p>
            </div>
          </div>
        </div>

        {/* Campos de alcance */}
        <div className="space-y-4">
          {/* Alcance General */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Target className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Alcance General del SIG *</span>
            </div>
            <Textarea
              value={formData.alcance_general}
              onChange={(e) => setFormData({ ...formData, alcance_general: e.target.value })}
              placeholder="Describa el alcance general del Sistema Integrado de Gestión..."
              rows={3}
              error={
                formData.declara_alcance && !formData.alcance_general.trim()
                  ? 'Campo requerido'
                  : undefined
              }
            />
          </div>

          {/* Cobertura Geográfica */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Cobertura Geográfica</span>
            </div>
            <Textarea
              value={formData.alcance_geografico}
              onChange={(e) => setFormData({ ...formData, alcance_geografico: e.target.value })}
              placeholder="Ej: Colombia - Oficinas en Bogotá, Medellín y Cali"
              rows={2}
            />
          </div>

          {/* Procesos Cubiertos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Workflow className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Procesos Cubiertos</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formData.procesos_cubiertos_ids.length} seleccionado
                {formData.procesos_cubiertos_ids.length !== 1 ? 's' : ''}
              </span>
            </div>

            {areas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                {areas.map((area) => (
                  <label
                    key={area.id}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors',
                      formData.procesos_cubiertos_ids.includes(area.id)
                        ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        formData.procesos_cubiertos_ids.includes(area.id)
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                    >
                      {formData.procesos_cubiertos_ids.includes(area.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.procesos_cubiertos_ids.includes(area.id)}
                      onChange={() => handleAreaToggle(area.id)}
                    />
                    <span
                      className="text-sm text-gray-900 dark:text-white truncate"
                      title={area.name}
                    >
                      {area.name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay áreas configuradas.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Configure las áreas en Organización
                </p>
              </div>
            )}
          </div>

          {/* Exclusiones */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-medium">Exclusiones Generales</span>
              <span className="text-xs text-gray-400">(opcional)</span>
            </div>
            <Textarea
              value={formData.alcance_exclusiones}
              onChange={(e) => setFormData({ ...formData, alcance_exclusiones: e.target.value })}
              placeholder="Ej: No aplica el requisito 7.1.5.2 por no requerir trazabilidad de mediciones."
              rows={2}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Las exclusiones específicas por norma ISO se configuran en "Alcances del Sistema"
            </p>
          </div>
        </div>
      </form>
    </BaseModal>
  );
};
