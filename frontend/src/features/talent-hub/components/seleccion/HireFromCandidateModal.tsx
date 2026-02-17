/**
 * HireFromCandidateModal - Modal para contratar candidato aprobado
 * Sprint 20: Wizard 2 pasos — datos contrato + revisión/Ley 2466
 *
 * Pre-llena desde el Candidato: nombre, documento, vacante, cargo.
 * Usa useContratarCandidato() que orquesta:
 *   Colaborador + HistorialContrato + Onboarding + GD + Notificación
 */
import { useState, useMemo } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Modal } from '@/components/common/Modal';
import { cn } from '@/utils/cn';
import {
  UserCheck,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { useContratarCandidato, useTiposContrato } from '../../hooks/useSeleccionContratacion';
import type { Candidato, ContratarCandidatoDTO } from '../../types';

interface Props {
  candidato: Candidato | null;
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { title: 'Datos del Contrato', description: 'Tipo, número, fechas y salario' },
  { title: 'Revisión y Ley 2466', description: 'Verificación y cumplimiento regulatorio' },
];

export const HireFromCandidateModal = ({ candidato, isOpen, onClose }: Props) => {
  const contratarMutation = useContratarCandidato();
  const { data: tiposContrato = [] } = useTiposContrato();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<{
    fecha_contratacion: string;
    salario_ofrecido: number;
    datos_contrato: {
      numero_contrato: string;
      tipo_contrato_id: number;
      fecha_inicio: string;
      fecha_fin: string | null;
      objeto_contrato: string;
      justificacion_tipo_contrato: string;
      generar_documento: boolean;
    };
  }>({
    fecha_contratacion: new Date().toISOString().split('T')[0],
    salario_ofrecido: 0,
    datos_contrato: {
      numero_contrato: '',
      tipo_contrato_id: 0,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: null,
      objeto_contrato: '',
      justificacion_tipo_contrato: '',
      generar_documento: true,
    },
  });

  // Reset cuando cambia candidato
  const resetForm = () => {
    setStep(0);
    setFormData({
      fecha_contratacion: new Date().toISOString().split('T')[0],
      salario_ofrecido: 0,
      datos_contrato: {
        numero_contrato: '',
        tipo_contrato_id: 0,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: null,
        objeto_contrato: '',
        justificacion_tipo_contrato: '',
        generar_documento: true,
      },
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = (field: string, value: unknown) => {
    if (field.startsWith('datos_contrato.')) {
      const subField = field.replace('datos_contrato.', '');
      setFormData((prev) => ({
        ...prev,
        datos_contrato: { ...prev.datos_contrato, [subField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Verificar si el tipo de contrato requiere duración
  const selectedTipo = useMemo(
    () => tiposContrato.find((t) => t.id === formData.datos_contrato.tipo_contrato_id),
    [tiposContrato, formData.datos_contrato.tipo_contrato_id]
  );
  const requiereDuracion = selectedTipo?.requiere_duracion ?? false;
  const requiereObjeto = selectedTipo?.requiere_objeto ?? false;
  const necesitaJustificacion = requiereDuracion;

  const canProceed = () => {
    if (step === 0) {
      return (
        formData.datos_contrato.tipo_contrato_id > 0 &&
        formData.datos_contrato.numero_contrato.trim() !== '' &&
        formData.datos_contrato.fecha_inicio !== '' &&
        formData.salario_ofrecido > 0
      );
    }
    if (step === 1 && necesitaJustificacion) {
      return formData.datos_contrato.justificacion_tipo_contrato.trim() !== '';
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidato) return;

    const dto: ContratarCandidatoDTO & { id: number } = {
      id: candidato.id,
      fecha_contratacion: formData.fecha_contratacion,
      salario_ofrecido: formData.salario_ofrecido,
      datos_contrato: {
        ...formData.datos_contrato,
        fecha_fin: formData.datos_contrato.fecha_fin || undefined,
        objeto_contrato: formData.datos_contrato.objeto_contrato || undefined,
        justificacion_tipo_contrato:
          formData.datos_contrato.justificacion_tipo_contrato || undefined,
      },
    };

    contratarMutation.mutate(dto, {
      onSuccess: () => handleClose(),
    });
  };

  const formatCOP = (value: number) =>
    value
      ? new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(value)
      : '-';

  if (!candidato) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Contratar Candidato" size="lg">
      {/* Candidato info card */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-800/40 rounded-full">
            <UserCheck size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {candidato.nombre_completo}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {candidato.tipo_documento} {candidato.numero_documento} • {candidato.vacante_titulo}
            </p>
          </div>
        </div>
      </div>

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
              {i < step ? <CheckCircle size={14} /> : i + 1}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Datos del Contrato */}
        {step === 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de contrato"
                value={formData.datos_contrato.tipo_contrato_id || ''}
                onChange={(e) =>
                  handleChange('datos_contrato.tipo_contrato_id', Number(e.target.value))
                }
                required
              >
                <option value="">Seleccionar tipo...</option>
                {tiposContrato.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Select>

              <Input
                label="Número de contrato"
                value={formData.datos_contrato.numero_contrato}
                onChange={(e) => handleChange('datos_contrato.numero_contrato', e.target.value)}
                placeholder="Ej: CTR-2026-001"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de contratación"
                type="date"
                value={formData.fecha_contratacion}
                onChange={(e) => handleChange('fecha_contratacion', e.target.value)}
                required
              />
              <Input
                label="Fecha de inicio"
                type="date"
                value={formData.datos_contrato.fecha_inicio}
                onChange={(e) => handleChange('datos_contrato.fecha_inicio', e.target.value)}
                required
              />
            </div>

            {requiereDuracion && (
              <Input
                label="Fecha de finalización"
                type="date"
                value={formData.datos_contrato.fecha_fin || ''}
                onChange={(e) => handleChange('datos_contrato.fecha_fin', e.target.value || null)}
              />
            )}

            <Input
              label="Salario ofrecido (COP)"
              type="number"
              value={formData.salario_ofrecido || ''}
              onChange={(e) => handleChange('salario_ofrecido', Number(e.target.value))}
              placeholder="1300000"
              min={0}
              required
            />

            {requiereObjeto && (
              <Textarea
                label="Objeto del contrato"
                value={formData.datos_contrato.objeto_contrato || ''}
                onChange={(e) => handleChange('datos_contrato.objeto_contrato', e.target.value)}
                placeholder="Descripción del objeto contractual..."
                rows={2}
              />
            )}
          </>
        )}

        {/* Step 2: Revisión y Ley 2466 */}
        {step === 1 && (
          <>
            {/* Alerta Ley 2466 */}
            {necesitaJustificacion && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  La Ley 2466 de 2025 establece requisitos adicionales para contratos a término fijo
                  y por obra o labor. Justifique la elección del tipo de contrato.
                </p>
              </div>
            )}

            {necesitaJustificacion ? (
              <Textarea
                label="Justificación del tipo de contrato"
                value={formData.datos_contrato.justificacion_tipo_contrato || ''}
                onChange={(e) =>
                  handleChange('datos_contrato.justificacion_tipo_contrato', e.target.value)
                }
                placeholder="Justifique por qué no se celebra contrato a término indefinido..."
                rows={3}
                required
              />
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <p className="text-xs text-green-700 dark:text-green-400">
                  Contrato a término indefinido: no requiere justificación especial según Ley
                  2466/2025.
                </p>
              </div>
            )}

            {/* Generar documento checkbox */}
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.datos_contrato.generar_documento}
                onChange={(e) => handleChange('datos_contrato.generar_documento', e.target.checked)}
                className="rounded border-gray-300"
              />
              Generar documento de contrato en Gestión Documental
            </label>

            {/* Resumen */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Resumen de contratación
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Candidato:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {candidato.nombre_completo}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Vacante:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {candidato.vacante_titulo}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Tipo contrato:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedTipo?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Número:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.datos_contrato.numero_contrato || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Salario:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCOP(formData.salario_ofrecido)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Inicio:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.datos_contrato.fecha_inicio
                      ? new Date(formData.datos_contrato.fecha_inicio).toLocaleDateString('es-CO')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Acciones */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {step > 0 && (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={14} className="mr-1" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Siguiente
                <ChevronRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!canProceed()}
                isLoading={contratarMutation.isPending}
              >
                <FileText size={16} className="mr-1" />
                Contratar
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
