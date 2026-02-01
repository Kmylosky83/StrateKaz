/**
 * Modal para crear/editar Gestión del Cambio
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Tabs para navegación (General, Análisis, Ejecución)
 * - Input, Textarea, Select para formulario
 * - Alert para información
 * - Button para acciones
 *
 * Validación con Zod
 * ZERO HARDCODING - usa configuraciones de types
 */
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { Alert } from '@/components/common/Alert';
import { Badge } from '@/components/common/Badge';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import {
  useCreateCambio,
  useUpdateCambio,
  useChangeTypes,
  useChangePriorities,
  useChangeStatuses,
} from '../../hooks/useGestionCambio';
import { useObjectives } from '../../hooks/useStrategic';
import type {
  GestionCambio,
  CreateGestionCambioDTO,
  UpdateGestionCambioDTO,
  ChangeType,
  ChangePriority,
  ChangeStatus,
} from '../../types/gestion-cambio.types';
import { PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG } from '../../types/gestion-cambio.types';
import type { Tab } from '@/components/common';

interface CambioFormModalProps {
  cambio: GestionCambio | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'analisis' | 'ejecucion';

const TABS: Tab[] = [
  { id: 'general', label: 'General' },
  { id: 'analisis', label: 'Análisis' },
  { id: 'ejecucion', label: 'Ejecución' },
];

// Validación con Zod
const cambioSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  description: z.string().optional(),
  change_type: z.enum([
    'ESTRATEGICO',
    'ORGANIZACIONAL',
    'PROCESO',
    'TECNOLOGICO',
    'CULTURAL',
    'NORMATIVO',
    'OTRO',
  ]),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']),
  status: z
    .enum(['IDENTIFICADO', 'ANALISIS', 'PLANIFICADO', 'EN_EJECUCION', 'COMPLETADO', 'CANCELADO'])
    .optional(),
  impact_analysis: z.string().optional(),
  risk_assessment: z.string().optional(),
  action_plan: z.string().optional(),
  resources_required: z.string().optional(),
  responsible: z.number().optional(),
  responsible_cargo: z.number().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  related_objectives: z.array(z.number()).optional(),
  lessons_learned: z.string().optional(),
});

