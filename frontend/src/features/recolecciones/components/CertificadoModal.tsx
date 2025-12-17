/**
 * Modal para Generar Certificado de Recoleccion
 *
 * Permite seleccionar el periodo (mensual, trimestral, semestral, anual, personalizado)
 * y genera el certificado para impresion/descarga.
 */
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Printer, Download, X, FileText, Calendar, AlertCircle } from 'lucide-react';
import { CertificadoRecoleccion } from './CertificadoRecoleccion';
import { useCertificadoRecoleccion } from '../api/useRecolecciones';
import type { PeriodoCertificado, CertificadoRecoleccionData } from '../types/recoleccion.types';

interface CertificadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ecoaliadoId: number;
  ecoaliadoNombre: string;
}

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const PERIODOS: { value: PeriodoCertificado; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'personalizado', label: 'Personalizado' },
];

const certificadoSchema = z.object({
  periodo: z.enum(['mensual', 'bimestral', 'trimestral', 'semestral', 'anual', 'personalizado']),
  año: z.number().min(2020).max(2100),
  mes: z.number().min(1).max(12).optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
});

type CertificadoFormData = z.infer<typeof certificadoSchema>;

export const CertificadoModal = ({
  isOpen,
  onClose,
  ecoaliadoId,
  ecoaliadoNombre,
}: CertificadoModalProps) => {
  const certificadoRef = useRef<HTMLDivElement>(null);
  const [certificadoData, setCertificadoData] = useState<CertificadoRecoleccionData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CertificadoFormData>({
    resolver: zodResolver(certificadoSchema),
    defaultValues: {
      periodo: 'mensual',
      año: currentYear,
      mes: currentMonth,
    },
  });

  const periodoWatch = watch('periodo');
  const añoWatch = watch('año');

  const { mutate: generarCertificado, isPending, error } = useCertificadoRecoleccion();

  // Generar lista de años (ultimos 5 años)
  const años = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const onSubmit = (data: CertificadoFormData) => {
    generarCertificado(
      {
        ecoaliado_id: ecoaliadoId,
        periodo: data.periodo,
        año: data.año,
        mes: data.mes,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
      },
      {
        onSuccess: (certificado) => {
          setCertificadoData(certificado);
          setShowPreview(true);
        },
      }
    );
  };

  const handlePrint = () => {
    if (!certificadoRef.current || !certificadoData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permita las ventanas emergentes para imprimir');
      return;
    }

    const certificadoContent = certificadoRef.current.innerHTML;
    const logoUrl = `${window.location.origin}/logo-dark.png`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificado ${certificadoData.numero_certificado}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Times New Roman', serif;
              font-size: 12px;
              line-height: 1.6;
            }
            * {
              box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-justify { text-align: justify; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 18px; }
            .text-2xl { font-size: 22px; }
            .text-sm { font-size: 11px; }
            .text-xs { font-size: 10px; }
            .uppercase { text-transform: uppercase; }
            .tracking-wide { letter-spacing: 0.05em; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .mb-8 { margin-bottom: 32px; }
            .mt-8 { margin-top: 32px; }
            .mt-12 { margin-top: 48px; }
            .mt-16 { margin-top: 64px; }
            .pt-2 { padding-top: 8px; }
            .pt-4 { padding-top: 16px; }
            .pt-8 { padding-top: 32px; }
            .pb-4 { padding-bottom: 16px; }
            .p-3 { padding: 12px; }
            .p-4 { padding: 16px; }
            .px-3 { padding-left: 12px; padding-right: 12px; }
            .px-16 { padding-left: 64px; padding-right: 64px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .gap-4 { gap: 16px; }
            .flex { display: flex; }
            .items-start { align-items: flex-start; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .inline-block { display: inline-block; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .border { border: 1px solid #d1d5db; }
            .border-t { border-top: 1px solid #d1d5db; }
            .border-t-2 { border-top: 2px solid #1f2937; }
            .border-b-2 { border-bottom: 2px solid #1f2937; }
            .rounded { border-radius: 4px; }
            .rounded-lg { border-radius: 8px; }
            .bg-white { background-color: white; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-gray-200 { background-color: #e5e7eb; }
            .bg-green-50 { background-color: #f0fdf4; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            .text-green-800 { color: #166534; }
            .text-primary-600 { color: #2563eb; }
            .text-green-600 { color: #16a34a; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-gray-800 { border-color: #1f2937; }
            .border-green-200 { border-color: #bbf7d0; }
            .border-collapse { border-collapse: collapse; }
            .w-full { width: 100%; }
            .font-mono { font-family: 'Courier New', monospace; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px 12px; }
            th { background-color: #f3f4f6; }
            img { max-width: 100%; height: auto; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${certificadoContent.replace(/src="\/logo-dark\.png"/g, 'src="' + logoUrl + '"')}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleBack = () => {
    setShowPreview(false);
    setCertificadoData(null);
  };

  const handleClose = () => {
    setShowPreview(false);
    setCertificadoData(null);
    onClose();
  };

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setShowPreview(false);
      setCertificadoData(null);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={showPreview ? 'Preview del Certificado' : 'Generar Certificado de Recoleccion'}
      size={showPreview ? '4xl' : 'lg'}
    >
      {!showPreview ? (
        // FORMULARIO DE CONFIGURACION
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Ecoaliado */}
          <Card variant="bordered" padding="sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Certificado para:</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{ecoaliadoNombre}</p>
              </div>
            </div>
          </Card>

          {/* Tipo de Periodo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de Periodo
            </label>
            <select
              {...register('periodo')}
              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            >
              {PERIODOS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Año */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Año
            </label>
            <select
              {...register('año', { valueAsNumber: true })}
              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            >
              {años.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Mes (solo para mensual/bimestral) */}
          {(periodoWatch === 'mensual' || periodoWatch === 'bimestral') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {periodoWatch === 'mensual' ? 'Mes' : 'Mes inicial del bimestre'}
              </label>
              <select
                {...register('mes', { valueAsNumber: true })}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Trimestre (solo para trimestral) */}
          {periodoWatch === 'trimestral' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trimestre
              </label>
              <select
                {...register('mes', { valueAsNumber: true })}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value={1}>1er Trimestre (Ene - Mar)</option>
                <option value={4}>2do Trimestre (Abr - Jun)</option>
                <option value={7}>3er Trimestre (Jul - Sep)</option>
                <option value={10}>4to Trimestre (Oct - Dic)</option>
              </select>
            </div>
          )}

          {/* Semestre (solo para semestral) */}
          {periodoWatch === 'semestral' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Semestre
              </label>
              <select
                {...register('mes', { valueAsNumber: true })}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value={1}>Primer Semestre (Ene - Jun)</option>
                <option value={7}>Segundo Semestre (Jul - Dic)</option>
              </select>
            </div>
          )}

          {/* Fechas personalizadas */}
          {periodoWatch === 'personalizado' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha Inicio
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    {...register('fecha_inicio')}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha Fin
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    {...register('fecha_fin')}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {(error as Error).message || 'Error al generar el certificado'}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={handleClose} type="button">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Certificado
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        // PREVIEW DEL CERTIFICADO
        <div className="space-y-4">
          {certificadoData && (
            <>
              {/* Preview del Certificado */}
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[70vh]">
                <div className="mx-auto" style={{ width: '210mm' }}>
                  <CertificadoRecoleccion ref={certificadoRef} certificado={certificadoData} />
                </div>
              </div>

              {/* Info adicional */}
              {certificadoData.resumen.total_recolecciones === 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    No hay recolecciones registradas en el periodo seleccionado.
                  </p>
                </div>
              )}

              {/* Botones de Accion */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={handleBack}>
                  Volver
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button variant="primary" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};
