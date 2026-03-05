/**
 * RechazarHoraExtraModal - Modal para rechazar una solicitud de hora extra con motivo
 */
import { useState } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/forms/Textarea';

interface RechazarHoraExtraModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

export const RechazarHoraExtraModal = ({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: RechazarHoraExtraModalProps) => {
  const [motivo, setMotivo] = useState('');

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(motivo);
    setMotivo('');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Rechazar solicitud de horas extras"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirm} isLoading={isLoading}>
            Rechazar solicitud
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Indique el motivo del rechazo. El colaborador podrá ver esta justificación.
        </p>

        <Textarea
          label="Motivo del rechazo (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: Horas no autorizadas por el área, presupuesto agotado..."
          rows={3}
        />
      </div>
    </BaseModal>
  );
};