export const CambioFormModal = ({ cambio, isOpen, onClose }: CambioFormModalProps) => {
  const isEditing = cambio !== null;

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    change_type: 'PROCESO' as ChangeType,
    priority: 'MEDIA' as ChangePriority,
    status: 'IDENTIFICADO' as ChangeStatus,
    impact_analysis: '',
    risk_assessment: '',
    action_plan: '',
    resources_required: '',
    responsible: undefined as number | undefined,
    responsible_cargo: undefined as number | undefined,
    start_date: '',
    due_date: '',
    related_objectives: [] as number[],
    lessons_learned: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Queries
  const createMutation = useCreateCambio();
  const updateMutation = useUpdateCambio();
  const { data: changeTypes } = useChangeTypes();
  const { data: priorities } = useChangePriorities();
  const { data: statuses } = useChangeStatuses();
  const { data: objectivesData } = useObjectives();

  useEffect(() => {
    if (cambio) {
      setFormData({
        code: cambio.code,
        title: cambio.title,
        description: cambio.description || '',
        change_type: cambio.change_type,
        priority: cambio.priority,
        status: cambio.status,
        impact_analysis: cambio.impact_analysis || '',
        risk_assessment: cambio.risk_assessment || '',
        action_plan: cambio.action_plan || '',
        resources_required: cambio.resources_required || '',
        responsible: cambio.responsible || undefined,
        responsible_cargo: cambio.responsible_cargo || undefined,
        start_date: cambio.start_date || '',
        due_date: cambio.due_date || '',
        related_objectives: cambio.related_objectives || [],
        lessons_learned: cambio.lessons_learned || '',
      });
    } else {
      // Auto-generar código GC-XXX
      const now = new Date();
      const autoCode = `GC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}-001`;

      setFormData({
        code: autoCode,
        title: '',
        description: '',
        change_type: 'PROCESO',
        priority: 'MEDIA',
        status: 'IDENTIFICADO',
        impact_analysis: '',
        risk_assessment: '',
        action_plan: '',
        resources_required: '',
        responsible: undefined,
        responsible_cargo: undefined,
        start_date: '',
        due_date: '',
        related_objectives: [],
        lessons_learned: '',
      });
    }
    setActiveTab('general');
    setErrors({});
  }, [cambio, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validar con Zod
      cambioSchema.parse(formData);

      if (isEditing && cambio) {
        const updateData: UpdateGestionCambioDTO = {
          title: formData.title,
          description: formData.description || undefined,
          change_type: formData.change_type,
          priority: formData.priority,
          status: formData.status,
          impact_analysis: formData.impact_analysis || undefined,
          risk_assessment: formData.risk_assessment || undefined,
          action_plan: formData.action_plan || undefined,
          resources_required: formData.resources_required || undefined,
          responsible: formData.responsible,
          responsible_cargo: formData.responsible_cargo,
          start_date: formData.start_date || undefined,
          due_date: formData.due_date || undefined,
          related_objectives: formData.related_objectives,
          lessons_learned: formData.lessons_learned || undefined,
        };
        await updateMutation.mutateAsync({ id: cambio.id, data: updateData });
      } else {
        const createData: CreateGestionCambioDTO = {
          code: formData.code,
          title: formData.title,
          description: formData.description || undefined,
          change_type: formData.change_type,
          priority: formData.priority,
          status: formData.status,
          impact_analysis: formData.impact_analysis || undefined,
          risk_assessment: formData.risk_assessment || undefined,
          action_plan: formData.action_plan || undefined,
          resources_required: formData.resources_required || undefined,
          responsible: formData.responsible,
          responsible_cargo: formData.responsible_cargo,
          start_date: formData.start_date || undefined,
          due_date: formData.due_date || undefined,
          related_objectives: formData.related_objectives,
        };
        await createMutation.mutateAsync(createData);
      }

      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const typeOptions = changeTypes?.map((t) => ({ value: t.value, label: t.label })) || [];
  const priorityOptions = priorities?.map((p) => ({ value: p.value, label: p.label })) || [];
  const statusOptions = statuses?.map((s) => ({ value: s.value, label: s.label })) || [];
  const objectiveOptions =
    objectivesData?.results.map((o) => ({ value: o.id, label: `${o.code} - ${o.name}` })) || [];

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.code || !formData.title}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Cambio'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cambio' : 'Nuevo Cambio Organizacional'}
      subtitle="Registre y gestione cambios estratégicos, organizacionales o tecnológicos"
      size="3xl"
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
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="GC-001"
                  disabled={isEditing}
                  error={errors.code}
                  required
                />
                <Select
                  label="Tipo de Cambio *"
                  value={formData.change_type}
                  onChange={(e) =>
                    setFormData({ ...formData, change_type: e.target.value as ChangeType })
                  }
                  options={typeOptions}
                  error={errors.change_type}
                  required
                />
              </div>

              <Input
                label="Título *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Implementación de nuevo ERP"
                error={errors.title}
                required
              />

              <Textarea
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describa el cambio organizacional..."
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Prioridad *"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as ChangePriority })
                  }
                  options={priorityOptions}
                  error={errors.priority}
                  required
                />
                <Select
                  label="Estado *"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as ChangeStatus })
                  }
                  options={statusOptions}
                  error={errors.status}
                  required
                />
              </div>

              {/* Preview de badges */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Badge
                  variant="outline"
                  className={`${PRIORITY_CONFIG[formData.priority].textColor} ${PRIORITY_CONFIG[formData.priority].borderColor}`}
                >
                  <DynamicIcon name={PRIORITY_CONFIG[formData.priority].icon} className="w-3 h-3 mr-1" />
                  {PRIORITY_CONFIG[formData.priority].label}
                </Badge>
                <Badge
                  className={`${STATUS_CONFIG[formData.status].bgColor} ${STATUS_CONFIG[formData.status].textColor} border-0`}
                >
                  <DynamicIcon name={STATUS_CONFIG[formData.status].icon} className="w-3 h-3 mr-1" />
                  {STATUS_CONFIG[formData.status].label}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <DynamicIcon name={TYPE_CONFIG[formData.change_type].icon} className="w-4 h-4" />
                  {TYPE_CONFIG[formData.change_type].label}
                </div>
              </div>
            </>
          )}

          {activeTab === 'analisis' && (
            <>
              <Alert
                variant="info"
                message="Analice el impacto y los riesgos del cambio propuesto"
              />

              <Textarea
                label="Análisis de Impacto"
                value={formData.impact_analysis}
                onChange={(e) => setFormData({ ...formData, impact_analysis: e.target.value })}
                placeholder="Describa el impacto esperado del cambio..."
                rows={4}
              />

              <Textarea
                label="Evaluación de Riesgos"
                value={formData.risk_assessment}
                onChange={(e) => setFormData({ ...formData, risk_assessment: e.target.value })}
                placeholder="Identifique los riesgos asociados al cambio..."
                rows={4}
              />

              <Textarea
                label="Recursos Requeridos"
                value={formData.resources_required}
                onChange={(e) => setFormData({ ...formData, resources_required: e.target.value })}
                placeholder="Liste los recursos humanos, técnicos y financieros necesarios..."
                rows={3}
              />
            </>
          )}

          {activeTab === 'ejecucion' && (
            <>
              <Textarea
                label="Plan de Acción"
                value={formData.action_plan}
                onChange={(e) => setFormData({ ...formData, action_plan: e.target.value })}
                placeholder="Detalle los pasos a seguir para implementar el cambio..."
                rows={4}
              />

              <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Objetivos Estratégicos Relacionados
                </label>
                <select
                  multiple
                  value={formData.related_objectives.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) =>
                      parseInt(option.value)
                    );
                    setFormData({ ...formData, related_objectives: selected });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  size={5}
                >
                  {objectiveOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mantenga presionado Ctrl/Cmd para seleccionar múltiples
                </p>
              </div>

              {isEditing && (
                <Textarea
                  label="Lecciones Aprendidas"
                  value={formData.lessons_learned}
                  onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
                  placeholder="Registre las lecciones aprendidas durante la ejecución..."
                  rows={3}
                />
              )}
            </>
          )}
        </form>
      </div>
    </BaseModal>
  );
};
