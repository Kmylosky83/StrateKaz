/**
 * FormBuilderModal - Constructor Visual de Pruebas Dinamicas
 * Seleccion y Contratacion > Pruebas > Crear/Editar Plantilla
 *
 * Wizard de 2 pasos:
 * 1. Datos de la plantilla (nombre, categoria, scoring, duracion)
 * 2. Constructor de preguntas (agregar/editar/reordenar campos)
 *
 * Usa design system: BaseModal, Button, Input, Select, Textarea, Badge, Alert
 */
import { useState, useEffect, useCallback } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { Alert } from '@/components/common/Alert';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  Settings,
} from 'lucide-react';
import {
  useCreatePlantillaPrueba,
  useUpdatePlantillaPrueba,
  usePlantillaPrueba,
} from '../../hooks/useSeleccionContratacion';
import type {
  PlantillaPruebaList,
  PlantillaPruebaFormData,
  CampoPruebaDinamica,
  TipoScoring,
} from '../../types';
import { TIPO_SCORING_OPTIONS } from '../../types';

// ============================================================================
// Tipos y constantes
// ============================================================================

interface FormBuilderModalProps {
  plantilla: PlantillaPruebaList | null;
  isOpen: boolean;
  onClose: () => void;
}

const TIPO_CAMPO_OPTIONS = [
  { value: 'TEXT', label: 'Texto Corto' },
  { value: 'TEXTAREA', label: 'Texto Largo' },
  { value: 'NUMBER', label: 'Numero' },
  { value: 'SELECT', label: 'Lista Desplegable' },
  { value: 'RADIO', label: 'Opcion Unica' },
  { value: 'CHECKBOX', label: 'Casillas Multiple' },
  { value: 'DATE', label: 'Fecha' },
  { value: 'EMAIL', label: 'Email' },
];

const CATEGORIA_OPTIONS = [
  { value: '', label: 'Seleccionar categoria' },
  { value: 'Tecnica', label: 'Tecnica' },
  { value: 'Conocimiento', label: 'Conocimiento' },
  { value: 'Habilidad', label: 'Habilidad' },
  { value: 'Conduccion', label: 'Conduccion' },
  { value: 'SST', label: 'SST' },
  { value: 'Excel', label: 'Excel' },
  { value: 'Idiomas', label: 'Idiomas' },
  { value: 'Otro', label: 'Otro' },
];

const EMPTY_CAMPO: CampoPruebaDinamica = {
  nombre_campo: '',
  etiqueta: '',
  tipo_campo: 'RADIO',
  descripcion: '',
  placeholder: '',
  opciones: [],
  es_obligatorio: true,
  respuesta_correcta: undefined,
  puntaje: 10,
  orden: 0,
};

const INITIAL_FORM: PlantillaPruebaFormData = {
  nombre: '',
  descripcion: '',
  instrucciones: '',
  campos: [],
  scoring_config: { puntaje_aprobacion: 60 },
  tipo_scoring: 'automatico',
  categoria: '',
  duracion_estimada_minutos: 30,
  tiempo_limite_minutos: null,
};

type StepKey = 'config' | 'campos';

const STEPS: { key: StepKey; label: string; icon: React.ReactNode }[] = [
  { key: 'config', label: 'Configuracion', icon: <Settings size={16} /> },
  { key: 'campos', label: 'Preguntas', icon: <FileText size={16} /> },
];

// ============================================================================
// Sub-componente: Editor de Campo
// ============================================================================

