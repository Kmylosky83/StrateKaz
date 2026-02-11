/**
 * Modal para crear/editar Cargos con Manual de Funciones completo
 *
 * 5 Tabs:
 * - Tab 1: Identificacion y Ubicacion Organizacional
 * - Tab 2: Manual de Funciones
 * - Tab 3: Requisitos del Cargo
 * - Tab 4: SST (Seguridad y Salud en el Trabajo)
 * - Tab 5: Acceso y Permisos (RBAC Unificado v4.0 - secciones con acciones CRUD integradas)
 *
 * Flujo unificado: Crear cargo → Configurar acceso y acciones en un solo lugar
 *
 * Usa Design System: BaseModal, Tabs, Input, Select, Textarea, Switch
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
import {
  useCreateCargo,
  useUpdateCargo,
  useCargos,
  useCargoChoices,
  useCargo,
} from '../hooks/useCargos';
import { useRiesgosOcupacionales } from '../hooks/useRiesgosOcupacionales';
import { RiesgoSelector } from './RiesgoSelector';
import type {
  CargoList,
  CreateCargoDTO,
  UpdateCargoDTO,
  NivelJerarquico,
  NivelEducativo,
  ExperienciaRequerida,
} from '../types/rbac.types';
import {
  NIVEL_JERARQUICO_OPTIONS,
  NIVEL_EDUCATIVO_OPTIONS,
  EXPERIENCIA_OPTIONS,
  EPP_SUGERIDOS,
  EXAMENES_MEDICOS_SUGERIDOS,
  CAPACITACIONES_SST_SUGERIDAS,
} from '../types/rbac.types';
import type { Tab } from '@/components/common';
import {
  UserCircle,
  FileText,
  GraduationCap,
  ShieldCheck,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { TabAccesoSecciones } from './CargoFormTabs';

interface CargoFormModalProps {
  /** CargoList del listado (para edicion) o null (para crear) */
  cargo: CargoList | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'identificacion' | 'funciones' | 'requisitos' | 'sst' | 'acceso';

