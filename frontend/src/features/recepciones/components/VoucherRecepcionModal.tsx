/**
 * Modal para visualizar e imprimir el voucher de recepción
 *
 * Muestra el voucher en formato 58mm para impresora térmica
 * con opción de imprimir
 */
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Printer, X } from 'lucide-react';
import { VoucherRecepcion } from './VoucherRecepcion';
import type { RecepcionDetallada } from '../types/recepcion.types';

interface VoucherRecepcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recepcion: RecepcionDetallada | null;
}

export const VoucherRecepcionModal = ({
  isOpen,
  onClose,
  recepcion,
}: VoucherRecepcionModalProps) => {
  const voucherRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: voucherRef,
    documentTitle: `Recepcion-${recepcion?.codigo_recepcion || 'voucher'}`,
    pageStyle: `
      @page {
        size: 58mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
      }
    `,
  });

  if (!isOpen || !recepcion) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Voucher de Recepción"
      size="sm"
    >
      <div className="flex flex-col items-center">
        {/* Preview del voucher */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-auto max-h-[60vh]">
          <VoucherRecepcion ref={voucherRef} recepcion={recepcion} />
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            leftIcon={<X className="h-4 w-4" />}
          >
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={() => handlePrint()}
            className="flex-1"
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  );
};
