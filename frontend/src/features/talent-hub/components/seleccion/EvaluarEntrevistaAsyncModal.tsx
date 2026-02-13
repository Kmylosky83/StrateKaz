/**
 * EvaluarEntrevistaAsyncModal - Evaluar respuestas de entrevista asincronica
 * Muestra preguntas y respuestas del candidato + formulario de evaluacion
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Star, CheckCircle, MessageSquare, User, Clock } from 'lucide-react';
import {
  useEntrevistaAsyncDetail,
  useEvaluarEntrevistaAsync,
} from '../../hooks/useSeleccionContratacion';
import { RECOMENDACION_OPTIONS, ESTADO_ENTREVISTA_ASYNC_BADGE } from '../../types';
import type { RecomendacionEntrevista, PreguntaEntrevistaAsync } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entrevistaId: number;
}

export const EvaluarEntrevistaAsyncModal = ({ isOpen, onClose, entrevistaId }: Props) => {
  const { data: entrevista, isLoading } = useEntrevistaAsyncDetail(entrevistaId);
  const evaluarMutation = useEvaluarEntrevistaAsync();

  const isReadOnly = entrevista?.estado === 'evaluada';

  const [formData, setFormData] = useState({
    calificacion_general: '',
    recomendacion: '' as RecomendacionEntrevista | '',
    fortalezas_identificadas: '',
    aspectos_mejorar: '',
    observaciones_evaluador: '',
  });

  // Sync form data when entrevista loads
  if (
    entrevista &&
    formData.calificacion_general === '' &&
    entrevista.calificacion_general != null
  ) {
    setFormData({
      calificacion_general: String(entrevista.calificacion_general),
      recomendacion: entrevista.recomendacion || '',
      fortalezas_identificadas: entrevista.fortalezas_identificadas || '',
      aspectos_mejorar: entrevista.aspectos_mejorar || '',
      observaciones_evaluador: entrevista.observaciones_evaluador || '',
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    evaluarMutation.mutate(
      {
        id: entrevistaId,
        data: {
          calificacion_general: formData.calificacion_general
            ? Number(formData.calificacion_general)
            : undefined,
          recomendacion: formData.recomendacion || undefined,
          fortalezas_identificadas: formData.fortalezas_identificadas,
          aspectos_mejorar: formData.aspectos_mejorar,
          observaciones_evaluador: formData.observaciones_evaluador,
        },
      },
      { onSuccess: onClose }
    );
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Evaluando..." size="xl">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Modal>
    );
  }

  if (!entrevista) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Error" size="md">
        <p className="text-gray-500 py-8 text-center">Entrevista no encontrada.</p>
      </Modal>
    );
  }

  const preguntas: PreguntaEntrevistaAsync[] = entrevista.preguntas || [];
  const respuestas = entrevista.respuestas || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReadOnly ? 'Evaluacion de Entrevista' : 'Evaluar Respuestas'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{entrevista.titulo}</p>
              <p className="text-sm text-gray-500">
                {entrevista.candidato_nombre} - {entrevista.vacante_codigo}
              </p>
            </div>
            <Badge variant={ESTADO_ENTREVISTA_ASYNC_BADGE[entrevista.estado]}>
              {entrevista.estado_display}
            </Badge>
          </div>
          {entrevista.fecha_completado && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} />
              Completada: {new Date(entrevista.fecha_completado).toLocaleString('es-CO')}
            </p>
          )}
        </div>

        {/* Preguntas y respuestas */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <MessageSquare size={16} />
            Preguntas y Respuestas ({preguntas.length})
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {preguntas
              .sort((a, b) => a.orden - b.orden)
              .map((pregunta, index) => {
                const respuesta = respuestas[pregunta.id] || '';
                return (
                  <div
                    key={pregunta.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-500 shrink-0">{index + 1}.</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {pregunta.pregunta}
                          {pregunta.obligatoria && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        {pregunta.descripcion && (
                          <p className="text-xs text-gray-500 mt-0.5">{pregunta.descripcion}</p>
                        )}
                      </div>
                    </div>

                    {/* Respuesta del candidato */}
                    <div className="ml-6 mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center gap-1">
                        <User size={12} />
                        Respuesta del candidato:
                      </p>
                      {respuesta ? (
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {respuesta}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Sin respuesta</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Formulario de evaluacion */}
        <div className="border-t pt-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Star size={16} />
            Evaluacion
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Calificacion general (0-100)"
              type="number"
              value={formData.calificacion_general}
              onChange={(e) => handleChange('calificacion_general', e.target.value)}
              min={0}
              max={100}
              disabled={isReadOnly}
            />

            <Select
              label="Recomendacion"
              value={formData.recomendacion}
              onChange={(e) => handleChange('recomendacion', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="">Seleccionar...</option>
              {RECOMENDACION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Fortalezas identificadas"
            value={formData.fortalezas_identificadas}
            onChange={(e) => handleChange('fortalezas_identificadas', e.target.value)}
            placeholder="Principales fortalezas observadas en las respuestas..."
            rows={2}
            disabled={isReadOnly}
          />

          <Textarea
            label="Aspectos a mejorar"
            value={formData.aspectos_mejorar}
            onChange={(e) => handleChange('aspectos_mejorar', e.target.value)}
            placeholder="Areas de mejora identificadas..."
            rows={2}
            disabled={isReadOnly}
          />

          <Textarea
            label="Observaciones del evaluador"
            value={formData.observaciones_evaluador}
            onChange={(e) => handleChange('observaciones_evaluador', e.target.value)}
            placeholder="Notas adicionales sobre la evaluacion..."
            rows={2}
            disabled={isReadOnly}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>
            {isReadOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!isReadOnly && (
            <Button type="submit" isLoading={evaluarMutation.isPending}>
              <CheckCircle size={16} className="mr-1" />
              Guardar Evaluacion
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
