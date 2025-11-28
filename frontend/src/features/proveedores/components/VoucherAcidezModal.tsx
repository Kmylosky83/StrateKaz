import { useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { PruebaAcidez, CalidadSebo } from '@/types/proveedores.types';

// Configuración de colores para impresión (blanco/negro)
const CALIDAD_LABEL: Record<CalidadSebo, string> = {
  A: 'CALIDAD A - PREMIUM',
  B: 'CALIDAD B - ESTANDAR',
  B1: 'CALIDAD B1',
  B2: 'CALIDAD B2',
  B4: 'CALIDAD B4',
  C: 'CALIDAD C - BAJA',
};

interface VoucherAcidezModalProps {
  isOpen: boolean;
  onClose: () => void;
  prueba: PruebaAcidez | null;
}

export const VoucherAcidezModal = ({
  isOpen,
  onClose,
  prueba,
}: VoucherAcidezModalProps) => {
  const voucherRef = useRef<HTMLDivElement>(null);

  if (!prueba) return null;

  // Función para imprimir el voucher
  const handlePrint = () => {
    const printContent = voucherRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor habilite las ventanas emergentes para imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voucher ${prueba.codigo_voucher}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0 auto;
              padding: 5mm;
              background: white;
              color: black;
            }
            .voucher {
              width: 100%;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .company-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .voucher-title {
              font-size: 16px;
              font-weight: bold;
              margin: 8px 0;
            }
            .voucher-code {
              font-size: 18px;
              font-weight: bold;
              letter-spacing: 2px;
              background: #000;
              color: #fff;
              padding: 4px 8px;
              display: inline-block;
            }
            .section {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px dashed #ccc;
            }
            .section-title {
              font-weight: bold;
              font-size: 11px;
              text-transform: uppercase;
              margin-bottom: 6px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
            }
            .label {
              font-size: 11px;
            }
            .value {
              font-weight: bold;
              text-align: right;
            }
            .calidad-box {
              text-align: center;
              padding: 10px;
              border: 3px solid #000;
              margin: 10px 0;
            }
            .calidad-value {
              font-size: 24px;
              font-weight: bold;
            }
            .calidad-label {
              font-size: 10px;
              margin-top: 4px;
            }
            .total-section {
              text-align: center;
              background: #f0f0f0;
              padding: 10px;
              margin: 10px 0;
            }
            .total-label {
              font-size: 12px;
            }
            .total-value {
              font-size: 20px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px dashed #000;
            }
            .barcode {
              text-align: center;
              font-family: 'Libre Barcode 39', monospace;
              font-size: 36px;
              margin: 10px 0;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Esperar a que cargue el contenido antes de imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Función para descargar como imagen (usando html2canvas si está disponible)
  const handleDownload = async () => {
    const printContent = voucherRef.current;
    if (!printContent) return;

    // Crear una versión temporal para captura
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Courier New', monospace; width: 300px; padding: 10px; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `], { type: 'text/html' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voucher-${prueba.codigo_voucher}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fechaPrueba = new Date(prueba.fecha_prueba).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const fechaEmision = new Date().toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Voucher de Prueba de Acidez"
      size="sm"
    >
      <div className="space-y-4">
        {/* Preview del voucher */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
          <div
            ref={voucherRef}
            className="voucher font-mono text-sm"
            style={{ width: '280px', margin: '0 auto' }}
          >
            {/* Header */}
            <div className="header text-center border-b-2 border-dashed border-gray-800 pb-2 mb-2">
              <div className="company-name text-sm font-bold">
                GRASAS Y HUESOS DEL NORTE
              </div>
              <div className="text-xs text-gray-600">
                NIT: 900.XXX.XXX-X
              </div>
              <div className="voucher-title text-base font-bold mt-2">
                PRUEBA DE ACIDEZ
              </div>
              <div className="voucher-code bg-black text-white px-2 py-1 inline-block text-lg font-bold tracking-wider mt-1">
                {prueba.codigo_voucher}
              </div>
            </div>

            {/* Información del proveedor */}
            <div className="section py-2 border-b border-dashed border-gray-300">
              <div className="section-title text-xs font-bold uppercase mb-1">
                PROVEEDOR
              </div>
              <div className="text-sm font-bold">{prueba.proveedor_nombre}</div>
              {prueba.proveedor_documento && (
                <div className="text-xs text-gray-600">
                  Doc: {prueba.proveedor_documento}
                </div>
              )}
            </div>

            {/* Datos de la prueba */}
            <div className="section py-2 border-b border-dashed border-gray-300">
              <div className="section-title text-xs font-bold uppercase mb-1">
                DATOS DE LA PRUEBA
              </div>
              <div className="row flex justify-between my-1">
                <span className="text-xs">Fecha Prueba:</span>
                <span className="font-bold">{fechaPrueba}</span>
              </div>
              <div className="row flex justify-between my-1">
                <span className="text-xs">Valor Acidez:</span>
                <span className="font-bold text-lg">{parseFloat(prueba.valor_acidez).toFixed(2)}%</span>
              </div>
              <div className="row flex justify-between my-1">
                <span className="text-xs">Cantidad:</span>
                <span className="font-bold">{parseFloat(prueba.cantidad_kg).toLocaleString('es-CO')} kg</span>
              </div>
              {prueba.lote_numero && (
                <div className="row flex justify-between my-1">
                  <span className="text-xs">Lote:</span>
                  <span className="font-bold">{prueba.lote_numero}</span>
                </div>
              )}
            </div>

            {/* Calidad resultante */}
            <div className="calidad-box text-center border-4 border-black p-3 my-3">
              <div className="calidad-value text-3xl font-bold">
                {prueba.calidad_resultante}
              </div>
              <div className="calidad-label text-xs mt-1">
                {CALIDAD_LABEL[prueba.calidad_resultante]}
              </div>
              <div className="text-xs mt-1 font-mono">
                Código: {prueba.codigo_materia}
              </div>
            </div>

            {/* Información de precio */}
            {prueba.precio_kg_aplicado && (
              <div className="section py-2 border-b border-dashed border-gray-300">
                <div className="row flex justify-between my-1">
                  <span className="text-xs">Precio/kg:</span>
                  <span className="font-bold">
                    ${parseFloat(prueba.precio_kg_aplicado).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            )}

            {/* Total */}
            {prueba.valor_total && (
              <div className="total-section text-center bg-gray-100 p-3 my-3">
                <div className="total-label text-xs">VALOR TOTAL</div>
                <div className="total-value text-2xl font-bold">
                  ${parseFloat(prueba.valor_total).toLocaleString('es-CO')}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="footer text-center text-xs mt-4 pt-3 border-t-2 border-dashed border-gray-800">
              <div>Realizado por: {prueba.realizado_por_nombre}</div>
              <div className="mt-1">Emitido: {fechaEmision}</div>
              <div className="barcode text-2xl mt-2 font-mono">
                *{prueba.codigo_voucher}*
              </div>
              <div className="mt-2 text-gray-500">
                Este voucher es válido como comprobante
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Cerrar
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Descargar
            </Button>
            <Button type="button" variant="primary" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
