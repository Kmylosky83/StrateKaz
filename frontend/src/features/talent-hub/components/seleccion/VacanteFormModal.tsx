/**
 * VacanteFormModal - Wizard para crear/editar vacantes
 * Seleccion y Contratacion > Vacantes > Crear/Editar
 *
 * Wizard de 3 pasos:
 * 1. Datos basicos (titulo, codigo, cargo, area, tipo contrato)
 * 2. Requisitos y descripcion (funciones, requisitos, competencias)
 * 3. Publicacion y condiciones (salario, horario, ubicacion, modalidad)
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Alert } from '@/components/common/Alert';
import { ChevronLeft, ChevronRight, Check, Briefcase, FileText, Globe } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  useCreateVacanteActiva,
  useUpdateVacanteActiva,
  useTiposContrato,
} from '../../hooks/useSeleccionContratacion';
import { useSelectCargos, useSelectAreas } from '@/hooks/useSelectLists';
import type {
  VacanteActiva,
  VacanteActivaFormData,
  EstadoVacante,
  PrioridadVacante,
  ModalidadVacante,
} from '../../types';
import { ESTADO_VACANTE_OPTIONS, PRIORIDAD_OPTIONS, MODALIDAD_OPTIONS } from '../../types';
import { useAuthStore } from '@/store/authStore';

// ============================================================================
// Tipos y constantes
// ============================================================================

interface VacanteFormModalProps {
  vacante: VacanteActiva | null;
  isOpen: boolean;
  onClose: () => void;
}

type StepKey = 'datos' | 'requisitos' | 'publicacion';

const STEPS: { key: StepKey; label: string; icon: React.ReactNode }[] = [
  { key: 'datos', label: 'Datos Basicos', icon: <Briefcase size={16} /> },
  { key: 'requisitos', label: 'Requisitos', icon: <FileText size={16} /> },
  { key: 'publicacion', label: 'Publicacion', icon: <Globe size={16} /> },
];

const INITIAL_FORM: VacanteActivaFormData = {
  codigo_vacante: '',
  titulo: '',
  cargo_requerido: '',
  area: '',
  tipo_contrato: 0,
  estado: 'abierta',
  prioridad: 'media',
  modalidad: 'presencial',
  numero_posiciones: 1,
  fecha_apertura: new Date().toISOString().split('T')[0],
  fecha_cierre_esperada: '',
  descripcion: '',
  requisitos_minimos: '',
  requisitos_deseables: '',
  funciones_principales: '',
  competencias_requeridas: '',
  salario_minimo: undefined,
  salario_maximo: undefined,
  salario_oculto: false,
  beneficios: '',
  horario: '',
  ubicacion: '',
  publicada_externamente: false,
  url_publicacion: '',
  responsable_proceso: 0,
  reclutador: undefined,
  observaciones: '',
};

// ============================================================================
// Componente
// ============================================================================

export const VacanteFormModal = ({ vacante, isOpen, onClose }: VacanteFormModalProps) => {
  const isEditing = vacante !== null;
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<VacanteActivaFormData>(INITIAL_FORM);

  // Auth (para responsable_proceso default)
  const user = useAuthStore((s) => s.user);

  // Queries
  const createMutation = useCreateVacanteActiva();
  const updateMutation = useUpdateVacanteActiva();
  const { data: tiposContratoData } = useTiposContrato();
  const { data: cargosData } = useSelectCargos();
  const { data: areasData } = useSelectAreas();

  // Options
  const tipoContratoOptions = useMemo(() => {
    const options = [{ value: '', label: 'Seleccionar tipo contrato' }];
    if (tiposContratoData) {
      (Array.isArray(tiposContratoData) ? tiposContratoData : []).forEach(
        (tc: { id: number; nombre: string }) => {
          options.push({ value: String(tc.id), label: tc.nombre });
        }
      );
    }
    return options;
  }, [tiposContratoData]);

  const cargoOptions = useMemo(() => {
    const options = [{ value: '', label: 'Escribir cargo requerido' }];
    if (cargosData) {
      cargosData.forEach((c) => {
        options.push({ value: c.label, label: c.label });
      });
    }
    return options;
  }, [cargosData]);

  const areaOptions = useMemo(() => {
    const options = [{ value: '', label: 'Seleccionar proceso/area' }];
    if (areasData) {
      areasData.forEach((a) => {
        options.push({ value: a.label, label: a.label });
      });
    }
    return options;
  }, [areasData]);

  // Load existing data
  useEffect(() => {
    if (vacante && isOpen) {
      setFormData({
        codigo_vacante: vacante.codigo_vacante || '',
        titulo: vacante.titulo || '',
        cargo_requerido: vacante.cargo_requerido || '',
        area: vacante.area || '',
        tipo_contrato: vacante.tipo_contrato || 0,
        estado: vacante.estado || 'abierta',
        prioridad: vacante.prioridad || 'media',
        modalidad: vacante.modalidad || 'presencial',
        numero_posiciones: vacante.numero_posiciones || 1,
        fecha_apertura: vacante.fecha_apertura || '',
        fecha_cierre_esperada: vacante.fecha_cierre_esperada || '',
        publicada_externamente: vacante.publicada_externamente || false,
        responsable_proceso: 0, // Will be filled from detail
      });
      setActiveStep(0);
    } else if (!vacante && isOpen) {
      setFormData({
        ...INITIAL_FORM,
        fecha_apertura: new Date().toISOString().split('T')[0],
        responsable_proceso: user?.id || 0,
      });
      setActiveStep(0);
    }
  }, [vacante, isOpen, user]);

  // Field updater
  const updateField = useCallback(
    <K extends keyof VacanteActivaFormData>(field: K, value: VacanteActivaFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Auto-generate codigo from titulo
  const generateCodigo = useCallback(() => {
    if (!formData.titulo) return;
    const year = new Date().getFullYear();
    const prefix = formData.titulo
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase())
      .join('')
      .slice(0, 4);
    const random = String(Math.floor(Math.random() * 900) + 100);
    updateField('codigo_vacante', `VAC-${prefix}-${year}-${random}`);
  }, [formData.titulo, updateField]);

  // Validation per step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(
          formData.codigo_vacante.trim() &&
          formData.titulo.trim() &&
          formData.cargo_requerido.trim() &&
          formData.tipo_contrato
        );
      case 1:
        return !!(formData.descripcion?.trim() || formData.funciones_principales?.trim());
      case 2:
        return true; // Publicacion es opcional
      default:
        return false;
    }
  };

  // Submit
  const handleSubmit = async () => {
    const data = { ...formData };

    // Clean empty strings
    if (!data.fecha_cierre_esperada) delete data.fecha_cierre_esperada;
    if (!data.requisitos_deseables) delete data.requisitos_deseables;
    if (!data.competencias_requeridas) delete data.competencias_requeridas;
    if (!data.beneficios) delete data.beneficios;
    if (!data.horario) delete data.horario;
    if (!data.ubicacion) delete data.ubicacion;
    if (!data.url_publicacion) delete data.url_publicacion;
    if (!data.observaciones) delete data.observaciones;

    try {
      if (isEditing && vacante) {
        await updateMutation.mutateAsync({ id: vacante.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch {
      // Error handled by mutation onError
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const currentStepKey = STEPS[activeStep].key;

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
            disabled={!isStepValid(activeStep)}
          >
            Siguiente
            <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading || !isStepValid(0)}
          >
            {isLoading ? (
              'Guardando...'
            ) : (
              <>
                <Check size={16} className="mr-1" />
                {isEditing ? 'Actualizar' : 'Crear Vacante'}
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
      title={isEditing ? 'Editar Vacante' : 'Nueva Vacante'}
      size="2xl"
      footer={footer}
    >
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        {STEPS.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => {
                if (index <= activeStep || (index === activeStep + 1 && isStepValid(activeStep))) {
                  setActiveStep(index);
                }
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
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
            </button>
          );
        })}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        {/* STEP 1: Datos Basicos */}
        {currentStepKey === 'datos' && (
          <div className="space-y-4">
            <Alert
              variant="info"
              message="Ingresa los datos principales de la vacante. El codigo se genera automaticamente."
            />

            {/* Codigo + Titulo */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Input
                  label="Codigo Vacante"
                  value={formData.codigo_vacante}
                  onChange={(e) => updateField('codigo_vacante', e.target.value)}
                  placeholder="VAC-DEV-2026-001"
                  required
                />
                {!formData.codigo_vacante && formData.titulo && (
                  <button
                    type="button"
                    onClick={generateCodigo}
                    className="mt-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    Generar automaticamente
                  </button>
                )}
              </div>
              <div className="col-span-2">
                <Input
                  label="Titulo de la Vacante"
                  value={formData.titulo}
                  onChange={(e) => updateField('titulo', e.target.value)}
                  placeholder="Ej: Desarrollador Full Stack Senior"
                  required
                />
              </div>
            </div>

            {/* Cargo + Area */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Cargo Requerido"
                  value={formData.cargo_requerido}
                  onChange={(e) => updateField('cargo_requerido', e.target.value)}
                  placeholder="Cargo para la vacante"
                  list="cargos-list"
                  required
                />
                <datalist id="cargos-list">
                  {cargoOptions.slice(1).map((opt) => (
                    <option key={opt.value} value={opt.value} />
                  ))}
                </datalist>
              </div>
              <Select
                label="Proceso / Area"
                value={formData.area}
                onChange={(e) => updateField('area', e.target.value)}
                options={areaOptions}
              />
            </div>

            {/* Tipo Contrato + Posiciones */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de Contrato"
                value={String(formData.tipo_contrato || '')}
                onChange={(e) => updateField('tipo_contrato', Number(e.target.value))}
                options={tipoContratoOptions}
                required
              />
              <Input
                label="Numero de Posiciones"
                type="number"
                min={1}
                value={String(formData.numero_posiciones || 1)}
                onChange={(e) => updateField('numero_posiciones', Number(e.target.value))}
              />
            </div>

            {/* Estado + Prioridad + Modalidad */}
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Estado"
                value={formData.estado || 'abierta'}
                onChange={(e) => updateField('estado', e.target.value as EstadoVacante)}
                options={ESTADO_VACANTE_OPTIONS}
              />
              <Select
                label="Prioridad"
                value={formData.prioridad || 'media'}
                onChange={(e) => updateField('prioridad', e.target.value as PrioridadVacante)}
                options={PRIORIDAD_OPTIONS}
              />
              <Select
                label="Modalidad"
                value={formData.modalidad || 'presencial'}
                onChange={(e) => updateField('modalidad', e.target.value as ModalidadVacante)}
                options={MODALIDAD_OPTIONS}
              />
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de Apertura"
                type="date"
                value={formData.fecha_apertura || ''}
                onChange={(e) => updateField('fecha_apertura', e.target.value)}
              />
              <Input
                label="Fecha Cierre Esperada"
                type="date"
                value={formData.fecha_cierre_esperada || ''}
                onChange={(e) => updateField('fecha_cierre_esperada', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Requisitos */}
        {currentStepKey === 'requisitos' && (
          <div className="space-y-4">
            <Alert
              variant="info"
              message="Describe las funciones, requisitos y competencias para la vacante."
            />

            <Textarea
              label="Descripcion del Cargo"
              value={formData.descripcion || ''}
              onChange={(e) => updateField('descripcion', e.target.value)}
              placeholder="Descripcion general de las responsabilidades del cargo..."
              rows={3}
            />

            <Textarea
              label="Funciones Principales"
              value={formData.funciones_principales || ''}
              onChange={(e) => updateField('funciones_principales', e.target.value)}
              placeholder="Lista de funciones principales del cargo..."
              rows={3}
            />

            <Textarea
              label="Requisitos Minimos"
              value={formData.requisitos_minimos || ''}
              onChange={(e) => updateField('requisitos_minimos', e.target.value)}
              placeholder="Educacion, experiencia, certificaciones requeridas..."
              rows={3}
            />

            <Textarea
              label="Requisitos Deseables"
              value={formData.requisitos_deseables || ''}
              onChange={(e) => updateField('requisitos_deseables', e.target.value)}
              placeholder="Conocimientos o experiencia adicional valorada..."
              rows={2}
            />

            <Textarea
              label="Competencias Requeridas"
              value={formData.competencias_requeridas || ''}
              onChange={(e) => updateField('competencias_requeridas', e.target.value)}
              placeholder="Competencias tecnicas y blandas necesarias..."
              rows={2}
            />
          </div>
        )}

        {/* STEP 3: Publicacion */}
        {currentStepKey === 'publicacion' && (
          <div className="space-y-4">
            <Alert
              variant="info"
              message="Configura las condiciones laborales y la publicacion de la vacante."
            />

            {/* Salario */}
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Salario Minimo"
                type="number"
                value={String(formData.salario_minimo || '')}
                onChange={(e) =>
                  updateField('salario_minimo', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="0"
              />
              <Input
                label="Salario Maximo"
                type="number"
                value={String(formData.salario_maximo || '')}
                onChange={(e) =>
                  updateField('salario_maximo', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="0"
              />
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.salario_oculto || false}
                    onChange={(e) => updateField('salario_oculto', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Ocultar salario
                </label>
              </div>
            </div>

            {/* Horario + Ubicacion */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Horario"
                value={formData.horario || ''}
                onChange={(e) => updateField('horario', e.target.value)}
                placeholder="Ej: Lunes a Viernes 8:00-17:00"
              />
              <Input
                label="Ubicacion"
                value={formData.ubicacion || ''}
                onChange={(e) => updateField('ubicacion', e.target.value)}
                placeholder="Ej: Bogota, Colombia"
              />
            </div>

            {/* Beneficios */}
            <Textarea
              label="Beneficios"
              value={formData.beneficios || ''}
              onChange={(e) => updateField('beneficios', e.target.value)}
              placeholder="Beneficios adicionales: salud, capacitacion, bonos..."
              rows={2}
            />

            {/* Publicacion */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.publicada_externamente || false}
                  onChange={(e) => updateField('publicada_externamente', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Publicar externamente
              </label>
              {formData.publicada_externamente && (
                <Input
                  label="URL de Publicacion"
                  type="url"
                  value={formData.url_publicacion || ''}
                  onChange={(e) => updateField('url_publicacion', e.target.value)}
                  placeholder="https://..."
                />
              )}
            </div>

            {/* Observaciones */}
            <Textarea
              label="Observaciones Internas"
              value={formData.observaciones || ''}
              onChange={(e) => updateField('observaciones', e.target.value)}
              placeholder="Notas internas sobre la vacante..."
              rows={2}
            />

            {/* Resumen visual */}
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <h4 className="text-sm font-semibold text-primary-800 dark:text-primary-200 mb-2">
                Resumen de la Vacante
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-primary-700 dark:text-primary-300">
                <p>
                  <strong>Titulo:</strong> {formData.titulo || '-'}
                </p>
                <p>
                  <strong>Codigo:</strong> {formData.codigo_vacante || '-'}
                </p>
                <p>
                  <strong>Cargo:</strong> {formData.cargo_requerido || '-'}
                </p>
                <p>
                  <strong>Posiciones:</strong> {formData.numero_posiciones || 1}
                </p>
                <p>
                  <strong>Modalidad:</strong>{' '}
                  {MODALIDAD_OPTIONS.find((o) => o.value === formData.modalidad)?.label || '-'}
                </p>
                <p>
                  <strong>Prioridad:</strong>{' '}
                  {PRIORIDAD_OPTIONS.find((o) => o.value === formData.prioridad)?.label || '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </BaseModal>
  );
};
