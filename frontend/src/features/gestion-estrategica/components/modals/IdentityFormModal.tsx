/**
 * Modal para crear/editar Identidad Corporativa
 *
 * v3.0 - Solo Misión y Visión
 * - La Política Integral se gestiona desde PoliticasManager (tab Políticas)
 * - Editor de texto enriquecido (TipTap) para misión y visión
 * - Soporte para formato rico (negrita, cursiva, listas, etc.)
 *
 * v4.1 - Campos de Alcance del SIG
 * - Toggle "¿Desea declarar alcance?" controla visibilidad de sección
 * - Campos: alcance_general, alcance_geografico, alcance_procesos, alcance_exclusiones
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input para campos simples
 * - RichTextEditor para contenido formateado
 * - Button para acciones
 */
import { useState, useEffect } from 'react';
import { Compass, Eye, Target, MapPin, Workflow, AlertTriangle, Check } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { RichTextEditor } from '@/components/forms/RichTextEditor';
import { Switch } from '@/components/forms/Switch';
import { useCreateIdentity, useUpdateIdentity } from '../../hooks/useStrategic';
import { useAreas } from '../../hooks/useAreas';
import type { CorporateIdentity, CreateCorporateIdentityDTO, UpdateCorporateIdentityDTO } from '../../types/strategic.types';
import { cn } from '@/lib/utils';

