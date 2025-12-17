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

    // Obtener la URL base para el logo
    const logoUrl = `${window.location.origin}/logo-dark.png`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voucher ${voucher?.codigo_voucher || ''}</title>
          <style>
            @page {
              size: 55mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 9px;
              line-height: 1.3;
            }
            .voucher-container {
              width: 55mm;
              max-width: 55mm;
              padding: 2mm;
              box-sizing: border-box;
            }
            img { max-width: 100%; height: auto; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .mb-1 { margin-bottom: 1mm; }
            .mb-2 { margin-bottom: 2mm; }
            .mt-1 { margin-top: 1mm; }
            .mt-3 { margin-top: 3mm; }
            .mt-4 { margin-top: 4mm; }
            .pt-2 { padding-top: 2mm; }
            .pb-2 { padding-bottom: 2mm; }
            .py-1 { padding-top: 1mm; padding-bottom: 1mm; }
            .p-2 { padding: 2mm; }
            .border-b { border-bottom: 1px dashed #666; }
            .border-t { border-top: 1px solid #000; }
            .border-dashed { border-style: dashed; }
            .border-gray-400 { border-color: #9ca3af; }
            .bg-gray-100 { background-color: #f3f4f6; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 0.5mm 0; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .gap-2 { gap: 2mm; }
            .flex-1 { flex: 1; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="voucher-container">
            ${voucherContent.replace(/src="\/logo-dark\.png"/g, `src="${logoUrl}"`)}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 300);
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
