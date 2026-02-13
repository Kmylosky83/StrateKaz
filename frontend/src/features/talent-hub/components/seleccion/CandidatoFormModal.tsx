/**
 * CandidatoFormModal - Wizard para crear/editar candidatos
 * Seleccion y Contratacion > Candidatos > Crear/Editar
 *
 * Wizard de 3 pasos:
 * 1. Datos personales (nombres, documento, educacion)
 * 2. Contacto y ubicacion (email, telefono, ciudad)
 * 3. Proceso de seleccion (vacante, origen, observaciones, CV)
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Alert } from '@/components/common/Alert';
import { ChevronLeft, ChevronRight, Check, User, Phone, Briefcase, Upload } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  useCreateCandidato,
  useUpdateCandidato,
  useVacantesActivasAbiertas,
} from '../../hooks/useSeleccionContratacion';
import type {
  Candidato,
  CandidatoFormData,
  TipoDocumentoCandidato,
  NivelEducativo,
  OrigenPostulacion,
} from '../../types';
import { TIPO_DOCUMENTO_OPTIONS, NIVEL_EDUCATIVO_OPTIONS, ORIGEN_OPTIONS } from '../../types';

// ============================================================================
// Tipos y constantes
// ============================================================================

interface CandidatoFormModalProps {
  candidato: Candidato | null;
  isOpen: boolean;
  onClose: () => void;
}

type StepKey = 'personal' | 'contacto' | 'proceso';

const STEPS: { key: StepKey; label: string; icon: React.ReactNode }[] = [
  { key: 'personal', label: 'Datos Personales', icon: <User size={16} /> },
  { key: 'contacto', label: 'Contacto', icon: <Phone size={16} /> },
  { key: 'proceso', label: 'Proceso', icon: <Briefcase size={16} /> },
];

const INITIAL_FORM: CandidatoFormData = {
  vacante: 0,
  nombres: '',
  apellidos: '',
  tipo_documento: 'CC',
  numero_documento: '',
  email: '',
  telefono: '',
  telefono_alternativo: '',
  ciudad: '',
  direccion: '',
  nivel_educativo: 'profesional',
  titulo_obtenido: '',
  anos_experiencia: 0,
  anos_experiencia_cargo: 0,
  origen_postulacion: 'portal_empleo',
  referido_por: '',
  pretension_salarial: undefined,
  fecha_disponibilidad: '',
  requiere_reubicacion: false,
  disponibilidad_viajes: false,
  fortalezas: '',
  debilidades: '',
  observaciones: '',
};

// ============================================================================
// Componente
// ============================================================================

export const CandidatoFormModal = ({ candidato, isOpen, onClose }: CandidatoFormModalProps) => {
  const isEditing = candidato !== null;
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CandidatoFormData>(INITIAL_FORM);
  const [cvFile, setCvFile] = useState<File | null>(null);

  // Queries
  const createMutation = useCreateCandidato();
  const updateMutation = useUpdateCandidato();
  const { data: vacantesData } = useVacantesActivasAbiertas();

  // Vacante options
  const vacanteOptions = useMemo(() => {
    const options = [{ value: '', label: 'Seleccionar vacante' }];
    if (vacantesData?.results) {
      vacantesData.results.forEach((v: { id: number; titulo: string; codigo_vacante: string }) => {
        options.push({ value: String(v.id), label: `${v.codigo_vacante} - ${v.titulo}` });
      });
    }
    return options;
  }, [vacantesData]);

  // Load existing data
  useEffect(() => {
    if (candidato && isOpen) {
      setFormData({
        vacante: candidato.vacante,
        nombres: candidato.nombres || '',
        apellidos: candidato.apellidos || '',
        tipo_documento: candidato.tipo_documento || 'CC',
        numero_documento: candidato.numero_documento || '',
        email: candidato.email || '',
        telefono: candidato.telefono || '',
        ciudad: candidato.ciudad || '',
        nivel_educativo: candidato.nivel_educativo || 'profesional',
        anos_experiencia: candidato.anos_experiencia || 0,
        origen_postulacion: candidato.origen_postulacion || 'portal_empleo',
      });
      setCvFile(null);
      setActiveStep(0);
    } else if (!candidato && isOpen) {
      setFormData(INITIAL_FORM);
      setCvFile(null);
      setActiveStep(0);
    }
  }, [candidato, isOpen]);

  // Field updater
  const updateField = useCallback(
    <K extends keyof CandidatoFormData>(field: K, value: CandidatoFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Validation per step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(
          formData.nombres.trim() &&
          formData.apellidos.trim() &&
          formData.tipo_documento &&
          formData.numero_documento.trim()
        );
      case 1:
        return !!(formData.email.trim() && formData.telefono.trim());
      case 2:
        return !!formData.vacante;
      default:
        return false;
    }
  };

  // Submit
  const handleSubmit = async () => {
    const data: CandidatoFormData = { ...formData };

    // Add CV file
    if (cvFile) {
      data.hoja_vida = cvFile;
    }

    // Clean empty optional fields
    if (!data.telefono_alternativo) delete data.telefono_alternativo;
    if (!data.direccion) delete data.direccion;
    if (!data.titulo_obtenido) delete data.titulo_obtenido;
    if (!data.referido_por) delete data.referido_por;
    if (!data.fecha_disponibilidad) delete data.fecha_disponibilidad;
    if (!data.fortalezas) delete data.fortalezas;
    if (!data.debilidades) delete data.debilidades;
    if (!data.observaciones) delete data.observaciones;
    if (!data.pretension_salarial) delete data.pretension_salarial;

    try {
      if (isEditing && candidato) {
        await updateMutation.mutateAsync({ id: candidato.id, data });
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
            disabled={isLoading || !isStepValid(0) || !isStepValid(1) || !isStepValid(2)}
          >
            {isLoading ? (
              'Guardando...'
            ) : (
              <>
                <Check size={16} className="mr-1" />
                {isEditing ? 'Actualizar' : 'Registrar Candidato'}
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
      title={isEditing ? 'Editar Candidato' : 'Nuevo Candidato'}
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
        {/* STEP 1: Datos Personales */}
        {currentStepKey === 'personal' && (
          <div className="space-y-4">
            <Alert
              variant="info"
              message="Ingresa los datos personales y de identificacion del candidato."
            />

            {/* Tipo doc + Numero */}
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Tipo Documento"
                value={formData.tipo_documento}
                onChange={(e) =>
                  updateField('tipo_documento', e.target.value as TipoDocumentoCandidato)
                }
                options={TIPO_DOCUMENTO_OPTIONS}
                required
              />
              <div className="col-span-2">
                <Input
                  label="Numero de Documento"
                  value={formData.numero_documento}
                  onChange={(e) => updateField('numero_documento', e.target.value)}
                  placeholder="Numero de identificacion"
                  required
                />
              </div>
            </div>

            {/* Nombres + Apellidos */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombres"
                value={formData.nombres}
                onChange={(e) => updateField('nombres', e.target.value)}
                placeholder="Nombres completos"
                required
              />
              <Input
                label="Apellidos"
                value={formData.apellidos}
                onChange={(e) => updateField('apellidos', e.target.value)}
                placeholder="Apellidos completos"
                required
              />
            </div>

            {/* Educacion */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Nivel Educativo"
                value={formData.nivel_educativo || 'profesional'}
                onChange={(e) => updateField('nivel_educativo', e.target.value as NivelEducativo)}
                options={NIVEL_EDUCATIVO_OPTIONS}
              />
              <Input
                label="Titulo Obtenido"
                value={formData.titulo_obtenido || ''}
                onChange={(e) => updateField('titulo_obtenido', e.target.value)}
                placeholder="Ej: Ingeniero de Sistemas"
              />
            </div>

            {/* Experiencia */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Anos de Experiencia General"
                type="number"
                min={0}
                value={String(formData.anos_experiencia || 0)}
                onChange={(e) => updateField('anos_experiencia', Number(e.target.value))}
              />
              <Input
                label="Anos Experiencia en el Cargo"
                type="number"
                min={0}
                value={String(formData.anos_experiencia_cargo || 0)}
                onChange={(e) => updateField('anos_experiencia_cargo', Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Contacto */}
        {currentStepKey === 'contacto' && (
          <div className="space-y-4">
            <Alert variant="info" message="Datos de contacto y ubicacion del candidato." />

            {/* Email */}
            <Input
              label="Correo Electronico"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />

            {/* Telefonos */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Telefono Principal"
                value={formData.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                placeholder="300 123 4567"
                required
              />
              <Input
                label="Telefono Alternativo"
                value={formData.telefono_alternativo || ''}
                onChange={(e) => updateField('telefono_alternativo', e.target.value)}
                placeholder="Opcional"
              />
            </div>

            {/* Ciudad + Direccion */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                value={formData.ciudad || ''}
                onChange={(e) => updateField('ciudad', e.target.value)}
                placeholder="Ej: Bogota"
              />
              <Input
                label="Direccion"
                value={formData.direccion || ''}
                onChange={(e) => updateField('direccion', e.target.value)}
                placeholder="Direccion de residencia"
              />
            </div>

            {/* Disponibilidad */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Pretension Salarial"
                type="number"
                value={String(formData.pretension_salarial || '')}
                onChange={(e) =>
                  updateField(
                    'pretension_salarial',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="Salario esperado"
              />
              <Input
                label="Fecha de Disponibilidad"
                type="date"
                value={formData.fecha_disponibilidad || ''}
                onChange={(e) => updateField('fecha_disponibilidad', e.target.value)}
              />
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiere_reubicacion || false}
                  onChange={(e) => updateField('requiere_reubicacion', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Requiere reubicacion
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.disponibilidad_viajes || false}
                  onChange={(e) => updateField('disponibilidad_viajes', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Disponibilidad para viajar
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: Proceso */}
        {currentStepKey === 'proceso' && (
          <div className="space-y-4">
            <Alert
              variant="info"
              message="Selecciona la vacante y adjunta la hoja de vida del candidato."
            />

            {/* Vacante */}
            <Select
              label="Vacante"
              value={String(formData.vacante || '')}
              onChange={(e) => updateField('vacante', Number(e.target.value))}
              options={vacanteOptions}
              required
            />

            {/* Origen */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Origen de Postulacion"
                value={formData.origen_postulacion || 'portal_empleo'}
                onChange={(e) =>
                  updateField('origen_postulacion', e.target.value as OrigenPostulacion)
                }
                options={ORIGEN_OPTIONS}
              />
              <Input
                label="Referido por"
                value={formData.referido_por || ''}
                onChange={(e) => updateField('referido_por', e.target.value)}
                placeholder="Nombre del referente (si aplica)"
              />
            </div>

            {/* CV Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hoja de Vida (CV)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Upload size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {cvFile ? cvFile.name : 'Seleccionar archivo'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setCvFile(file);
                    }}
                    className="hidden"
                  />
                </label>
                {cvFile && (
                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">PDF, DOC o DOCX. Max 5MB.</p>
            </div>

            {/* Fortalezas y Debilidades */}
            <div className="grid grid-cols-2 gap-4">
              <Textarea
                label="Fortalezas"
                value={formData.fortalezas || ''}
                onChange={(e) => updateField('fortalezas', e.target.value)}
                placeholder="Principales fortalezas del candidato..."
                rows={2}
              />
              <Textarea
                label="Areas de Mejora"
                value={formData.debilidades || ''}
                onChange={(e) => updateField('debilidades', e.target.value)}
                placeholder="Areas de mejora identificadas..."
                rows={2}
              />
            </div>

            {/* Observaciones */}
            <Textarea
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => updateField('observaciones', e.target.value)}
              placeholder="Notas adicionales sobre el candidato..."
              rows={2}
            />

            {/* Resumen */}
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <h4 className="text-sm font-semibold text-primary-800 dark:text-primary-200 mb-2">
                Resumen del Candidato
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-primary-700 dark:text-primary-300">
                <p>
                  <strong>Nombre:</strong> {formData.nombres} {formData.apellidos}
                </p>
                <p>
                  <strong>Documento:</strong> {formData.tipo_documento} {formData.numero_documento}
                </p>
                <p>
                  <strong>Email:</strong> {formData.email || '-'}
                </p>
                <p>
                  <strong>Telefono:</strong> {formData.telefono || '-'}
                </p>
                <p>
                  <strong>Educacion:</strong>{' '}
                  {NIVEL_EDUCATIVO_OPTIONS.find((o) => o.value === formData.nivel_educativo)
                    ?.label || '-'}
                </p>
                <p>
                  <strong>Experiencia:</strong> {formData.anos_experiencia || 0} anos
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </BaseModal>
  );
};