interface IdentityFormModalProps {
  identity: CorporateIdentity | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IdentityFormModal = ({ identity, isOpen, onClose }: IdentityFormModalProps) => {
  const isEditing = identity !== null;

  const [formData, setFormData] = useState({
    mission: '',
    vision: '',
    effective_date: '',
    version: '1.0',
    // Campos de alcance del SIG (v4.1)
    declara_alcance: false,
    alcance_general: '',
    alcance_geografico: '',
    alcance_procesos: '',
    alcance_exclusiones: '',
    // Procesos cubiertos - IDs de áreas (v4.2)
    procesos_cubiertos_ids: [] as number[],
  });

  // Query para obtener áreas disponibles
  const { data: areasData } = useAreas({ is_active: true });
  const areas = areasData?.results || [];

  const createMutation = useCreateIdentity();
  const updateMutation = useUpdateIdentity();

  useEffect(() => {
    if (identity) {
      setFormData({
        mission: identity.mission,
        vision: identity.vision,
        effective_date: identity.effective_date,
        version: identity.version,
        // Campos de alcance del SIG (v4.1)
        declara_alcance: identity.declara_alcance ?? false,
        alcance_general: identity.alcance_general ?? '',
        alcance_geografico: identity.alcance_geografico ?? '',
        alcance_procesos: identity.alcance_procesos ?? '',
        alcance_exclusiones: identity.alcance_exclusiones ?? '',
        // Procesos cubiertos - extraer IDs de las áreas (v4.2)
        procesos_cubiertos_ids: identity.procesos_cubiertos?.map(p => p.id) || [],
      });
    } else {
      setFormData({
        mission: '',
        vision: '',
        effective_date: new Date().toISOString().split('T')[0],
        version: '1.0',
        // Campos de alcance del SIG (v4.1)
        declara_alcance: false,
        alcance_general: '',
        alcance_geografico: '',
        alcance_procesos: '',
        alcance_exclusiones: '',
        // Procesos cubiertos (v4.2)
        procesos_cubiertos_ids: [],
      });
    }
  }, [identity, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const baseData = {
      mission: formData.mission,
      vision: formData.vision,
      effective_date: formData.effective_date,
      version: formData.version,
      // Campos de alcance del SIG
      declara_alcance: formData.declara_alcance,
      alcance_general: formData.declara_alcance ? formData.alcance_general : undefined,
      alcance_geografico: formData.declara_alcance ? formData.alcance_geografico : undefined,
      alcance_procesos: formData.declara_alcance ? formData.alcance_procesos : undefined,
      alcance_exclusiones: formData.declara_alcance ? formData.alcance_exclusiones : undefined,
      // Procesos cubiertos - IDs de áreas (v4.2)
      procesos_cubiertos_ids: formData.declara_alcance ? formData.procesos_cubiertos_ids : [],
    };

    if (isEditing && identity) {
      const updateData: UpdateCorporateIdentityDTO = baseData;
      await updateMutation.mutateAsync({ id: identity.id, data: updateData });
    } else {
      const createData: CreateCorporateIdentityDTO = baseData;
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  // Handler para toggle de área en el selector
  const handleAreaToggle = (areaId: number) => {
    const current = formData.procesos_cubiertos_ids;
    const updated = current.includes(areaId)
      ? current.filter(id => id !== areaId)
      : [...current, areaId];
    setFormData({ ...formData, procesos_cubiertos_ids: updated });
  };

  // Validar contenido de editores (quitar tags HTML vacíos)
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Validación: misión y visión requeridos, alcance_general requerido si declara_alcance
  const isValid =
    stripHtml(formData.mission).trim().length > 0 &&
    stripHtml(formData.vision).trim().length > 0 &&
    (!formData.declara_alcance || formData.alcance_general.trim().length > 0);

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
        {isEditing ? 'Guardar Cambios' : 'Crear Identidad'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Identidad Corporativa' : 'Nueva Identidad Corporativa'}
      subtitle="Define la misión y visión de la organización"
      size="4xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de Vigencia *"
            type="date"
            value={formData.effective_date}
            onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
            required
          />
          <Input
            label="Versión"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="1.0"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Compass className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Misión *</span>
          </div>
          <RichTextEditor
            value={formData.mission}
            onChange={(value) => setFormData({ ...formData, mission: value })}
            placeholder="Describa la misión de la organización: razón de ser, propósito fundamental..."
            minHeight="150px"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Eye className="w-5 h-5 text-indigo-600" />
            <span className="font-medium">Visión *</span>
          </div>
          <RichTextEditor
            value={formData.vision}
            onChange={(value) => setFormData({ ...formData, vision: value })}
            placeholder="Describa la visión de la organización: hacia dónde se dirige, aspiración a futuro..."
            minHeight="150px"
          />
        </div>

        {/* Separador visual */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          {/* Toggle de Alcance del SIG */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Alcance del Sistema Integrado de Gestión
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Define el alcance general, cobertura geográfica y procesos del SIG
                </p>
              </div>
            </div>
            <Switch
              checked={formData.declara_alcance}
              onCheckedChange={(checked) => setFormData({ ...formData, declara_alcance: checked })}
              label="¿Declarar alcance?"
            />
          </div>

          {/* Campos de alcance (condicional) */}
          <div
            className={cn(
              'space-y-4 overflow-hidden transition-all duration-300',
              formData.declara_alcance ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            {/* Alcance General */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Target className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Alcance General del SIG *</span>
              </div>
              <Textarea
                value={formData.alcance_general}
                onChange={(e) => setFormData({ ...formData, alcance_general: e.target.value })}
                placeholder="Describa el alcance general del Sistema Integrado de Gestión. Ejemplo: 'Diseño, desarrollo, implementación y mantenimiento de soluciones tecnológicas...'"
                rows={3}
                error={formData.declara_alcance && !formData.alcance_general.trim() ? 'Campo requerido' : undefined}
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

            {/* Procesos Cubiertos - Selector Dinámico de Áreas (v4.2) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Workflow className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Procesos Cubiertos</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.procesos_cubiertos_ids.length} seleccionado{formData.procesos_cubiertos_ids.length !== 1 ? 's' : ''}
                </span>
              </div>

              {areas.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
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
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        formData.procesos_cubiertos_ids.includes(area.id)
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-300 dark:border-gray-600'
                      )}>
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
                      <span className="text-sm text-gray-900 dark:text-white truncate" title={area.name}>
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
                    Configure las áreas en Organización → Áreas
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Seleccione las áreas/procesos cubiertos por el Sistema Integrado de Gestión.
                Las áreas se administran en Dirección Estratégica → Organización → Áreas.
              </p>
            </div>

            {/* Exclusiones Generales */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Exclusiones Generales</span>
                <span className="text-xs text-gray-400">(opcional)</span>
              </div>
              <Textarea
                value={formData.alcance_exclusiones}
                onChange={(e) => setFormData({ ...formData, alcance_exclusiones: e.target.value })}
                placeholder="Ej: No aplica el requisito 7.1.5.2 por no requerir trazabilidad de mediciones. Las exclusiones específicas por norma se gestionan en Alcances por Norma ISO."
                rows={2}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Las exclusiones específicas por norma ISO se configuran en la sección "Alcances del Sistema"
              </p>
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  );
};
