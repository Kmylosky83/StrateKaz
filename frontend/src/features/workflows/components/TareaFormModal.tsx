/**
 * TareaFormModal - Modal para resolver/completar/rechazar tareas activas
 *
 * Muestra info de la tarea (read-only) + formulario de acción.
 * Campos condicionales según tipo_tarea:
 *  - APROBACION: decision (Aprobar/Rechazar/Devolver)
 *  - FORMULARIO: formulario_data (JSON)
 *  - Todos: observaciones
 */
import { useState, useEffect } from 'react';
import { Clock, User, GitBranch, CheckCircle2 } from 'lucide-react';
import { Modal, Card, Badge, Button, Spinner, StatusBadge } from '@/components/common';
import { Select, Textarea } from '@/components/forms';
import { useCompletarTarea, useRechazarTarea } from '../hooks/useWorkflows';
import type { TareaActiva, TipoTarea } from '../types/workflow.types';

interface TareaFormModalProps {
  tarea: TareaActiva | null;
  isOpen: boolean;
  onClose: () => void;
}

type DecisionType = 'APROBAR' | 'RECHAZAR' | 'DEVOLVER';

interface FormState {
  decision: DecisionType | '';
  formulario_data_text: string;
  observaciones: string;
  motivo_rechazo: string;
}

const INITIAL_FORM: FormState = {
  decision: '',
  formulario_data_text: '',
  observaciones: '',
  motivo_rechazo: '',
};

const DECISION_OPTIONS = [
  { value: 'APROBAR', label: 'Aprobar' },
  { value: 'RECHAZAR', label: 'Rechazar' },
  { value: 'DEVOLVER', label: 'Devolver para corrección' },
];

const TIPO_TAREA_LABELS: Record<TipoTarea, string> = {
  APROBACION: 'Aprobación',
  REVISION: 'Revisión',
  FORMULARIO: 'Formulario',
  NOTIFICACION: 'Notificación',
  FIRMA: 'Firma',
  SISTEMA: 'Sistema',
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TareaFormModal({ tarea, isOpen, onClose }: TareaFormModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

  const completarMutation = useCompletarTarea();
  const rechazarMutation = useRechazarTarea();

  const isLoading = completarMutation.isPending || rechazarMutation.isPending;

  useEffect(() => {
    if (isOpen && tarea) {
      setFormData({
        ...INITIAL_FORM,
        formulario_data_text: tarea.formulario_data
          ? JSON.stringify(tarea.formulario_data, null, 2)
          : '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [tarea, isOpen]);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarea) return;

    // Si es rechazo explícito (en aprobación tipo)
    if (formData.decision === 'RECHAZAR') {
      rechazarMutation.mutate(
        {
          id: tarea.id,
          data: {
            motivo_rechazo: formData.motivo_rechazo || formData.observaciones || 'Rechazado',
            observaciones: formData.observaciones || undefined,
          },
        },
        { onSuccess: onClose }
      );
      return;
    }

    // Completar tarea (aprobar, devolver, o completar genérica)
    const payload: Record<string, unknown> = {};

    if (formData.observaciones.trim()) {
      payload.observaciones = formData.observaciones.trim();
    }

    if (tarea.tipo_tarea === 'APROBACION' && formData.decision) {
      payload.decision = formData.decision;
    }

    if (tarea.tipo_tarea === 'FORMULARIO' && formData.formulario_data_text.trim()) {
      try {
        payload.formulario_data = JSON.parse(formData.formulario_data_text);
      } catch {
        // Si no es JSON válido, se envía como texto en observaciones
        payload.observaciones = formData.formulario_data_text;
      }
    }

    completarMutation.mutate({ id: tarea.id, data: payload }, { onSuccess: onClose });
  };

  if (!tarea) return null;

  const isAprobacion = tarea.tipo_tarea === 'APROBACION';
  const isFormulario = tarea.tipo_tarea === 'FORMULARIO';
  const isRechazando = formData.decision === 'RECHAZAR';

  // Validación: aprobación requiere decisión, formulario requiere datos, resto requiere observaciones
  const canSubmit = (() => {
    if (isAprobacion && !formData.decision) return false;
    if (isRechazando && !formData.motivo_rechazo.trim()) return false;
    if (!isAprobacion && !isFormulario && !formData.observaciones.trim()) return false;
    return true;
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resolver Tarea" size="lg">
      {/* Info de la tarea (read-only) */}
      <Card className="mb-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {tarea.nombre_tarea}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                {tarea.codigo_tarea}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={tarea.estado} />
              <StatusBadge status={tarea.tipo_tarea} label={TIPO_TAREA_LABELS[tarea.tipo_tarea]} />
            </div>
          </div>

          {tarea.descripcion && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{tarea.descripcion}</p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            {tarea.instancia_detail && (
              <span className="flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5" />
                {tarea.instancia_detail.titulo}
              </span>
            )}
            {tarea.asignado_a_detail && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {tarea.asignado_a_detail.first_name} {tarea.asignado_a_detail.last_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Creada: {formatDate(tarea.fecha_creacion)}
            </span>
            {tarea.fecha_vencimiento && (
              <span
                className={`flex items-center gap-1 ${tarea.esta_vencida ? 'text-red-500 font-medium' : ''}`}
              >
                <Clock className="h-3.5 w-3.5" />
                Vence: {formatDate(tarea.fecha_vencimiento)}
                {tarea.esta_vencida && (
                  <Badge variant="red" size="sm">
                    Vencida
                  </Badge>
                )}
              </span>
            )}
          </div>

          {tarea.instancia_detail && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 dark:text-gray-400">Prioridad:</span>
              <StatusBadge status={tarea.instancia_detail.prioridad} preset="prioridad" />
            </div>
          )}
        </div>
      </Card>

      {/* Formulario de acción */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Decisión (solo para tipo APROBACION) */}
        {isAprobacion && (
          <Select
            label="Decisión *"
            value={formData.decision}
            onChange={(e) => handleChange('decision', e.target.value)}
            required
          >
            <option value="">Seleccione una decisión...</option>
            {DECISION_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>
        )}

        {/* Motivo de rechazo (solo si decisión es RECHAZAR) */}
        {isAprobacion && isRechazando && (
          <Textarea
            label="Motivo del Rechazo *"
            value={formData.motivo_rechazo}
            onChange={(e) => handleChange('motivo_rechazo', e.target.value)}
            placeholder="Explique el motivo del rechazo..."
            rows={3}
            required
          />
        )}

        {/* Datos de formulario (solo para tipo FORMULARIO) */}
        {isFormulario && (
          <Textarea
            label="Datos del Formulario"
            value={formData.formulario_data_text}
            onChange={(e) => handleChange('formulario_data_text', e.target.value)}
            placeholder='{"campo1": "valor1", "campo2": "valor2"}'
            rows={6}
            helperText="Ingrese los datos en formato JSON"
          />
        )}

        {/* Observaciones */}
        <Textarea
          label={isAprobacion ? 'Observaciones' : 'Observaciones *'}
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Agregue comentarios u observaciones sobre la resolución de la tarea..."
          rows={3}
          required={!isAprobacion}
        />

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          {isAprobacion && isRechazando ? (
            <Button type="submit" variant="danger" disabled={isLoading || !canSubmit}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Rechazando...
                </>
              ) : (
                'Rechazar Tarea'
              )}
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading || !canSubmit}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {isAprobacion && formData.decision === 'APROBAR'
                    ? 'Aprobar'
                    : isAprobacion && formData.decision === 'DEVOLVER'
                      ? 'Devolver'
                      : 'Completar Tarea'}
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
