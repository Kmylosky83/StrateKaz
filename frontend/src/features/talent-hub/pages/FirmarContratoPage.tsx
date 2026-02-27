/**
 * FirmarContratoPage - Pagina publica para firma digital de contratos
 *
 * Accesible SIN autenticacion via token unico.
 * Ruta: /contratos/firmar/:token
 *
 * Flujo:
 * 1. Colaborador recibe email con link de firma
 * 2. Abre link -> ve detalles del contrato
 * 3. Firma con SignaturePad
 * 4. Envia firma -> contrato queda firmado digitalmente
 *
 * Usa design system: Card, Button, Badge, Spinner, Alert, SignaturePad
 */
import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  PenTool,
  Calendar,
  DollarSign,
  Briefcase,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { Card } from '@/components/common/Card';
import { SignaturePad } from '@/components/forms/SignaturePad';
import type { SignaturePadRef } from '@/components/forms/SignaturePad';
import { useContratoPublico, useFirmarContratoPublico } from '../hooks/useSeleccionContratacion';

// ============================================================================
// Public Layout (misma estructura que ResponderEntrevistaPage)
// ============================================================================

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/logo-light.png" alt="StrateKaz" className="h-8" />
          <span className="text-lg font-semibold text-gray-800 dark:text-white">StrateKaz</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      <footer className="text-center py-6 text-xs text-gray-400">
        StrateKaz ERP &middot; Firma digital de contrato
      </footer>
    </div>
  );
}

function ErrorLayout({
  title,
  message,
  icon,
}: {
  title: string;
  message: string;
  icon?: React.ReactNode;
}) {
  return (
    <PublicLayout>
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          {icon || <AlertCircle className="w-8 h-8 text-red-500" />}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </PublicLayout>
  );
}

// ============================================================================
// Formato moneda COP
// ============================================================================

const formatCOP = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Indefinido';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// ============================================================================
// Detalle Item
// ============================================================================

function DetailItem({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 shrink-0">
        <Icon size={16} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p
          className={
            highlight
              ? 'text-sm font-semibold text-emerald-700 dark:text-emerald-400'
              : 'text-sm font-medium text-gray-900 dark:text-white'
          }
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function FirmarContratoPage() {
  const { token } = useParams<{ token: string }>();
  const { data: contrato, isLoading, error } = useContratoPublico(token || '');
  const firmarMutation = useFirmarContratoPublico();
  const signatureRef = useRef<SignaturePadRef>(null);

  const [firmaData, setFirmaData] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const handleSignature = (base64: string) => {
    setFirmaData(base64);
  };

  const handleClearSignature = () => {
    setFirmaData('');
  };

  const handleSubmit = () => {
    if (!token || !firmaData) return;

    firmarMutation.mutate(
      { token, firma_imagen: firmaData },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  // Loading
  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Cargando contrato...</p>
        </div>
      </PublicLayout>
    );
  }

  // Error handling
  if (error) {
    const errorData = (
      error as {
        response?: { data?: { firmado?: boolean; expirado?: boolean; detail?: string } };
      }
    )?.response?.data;

    if (errorData?.firmado) {
      return (
        <ErrorLayout
          title="Contrato ya firmado"
          message="Este contrato ya fue firmado. No es necesaria ninguna accion adicional."
          icon={<CheckCircle className="w-8 h-8 text-green-500" />}
        />
      );
    }
    if (errorData?.expirado) {
      return (
        <ErrorLayout
          title="Enlace expirado"
          message="El enlace para firmar este contrato ha expirado. Por favor solicita un nuevo enlace a tu empresa."
          icon={<Clock className="w-8 h-8 text-amber-500" />}
        />
      );
    }
    return (
      <ErrorLayout
        title="Contrato no disponible"
        message={errorData?.detail || 'No se pudo encontrar el contrato solicitado.'}
      />
    );
  }

  if (!contrato) {
    return (
      <ErrorLayout
        title="Contrato no encontrado"
        message="No se pudo encontrar el contrato solicitado."
      />
    );
  }

  // Success state
  if (submitted) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            Contrato firmado exitosamente
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gracias, <strong>{contrato.colaborador_nombre}</strong>. Tu firma digital ha sido
            registrada para el contrato <strong>{contrato.numero_contrato}</strong>.
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 text-sm text-emerald-700 dark:text-emerald-400">
            <p>Se ha registrado la fecha, hora y direccion IP como constancia legal de la firma.</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Main form
  return (
    <PublicLayout>
      {/* Header card */}
      <Card className="mb-6 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Firma de Contrato Laboral
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Hola <strong>{contrato.colaborador_nombre}</strong>, por favor revisa los detalles de
              tu contrato y firma al final de esta pagina.
            </p>

            {contrato.fecha_expiracion && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <Clock size={12} />
                <span>
                  Este enlace expira el{' '}
                  {new Date(contrato.fecha_expiracion).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Contract details */}
      <Card className="mb-6 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Info size={16} className="text-gray-400" />
          Detalles del Contrato
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <DetailItem icon={FileText} label="Numero de Contrato" value={contrato.numero_contrato} />
          <DetailItem icon={Briefcase} label="Tipo de Contrato" value={contrato.tipo_contrato} />
          <DetailItem
            icon={Calendar}
            label="Fecha de Inicio"
            value={formatDate(contrato.fecha_inicio)}
          />
          <DetailItem
            icon={Calendar}
            label="Fecha de Fin"
            value={contrato.fecha_fin ? formatDate(contrato.fecha_fin) : 'Indefinido'}
          />
          <DetailItem
            icon={DollarSign}
            label="Salario Pactado"
            value={formatCOP(contrato.salario_pactado)}
            highlight
          />
          <DetailItem
            icon={Briefcase}
            label="Tipo de Movimiento"
            value={contrato.tipo_movimiento}
          />
        </div>

        {contrato.objeto_contrato && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Objeto del Contrato</p>
            <p className="text-sm text-gray-900 dark:text-white">{contrato.objeto_contrato}</p>
          </div>
        )}

        {/* PDF viewer link */}
        {contrato.archivo_contrato && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <a
              href={contrato.archivo_contrato}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <ExternalLink size={14} />
              Ver documento del contrato (PDF)
            </a>
          </div>
        )}
      </Card>

      {/* Signature section */}
      <Card className="mb-6 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <PenTool size={16} className="text-emerald-600 dark:text-emerald-400" />
          Firma Digital
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Dibuja tu firma en el recuadro a continuacion. Al firmar, aceptas los terminos del
          contrato descritos anteriormente.
        </p>

        <SignaturePad
          ref={signatureRef}
          label="Tu firma"
          required
          onSignature={handleSignature}
          onClear={handleClearSignature}
          height={200}
          placeholder="Dibuja tu firma aqui"
          helpText="Usa el mouse o el dedo en dispositivos tactiles para firmar."
        />

        <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Aviso legal:</strong> Al firmar digitalmente este contrato, se registrara tu
            direccion IP, fecha, hora y navegador como constancia legal de la aceptacion.
          </p>
        </div>
      </Card>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          isLoading={firmarMutation.isPending}
          disabled={!firmaData}
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <PenTool size={18} className="mr-2" />
          Firmar Contrato
        </Button>
      </div>
    </PublicLayout>
  );
}
