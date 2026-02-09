/**
 * AprobacionModal - Confirmar aprobacion/rechazo de solicitud
 */

import { useState } from 'react';
import { Modal, Button } from '@/components/common';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esRechazo ? 'Rechazar solicitud' : 'Aprobar solicitud'}
    >
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {solicitud.colaborador_nombre}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {solicitud.tipo}: {solicitud.detalle}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Observaciones {esRechazo ? '(requerido)' : '(opcional)'}
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            placeholder={
              esRechazo
                ? 'Indique el motivo del rechazo...'
                : 'Observaciones adicionales...'
            }
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(observaciones)}
            disabled={isPending || (esRechazo && !observaciones.trim())}
            variant={esRechazo ? 'danger' : 'primary'}
          >
            {isPending
              ? 'Procesando...'
              : esRechazo
                ? 'Rechazar'
                : 'Aprobar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
