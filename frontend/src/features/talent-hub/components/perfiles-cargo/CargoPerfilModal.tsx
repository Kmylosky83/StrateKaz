/**
 * CargoPerfilModal — Requisitos y SST por Cargo
 * REORG-B2: Talent Hub edita Requisitos + SST del cargo.
 * Fundación edita Identificación + Funciones + Acceso.
 *
 * Usa la misma API /core/cargos-rbac/ (modelo Cargo en C0).
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { useCargo, useUpdateCargo } from '@/features/configuracion/hooks/useCargos';
import { useRiesgosOcupacionales } from '@/features/configuracion/hooks/useRiesgosOcupacionales';
import { RiesgoSelector } from '@/features/configuracion/components/RiesgoSelector';
import { CompetenciasTable } from '@/features/configuracion/components/CompetenciasTable';
import { useSelectTiposEPP } from '@/hooks/useSelectLists';
import type {
  CargoList,
  UpdateCargoDTO,
  NivelEducativo,
  ExperienciaRequerida,
  CompetenciaCargo,
  EPPItem,
} from '@/features/configuracion/types/rbac.types';
import {
  NIVEL_EDUCATIVO_OPTIONS,
  EXPERIENCIA_OPTIONS,
  EXAMENES_MEDICOS_SUGERIDOS,
  CAPACITACIONES_SST_SUGERIDAS,
  normalizeCompetencias,
} from '@/features/configuracion/types/rbac.types';
import type { Tab } from '@/components/common';
import { GraduationCap, ShieldCheck, Plus, Trash2 } from 'lucide-react';

interface CargoPerfilModalProps {
  cargo: CargoList | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'requisitos' | 'sst';

const TABS: Tab[] = [
  { id: 'requisitos', label: 'Requisitos', icon: <GraduationCap size={16} /> },
  { id: 'sst', label: 'SST', icon: <ShieldCheck size={16} /> },
];

/** Normaliza epp_requeridos legacy (string[]) o estructurado (EPPItem[]) */
const normalizeEppItems = (data: unknown): EPPItem[] => {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    if (typeof item === 'string') {
      return { tipo_epp_id: null, nombre: item, cantidad: 1, obligatorio: true };
    }
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      return {
        tipo_epp_id: (obj.tipo_epp_id as number | null) ?? null,
        nombre: (obj.nombre as string) || '',
        cantidad: (obj.cantidad as number) || 1,
        obligatorio: obj.obligatorio !== false,
      };
    }
    return { tipo_epp_id: null, nombre: String(item), cantidad: 1, obligatorio: true };
  });
};

