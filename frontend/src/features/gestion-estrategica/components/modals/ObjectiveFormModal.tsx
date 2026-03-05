/**
 * Modal para crear/editar Objetivo Estratégico
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Tabs para navegación
 * - Input, Textarea, Select para formulario
 * - Checkbox para estándares ISO (dinámico desde BD)
 * - DynamicIcon para iconos de normas
 * - Alert para información
 * - Button para acciones
 *
 * Sin hardcoding - Normas ISO cargadas desde API
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { Alert } from '@/components/common/Alert';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { Spinner } from '@/components/common/Spinner';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Checkbox } from '@/components/forms/Checkbox';
import {
  useCreateObjective,
  useUpdateObjective,
  useBSCPerspectives,
  useISOStandards,
  useObjectiveStatuses,
} from '../../hooks/useStrategic';
import type {
  StrategicObjective,
  CreateStrategicObjectiveDTO,
  UpdateStrategicObjectiveDTO,
  BSCPerspective,
  ObjectiveStatus,
} from '../../types/strategic.types';
import type { NormaISOChoice } from '../../api/strategicApi';
import type { Tab } from '@/components/common';

interface ObjectiveFormModalProps {
  objective: StrategicObjective | null;
  planId: number;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'alineacion' | 'medicion';

const TABS: Tab[] = [
  { id: 'general', label: 'General' },
  { id: 'alineacion', label: 'Alineación' },
  { id: 'medicion', label: 'Medición' },
];

const BSC_COLORS: Record<BSCPerspective, string> = {
  FINANCIERA: 'text-green-600',
  CLIENTES: 'text-blue-600',
  PROCESOS: 'text-amber-600',
  APRENDIZAJE: 'text-purple-600',
};

export const ObjectiveFormModal = ({
  objective,
  planId,
  isOpen,
  onClose,
}: ObjectiveFormModalProps) => {
  const isEditing = objective !== null;

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    bsc_perspective: 'PROCESOS' as BSCPerspective,
    // Ahora usamos IDs de normas ISO (ManyToMany)
    normas_iso_ids: [] as number[],
    responsible_cargo: undefined as number | undefined,
    target_value: 100,
    current_value: 0,
    unit: '%',
    start_date: '',
    due_date: '',
    status: 'PENDIENTE' as ObjectiveStatus,
  });

  const createMutation = useCreateObjective();
  const updateMutation = useUpdateObjective();
  const { data: perspectives } = useBSCPerspectives();
  const { data: normasISO, isLoading: normasLoading } = useISOStandards();
  const { data: statuses } = useObjectiveStatuses();

  useEffect(() => {
    if (objective) {
      // Extraer IDs de normas_iso (ManyToMany viene como array de objetos o IDs)
      const normaIds =
        objective.normas_iso?.map((n: number | { id: number }) =>
          typeof n === 'number' ? n : n.id
        ) || [];

      setFormData({
        code: objective.code,
        name: objective.name,
        description: objective.description || '',
        bsc_perspective: objective.bsc_perspective,
        normas_iso_ids: normaIds,
        responsible_cargo: objective.responsible_cargo || undefined,
        target_value: objective.target_value ?? 100,
        current_value: objective.current_value ?? 0,
        unit: objective.unit || '%',
        start_date: objective.start_date || '',
        due_date: objective.due_date || '',
        status: objective.status,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        bsc_perspective: 'PROCESOS',
        normas_iso_ids: [],
        responsible_cargo: undefined,
        target_value: 100,
        current_value: 0,
        unit: '%',
        start_date: '',
        due_date: '',
        status: 'PENDIENTE',
      });
    }
    setActiveTab('general');
  }, [objective]);

  // Toggle de norma ISO por ID
  const handleNormaISOToggle = (normaId: number) => {
    setFormData((prev) => ({
      ...prev,
      normas_iso_ids: prev.normas_iso_ids.includes(normaId)
        ? prev.normas_iso_ids.filter((id) => id !== normaId)
        : [...prev.normas_iso_ids, normaId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && objective) {
      const updateData: UpdateStrategicObjectiveDTO = {
        name: formData.name,
        description: formData.description || undefined,
        bsc_perspective: formData.bsc_perspective,
        normas_iso_ids: formData.normas_iso_ids,
        responsible_cargo: formData.responsible_cargo,
        target_value: formData.target_value,
        current_value: formData.current_value,
        unit: formData.unit,
        start_date: formData.start_date || undefined,
        due_date: formData.due_date || undefined,
        status: formData.status,
      };
      await updateMutation.mutateAsync({ id: objective.id, data: updateData });
    } else {
      const createData: CreateStrategicObjectiveDTO = {
        plan: planId,
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        bsc_perspective: formData.bsc_perspective,
        normas_iso_ids: formData.normas_iso_ids,
        responsible_cargo: formData.responsible_cargo,
        target_value: formData.target_value,
        unit: formData.unit,
        start_date: formData.start_date || undefined,
        due_date: formData.due_date || undefined,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const perspectiveOptions = perspectives?.map((p) => ({ value: p.value, label: p.label })) || [
    { value: 'FINANCIERA', label: 'Financiera' },
    { value: 'CLIENTES', label: 'Clientes' },
    { value: 'PROCESOS', label: 'Procesos Internos' },
    { value: 'APRENDIZAJE', label: 'Aprendizaje y Crecimiento' },
  ];

  const statusOptions = statuses?.map((s) => ({ value: s.value, label: s.label })) || [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN_PROGRESO', label: 'En Progreso' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'RETRASADO', label: 'Retrasado' },
  ];

  // Normas ISO dinámicas desde la API (sin fallback hardcodeado)
  const normasISOOptions: NormaISOChoice[] = normasISO || [];

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.code || !formData.name}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Objetivo'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Objetivo Estratégico' : 'Nuevo Objetivo Estratégico'}
      subtitle="Define un objetivo alineado con el BSC y estándares ISO"
      size="2xl"
      footer={footer}
    >
      <div className="space-y-6">
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as TabType)}
          variant="underline"
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'general' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Código *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="OE-001"
                  disabled={isEditing}
                  required
                />
                <Select
                  label="Perspectiva BSC *"
                  value={formData.bsc_perspective}
                  onChange={(e) =>
                    setFormData({ ...formData, bsc_perspective: e.target.value as BSCPerspective })
                  }
                  options={perspectiveOptions}
                  required
                />
              </div>

              <Input
                label="Nombre del Objetivo *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Incrementar la rentabilidad operacional"
                required
              />

              <Textarea
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describa el objetivo estratégico..."
                rows={3}
              />

              {isEditing && (
                <Select
                  label="Estado"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as ObjectiveStatus })
                  }
                  options={statusOptions}
                />
              )}
            </>
          )}

          {activeTab === 'alineacion' && (
            <>
              <Alert
                variant="info"
                message="Selecciona las normas ISO a las que aporta este objetivo estratégico"
              />

              <div
                className={`p-3 rounded-lg border-l-4 ${BSC_COLORS[formData.bsc_perspective]} bg-gray-50 dark:bg-gray-800`}
              >
                <p className="text-sm font-medium">
                  Perspectiva BSC:{' '}
                  {perspectiveOptions.find((p) => p.value === formData.bsc_perspective)?.label}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Normas ISO
                </label>

                {normasLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="md" />
                    <span className="ml-2 text-sm text-gray-500">Cargando normas...</span>
                  </div>
                ) : normasISOOptions.length === 0 ? (
                  <Alert
                    variant="warning"
                    message="No hay normas ISO activas. Actívalas en Configuración → Normas ISO."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {normasISOOptions.map((norma) => (
                      <div
                        key={norma.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer
                          transition-all duration-200
                          ${
                            formData.normas_iso_ids.includes(norma.id)
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                        onClick={() => handleNormaISOToggle(norma.id)}
                      >
                        {/* Icono de la norma */}
                        <div
                          className={`
                            p-2 rounded-lg
                            ${
                              formData.normas_iso_ids.includes(norma.id)
                                ? 'bg-primary-100 dark:bg-primary-800'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }
                          `}
                        >
                          <DynamicIcon
                            name={norma.icon || 'FileCheck'}
                            className={`w-5 h-5 ${
                              formData.normas_iso_ids.includes(norma.id)
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          />
                        </div>

                        {/* Info de la norma */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              formData.normas_iso_ids.includes(norma.id)
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {norma.code}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {norma.short_name || norma.name}
                          </p>
                        </div>

                        {/* Checkbox visual */}
                        <Checkbox
                          checked={formData.normas_iso_ids.includes(norma.id)}
                          onChange={() => handleNormaISOToggle(norma.id)}
                          className="pointer-events-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Contador de seleccionados */}
                {formData.normas_iso_ids.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {formData.normas_iso_ids.length} norma
                    {formData.normas_iso_ids.length !== 1 ? 's' : ''} seleccionada
                    {formData.normas_iso_ids.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'medicion' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Meta *"
                  type="number"
                  value={formData.target_value.toString()}
                  onChange={(e) =>
                    setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
                {isEditing && (
                  <Input
                    label="Valor Actual"
                    type="number"
                    value={formData.current_value.toString()}
                    onChange={(e) =>
                      setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })
                    }
                  />
                )}
                <Input
                  label="Unidad de Medida"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="%"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha de Inicio"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
                <Input
                  label="Fecha Límite"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              {isEditing && formData.current_value > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progreso actual</span>
                    <span className="font-medium">
                      {Math.round((formData.current_value / formData.target_value) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((formData.current_value / formData.target_value) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </BaseModal>
  );
};