const TABS: Tab[] = [
  { id: 'identificacion', label: 'Identificación', icon: <UserCircle size={16} /> },
  { id: 'funciones', label: 'Funciones', icon: <FileText size={16} /> },
  { id: 'requisitos', label: 'Requisitos', icon: <GraduationCap size={16} /> },
  { id: 'sst', label: 'SST', icon: <ShieldCheck size={16} /> },
  { id: 'acceso', label: 'Acceso y Permisos', icon: <Layers size={16} /> },
];

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
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-0.5 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
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
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSuggestion(suggestion)}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  + {suggestion}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CargoFormModal = ({ cargo, isOpen, onClose }: CargoFormModalProps) => {
  const isEditing = cargo !== null;

  // Form state organizado por tabs
  const [formData, setFormData] = useState({
    // Tab 1: Identificacion
    code: '',
    name: '',
    description: '',
    area: undefined as number | undefined,
    parent_cargo: undefined as number | undefined,
    nivel_jerarquico: 'OPERATIVO' as NivelJerarquico,
    cantidad_posiciones: 1,
    is_jefatura: false,
    is_externo: false,
    requiere_licencia_conduccion: false,
    categoria_licencia: '',
    requiere_licencia_sst: false,
    requiere_tarjeta_contador: false,
    requiere_tarjeta_abogado: false,

    // Tab 2: Manual de Funciones
    objetivo_cargo: '',
    funciones_responsabilidades: [] as string[],
    autoridad_autonomia: '',
    relaciones_internas: '',
    relaciones_externas: '',

    // Tab 3: Requisitos
    nivel_educativo: undefined as NivelEducativo | undefined,
    titulo_requerido: '',
    experiencia_requerida: undefined as ExperienciaRequerida | undefined,
    experiencia_especifica: '',
    competencias_tecnicas: [] as string[],
    competencias_blandas: [] as string[],
    licencias_certificaciones: [] as string[],
    formacion_complementaria: '',

    // Tab 4: SST
    riesgo_ids: [] as number[],
    epp_requeridos: [] as string[],
    examenes_medicos: [] as string[],
    restricciones_medicas: '',
    capacitaciones_sst: [] as string[],
  });

  const [activeTab, setActiveTab] = useState<TabType>('identificacion');

  // Queries
  const { data: cargosData } = useCargos({ include_inactive: false, page_size: 100 });
  const { data: choicesData } = useCargoChoices();
  const { data: riesgosData } = useRiesgosOcupacionales({});
  // Cargar cargo completo para edicion (CargoList no tiene todos los campos)
  const { data: cargoCompleto, isLoading: isLoadingCargo } = useCargo(cargo?.id ?? null);

  // Mutations
  const createMutation = useCreateCargo();
  const updateMutation = useUpdateCargo();

  // Cargar datos cuando se obtiene el cargo completo para edicion
  useEffect(() => {
    if (cargoCompleto) {
      setFormData({
        code: cargoCompleto.code,
        name: cargoCompleto.name,
        description: cargoCompleto.description || '',
        area: cargoCompleto.area,
        parent_cargo: cargoCompleto.parent_cargo,
        nivel_jerarquico: cargoCompleto.nivel_jerarquico,
        cantidad_posiciones: cargoCompleto.cantidad_posiciones,
        is_jefatura: cargoCompleto.is_jefatura,
        is_externo: cargoCompleto.is_externo,
        requiere_licencia_conduccion: cargoCompleto.requiere_licencia_conduccion,
        categoria_licencia: cargoCompleto.categoria_licencia || '',
        requiere_licencia_sst: cargoCompleto.requiere_licencia_sst,
        requiere_tarjeta_contador: cargoCompleto.requiere_tarjeta_contador,
        requiere_tarjeta_abogado: cargoCompleto.requiere_tarjeta_abogado,

        objetivo_cargo: cargoCompleto.objetivo_cargo || '',
        funciones_responsabilidades: cargoCompleto.funciones_responsabilidades || [],
        autoridad_autonomia: cargoCompleto.autoridad_autonomia || '',
        relaciones_internas: cargoCompleto.relaciones_internas || '',
        relaciones_externas: cargoCompleto.relaciones_externas || '',

        nivel_educativo: cargoCompleto.nivel_educativo,
        titulo_requerido: cargoCompleto.titulo_requerido || '',
        experiencia_requerida: cargoCompleto.experiencia_requerida,
        experiencia_especifica: cargoCompleto.experiencia_especifica || '',
        competencias_tecnicas: cargoCompleto.competencias_tecnicas || [],
        competencias_blandas: cargoCompleto.competencias_blandas || [],
        licencias_certificaciones: cargoCompleto.licencias_certificaciones || [],
        formacion_complementaria: cargoCompleto.formacion_complementaria || '',

        riesgo_ids: cargoCompleto.expuesto_riesgos || [],
        epp_requeridos: cargoCompleto.epp_requeridos || [],
        examenes_medicos: cargoCompleto.examenes_medicos || [],
        restricciones_medicas: cargoCompleto.restricciones_medicas || '',
        capacitaciones_sst: cargoCompleto.capacitaciones_sst || [],
      });
    }
    setActiveTab('identificacion');
  }, [cargoCompleto]);

  // Reset cuando se cierra o cambia a crear nuevo
  useEffect(() => {
    if (!cargo) {
      setFormData({
        code: '',
        name: '',
        description: '',
        area: undefined,
        parent_cargo: undefined,
        nivel_jerarquico: 'OPERATIVO',
        cantidad_posiciones: 1,
        is_jefatura: false,
        is_externo: false,
        requiere_licencia_conduccion: false,
        categoria_licencia: '',
        requiere_licencia_sst: false,
        requiere_tarjeta_contador: false,
        requiere_tarjeta_abogado: false,
        objetivo_cargo: '',
        funciones_responsabilidades: [],
        autoridad_autonomia: '',
        relaciones_internas: '',
        relaciones_externas: '',
        nivel_educativo: undefined,
        titulo_requerido: '',
        experiencia_requerida: undefined,
        experiencia_especifica: '',
        competencias_tecnicas: [],
        competencias_blandas: [],
        licencias_certificaciones: [],
        formacion_complementaria: '',
        riesgo_ids: [],
        epp_requeridos: [],
        examenes_medicos: [],
        restricciones_medicas: '',
        capacitaciones_sst: [],
      });
      setActiveTab('identificacion');
    }
  }, [cargo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && cargo) {
      const updateData: UpdateCargoDTO = {
        name: formData.name,
        description: formData.description || undefined,
        area: formData.area,
        parent_cargo: formData.parent_cargo || null,
        nivel_jerarquico: formData.nivel_jerarquico,
        cantidad_posiciones: formData.cantidad_posiciones,
        is_jefatura: formData.is_jefatura,
        is_externo: formData.is_externo,
        requiere_licencia_conduccion: formData.requiere_licencia_conduccion,
        categoria_licencia: formData.categoria_licencia || undefined,
        requiere_licencia_sst: formData.requiere_licencia_sst,
        requiere_tarjeta_contador: formData.requiere_tarjeta_contador,
        requiere_tarjeta_abogado: formData.requiere_tarjeta_abogado,

        objetivo_cargo: formData.objetivo_cargo || undefined,
        funciones_responsabilidades: formData.funciones_responsabilidades,
        autoridad_autonomia: formData.autoridad_autonomia || undefined,
        relaciones_internas: formData.relaciones_internas || undefined,
        relaciones_externas: formData.relaciones_externas || undefined,

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
    } else {
      const createData: CreateCargoDTO = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        area: formData.area,
        parent_cargo: formData.parent_cargo,
        nivel_jerarquico: formData.nivel_jerarquico,
        cantidad_posiciones: formData.cantidad_posiciones,
        is_jefatura: formData.is_jefatura,
        is_externo: formData.is_externo,
        requiere_licencia_conduccion: formData.requiere_licencia_conduccion,
        categoria_licencia: formData.categoria_licencia || undefined,
        requiere_licencia_sst: formData.requiere_licencia_sst,
        requiere_tarjeta_contador: formData.requiere_tarjeta_contador,
        requiere_tarjeta_abogado: formData.requiere_tarjeta_abogado,

        objetivo_cargo: formData.objetivo_cargo || undefined,
        funciones_responsabilidades: formData.funciones_responsabilidades,
        autoridad_autonomia: formData.autoridad_autonomia || undefined,
        relaciones_internas: formData.relaciones_internas || undefined,
        relaciones_externas: formData.relaciones_externas || undefined,

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
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const parentCargos = cargosData?.results.filter((c) => c.id !== cargo?.id) || [];
  const areaOptions = choicesData?.areas || [];

  const isLoading = createMutation.isPending || updateMutation.isPending || isLoadingCargo;

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
        {isEditing ? 'Guardar Cambios' : 'Crear Cargo'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Cargo: ${cargo?.name}` : 'Nuevo Cargo'}
      size="5xl"
      footer={footer}
    >
      <div className="space-y-4">
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as TabType)}
          variant="pills"
        />

        <form onSubmit={handleSubmit} className="space-y-6 max-h-[65vh] overflow-y-auto px-1">
          {/* ========== TAB 1: IDENTIFICACION Y UBICACION ========== */}
          {activeTab === 'identificacion' && (
            <div className="space-y-4">
              <Alert
                variant="info"
                message="Define la información básica del cargo y su ubicación en la estructura organizacional."
              />

              {/* Identificación */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="GERENTE_OPERACIONES"
                  disabled={isEditing}
                  required
                  helperText={
                    isEditing ? 'El código no se puede modificar' : 'Código único del cargo'
                  }
                />
                <Input
                  label="Nombre *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Gerente de Operaciones"
                  required
                />
              </div>

              <Textarea
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción general del cargo..."
                rows={2}
              />

              {/* Ubicación Organizacional */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Ubicación Organizacional
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Proceso"
                    value={formData.area?.toString() || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        area: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    options={[
                      { value: '', label: 'Sin proceso asignado' },
                      ...areaOptions.map((a) => ({ value: a.value.toString(), label: a.label })),
                    ]}
                  />
                  <Select
                    label="Nivel Jerárquico *"
                    value={formData.nivel_jerarquico}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nivel_jerarquico: e.target.value as NivelJerarquico,
                      })
                    }
                    options={NIVEL_JERARQUICO_OPTIONS.map((opt) => ({
                      value: opt.value as string,
                      label: opt.label,
                    }))}
                  />
                </div>

                <div className="mt-4">
                  <Select
                    label="Reporta a (Cargo Superior)"
                    value={formData.parent_cargo?.toString() || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parent_cargo: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    options={[
                      { value: '', label: 'Sin cargo superior' },
                      ...parentCargos.map((c) => ({
                        value: c.id.toString(),
                        label: c.name,
                      })),
                    ]}
                  />
                </div>
              </div>

              {/* Configuración del Cargo */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Configuración del Cargo
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Cantidad de Posiciones"
                    type="number"
                    min={1}
                    value={formData.cantidad_posiciones}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cantidad_posiciones: parseInt(e.target.value) || 1,
                      })
                    }
                    helperText="Cuántas personas pueden ocupar este cargo"
                  />
                  <div className="flex flex-col gap-3 pt-6">
                    <Switch
                      checked={formData.is_jefatura}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_jefatura: checked })
                      }
                      label="Es Jefatura"
                    />
                    <Switch
                      checked={formData.is_externo}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_externo: checked })
                      }
                      label="Es Externo (Contratista, Consultor, Auditor)"
                    />
                    <Switch
                      checked={formData.requiere_licencia_conduccion}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, requiere_licencia_conduccion: checked })
                      }
                      label="Requiere Licencia de Conducción"
                    />
                    <Switch
                      checked={formData.requiere_licencia_sst}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, requiere_licencia_sst: checked })
                      }
                      label="Requiere Licencia en SST"
                    />
                    <Switch
                      checked={formData.requiere_tarjeta_contador}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, requiere_tarjeta_contador: checked })
                      }
                      label="Requiere Tarjeta Profesional Contador"
                    />
                    <Switch
                      checked={formData.requiere_tarjeta_abogado}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, requiere_tarjeta_abogado: checked })
                      }
                      label="Requiere Tarjeta Profesional Abogado"
                    />
                  </div>
                </div>

                {formData.requiere_licencia_conduccion && (
                  <div className="mt-4">
                    <Input
                      label="Categoría de Licencia"
                      value={formData.categoria_licencia}
                      onChange={(e) =>
                        setFormData({ ...formData, categoria_licencia: e.target.value })
                      }
                      placeholder="B1, C1, C2, C3..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== TAB 2: MANUAL DE FUNCIONES ========== */}
          {activeTab === 'funciones' && (
            <div className="space-y-4">
              <Alert
                variant="info"
                message="Define el objetivo, funciones y responsabilidades del cargo según el manual de funciones."
              />

              <Textarea
                label="Objetivo del Cargo"
                value={formData.objetivo_cargo}
                onChange={(e) => setFormData({ ...formData, objetivo_cargo: e.target.value })}
                placeholder="Describir el propósito principal del cargo en la organización..."
                rows={3}
              />

              <ListEditor
                label="Funciones y Responsabilidades"
                items={formData.funciones_responsabilidades}
                onChange={(items) =>
                  setFormData({ ...formData, funciones_responsabilidades: items })
                }
                placeholder="Agregar función o responsabilidad..."
              />

              <Textarea
                label="Autoridad y Autonomía"
                value={formData.autoridad_autonomia}
                onChange={(e) => setFormData({ ...formData, autoridad_autonomia: e.target.value })}
                placeholder="Decisiones que puede tomar, límite de aprobaciones, etc..."
                rows={2}
              />

              <div className="grid grid-cols-2 gap-4">
                <Textarea
                  label="Relaciones Internas"
                  value={formData.relaciones_internas}
                  onChange={(e) =>
                    setFormData({ ...formData, relaciones_internas: e.target.value })
                  }
                  placeholder="Áreas o cargos con los que interactúa internamente..."
                  rows={2}
                />
                <Textarea
                  label="Relaciones Externas"
                  value={formData.relaciones_externas}
                  onChange={(e) =>
                    setFormData({ ...formData, relaciones_externas: e.target.value })
                  }
                  placeholder="Proveedores, clientes, entidades externas..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* ========== TAB 3: REQUISITOS ========== */}
          {activeTab === 'requisitos' && (
            <div className="space-y-4">
              <Alert
                variant="info"
                message="Define los requisitos de formación, experiencia y competencias para ocupar el cargo."
              />

              {/* Formacion Academica */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Formación Académica
                </h4>
                <div className="grid grid-cols-2 gap-4">
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
                    label="Titulo Requerido"
                    value={formData.titulo_requerido}
                    onChange={(e) => setFormData({ ...formData, titulo_requerido: e.target.value })}
                    placeholder="Ingeniero Industrial, Contador Público..."
                  />
                </div>
              </div>

              {/* Experiencia */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Experiencia Laboral
                </h4>
                <div className="grid grid-cols-2 gap-4">
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

              {/* Competencias */}
              <ListEditor
                label="Competencias Técnicas"
                items={formData.competencias_tecnicas}
                onChange={(items) => setFormData({ ...formData, competencias_tecnicas: items })}
                placeholder="Excel avanzado, manejo de ERP..."
              />

              <ListEditor
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

          {/* ========== TAB 4: SST ========== */}
          {activeTab === 'sst' && (
            <div className="space-y-4">
              <Alert
                variant="warning"
                message="Define los riesgos ocupacionales, EPP y requisitos de SST según el SG-SST."
              />

              {/* Riesgos Ocupacionales con RiesgoSelector */}
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

              <ListEditor
                label="EPP Requeridos"
                items={formData.epp_requeridos}
                onChange={(items) => setFormData({ ...formData, epp_requeridos: items })}
                placeholder="Agregar EPP..."
                suggestions={EPP_SUGERIDOS}
              />

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

          {/* ========== TAB 5: ACCESO Y PERMISOS (RBAC Unificado v4.0) ========== */}
          {activeTab === 'acceso' && (
            <div className="space-y-4">
              {isEditing && cargo ? (
                <TabAccesoSecciones cargoId={cargo.id} cargoName={cargo.name} />
              ) : (
                <Alert
                  variant="warning"
                  message="Los accesos y permisos se configuran después de crear el cargo. Guarda primero y luego configura los accesos."
                />
              )}
            </div>
          )}
        </form>
      </div>
    </BaseModal>
  );
};
