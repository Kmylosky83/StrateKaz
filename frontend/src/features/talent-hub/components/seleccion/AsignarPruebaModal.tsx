/**
 * AsignarPruebaModal - Modal para asignar una prueba dinamica a un candidato
 * Seleccion y Contratacion > Pruebas > Asignar Prueba
 *
 * Usa design system: Modal, Button, Select, Input, Textarea, Alert, Badge
 * - Seleccionar plantilla de prueba activa
 * - Seleccionar candidato
 * - Opcionalmente vincular a vacante
 * - Configurar dias de vencimiento
 * - Toggle envio de email automatico
 */
import { useState, useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { Spinner } from '@/components/common/Spinner';
import { Send, ClipboardCheck, Calendar } from 'lucide-react';
import {
  usePlantillasPruebaActivas,
  useCandidatos,
  useVacantesActivasAbiertas,
  useCreateAsignacionPrueba,
} from '../../hooks/useSeleccionContratacion';
import type { AsignacionPruebaFormData } from '../../types';

// ============================================================================
// Tipos
// ============================================================================

interface AsignarPruebaModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-seleccionar candidato (opcional, desde CandidatoDetailDrawer) */
  candidatoId?: number;
}

// ============================================================================
// Componente
// ============================================================================

export const AsignarPruebaModal = ({ isOpen, onClose, candidatoId }: AsignarPruebaModalProps) => {
  const [plantillaId, setPlantillaId] = useState<number | ''>('');
  const [candidato, setCandidato] = useState<number | ''>('');
  const [vacanteId, setVacanteId] = useState<number | ''>('');
  const [diasVencimiento, setDiasVencimiento] = useState('7');
  const [enviarEmail, setEnviarEmail] = useState(true);
  const [observaciones, setObservaciones] = useState('');

  // Queries
  const { data: plantillas, isLoading: isLoadingPlantillas } = usePlantillasPruebaActivas();
  const { data: candidatosData, isLoading: isLoadingCandidatos } = useCandidatos({
    page_size: 200,
  });
  const { data: vacantes } = useVacantesActivasAbiertas();

  // Mutation
  const createMutation = useCreateAsignacionPrueba();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPlantillaId('');
      setCandidato(candidatoId || '');
      setVacanteId('');
      setDiasVencimiento('7');
      setEnviarEmail(true);
      setObservaciones('');
    }
  }, [isOpen, candidatoId]);

  // Options
  const plantillaOptions = useMemo(() => {
    const opts = (plantillas || []).map((p) => ({
      value: String(p.id),
      label: `${p.nombre} (${p.total_campos} preguntas)`,
    }));
    return [{ value: '', label: 'Seleccionar plantilla...' }, ...opts];
  }, [plantillas]);

  const candidatoOptions = useMemo(() => {
    const candidatosList = candidatosData?.results || [];
    const opts = candidatosList.map((c) => ({
      value: String(c.id),
      label: `${c.nombre_completo} - ${c.vacante_titulo}`,
    }));
    return [{ value: '', label: 'Seleccionar candidato...' }, ...opts];
  }, [candidatosData]);

  const vacanteOptions = useMemo(() => {
    const vacantesList = vacantes?.results || [];
    const opts = vacantesList.map((v) => ({
      value: String(v.id),
      label: `${v.codigo_vacante} - ${v.titulo}`,
    }));
    return [{ value: '', label: 'Sin vincular a vacante' }, ...opts];
  }, [vacantes]);

  // Selected plantilla info
  const selectedPlantilla = useMemo(
    () => (plantillas || []).find((p) => p.id === Number(plantillaId)),
    [plantillas, plantillaId]
  );

  // Submit
  const handleSubmit = async () => {
    if (!plantillaId || !candidato) return;

    const data: AsignacionPruebaFormData = {
      plantilla: Number(plantillaId),
      candidato: Number(candidato),
      vacante: vacanteId ? Number(vacanteId) : undefined,
      observaciones: observaciones || undefined,
      dias_vencimiento: Number(diasVencimiento) || 7,
      enviar_email: enviarEmail,
    };

    try {
      await createMutation.mutateAsync(data);
      onClose();
    } catch {
      // Error handled by mutation onError
    }
  };

  const canSubmit = !!plantillaId && !!candidato;
  const isLoading = createMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Prueba"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            isLoading={isLoading}
          >
            <Send size={16} className="mr-1" />
            Asignar Prueba
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Info */}
        <Alert
          variant="info"
          message="Selecciona una plantilla de prueba y el candidato. Se generara un link unico para que responda."
        />

        {/* Plantilla select */}
        {isLoadingPlantillas ? (
          <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
            <Spinner size="sm" />
            Cargando plantillas...
          </div>
        ) : (
          <Select
            label="Plantilla de Prueba"
            value={plantillaId ? String(plantillaId) : ''}
            onChange={(e) => setPlantillaId(e.target.value ? Number(e.target.value) : '')}
            options={plantillaOptions}
            required
          />
        )}

        {/* Selected plantilla info card */}
        {selectedPlantilla && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedPlantilla.nombre}
              </p>
              <Badge
                variant={
                  selectedPlantilla.tipo_scoring === 'automatico'
                    ? 'success'
                    : selectedPlantilla.tipo_scoring === 'mixto'
                      ? 'warning'
                      : 'gray'
                }
                size="sm"
              >
                {selectedPlantilla.tipo_scoring}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <ClipboardCheck size={12} />
                {selectedPlantilla.total_campos} preguntas
              </span>
              {selectedPlantilla.duracion_estimada_minutos > 0 && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />~{selectedPlantilla.duracion_estimada_minutos} min
                </span>
              )}
              {selectedPlantilla.puntaje_maximo > 0 && (
                <span>Max: {selectedPlantilla.puntaje_maximo} pts</span>
              )}
            </div>
          </div>
        )}

        {/* Candidato select */}
        {isLoadingCandidatos ? (
          <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
            <Spinner size="sm" />
            Cargando candidatos...
          </div>
        ) : (
          <Select
            label="Candidato"
            value={candidato ? String(candidato) : ''}
            onChange={(e) => setCandidato(e.target.value ? Number(e.target.value) : '')}
            options={candidatoOptions}
            required
          />
        )}

        {/* Vacante (optional) */}
        <Select
          label="Vincular a Vacante (opcional)"
          value={vacanteId ? String(vacanteId) : ''}
          onChange={(e) => setVacanteId(e.target.value ? Number(e.target.value) : '')}
          options={vacanteOptions}
        />

        {/* Config row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Dias para responder"
            type="number"
            value={diasVencimiento}
            onChange={(e) => setDiasVencimiento(e.target.value)}
            min={1}
            max={90}
          />
          <div className="flex flex-col justify-end pb-2">
            <Checkbox
              label="Enviar email al candidato"
              checked={enviarEmail}
              onChange={(e) => setEnviarEmail((e.target as HTMLInputElement).checked)}
            />
          </div>
        </div>

        {/* Observaciones */}
        <Textarea
          label="Observaciones (opcional)"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Instrucciones adicionales para el candidato..."
          rows={2}
        />
      </div>
    </BaseModal>
  );
};
