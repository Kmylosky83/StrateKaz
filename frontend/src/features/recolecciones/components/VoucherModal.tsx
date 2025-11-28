/**
 * Modal para Ver y Reimprimir Voucher de Recoleccion
 *
 * Caracteristicas:
 * - Muestra preview del voucher
 * - Boton para imprimir en impresora termica
 * - Opcion de descargar como imagen
 */
import { useRef } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Printer, Download, X } from 'lucide-react';
import { VoucherRecoleccion } from './VoucherRecoleccion';
import { useVoucherRecoleccion } from '../api/useRecolecciones';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoleccionId: number | null;
}

export const VoucherModal = ({ isOpen, onClose, recoleccionId }: VoucherModalProps) => {
  const voucherRef = useRef<HTMLDivElement>(null);
  const { data: voucher, isLoading, error } = useVoucherRecoleccion(recoleccionId);

  const handlePrint = () => {
    if (!voucherRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permita las ventanas emergentes para imprimir');
      return;
    }

    const voucherContent = voucherRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voucher ${voucher?.codigo_voucher || ''}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 12px;
            }
            .voucher-container {
              width: 80mm;
              max-width: 80mm;
              padding: 4mm;
              box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-sm { font-size: 14px; }
            .text-lg { font-size: 18px; }
            .text-xs { font-size: 10px; }
            .mb-1 { margin-bottom: 2mm; }
            .mb-2 { margin-bottom: 4mm; }
            .mt-4 { margin-top: 8mm; }
            .mt-8 { margin-top: 16mm; }
            .pt-4 { padding-top: 8mm; }
            .pb-2 { padding-bottom: 4mm; }
            .border-b { border-bottom: 1px dashed #333; }
            .border-t { border-top: 1px solid #000; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 1mm 0; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .flex-1 { flex: 1; }
            .w-24 { width: 20mm; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="voucher-container">
            ${voucherContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownload = async () => {
    // Por ahora solo imprimimos, la descarga como imagen requiere html2canvas
    handlePrint();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Voucher de Recoleccion" size="md">
      <div className="space-y-4">
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">Error al cargar el voucher</p>
          </div>
        )}

        {voucher && (
          <>
            {/* Preview del Voucher */}
            <div className="flex justify-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[60vh]">
              <VoucherRecoleccion ref={voucherRef} voucher={voucher} />
            </div>

            {/* Botones de Accion */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cerrar
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button variant="primary" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