// Componente para editar listas de strings
const ListEditor = ({
  items,
  onChange,
  placeholder,
  suggestions,
  label,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  suggestions?: string[];
  label: string;
}) => {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addSuggestion = (suggestion: string) => {
    if (!items.includes(suggestion)) {
      onChange([...items, suggestion]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus size={16} />
        </Button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md"
            >
              {item}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="p-0.5 hover:text-red-500 h-auto min-h-0"
              >
                <Trash2 size={14} />
              </Button>
            </span>
          ))}
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sugerencias:</p>
          <div className="flex flex-wrap gap-1">
            {suggestions
              .filter((s) => !items.includes(s))
              .slice(0, 8)
              .map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addSuggestion(suggestion)}
                  className="px-2 py-0.5 text-xs h-auto min-h-0"
                >
                  + {suggestion}
                </Button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CargoPerfilModal = ({ cargo, isOpen, onClose }: CargoPerfilModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('requisitos');
  const [formData, setFormData] = useState({
    // Requisitos
    nivel_educativo: undefined as NivelEducativo | undefined,
    titulo_requerido: '',
    experiencia_requerida: undefined as ExperienciaRequerida | undefined,
    experiencia_especifica: '',
    competencias_tecnicas: [] as CompetenciaCargo[],
    competencias_blandas: [] as CompetenciaCargo[],
    licencias_certificaciones: [] as string[],
    formacion_complementaria: '',
    // SST
    riesgo_ids: [] as number[],
    epp_requeridos: [] as EPPItem[],
    examenes_medicos: [] as string[],
    restricciones_medicas: '',
    capacitaciones_sst: [] as string[],
  });

  const { data: cargoCompleto, isLoading: isLoadingCargo } = useCargo(cargo?.id ?? null);
  const updateMutation = useUpdateCargo();
  const { data: riesgosData } = useRiesgosOcupacionales({});
  const { data: tiposEPP = [] } = useSelectTiposEPP();

  const isLoading = updateMutation.isPending || isLoadingCargo;

  useEffect(() => {
    if (cargoCompleto) {
      setFormData({
        nivel_educativo: cargoCompleto.nivel_educativo,
        titulo_requerido: cargoCompleto.titulo_requerido || '',
        experiencia_requerida: cargoCompleto.experiencia_requerida,
        experiencia_especifica: cargoCompleto.experiencia_especifica || '',
        competencias_tecnicas: normalizeCompetencias(cargoCompleto.competencias_tecnicas || []),
        competencias_blandas: normalizeCompetencias(cargoCompleto.competencias_blandas || []),
        licencias_certificaciones: cargoCompleto.licencias_certificaciones || [],
        formacion_complementaria: cargoCompleto.formacion_complementaria || '',
        riesgo_ids: cargoCompleto.expuesto_riesgos || [],
        epp_requeridos: normalizeEppItems(cargoCompleto.epp_requeridos),
        examenes_medicos: cargoCompleto.examenes_medicos || [],
        restricciones_medicas: cargoCompleto.restricciones_medicas || '',
        capacitaciones_sst: cargoCompleto.capacitaciones_sst || [],
      });
    }
    setActiveTab('requisitos');
  }, [cargoCompleto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargo) return;

    const updateData: UpdateCargoDTO = {
      nivel_educativo: formData.nivel_educativo,
      titulo_requerido: formData.titulo_requerido || undefined,
      experiencia_requerida: formData.experiencia_requerida,
      experiencia_especifica: formData.experiencia_especifica || undefined,
      competencias_tecnicas: formData.competencias_tecnicas,
      competencias_blandas: formData.competencias_blandas,
      licencias_certificaciones: formData.licencias_certificaciones,
      formacion_complementaria: formData.formacion_complementaria || undefined,
      riesgo_ids: formData.riesgo_ids,
      epp_requeridos: formData.epp_requeridos,
      examenes_medicos: formData.examenes_medicos,
      restricciones_medicas: formData.restricciones_medicas || undefined,
      capacitaciones_sst: formData.capacitaciones_sst,
    };

    await updateMutation.mutateAsync({ id: cargo.id, data: updateData });
    onClose();
  };

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        isLoading={isLoading}
      >
        Guardar Perfil
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={cargo ? `Perfil: ${cargo.name}` : 'Perfil de Cargo'}
      size="4xl"
      footer={footer}
    >
      <div className="space-y-4">
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as TabType)}
          variant="pills"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TAB: REQUISITOS */}
          {activeTab === 'requisitos' && (
            <div className="space-y-4">
              <Alert
                variant="info"
                message="Define los requisitos de formación, experiencia y competencias para ocupar el cargo."
              />

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Formación Académica
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Nivel Educativo Mínimo"
                    value={formData.nivel_educativo || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nivel_educativo: (e.target.value as NivelEducativo) || undefined,
                      })
                    }
                    options={[
                      { value: '', label: 'Sin requisito específico' },
                      ...NIVEL_EDUCATIVO_OPTIONS.map((opt) => ({
                        value: opt.value as string,
                        label: opt.label,
                      })),
                    ]}
                  />
                  <Input
                    label="Título Requerido"
                    value={formData.titulo_requerido}
                    onChange={(e) => setFormData({ ...formData, titulo_requerido: e.target.value })}
                    placeholder="Ingeniero Industrial, Contador Público..."
                  />
                </div>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Experiencia Laboral
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Experiencia Mínima"
                    value={formData.experiencia_requerida || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experiencia_requerida:
                          (e.target.value as ExperienciaRequerida) || undefined,
                      })
                    }
                    options={[
                      { value: '', label: 'Sin requisito específico' },
                      ...EXPERIENCIA_OPTIONS.map((opt) => ({
                        value: opt.value as string,
                        label: opt.label,
                      })),
                    ]}
                  />
                </div>
                <div className="mt-3">
                  <Textarea
                    label="Experiencia Específica"
                    value={formData.experiencia_especifica}
                    onChange={(e) =>
                      setFormData({ ...formData, experiencia_especifica: e.target.value })
                    }
                    placeholder="Experiencia en manejo de equipos, sector de grasas y aceites..."
                    rows={2}
                  />
                </div>
              </div>

              <CompetenciasTable
                label="Competencias Técnicas"
                items={formData.competencias_tecnicas}
                onChange={(items) => setFormData({ ...formData, competencias_tecnicas: items })}
                placeholder="Excel avanzado, manejo de ERP..."
              />

              <CompetenciasTable
                label="Competencias Blandas"
                items={formData.competencias_blandas}
                onChange={(items) => setFormData({ ...formData, competencias_blandas: items })}
                placeholder="Liderazgo, trabajo en equipo..."
              />

              <ListEditor
                label="Licencias y Certificaciones"
                items={formData.licencias_certificaciones}
                onChange={(items) => setFormData({ ...formData, licencias_certificaciones: items })}
                placeholder="Licencia SST, Certificado manipulación de alimentos..."
              />

              <Textarea
                label="Formación Complementaria (Deseable)"
                value={formData.formacion_complementaria}
                onChange={(e) =>
                  setFormData({ ...formData, formacion_complementaria: e.target.value })
                }
                placeholder="Cursos o capacitaciones adicionales que serían valoradas..."
                rows={2}
              />
            </div>
          )}

          {/* TAB: SST */}
          {activeTab === 'sst' && (
            <div className="space-y-4">
              <Alert
                variant="warning"
                message="Define los riesgos ocupacionales, EPP y requisitos de SST según el SG-SST."
              />

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                {riesgosData?.results && riesgosData.results.length > 0 ? (
                  <RiesgoSelector
                    selectedIds={formData.riesgo_ids}
                    onChange={(ids) => setFormData({ ...formData, riesgo_ids: ids })}
                    riesgos={riesgosData.results}
                    disabled={isLoading}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay riesgos ocupacionales configurados. Agrégalos desde el catálogo de SST.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  EPP Requeridos
                </label>
                <div className="flex gap-2">
                  <Select
                    value=""
                    onChange={(e) => {
                      const tipoId = Number(e.target.value);
                      if (!tipoId) return;
                      const tipo = tiposEPP.find((t) => t.id === tipoId);
                      if (!tipo) return;
                      if (formData.epp_requeridos.some((epp) => epp.tipo_epp_id === tipoId)) return;
                      setFormData({
                        ...formData,
                        epp_requeridos: [
                          ...formData.epp_requeridos,
                          {
                            tipo_epp_id: tipoId,
                            nombre: tipo.label,
                            cantidad: 1,
                            obligatorio: true,
                          },
                        ],
                      });
                    }}
                    options={[
                      { value: '', label: 'Seleccionar EPP...' },
                      ...tiposEPP
                        .filter(
                          (t) => !formData.epp_requeridos.some((epp) => epp.tipo_epp_id === t.id)
                        )
                        .map((t) => ({ value: String(t.id), label: t.label })),
                    ]}
                  />
                </div>
                {formData.epp_requeridos.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.epp_requeridos.map((epp, index) => (
                      <div
                        key={epp.tipo_epp_id ?? index}
                        className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-md"
                      >
                        <span className="flex-1 text-sm text-primary-700 dark:text-primary-300">
                          {epp.nombre}
                        </span>
                        <Input
                          type="number"
                          value={epp.cantidad}
                          onChange={(e) => {
                            const updated = [...formData.epp_requeridos];
                            updated[index] = {
                              ...epp,
                              cantidad: Math.max(1, Number(e.target.value)),
                            };
                            setFormData({ ...formData, epp_requeridos: updated });
                          }}
                          className="w-16 text-center"
                          min={1}
                        />
                        <Switch
                          checked={epp.obligatorio}
                          onCheckedChange={(checked) => {
                            const updated = [...formData.epp_requeridos];
                            updated[index] = { ...epp, obligatorio: checked };
                            setFormData({ ...formData, epp_requeridos: updated });
                          }}
                          label="Obligatorio"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              epp_requeridos: formData.epp_requeridos.filter((_, i) => i !== index),
                            });
                          }}
                          className="p-0.5 hover:text-red-500 h-auto min-h-0"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {tiposEPP.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No hay tipos de EPP configurados. Agrégalos desde Seguridad Industrial.
                  </p>
                )}
              </div>

              <ListEditor
                label="Exámenes Médicos Ocupacionales"
                items={formData.examenes_medicos}
                onChange={(items) => setFormData({ ...formData, examenes_medicos: items })}
                placeholder="Agregar examen médico..."
                suggestions={EXAMENES_MEDICOS_SUGERIDOS}
              />

              <Textarea
                label="Restricciones Médicas"
                value={formData.restricciones_medicas}
                onChange={(e) =>
                  setFormData({ ...formData, restricciones_medicas: e.target.value })
                }
                placeholder="Condiciones médicas que impiden ejercer el cargo..."
                rows={2}
              />

              <ListEditor
                label="Capacitaciones SST Requeridas"
                items={formData.capacitaciones_sst}
                onChange={(items) => setFormData({ ...formData, capacitaciones_sst: items })}
                placeholder="Agregar capacitación..."
                suggestions={CAPACITACIONES_SST_SUGERIDAS}
              />
            </div>
          )}
        </form>
      </div>
    </BaseModal>
  );
};
