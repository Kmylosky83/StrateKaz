/**
 * TotpVerificationStep — Paso de verificación TOTP para firma digital.
 *
 * Se muestra después de capturar la firma en el canvas cuando el usuario
 * tiene nivel_firma >= 2 (ISO 27001).
 *
 * - nivel_firma 2: Solo TOTP
 * - nivel_firma 3: TOTP o OTP por email
 */

import { useState } from 'react';
import { ShieldCheck, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { toast } from 'sonner';
import { sendEmailOTP } from '@/api/twoFactor.api';

interface TotpVerificationStepProps {
  nivelFirma: number;
  onVerified: (data: { totpCode?: string; emailOtpCode?: string }) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const TotpVerificationStep = ({
  nivelFirma,
  onVerified,
  onBack,
  isLoading = false,
}: TotpVerificationStepProps) => {
  const [code, setCode] = useState('');
  const [useEmailOtp, setUseEmailOtp] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      toast.error('El código debe tener 6 dígitos numéricos');
      return;
    }

    if (useEmailOtp) {
      onVerified({ emailOtpCode: code });
    } else {
      onVerified({ totpCode: code });
    }
  };

  const handleSendEmailOtp = async () => {
    setSendingEmailOtp(true);
    try {
      await sendEmailOTP('FIRMA');
      setEmailOtpSent(true);
      setUseEmailOtp(true);
      toast.success('Código enviado a tu correo electrónico');
    } catch {
      toast.error('Error al enviar el código por email');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header informativo */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Verificación de seguridad requerida</p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              {useEmailOtp
                ? 'Ingresa el código de 6 dígitos enviado a tu correo electrónico.'
                : 'Ingresa el código de 6 dígitos de tu app de autenticación para confirmar la firma.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={useEmailOtp ? 'Código enviado por email' : 'Código de verificación (TOTP)'}
          type="text"
          autoComplete="off"
          autoFocus
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />

        {/* Opción OTP email solo para nivel 3 */}
        {nivelFirma >= 3 && !useEmailOtp && (
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={handleSendEmailOtp}
            disabled={sendingEmailOtp}
          >
            {sendingEmailOtp ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {sendingEmailOtp ? 'Enviando...' : 'Enviar código por email'}
          </button>
        )}

        {useEmailOtp && emailOtpSent && (
          <p className="text-xs text-green-600 dark:text-green-400">
            Código enviado. Expira en 10 minutos.
          </p>
        )}

        {useEmailOtp && (
          <button
            type="button"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => {
              setUseEmailOtp(false);
              setCode('');
            }}
          >
            Usar código de la app
          </button>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={isLoading}
          >
            Volver
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isLoading}
            disabled={code.length !== 6}
          >
            Confirmar firma
          </Button>
        </div>
      </form>
    </div>
  );
};
