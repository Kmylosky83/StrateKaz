/**
 * EntrevistaAsyncFormModal - Crear entrevista asincronica por email
 * Wizard 2 pasos: 1) Info basica + candidato 2) Preguntas
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';
import { Plus, Trash2, ChevronRight, ChevronLeft, Send, ArrowUp, ArrowDown } from 'lucide-react';
import {
  useCreateEntrevistaAsync,
  useCandidatos,
  useVacantesActivasAbiertas,
} from '../../hooks/useSeleccionContratacion';
import { TIPO_PREGUNTA_ASYNC_OPTIONS } from '../../types';
import type { EntrevistaAsincronicaFormData, PreguntaEntrevistaAsync } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_PREGUNTA: PreguntaEntrevistaAsync = {
  id: '',
  pregunta: '',
  descripcion: '',
  tipo: 'texto_largo',
  obligatoria: true,
  opciones: [],
  orden: 0,
};

export const EntrevistaAsyncFormModal = ({ isOpen, onClose }: Props) => {
  const [step, setStep] = useState(1);
  const [vacanteFilter, setVacanteFilter] = useState('');

  const [formData, setFormData] = useState<EntrevistaAsincronicaFormData>({
    candidato: 0,
    titulo: '',
    instrucciones: '',
    preguntas: [{ ...EMPTY_PREGUNTA, id: 'pregunta_1', orden: 1, pregunta: '' }],
    dias_vencimiento: 7,
    enviar_email: true,
  });

  const createMutation = useCreateEntrevistaAsync();
  const { data: candidatosData } = useCandidatos({
    ...(vacanteFilter ? { vacante: vacanteFilter } : {}),
  });
  const { data: vacantes } = useVacantesActivasAbiertas();

  const candidatos = candidatosData?.results || [];

  // Handlers
  const handleChange = (field: keyof EntrevistaAsincronicaFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addPregunta = () => {
    const newOrder = formData.preguntas.length + 1;
    setFormData((prev) => ({
      ...prev,
      preguntas: [
        ...prev.preguntas,
        { ...EMPTY_PREGUNTA, id: `pregunta_${newOrder}`, orden: newOrder },
      ],
    }));
  };

  const removePregunta = (index: number) => {
    if (formData.preguntas.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      preguntas: prev.preguntas
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, orden: i + 1 })),
    }));
  };

  const updatePregunta = (index: number, field: keyof PreguntaEntrevistaAsync, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const movePregunta = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.preguntas.length) return;
    setFormData((prev) => {
      const preguntas = [...prev.preguntas];
      [preguntas[index], preguntas[newIndex]] = [preguntas[newIndex], preguntas[index]];
      return {
        ...prev,
        preguntas: preguntas.map((p, i) => ({ ...p, orden: i + 1 })),
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidato || !formData.titulo || formData.preguntas.length === 0) return;

    // Filter empty questions
    const cleanedPreguntas = formData.preguntas
      .filter((p) => p.pregunta.trim() !== '')
      .map((p, i) => ({
        ...p,
        id: p.id || `pregunta_${i + 1}`,
        orden: i + 1,
      }));

    if (cleanedPreguntas.length === 0) return;

    createMutation.mutate({ ...formData, preguntas: cleanedPreguntas }, { onSuccess: onClose });
  };

  const isStep1Valid = formData.candidato > 0 && formData.titulo.trim() !== '';
  const isStep2Valid = formData.preguntas.some((p) => p.pregunta.trim() !== '');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Entrevista Asincronica" size="xl">
      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step >= s
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
              )}
            >
              {s}
            </div>
            <span
              className={cn(
                'text-sm',
                step >= s ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'
              )}
            >
              {s === 1 ? 'Datos basicos' : 'Preguntas'}
            </span>
            {s < 2 && <ChevronRight size={16} className="text-gray-400 mx-2" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Datos basicos */}
        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Titulo de la entrevista *"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Ej: Entrevista tecnica, Entrevista de competencias"
              required
            />

            <Textarea
              label="Instrucciones para el candidato"
              value={formData.instrucciones || ''}
              onChange={(e) => handleChange('instrucciones', e.target.value)}
              placeholder="Instrucciones que vera el candidato antes de responder..."
              rows={3}
            />

            {/* Filtro por vacante */}
            <Select
              label="Filtrar candidatos por vacante"
              value={vacanteFilter}
              onChange={(e) => {
                setVacanteFilter(e.target.value);
                handleChange('candidato', 0);
              }}
            >
              <option value="">Todas las vacantes</option>
              {(vacantes || []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.codigo_vacante} - {v.titulo}
                </option>
              ))}
            </Select>

            <Select
              label="Candidato *"
              value={formData.candidato || ''}
              onChange={(e) => handleChange('candidato', Number(e.target.value))}
              required
            >
              <option value="">Seleccionar candidato</option>
              {candidatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_completo} - {c.email}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Dias para responder"
                type="number"
                value={formData.dias_vencimiento || 7}
                onChange={(e) => handleChange('dias_vencimiento', Number(e.target.value))}
                min={1}
                max={90}
              />

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enviar_email ?? true}
                    onChange={(e) => handleChange('enviar_email', e.target.checked)}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Enviar email al candidato
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preguntas */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configura las preguntas de la entrevista ({formData.preguntas.length})
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={addPregunta}>
                <Plus size={16} className="mr-1" />
                Agregar Pregunta
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {formData.preguntas.map((pregunta, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                      <Badge variant="info" className="text-xs">
                        {TIPO_PREGUNTA_ASYNC_OPTIONS.find((o) => o.value === pregunta.tipo)
                          ?.label || pregunta.tipo}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => movePregunta(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => movePregunta(index, 'down')}
                        disabled={index === formData.preguntas.length - 1}
                      >
                        <ArrowDown size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePregunta(index)}
                        disabled={formData.preguntas.length <= 1}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={pregunta.pregunta}
                    onChange={(e) => updatePregunta(index, 'pregunta', e.target.value)}
                    placeholder="Escribe la pregunta..."
                    rows={2}
                  />

                  <Input
                    value={pregunta.descripcion || ''}
                    onChange={(e) => updatePregunta(index, 'descripcion', e.target.value)}
                    placeholder="Descripcion o contexto adicional (opcional)"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={pregunta.tipo}
                      onChange={(e) => updatePregunta(index, 'tipo', e.target.value)}
                    >
                      {TIPO_PREGUNTA_ASYNC_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pregunta.obligatoria}
                        onChange={(e) => updatePregunta(index, 'obligatoria', e.target.checked)}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Obligatoria</span>
                    </label>
                  </div>

                  {/* Opciones para opcion_multiple */}
                  {pregunta.tipo === 'opcion_multiple' && (
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500">Opciones (una por linea)</label>
                      <Textarea
                        value={(pregunta.opciones || []).join('\n')}
                        onChange={(e) =>
                          updatePregunta(
                            index,
                            'opciones',
                            e.target.value.split('\n').filter((o) => o.trim())
                          )
                        }
                        placeholder="Opcion 1&#10;Opcion 2&#10;Opcion 3"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Escala config */}
                  {pregunta.tipo === 'escala' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Minimo"
                        type="number"
                        value={pregunta.escala_min ?? 1}
                        onChange={(e) =>
                          updatePregunta(index, 'escala_min', Number(e.target.value))
                        }
                      />
                      <Input
                        label="Maximo"
                        type="number"
                        value={pregunta.escala_max ?? 10}
                        onChange={(e) =>
                          updatePregunta(index, 'escala_max', Number(e.target.value))
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={16} className="mr-1" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            {step < 2 ? (
              <Button type="button" onClick={() => setStep(2)} disabled={!isStep1Valid}>
                Siguiente
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={!isStep2Valid} isLoading={createMutation.isPending}>
                <Send size={16} className="mr-1" />
                Crear y Enviar
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
