/**
 * AprobacionModal - Confirmar aprobación/rechazo de solicitud
 *
 * Usa BaseModal (Framer Motion) + Textarea del Design System.
 */

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/common';
import { BaseModal } from '@/components/modals/BaseModal';
import { Textarea } from '@/components/forms/Textarea';
import type { AprobacionPendiente } from '../types';

interface AprobacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: AprobacionPendiente;
  accion: 'aprobar' | 'rechazar';
  onConfirm: (observaciones: string) => void;
  isPending: boolean;
}

export function AprobacionModal({
  isOpen,
  onClose,
  solicitud,
  accion,
  onConfirm,
  isPending,
}: AprobacionModalProps) {
  const [observaciones, setObservaciones] = useState('');

  const esRechazo = accion === 'rechazar';

  const handleClose = () => {
    setObservaciones('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={esRechazo ? 'Rechazar solicitud' : 'Aprobar solicitud'}
      subtitle={`${solicitud.colaborador_nombre} — ${solicitud.tipo}: ${solicitud.detalle}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(observaciones)}
            disabled={isPending || (esRechazo && !observaciones.trim())}
            variant={esRechazo ? 'danger' : 'primary'}
            leftIcon={
              esRechazo ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />
            }
          >
            {isPending ? 'Procesando...' : esRechazo ? 'Rechazar' : 'Aprobar'}
          </Button>
        </>
      }
    >
      <Textarea
        label={`Observaciones ${esRechazo ? '(requerido)' : '(opcional)'}`}
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        rows={3}
        resize="none"
        placeholder={
          esRechazo ? 'Indique el motivo del rechazo...' : 'Observaciones adicionales...'
        }
      />
    </BaseModal>
  );
}
