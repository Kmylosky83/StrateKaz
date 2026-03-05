/**
 * CambiarEstadoDialog - Dialog para transicionar el estado de un candidato
 * Seleccion y Contratacion > Candidatos > Cambiar Estado
 *
 * Usa el design system: Modal, Button, Select, Textarea, Badge, Alert
 * - Muestra estado actual con badge
 * - Select para nuevo estado (filtra transiciones validas)
 * - Textarea para motivo/observaciones
 * - Campos adicionales si el estado es 'contratado' (fecha, salario)
 */
import { useState, useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Input } from '@/components/forms/Input';
import { Alert } from '@/components/common/Alert';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  useCambiarEstadoCandidato,
  useContratarCandidato,
} from '../../hooks/useSeleccionContratacion';
import type { Candidato, EstadoCandidato } from '../../types';
import { ESTADO_CANDIDATO_OPTIONS, ESTADO_CANDIDATO_BADGE } from '../../types';

// ============================================================================
// Transiciones validas
// ============================================================================

/**
 * Mapa de transiciones validas por estado actual.
 * Controla que estados puede alcanzar un candidato desde su estado actual.
 */
const TRANSICIONES_VALIDAS: Record<EstadoCandidato, EstadoCandidato[]> = {
  postulado: ['preseleccionado', 'rechazado'],
  preseleccionado: ['en_evaluacion', 'rechazado'],
  en_evaluacion: ['aprobado', 'rechazado'],
  aprobado: ['contratado', 'rechazado'],
  rechazado: [], // Estado final
  contratado: [], // Estado final
};

// ============================================================================
// Tipos
// ============================================================================

interface CambiarEstadoDialogProps {
  candidato: Candidato | null;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Componente
// ============================================================================

export const CambiarEstadoDialog = ({ candidato, isOpen, onClose }: CambiarEstadoDialogProps) => {
  const [nuevoEstado, setNuevoEstado] = useState<EstadoCandidato | ''>('');
  const [motivo, setMotivo] = useState('');
  const [fechaContratacion, setFechaContratacion] = useState('');
  const [salarioOfrecido, setSalarioOfrecido] = useState('');

  // Mutations
  const cambiarEstadoMutation = useCambiarEstadoCandidato();
  const contratarMutation = useContratarCandidato();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNuevoEstado('');
      setMotivo('');
      setFechaContratacion('');
      setSalarioOfrecido('');
    }
  }, [isOpen]);

  // Available states based on current state
  const estadosDisponibles = useMemo(() => {
    if (!candidato) return [];
    const transiciones = TRANSICIONES_VALIDAS[candidato.estado] || [];
    return ESTADO_CANDIDATO_OPTIONS.filter((opt) =>
      transiciones.includes(opt.value as EstadoCandidato)
    );
  }, [candidato]);

  const estadoSelectOptions = useMemo(
    () => [{ value: '', label: 'Seleccionar nuevo estado' }, ...estadosDisponibles],
    [estadosDisponibles]
  );

  // Submit
  const handleSubmit = async () => {
    if (!candidato || !nuevoEstado) return;

    try {
      if (nuevoEstado === 'contratado') {
        await contratarMutation.mutateAsync({
          id: candidato.id,
          fecha_contratacion: fechaContratacion || undefined,
          salario_ofrecido: salarioOfrecido ? Number(salarioOfrecido) : undefined,
        });
      } else {
        await cambiarEstadoMutation.mutateAsync({
          id: candidato.id,
          estado: nuevoEstado,
          motivo: motivo || undefined,
        });
      }
      onClose();
    } catch {
      // Error handled by mutation onError
    }
  };

  const isLoading = cambiarEstadoMutation.isPending || contratarMutation.isPending;
  const isContratar = nuevoEstado === 'contratado';
  const isRechazar = nuevoEstado === 'rechazado';
  const canSubmit = !!nuevoEstado && (isRechazar ? !!motivo.trim() : true);

  if (!candidato) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar Estado"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant={isRechazar ? 'danger' : 'primary'}
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading || estadosDisponibles.length === 0}
            isLoading={isLoading}
          >
            <Check size={16} className="mr-1" />
            {isContratar ? 'Contratar' : isRechazar ? 'Rechazar Candidato' : 'Cambiar Estado'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Current state */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {candidato.nombre_completo}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {candidato.vacante_titulo}
              </p>
            </div>
            <Badge variant={ESTADO_CANDIDATO_BADGE[candidato.estado]} size="sm">
              {candidato.estado_display}
            </Badge>
          </div>
        </div>

        {/* Transition arrow */}
        {nuevoEstado && (
          <div className="flex items-center justify-center gap-3 py-1">
            <Badge variant={ESTADO_CANDIDATO_BADGE[candidato.estado]} size="sm">
              {candidato.estado_display}
            </Badge>
            <ArrowRight size={16} className="text-gray-400" />
            <Badge variant={ESTADO_CANDIDATO_BADGE[nuevoEstado as EstadoCandidato]} size="sm">
              {ESTADO_CANDIDATO_OPTIONS.find((o) => o.value === nuevoEstado)?.label || nuevoEstado}
            </Badge>
          </div>
        )}

        {/* Estado select */}
        <Select
          label="Nuevo Estado"
          value={nuevoEstado}
          onChange={(e) => setNuevoEstado(e.target.value as EstadoCandidato | '')}
          options={estadoSelectOptions}
          required
        />

        {/* Alert for rechazado */}
        {isRechazar && (
          <Alert
            variant="warning"
            message="Al rechazar un candidato, se requiere indicar el motivo. Esta accion no se puede deshacer."
          />
        )}

        {/* Alert for contratado */}
        {isContratar && (
          <Alert
            variant="info"
            message="Al contratar, el candidato pasara a estado final. Puedes registrar la fecha y salario ofrecido."
          />
        )}

        {/* Motivo (required for rechazado, optional for others) */}
        {nuevoEstado && !isContratar && (
          <Textarea
            label={isRechazar ? 'Motivo de Rechazo' : 'Observaciones'}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={
              isRechazar
                ? 'Indica el motivo del rechazo...'
                : 'Observaciones sobre el cambio de estado (opcional)...'
            }
            rows={3}
            required={isRechazar}
          />
        )}

        {/* Contratacion fields */}
        {isContratar && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de Contratacion"
                type="date"
                value={fechaContratacion}
                onChange={(e) => setFechaContratacion(e.target.value)}
              />
              <Input
                label="Salario Ofrecido"
                type="number"
                value={salarioOfrecido}
                onChange={(e) => setSalarioOfrecido(e.target.value)}
                placeholder="$0"
              />
            </div>
            <Textarea
              label="Observaciones"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Observaciones sobre la contratacion (opcional)..."
              rows={2}
            />
          </div>
        )}

        {/* No transitions available */}
        {estadosDisponibles.length === 0 && (
          <Alert
            variant="info"
            message={`El candidato se encuentra en estado "${candidato.estado_display}" que es un estado final. No se puede cambiar.`}
          />
        )}
      </div>
    </BaseModal>
  );
};
