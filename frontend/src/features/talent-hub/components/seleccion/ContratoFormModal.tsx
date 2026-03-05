/**
 * ContratoFormModal - Formulario para crear contratos (Ley 2466/2025)
 * Wizard 2 pasos: datos basicos + configuracion avanzada
 *
 * Cumplimiento Ley 2466/2025:
 * - Justificacion obligatoria si no es indefinido
 * - Control de renovaciones
 * - Registro de preaviso
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { BaseModal } from '@/components/modals/BaseModal';
import { cn } from '@/utils/cn';
import { FileText, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useCreateHistorialContrato, useTiposContrato } from '../../hooks/useSeleccionContratacion';
import { useColaboradoresActivos } from '../../hooks/useColaboradores';
import { TIPO_MOVIMIENTO_OPTIONS } from '../../types';
import type { HistorialContratoFormData, TipoMovimientoContrato } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { title: 'Datos del Contrato', description: 'Informacion basica' },
  { title: 'Ley 2466/2025', description: 'Configuracion regulatoria' },
];

export const ContratoFormModal = ({ isOpen, onClose }: Props) => {
  const createMutation = useCreateHistorialContrato();
  const { data: tiposContrato = [] } = useTiposContrato();
  const { data: colaboradoresData } = useColaboradoresActivos();

  const colaboradores = Array.isArray(colaboradoresData)
    ? colaboradoresData
    : colaboradoresData?.results || [];

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<HistorialContratoFormData>({
    colaborador: 0,
    tipo_contrato: 0,
    numero_contrato: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: null,
    salario_pactado: 0,
    objeto_contrato: '',
    tipo_movimiento: 'contrato_inicial',
    contrato_padre: null,
    numero_renovacion: 0,
    justificacion_tipo_contrato: '',
    fecha_preaviso_terminacion: null,
    preaviso_entregado: false,
  });

  const handleChange = (field: keyof HistorialContratoFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Verificar si el tipo de contrato requiere duracion (no es indefinido)
  const selectedTipoContrato = tiposContrato.find((t) => t.id === formData.tipo_contrato);
  const requiereDuracion = selectedTipoContrato?.requiere_duracion ?? false;
  const requiereObjeto = selectedTipoContrato?.requiere_objeto ?? false;
  const necesitaJustificacion = requiereDuracion; // Ley 2466: justificar si no es indefinido

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: HistorialContratoFormData = {
      ...formData,
      fecha_fin: formData.fecha_fin || undefined,
      objeto_contrato: formData.objeto_contrato || undefined,
      contrato_padre: formData.contrato_padre || undefined,
      justificacion_tipo_contrato: formData.justificacion_tipo_contrato || undefined,
      fecha_preaviso_terminacion: formData.fecha_preaviso_terminacion || undefined,
    };

    createMutation.mutate(submitData, { onSuccess: onClose });
  };

  const canProceed = () => {
    if (step === 0) {
      return (
        formData.colaborador > 0 &&
        formData.tipo_contrato > 0 &&
        formData.numero_contrato.trim() !== '' &&
        formData.fecha_inicio !== '' &&
        formData.salario_pactado > 0
      );
    }
    return true;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Contrato"
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          <div>
            {step > 0 && (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={14} className="mr-1" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Siguiente
                <ChevronRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button type="submit" form="contrato-form" isLoading={createMutation.isPending}>
                <FileText size={16} className="mr-1" />
                Registrar Contrato
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 px-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                i === step
                  ? 'bg-primary-500 text-white'
                  : i < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              )}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-xs font-medium truncate',
                  i === step ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'
                )}
              >
                {s.title}
              </p>
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-300 shrink-0" />}
          </div>
        ))}
      </div>

      <form id="contrato-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Datos del Contrato */}
        {step === 0 && (
          <>
            <Select
              label="Colaborador"
              value={formData.colaborador || ''}
              onChange={(e) => handleChange('colaborador', Number(e.target.value))}
              required
            >
              <option value="">Seleccionar colaborador...</option>
              {colaboradores.map(
                (c: {
                  id: number;
                  nombre_completo?: string;
                  primer_nombre?: string;
                  primer_apellido?: string;
                  numero_identificacion?: string;
                }) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_completo || `${c.primer_nombre} ${c.primer_apellido}`} —{' '}
                    {c.numero_identificacion}
                  </option>
                )
              )}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de contrato"
                value={formData.tipo_contrato || ''}
                onChange={(e) => handleChange('tipo_contrato', Number(e.target.value))}
                required
              >
                <option value="">Seleccionar tipo...</option>
                {tiposContrato.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Select>

              <Select
                label="Tipo de movimiento"
                value={formData.tipo_movimiento}
                onChange={(e) =>
                  handleChange('tipo_movimiento', e.target.value as TipoMovimientoContrato)
                }
                required
              >
                {TIPO_MOVIMIENTO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Numero de contrato"
              value={formData.numero_contrato}
              onChange={(e) => handleChange('numero_contrato', e.target.value)}
              placeholder="Ej: CTR-2026-001"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => handleChange('fecha_inicio', e.target.value)}
                required
              />

              {requiereDuracion && (
                <Input
                  label="Fecha de finalizacion"
                  type="date"
                  value={formData.fecha_fin || ''}
                  onChange={(e) => handleChange('fecha_fin', e.target.value || null)}
                />
              )}
            </div>

            <Input
              label="Salario pactado (COP)"
              type="number"
              value={formData.salario_pactado || ''}
              onChange={(e) => handleChange('salario_pactado', Number(e.target.value))}
              placeholder="1300000"
              min={0}
              required
            />

            {requiereObjeto && (
              <Textarea
                label="Objeto del contrato"
                value={formData.objeto_contrato || ''}
                onChange={(e) => handleChange('objeto_contrato', e.target.value)}
                placeholder="Descripcion del objeto contractual..."
                rows={2}
              />
            )}

            {formData.tipo_movimiento !== 'contrato_inicial' && (
              <Input
                label="Numero de renovacion"
                type="number"
                value={formData.numero_renovacion || ''}
                onChange={(e) => handleChange('numero_renovacion', Number(e.target.value))}
                min={0}
              />
            )}
          </>
        )}

        {/* Step 2: Ley 2466/2025 */}
        {step === 1 && (
          <>
            {/* Alerta Ley 2466 */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                La Ley 2466 de 2025 establece requisitos adicionales para contratos a termino fijo y
                por obra o labor.
              </p>
            </div>

            {necesitaJustificacion && (
              <Textarea
                label="Justificacion del tipo de contrato"
                value={formData.justificacion_tipo_contrato || ''}
                onChange={(e) => handleChange('justificacion_tipo_contrato', e.target.value)}
                placeholder="Justifique por que no se celebra contrato a termino indefinido..."
                rows={3}
                required={necesitaJustificacion}
              />
            )}

            {!necesitaJustificacion && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <p className="text-xs text-green-700 dark:text-green-400">
                  Contrato a termino indefinido: no requiere justificacion especial segun Ley
                  2466/2025.
                </p>
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Preaviso de Terminacion
              </h4>

              <Checkbox
                label="Preaviso entregado"
                checked={formData.preaviso_entregado || false}
                onChange={(e) =>
                  handleChange('preaviso_entregado', (e.target as HTMLInputElement).checked)
                }
              />

              {formData.preaviso_entregado && (
                <Input
                  label="Fecha de entrega del preaviso"
                  type="date"
                  value={formData.fecha_preaviso_terminacion || ''}
                  onChange={(e) =>
                    handleChange('fecha_preaviso_terminacion', e.target.value || null)
                  }
                />
              )}
            </div>

            {/* Resumen */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resumen</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Tipo contrato:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedTipoContrato?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Movimiento:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {
                      TIPO_MOVIMIENTO_OPTIONS.find((o) => o.value === formData.tipo_movimiento)
                        ?.label
                    }
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Numero:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.numero_contrato || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Salario:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.salario_pactado
                      ? new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                        }).format(formData.salario_pactado)
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </form>
    </BaseModal>
  );
};
