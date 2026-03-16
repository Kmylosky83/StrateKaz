/**
 * RealizarEntrevistaModal - Registrar resultado de entrevista sincrona
 * Captura calificaciones, retroalimentacion y recomendacion
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { BaseModal } from '@/components/modals/BaseModal';
import { Badge } from '@/components/common/Badge';
import { CheckCircle } from 'lucide-react';
import { useRealizarEntrevista } from '@/features/talent-hub/hooks/useSeleccionContratacion';
import { RECOMENDACION_OPTIONS, ESTADO_ENTREVISTA_BADGE } from '@/features/talent-hub/types';
import type { Entrevista } from '@/features/talent-hub/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entrevista: Entrevista;
}

export const RealizarEntrevistaModal = ({ isOpen, onClose, entrevista }: Props) => {
  const isReadOnly = entrevista.estado === 'realizada';

  const [formData, setFormData] = useState({
    duracion_real_minutos: entrevista.duracion_real_minutos || entrevista.duracion_estimada_minutos,
    asistio_candidato: entrevista.asistio_candidato ?? true,
    calificacion_tecnica: entrevista.calificacion_tecnica || '',
    calificacion_competencias: entrevista.calificacion_competencias || '',
    calificacion_general: entrevista.calificacion_general || '',
    fortalezas_identificadas: entrevista.fortalezas_identificadas || '',
    aspectos_mejorar: entrevista.aspectos_mejorar || '',
    observaciones: entrevista.observaciones || '',
    recomendacion: entrevista.recomendacion || '',
  });

  const realizarMutation = useRealizarEntrevista();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    realizarMutation.mutate(
      {
        id: entrevista.id,
        data: {
          duracion_real_minutos: formData.duracion_real_minutos || undefined,
          asistio_candidato: formData.asistio_candidato,
          calificacion_tecnica: formData.calificacion_tecnica
            ? Number(formData.calificacion_tecnica)
            : undefined,
          calificacion_competencias: formData.calificacion_competencias
            ? Number(formData.calificacion_competencias)
            : undefined,
          calificacion_general: formData.calificacion_general
            ? Number(formData.calificacion_general)
            : undefined,
          fortalezas_identificadas: formData.fortalezas_identificadas,
          aspectos_mejorar: formData.aspectos_mejorar,
          observaciones: formData.observaciones,
          recomendacion: formData.recomendacion || undefined,
        },
      },
      { onSuccess: onClose }
    );
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isReadOnly ? 'Detalle de Entrevista' : 'Registrar Resultado'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {isReadOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!isReadOnly && (
            <Button
              type="submit"
              form="realizar-entrevista-form"
              isLoading={realizarMutation.isPending}
            >
              <CheckCircle size={16} className="mr-1" />
              Registrar Resultado
            </Button>
          )}
        </>
      }
    >
      <form id="realizar-entrevista-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Info header */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {entrevista.candidato_nombre}
              </p>
              <p className="text-sm text-gray-500">
                Entrevista #{entrevista.numero_entrevista} - {entrevista.tipo_display}
              </p>
            </div>
            <Badge variant={ESTADO_ENTREVISTA_BADGE[entrevista.estado]}>
              {entrevista.estado_display}
            </Badge>
          </div>
        </div>

        {/* Asistencia y duracion */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Candidato asistio"
            value={String(formData.asistio_candidato)}
            onChange={(e) => handleChange('asistio_candidato', e.target.value === 'true')}
            disabled={isReadOnly}
          >
            <option value="true">Si, asistio</option>
            <option value="false">No asistio</option>
          </Select>

          <Input
            label="Duracion real (min)"
            type="number"
            value={formData.duracion_real_minutos || ''}
            onChange={(e) => handleChange('duracion_real_minutos', Number(e.target.value))}
            min={1}
            disabled={isReadOnly}
          />
        </div>

        {/* Calificaciones */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Calif. Tecnica (0-100)"
            type="number"
            value={formData.calificacion_tecnica}
            onChange={(e) => handleChange('calificacion_tecnica', e.target.value)}
            min={0}
            max={100}
            disabled={isReadOnly}
          />
          <Input
            label="Calif. Competencias (0-100)"
            type="number"
            value={formData.calificacion_competencias}
            onChange={(e) => handleChange('calificacion_competencias', e.target.value)}
            min={0}
            max={100}
            disabled={isReadOnly}
          />
          <Input
            label="Calif. General (0-100)"
            type="number"
            value={formData.calificacion_general}
            onChange={(e) => handleChange('calificacion_general', e.target.value)}
            min={0}
            max={100}
            disabled={isReadOnly}
          />
        </div>

        {/* Retroalimentacion */}
        <Textarea
          label="Fortalezas identificadas"
          value={formData.fortalezas_identificadas}
          onChange={(e) => handleChange('fortalezas_identificadas', e.target.value)}
          placeholder="Principales fortalezas observadas..."
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
          label="Observaciones generales"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Observaciones adicionales..."
          rows={2}
          disabled={isReadOnly}
        />

        {/* Recomendacion */}
        <Select
          label="Recomendacion"
          value={formData.recomendacion}
          onChange={(e) => handleChange('recomendacion', e.target.value)}
          disabled={isReadOnly}
        >
          <option value="">Seleccionar recomendacion</option>
          {RECOMENDACION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </form>
    </BaseModal>
  );
};
