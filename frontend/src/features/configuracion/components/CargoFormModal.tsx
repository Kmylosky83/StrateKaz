/**
 * Modal para crear/editar Cargos — Fundación (C1)
 *
 * REORG-B2: 3 Tabs (Requisitos y SST se editan en Talent Hub → Perfiles de Cargo):
 * - Tab 1: Identificación y Ubicación Organizacional
 * - Tab 2: Manual de Funciones
 * - Tab 3: Acceso y Permisos (RBAC Unificado v4.0)
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
import type {
  CargoList,
  CreateCargoDTO,
  UpdateCargoDTO,
  NivelJerarquico,
  FuncionCargo,
} from '../types/rbac.types';
import { NIVEL_JERARQUICO_OPTIONS, normalizeFunciones } from '../types/rbac.types';
import { FuncionesTable } from './FuncionesTable';
import type { Tab } from '@/components/common';
import { toast } from 'sonner';
import { UserCircle, FileText, Layers } from 'lucide-react';
import { TabAccesoSecciones } from './CargoFormTabs';

interface CargoFormModalProps {
  /** CargoList del listado (para edicion) o null (para crear) */
  cargo: CargoList | null;
  isOpen: boolean;
  onClose: () => void;
  /** Callback tras crear cargo exitosamente (retorna ID del nuevo cargo) */
  onSuccess?: (newCargoId: number) => void;
}

type TabType = 'identificacion' | 'funciones' | 'acceso';

const TABS: Tab[] = [
  { id: 'identificacion', label: 'Identificación', icon: <UserCircle size={16} /> },
  { id: 'funciones', label: 'Funciones', icon: <FileText size={16} /> },
  { id: 'acceso', label: 'Acceso y Permisos', icon: <Layers size={16} /> },
];

export const CargoFormModal = ({ cargo, isOpen, onClose, onSuccess }: CargoFormModalProps) => {
  // Estado para transicion create→edit: al crear un cargo, permite configurar permisos sin cerrar el modal
  const [createdCargo, setCreatedCargo] = useState<{ id: number; name: string } | null>(null);
  const isEditing = cargo !== null || createdCargo !== null;
  const editingCargoId = cargo?.id ?? createdCargo?.id ?? null;
  const editingCargoName = cargo?.name ?? createdCargo?.name ?? '';

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
    funciones_responsabilidades: [] as FuncionCargo[],
    autoridad_autonomia: '',
    relaciones_internas: '',
    relaciones_externas: '',
  });

  const [activeTab, setActiveTab] = useState<TabType>('identificacion');

  // Queries
  const { data: cargosData } = useCargos({ include_inactive: false, page_size: 100 });
  const { data: choicesData } = useCargoChoices();
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
        funciones_responsabilidades: normalizeFunciones(
          cargoCompleto.funciones_responsabilidades || []
        ),
        autoridad_autonomia: cargoCompleto.autoridad_autonomia || '',
        relaciones_internas: cargoCompleto.relaciones_internas || '',
        relaciones_externas: cargoCompleto.relaciones_externas || '',
      });
    }
    setActiveTab('identificacion');
  }, [cargoCompleto]);

  // Reset cuando el modal se ABRE en modo creación (cargo=null).
  //
  // PROBLEMA RESUELTO: CargoFormModal permanece montado en el parent entre aperturas
  // (BaseModal solo desmonta sus children via AnimatePresence, no el componente padre).
  // Con [cargo] como única dependencia: si cargo siempre es null entre dos sesiones
  // de creación, el efecto nunca se re-ejecuta y createdCargo conserva el ID del
  // cargo creado anteriormente → isEditing=true → handleSubmit hace UPDATE en vez de
  // CREATE, editando accidentalmente el cargo anterior.
  //
  // Solución: agregar isOpen a las dependencias. Cuando isOpen cambia de false→true
  // con cargo=null, el efecto se dispara y limpia el estado.
  useEffect(() => {
    if (!cargo && isOpen) {
      setCreatedCargo(null);
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
      });
      setActiveTab('identificacion');
    }
  }, [isOpen, cargo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && (cargo || createdCargo)) {
      const cargoId = cargo?.id ?? createdCargo!.id;
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
      };
      await updateMutation.mutateAsync({ id: cargoId, data: updateData });
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
      };
      const newCargo = await createMutation.mutateAsync(createData);
      onSuccess?.(newCargo.id);

      // Transicionar a modo edición para configurar permisos RBAC
      setCreatedCargo({ id: newCargo.id, name: newCargo.name || formData.name });
      setActiveTab('acceso');
      toast.success('Cargo creado. Ahora configura los accesos y permisos.');
      return; // No cerrar el modal
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
      title={
        cargo
          ? `Editar Cargo: ${cargo.name}`
          : createdCargo
            ? `Cargo: ${createdCargo.name}`
            : 'Nuevo Cargo'
      }
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
          {/* ========== TAB 1: IDENTIFICACION Y UBICACION ========== */}
          {activeTab === 'identificacion' && (
            <div className="space-y-4">
              <Alert
                variant="info"
                message="Define la información básica del cargo y su ubicación en la estructura organizacional."
              />

              {/* Identificación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                  <Switch
                    checked={formData.is_jefatura}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_jefatura: checked })
                    }
                    label="Es Jefatura"
                  />
                  <Switch
                    checked={formData.is_externo}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_externo: checked })}
                    label="Es Externo (Contratista)"
                  />
                  <Switch
                    checked={formData.requiere_licencia_conduccion}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiere_licencia_conduccion: checked })
                    }
                    label="Licencia de Conducción"
                  />
                  <Switch
                    checked={formData.requiere_licencia_sst}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiere_licencia_sst: checked })
                    }
                    label="Licencia en SST"
                  />
                  <Switch
                    checked={formData.requiere_tarjeta_contador}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiere_tarjeta_contador: checked })
                    }
                    label="Tarjeta Prof. Contador"
                  />
                  <Switch
                    checked={formData.requiere_tarjeta_abogado}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiere_tarjeta_abogado: checked })
                    }
                    label="Tarjeta Prof. Abogado"
                  />
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

              {/* Horarios y turnos se gestionan en Talent Hub → Control de Tiempo */}
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

              <FuncionesTable
                items={formData.funciones_responsabilidades}
                onChange={(items) =>
                  setFormData({ ...formData, funciones_responsabilidades: items })
                }
              />

              <Textarea
                label="Autoridad y Autonomía"
                value={formData.autoridad_autonomia}
                onChange={(e) => setFormData({ ...formData, autoridad_autonomia: e.target.value })}
                placeholder="Decisiones que puede tomar, límite de aprobaciones, etc..."
                rows={2}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* ========== TAB 3: ACCESO Y PERMISOS (RBAC Unificado v4.0) ========== */}
          {activeTab === 'acceso' && (
            <div className="space-y-4">
              {isEditing && editingCargoId ? (
                <TabAccesoSecciones cargoId={editingCargoId} cargoName={editingCargoName} />
              ) : (
                <Alert
                  variant="info"
                  message="Los accesos y permisos se configurarán después de guardar el cargo. Completa la información y guarda para continuar."
                />
              )}
            </div>
          )}
        </form>
      </div>
    </BaseModal>
  );
};
