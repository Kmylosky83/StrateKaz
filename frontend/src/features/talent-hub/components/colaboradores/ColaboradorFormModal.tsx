/**
 * ColaboradorFormModal - Modal de creacion/edicion de colaboradores
 * Talento Humano > Colaboradores
 *
 * Wizard de 3 pasos:
 * - Step 1: Datos basicos (nombre, documento, contacto)
 * - Step 2: Asignacion organizacional (cargo, area, fecha ingreso)
 * - Step 3: Contratacion (tipo contrato, salario, horas)
 *
 * Compatible con el flujo maestro:
 * Cargo -> Colaborador -> User (auto-creado en backend)
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { User, Briefcase, FileText, ChevronLeft, ChevronRight, Check, Plus } from 'lucide-react';
import { useCreateColaborador, useUpdateColaborador } from '../../hooks/useColaboradores';
import { useCargos } from '@/features/users/hooks/useUsers';
import { useAreas } from '@/features/gestion-estrategica/hooks/useAreas';
import { CargoFormModal } from '../estructura';
import type {
  Colaborador,
  ColaboradorFormData,
  TipoDocumento,
  TipoContratoColaborador,
  EstadoColaborador,
} from '../../types';

interface ColaboradorFormModalProps {
  colaborador: Colaborador | null;
  isOpen: boolean;
  onClose: () => void;
}

type StepKey = 'datos' | 'asignacion' | 'contratacion';

const STEPS: { key: StepKey; label: string; icon: React.ReactNode }[] = [
  { key: 'datos', label: 'Datos Basicos', icon: <User size={16} /> },
  { key: 'asignacion', label: 'Asignacion', icon: <Briefcase size={16} /> },
  { key: 'contratacion', label: 'Contratacion', icon: <FileText size={16} /> },
];

const TIPO_DOCUMENTO_OPTIONS = [
  { value: 'CC', label: 'Cedula de Ciudadania' },
  { value: 'CE', label: 'Cedula de Extranjeria' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'PEP', label: 'PEP' },
  { value: 'PPT', label: 'PPT' },
];

const TIPO_CONTRATO_OPTIONS = [
  { value: 'indefinido', label: 'Termino Indefinido' },
  { value: 'fijo', label: 'Termino Fijo' },
  { value: 'obra_labor', label: 'Obra o Labor' },
  { value: 'aprendizaje', label: 'Contrato de Aprendizaje' },
  { value: 'prestacion_servicios', label: 'Prestacion de Servicios' },
];

const INITIAL_FORM: ColaboradorFormData = {
  tipo_documento: 'CC',
  numero_identificacion: '',
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  cargo: '',
  area: '',
  fecha_ingreso: new Date().toISOString().split('T')[0],
  tipo_contrato: 'indefinido',
  salario: '',
  auxilio_transporte: true,
  horas_semanales: 48,
  email_personal: '',
  telefono_movil: '',
  observaciones: '',
};

export const ColaboradorFormModal = ({
  colaborador,
  isOpen,
  onClose,
}: ColaboradorFormModalProps) => {
  const isEditing = colaborador !== null;
  const [activeStep, setActiveStep] = useState<number>(0);
  const [formData, setFormData] = useState<ColaboradorFormData>(INITIAL_FORM);
  const [showCargoModal, setShowCargoModal] = useState(false);

  // Queries
  const queryClient = useQueryClient();
  const { data: cargosData } = useCargos();
  const { data: areasData } = useAreas();
  const createMutation = useCreateColaborador();
  const updateMutation = useUpdateColaborador();

  /**
   * Callback cuando se crea un cargo inline desde el wizard.
   * Invalida queries de cargos y auto-selecciona el nuevo cargo.
   */
  const handleCargoCreated = useCallback(
    (newCargoId: number) => {
      // Invalidar ambos queries de cargos (el de users y el de rbac)
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      // Auto-seleccionar el cargo recien creado
      setFormData((prev) => ({ ...prev, cargo: String(newCargoId) }));
      setShowCargoModal(false);
    },
    [queryClient]
  );

  // Cargo options
  const cargoOptions = useMemo(() => {
    if (!cargosData?.results) return [];
    return cargosData.results.map((c: { id: number; name: string }) => ({
      value: String(c.id),
      label: c.name,
    }));
  }, [cargosData]);

  // Area options
  const areaOptions = useMemo(() => {
    if (!areasData?.results) return [];
    return areasData.results.map((a: { id: number; name: string }) => ({
      value: String(a.id),
      label: a.name,
    }));
  }, [areasData]);

  // Load existing data when editing
  useEffect(() => {
    if (colaborador) {
      setFormData({
        tipo_documento: colaborador.tipo_documento,
        numero_identificacion: colaborador.numero_identificacion,
        primer_nombre: colaborador.primer_nombre,
        segundo_nombre: colaborador.segundo_nombre || '',
        primer_apellido: colaborador.primer_apellido,
        segundo_apellido: colaborador.segundo_apellido || '',
        cargo: String(
          typeof colaborador.cargo === 'object' ? colaborador.cargo?.id : colaborador.cargo || ''
        ),
        area: String(
          typeof colaborador.area === 'object' ? colaborador.area?.id : colaborador.area || ''
        ),
        fecha_ingreso: colaborador.fecha_ingreso,
        fecha_retiro: colaborador.fecha_retiro,
        estado: colaborador.estado,
        motivo_retiro: colaborador.motivo_retiro || '',
        tipo_contrato: colaborador.tipo_contrato,
        fecha_fin_contrato: colaborador.fecha_fin_contrato,
        salario: colaborador.salario,
        auxilio_transporte: colaborador.auxilio_transporte,
        horas_semanales: colaborador.horas_semanales,
        email_personal: colaborador.email_personal || '',
        telefono_movil: colaborador.telefono_movil || '',
        observaciones: colaborador.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setActiveStep(0);
  }, [colaborador, isOpen]);

  // Field updater
  const updateField = <K extends keyof ColaboradorFormData>(
    field: K,
    value: ColaboradorFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validation per step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Datos basicos
        return !!(
          formData.primer_nombre.trim() &&
          formData.primer_apellido.trim() &&
          formData.numero_identificacion.trim()
        );
      case 1: // Asignacion
        return !!(formData.cargo && formData.area && formData.fecha_ingreso);
      case 2: // Contratacion
        return !!(formData.tipo_contrato && formData.salario);
      default:
        return false;
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!isStepValid(0) || !isStepValid(1) || !isStepValid(2)) return;

    const data = { ...formData };
    // Clean optional fields
    if (!data.segundo_nombre) delete data.segundo_nombre;
    if (!data.segundo_apellido) delete data.segundo_apellido;
    if (!data.email_personal) delete data.email_personal;
    if (!data.telefono_movil) delete data.telefono_movil;
    if (!data.observaciones) delete data.observaciones;

    if (isEditing && colaborador) {
      await updateMutation.mutateAsync({ id: colaborador.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const currentStepKey = STEPS[activeStep].key;

  // Footer with wizard navigation
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
            disabled={isLoading || !isStepValid(activeStep)}
          >
            {isLoading ? (
              'Guardando...'
            ) : (
              <>
                <Check size={16} className="mr-1" />
                {isEditing ? 'Actualizar' : 'Crear Colaborador'}
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
      title={isEditing ? 'Editar Colaborador' : 'Nuevo Colaborador'}
      subtitle={
        isEditing
          ? `${colaborador.primer_nombre} ${colaborador.primer_apellido}`
          : 'Registro de nuevo empleado'
      }
      size="2xl"
      footer={footer}
    >
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        {STEPS.map((step, index) => (
          <button
            key={step.key}
            type="button"
            onClick={() => {
              // Solo permitir navegar a pasos anteriores o al actual
              if (index <= activeStep || (index === activeStep + 1 && isStepValid(activeStep))) {
                setActiveStep(index);
              }
            }}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                activeStep === index
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : index < activeStep
                    ? 'text-success-600 dark:text-success-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    : 'text-gray-400 dark:text-gray-500'
              }
            `}
          >
            <span
              className={`
              flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
              ${
                activeStep === index
                  ? 'bg-primary-600 text-white'
                  : index < activeStep
                    ? 'bg-success-500 text-white'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }
            `}
            >
              {index < activeStep ? <Check size={12} /> : index + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        {/* ========== STEP 1: DATOS BASICOS ========== */}
        {currentStepKey === 'datos' && (
          <div className="space-y-4">
            <Alert
              variant="info"
              message="Ingresa los datos de identificacion y contacto del colaborador."
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de Documento"
                value={formData.tipo_documento}
                onChange={(e) => updateField('tipo_documento', e.target.value as TipoDocumento)}
                options={TIPO_DOCUMENTO_OPTIONS}
              />
              <Input
                label="Numero de Identificacion"
                value={formData.numero_identificacion}
                onChange={(e) => updateField('numero_identificacion', e.target.value)}
                placeholder="1.234.567.890"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Primer Nombre"
                value={formData.primer_nombre}
                onChange={(e) => updateField('primer_nombre', e.target.value)}
                placeholder="Juan"
                required
              />
              <Input
                label="Segundo Nombre"
                value={formData.segundo_nombre || ''}
                onChange={(e) => updateField('segundo_nombre', e.target.value)}
                placeholder="Carlos (opcional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Primer Apellido"
                value={formData.primer_apellido}
                onChange={(e) => updateField('primer_apellido', e.target.value)}
                placeholder="Rodriguez"
                required
              />
              <Input
                label="Segundo Apellido"
                value={formData.segundo_apellido || ''}
                onChange={(e) => updateField('segundo_apellido', e.target.value)}
                placeholder="Martinez (opcional)"
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Informacion de Contacto
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email Personal"
                  type="email"
                  value={formData.email_personal || ''}
                  onChange={(e) => updateField('email_personal', e.target.value)}
                  placeholder="juan@email.com"
                />
                <Input
                  label="Telefono Movil"
                  value={formData.telefono_movil || ''}
                  onChange={(e) => updateField('telefono_movil', e.target.value)}
                  placeholder="300 123 4567"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========== STEP 2: ASIGNACION ORGANIZACIONAL ========== */}
        {currentStepKey === 'asignacion' && (
          <div className="space-y-4">
            <Alert
              variant="info"
              message="Asigna el cargo, proceso y fecha de ingreso del colaborador."
            />

            {/* Cargo con opcion de crear inline */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Select
                    label="Cargo"
                    value={formData.cargo}
                    onChange={(e) => updateField('cargo', e.target.value)}
                    options={[{ value: '', label: 'Seleccionar cargo...' }, ...cargoOptions]}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCargoModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                  >
                    <Plus size={12} />
                    Crear nuevo cargo
                  </button>
                </div>
                <Select
                  label="Proceso (Area)"
                  value={formData.area}
                  onChange={(e) => updateField('area', e.target.value)}
                  options={[{ value: '', label: 'Seleccionar proceso...' }, ...areaOptions]}
                  required
                />
              </div>
            </div>

            <Input
              label="Fecha de Ingreso"
              type="date"
              value={formData.fecha_ingreso}
              onChange={(e) => updateField('fecha_ingreso', e.target.value)}
              required
            />

            {isEditing && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Estado del Colaborador
                </h4>
                <Select
                  label="Estado"
                  value={formData.estado || 'activo'}
                  onChange={(e) => updateField('estado', e.target.value as EstadoColaborador)}
                  options={[
                    { value: 'activo', label: 'Activo' },
                    { value: 'inactivo', label: 'Inactivo' },
                    { value: 'suspendido', label: 'Suspendido' },
                  ]}
                />
              </div>
            )}

            <Textarea
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => updateField('observaciones', e.target.value)}
              placeholder="Notas internas sobre el colaborador..."
              rows={2}
            />
          </div>
        )}

        {/* ========== STEP 3: CONTRATACION ========== */}
        {currentStepKey === 'contratacion' && (
          <div className="space-y-4">
            <Alert variant="info" message="Define las condiciones contractuales y salariales." />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de Contrato"
                value={formData.tipo_contrato}
                onChange={(e) =>
                  updateField('tipo_contrato', e.target.value as TipoContratoColaborador)
                }
                options={TIPO_CONTRATO_OPTIONS}
                required
              />
              {(formData.tipo_contrato === 'fijo' || formData.tipo_contrato === 'obra_labor') && (
                <Input
                  label="Fecha Fin de Contrato"
                  type="date"
                  value={formData.fecha_fin_contrato || ''}
                  onChange={(e) => updateField('fecha_fin_contrato', e.target.value || null)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Salario Mensual"
                type="number"
                value={formData.salario}
                onChange={(e) => updateField('salario', e.target.value)}
                placeholder="1.300.000"
                required
              />
              <Input
                label="Horas Semanales"
                type="number"
                value={String(formData.horas_semanales || 48)}
                onChange={(e) => updateField('horas_semanales', parseInt(e.target.value) || 48)}
              />
            </div>

            <Switch
              label="Auxilio de Transporte"
              checked={formData.auxilio_transporte ?? true}
              onChange={(checked) => updateField('auxilio_transporte', checked)}
            />

            {/* Resumen */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Resumen</h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm space-y-1">
                <p>
                  <span className="text-gray-500">Nombre:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formData.primer_nombre} {formData.segundo_nombre} {formData.primer_apellido}{' '}
                    {formData.segundo_apellido}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Documento:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formData.tipo_documento} {formData.numero_identificacion}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Cargo:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {cargoOptions.find((c) => c.value === formData.cargo)?.label || '-'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Contrato:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {TIPO_CONTRATO_OPTIONS.find((c) => c.value === formData.tipo_contrato)?.label}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Salario:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${Number(formData.salario || 0).toLocaleString('es-CO')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Modal anidado: Crear Cargo Inline */}
      <CargoFormModal
        cargo={null}
        isOpen={showCargoModal}
        onClose={() => setShowCargoModal(false)}
        onSuccess={handleCargoCreated}
      />
    </BaseModal>
  );
};