const CampoEditor = ({
  campo,
  index,
  onChange,
  onRemove,
  tipoScoring,
}: {
  campo: CampoPruebaDinamica;
  index: number;
  onChange: (updated: CampoPruebaDinamica) => void;
  onRemove: () => void;
  tipoScoring: TipoScoring;
}) => {
  const [opcionInput, setOpcionInput] = useState('');

  const updateField = <K extends keyof CampoPruebaDinamica>(
    field: K,
    value: CampoPruebaDinamica[K]
  ) => {
    onChange({ ...campo, [field]: value });
  };

  const addOpcion = () => {
    if (!opcionInput.trim()) return;
    const nuevaOpcion = {
      valor: opcionInput.trim().toLowerCase().replace(/\s+/g, '_'),
      etiqueta: opcionInput.trim(),
    };
    updateField('opciones', [...(campo.opciones || []), nuevaOpcion]);
    setOpcionInput('');
  };

  const removeOpcion = (idx: number) => {
    updateField(
      'opciones',
      (campo.opciones || []).filter((_, i) => i !== idx)
    );
  };

  const showOpciones = ['SELECT', 'RADIO', 'CHECKBOX'].includes(campo.tipo_campo);
  const showRespuestaCorrecta = tipoScoring !== 'manual' && showOpciones;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-gray-400 cursor-grab" />
          <Badge variant="gray" size="sm">
            Pregunta {index + 1}
          </Badge>
          <Badge variant={campo.es_obligatorio ? 'danger' : 'gray'} size="sm">
            {campo.es_obligatorio ? 'Obligatoria' : 'Opcional'}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-gray-400 hover:text-danger-600"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Etiqueta + Tipo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Pregunta"
              value={campo.etiqueta}
              onChange={(e) => {
                updateField('etiqueta', e.target.value);
                if (!campo.nombre_campo || campo.nombre_campo === '') {
                  updateField('nombre_campo', `pregunta_${index + 1}`);
                }
              }}
              placeholder="Escribe la pregunta..."
              required
            />
          </div>
          <Select
            label="Tipo"
            value={campo.tipo_campo}
            onChange={(e) => updateField('tipo_campo', e.target.value)}
            options={TIPO_CAMPO_OPTIONS}
          />
        </div>

        {/* Opciones (para SELECT, RADIO, CHECKBOX) */}
        {showOpciones && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Opciones
            </label>
            <div className="space-y-1.5">
              {(campo.opciones || []).map((opcion, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                    {opcion.etiqueta}
                  </span>
                  {showRespuestaCorrecta && (
                    <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                      <input
                        type={campo.tipo_campo === 'CHECKBOX' ? 'checkbox' : 'radio'}
                        name={`correcta_${index}`}
                        checked={
                          campo.tipo_campo === 'CHECKBOX'
                            ? Array.isArray(campo.respuesta_correcta) &&
                              campo.respuesta_correcta.includes(opcion.valor)
                            : campo.respuesta_correcta === opcion.valor
                        }
                        onChange={() => {
                          if (campo.tipo_campo === 'CHECKBOX') {
                            const current = Array.isArray(campo.respuesta_correcta)
                              ? [...campo.respuesta_correcta]
                              : [];
                            const idx2 = current.indexOf(opcion.valor);
                            if (idx2 >= 0) current.splice(idx2, 1);
                            else current.push(opcion.valor);
                            updateField('respuesta_correcta', current);
                          } else {
                            updateField('respuesta_correcta', opcion.valor);
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Correcta
                    </label>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOpcion(idx)}
                    className="text-gray-400 hover:text-danger-500 !px-1 !min-h-0 !py-1"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  value={opcionInput}
                  onChange={(e) => setOpcionInput(e.target.value)}
                  placeholder="Nueva opcion..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOpcion();
                    }
                  }}
                />
                <Button type="button" variant="ghost" size="sm" onClick={addOpcion}>
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Puntaje + Obligatorio */}
        <div className="grid grid-cols-3 gap-3">
          {tipoScoring !== 'manual' && (
            <Input
              label="Puntaje"
              type="number"
              min={0}
              value={String(campo.puntaje || 0)}
              onChange={(e) => updateField('puntaje', Number(e.target.value))}
            />
          )}
          <div className="flex items-end pb-2">
            <Checkbox
              label="Obligatoria"
              checked={campo.es_obligatorio || false}
              onChange={(e) =>
                updateField('es_obligatorio', (e.target as HTMLInputElement).checked)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Componente Principal
// ============================================================================

export const FormBuilderModal = ({ plantilla, isOpen, onClose }: FormBuilderModalProps) => {
  const isEditing = plantilla !== null;
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<PlantillaPruebaFormData>(INITIAL_FORM);

  // Fetch detail if editing
  const { data: detailData } = usePlantillaPrueba(plantilla?.id || 0);

  // Mutations
  const createMutation = useCreatePlantillaPrueba();
  const updateMutation = useUpdatePlantillaPrueba();

  // Load existing data
  useEffect(() => {
    if (detailData && isOpen && isEditing) {
      setFormData({
        nombre: detailData.nombre,
        descripcion: detailData.descripcion || '',
        instrucciones: detailData.instrucciones || '',
        campos: detailData.campos || [],
        scoring_config: detailData.scoring_config || { puntaje_aprobacion: 60 },
        tipo_scoring: detailData.tipo_scoring,
        categoria: detailData.categoria || '',
        duracion_estimada_minutos: detailData.duracion_estimada_minutos,
        tiempo_limite_minutos: detailData.tiempo_limite_minutos,
      });
      setActiveStep(0);
    } else if (!isEditing && isOpen) {
      setFormData(INITIAL_FORM);
      setActiveStep(0);
    }
  }, [detailData, isOpen, isEditing]);

  // Field updater
  const updateField = useCallback(
    <K extends keyof PlantillaPruebaFormData>(field: K, value: PlantillaPruebaFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Campo handlers
  const addCampo = () => {
    const newCampo: CampoPruebaDinamica = {
      ...EMPTY_CAMPO,
      nombre_campo: `pregunta_${formData.campos.length + 1}`,
      orden: formData.campos.length,
    };
    updateField('campos', [...formData.campos, newCampo]);
  };

  const updateCampo = (index: number, updated: CampoPruebaDinamica) => {
    const newCampos = [...formData.campos];
    newCampos[index] = updated;
    updateField('campos', newCampos);
  };

  const removeCampo = (index: number) => {
    updateField(
      'campos',
      formData.campos.filter((_, i) => i !== index).map((c, i) => ({ ...c, orden: i }))
    );
  };

  // Validation
  const isStep1Valid = !!formData.nombre.trim();
  const isStep2Valid =
    formData.campos.length > 0 && formData.campos.every((c) => c.etiqueta.trim());

  // Submit
  const handleSubmit = async () => {
    // Ensure nombre_campo is set for all campos
    const cleanedCampos = formData.campos.map((c, i) => ({
      ...c,
      nombre_campo: c.nombre_campo || `pregunta_${i + 1}`,
      orden: i,
    }));

    const data: PlantillaPruebaFormData = {
      ...formData,
      campos: cleanedCampos,
    };

    try {
      if (isEditing && plantilla) {
        await updateMutation.mutateAsync({ id: plantilla.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const currentStepKey = STEPS[activeStep].key;

  // Puntaje total
  const puntajeTotal = formData.campos.reduce((sum, c) => sum + (c.puntaje || 0), 0);

  // Footer
  const footer = (
    <div className="flex items-center justify-between w-full">
      <div>
        {activeStep > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveStep((s) => s - 1)}
            disabled={isLoading}
          >
            <ChevronLeft size={16} className="mr-1" />
            Anterior
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        {activeStep < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="primary"
            onClick={() => setActiveStep((s) => s + 1)}
            disabled={!isStep1Valid}
          >
            Siguiente
            <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading || !isStep1Valid || !isStep2Valid}
          >
            {isLoading ? (
              'Guardando...'
            ) : (
              <>
                <Check size={16} className="mr-1" />
                {isEditing ? 'Actualizar' : 'Crear Plantilla'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Plantilla de Prueba' : 'Nueva Plantilla de Prueba'}
      size="3xl"
      footer={footer}
    >
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        {STEPS.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          return (
            <Button
              key={step.key}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (index <= activeStep || (index === 1 && isStep1Valid)) {
                  setActiveStep(index);
                }
              }}
              className={cn(
                'flex items-center gap-2 !px-3 !py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : isCompleted
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                )}
              >
                {isCompleted ? <Check size={12} /> : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </Button>
          );
        })}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        {/* STEP 1: Configuracion */}
        {currentStepKey === 'config' && (
          <div className="space-y-4">
            <Alert variant="info" message="Define los datos generales de la plantilla de prueba." />

            <Input
              label="Nombre de la Plantilla"
              value={formData.nombre}
              onChange={(e) => updateField('nombre', e.target.value)}
              placeholder="Ej: Prueba de Conduccion Preventiva"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Categoria"
                value={formData.categoria || ''}
                onChange={(e) => updateField('categoria', e.target.value)}
                options={CATEGORIA_OPTIONS}
              />
              <Select
                label="Tipo de Scoring"
                value={formData.tipo_scoring || 'automatico'}
                onChange={(e) => updateField('tipo_scoring', e.target.value as TipoScoring)}
                options={TIPO_SCORING_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Duracion Estimada (min)"
                type="number"
                min={1}
                value={String(formData.duracion_estimada_minutos || 30)}
                onChange={(e) => updateField('duracion_estimada_minutos', Number(e.target.value))}
              />
              <Input
                label="Tiempo Limite (min)"
                type="number"
                min={0}
                value={String(formData.tiempo_limite_minutos || '')}
                onChange={(e) =>
                  updateField(
                    'tiempo_limite_minutos',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="Sin limite"
              />
              {formData.tipo_scoring !== 'manual' && (
                <Input
                  label="% Aprobacion"
                  type="number"
                  min={0}
                  max={100}
                  value={String(
                    (formData.scoring_config as Record<string, unknown>)?.puntaje_aprobacion || 60
                  )}
                  onChange={(e) =>
                    updateField('scoring_config', {
                      ...formData.scoring_config,
                      puntaje_aprobacion: Number(e.target.value),
                    })
                  }
                />
              )}
            </div>

            <Textarea
              label="Descripcion"
              value={formData.descripcion || ''}
              onChange={(e) => updateField('descripcion', e.target.value)}
              placeholder="Descripcion breve de la prueba..."
              rows={2}
            />

            <Textarea
              label="Instrucciones para el Candidato"
              value={formData.instrucciones || ''}
              onChange={(e) => updateField('instrucciones', e.target.value)}
              placeholder="Instrucciones que vera el candidato antes de iniciar..."
              rows={3}
            />
          </div>
        )}

        {/* STEP 2: Preguntas */}
        {currentStepKey === 'campos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Alert
                variant="info"
                message={`Agrega las preguntas de la prueba. ${
                  formData.tipo_scoring !== 'manual' ? `Puntaje total: ${puntajeTotal} pts` : ''
                }`}
              />
            </div>

            {/* Lista de campos */}
            <div className="space-y-3">
              {formData.campos.map((campo, index) => (
                <CampoEditor
                  key={index}
                  campo={campo}
                  index={index}
                  onChange={(updated) => updateCampo(index, updated)}
                  onRemove={() => removeCampo(index)}
                  tipoScoring={formData.tipo_scoring || 'manual'}
                />
              ))}
            </div>

            {/* Add button */}
            <Button
              type="button"
              variant="outline"
              onClick={addCampo}
              className="w-full border-dashed"
            >
              <Plus size={16} className="mr-2" />
              Agregar Pregunta
            </Button>

            {formData.campos.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">
                Agrega al menos una pregunta para crear la plantilla.
              </p>
            )}
          </div>
        )}
      </form>
    </BaseModal>
  );
};
