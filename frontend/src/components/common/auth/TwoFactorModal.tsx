/**
 * TwoFactorModal - Modal para habilitar autenticación de dos factores
 * Movido desde features/perfil/components/ — componente compartido
 *
 * Flujo:
 * 1. Ingresar contraseña para confirmar identidad
 * 2. Escanear QR code con app de autenticación
 * 3. Ingresar código de 6 dígitos para verificar
 * 4. Guardar códigos de backup
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Button } from '@/components/common/Button';
import { use2FA } from '@/hooks/use2FA';
import { Lock, Key, Download } from 'lucide-react';

const passwordSchema = z.object({
  password: z.string().min(1, 'Contraseña requerida'),
});

const tokenSchema = z.object({
  token: z
    .string()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6, 'El código debe tener 6 dígitos')
    .regex(/^\d+$/, 'Solo números'),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type TokenFormData = z.infer<typeof tokenSchema>;

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TwoFactorModal = ({ isOpen, onClose }: TwoFactorModalProps) => {
  const [step, setStep] = useState<'password' | 'scan' | 'verify' | 'backup'>('password');
  const { setupData, backupCodes, startSetup, enable, isSettingUp, isEnabling, clearSetupData } =
    use2FA();

  // Form para contraseña
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Form para token
  const {
    register: registerToken,
    handleSubmit: handleSubmitToken,
    formState: { errors: tokenErrors },
    reset: resetTokenForm,
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
  });

  // Handler: Submit contraseña
  const onSubmitPassword = async (data: PasswordFormData) => {
    await startSetup(data.password);
    setStep('scan');
  };

  // Handler: Submit token
  const onSubmitToken = async (data: TokenFormData) => {
    await enable(data.token);
    setStep('backup');
  };

  // Handler: Cerrar modal
  const handleClose = () => {
    setStep('password');
    resetPasswordForm();
    resetTokenForm();
    clearSetupData();
    onClose();
  };

  // Handler: Descargar códigos de backup
  const handleDownloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stratekaz-2fa-backup-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Habilitar Autenticación de Dos Factores (2FA)"
      size="lg"
    >
      <div className="space-y-6">
        {/* PASO 1: Contraseña */}
        {step === 'password' && (
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-3">
                La autenticación de dos factores (2FA) añade una capa extra de seguridad a tu
                cuenta.
              </p>
              <p className="mb-4">
                Necesitarás una app de autenticación como Google Authenticator, Authy o Microsoft
                Authenticator.
              </p>
              <p className="font-medium">Ingresa tu contraseña para continuar:</p>
            </div>

            <Input
              {...registerPassword('password')}
              type="password"
              label="Contraseña"
              placeholder="Tu contraseña actual"
              error={passwordErrors.password?.message}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSettingUp}>
                Continuar
              </Button>
            </div>
          </form>
        )}

        {/* PASO 2: Escanear QR */}
        {step === 'scan' && setupData && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-4">Escanea este código QR con tu app de autenticación:</p>
            </div>

            <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
              <img src={setupData.qr_code} alt="QR Code" className="max-w-xs" />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                ¿No puedes escanear el código?
              </p>
              <p className="text-xs text-blue-700 mb-2">Ingresa esta clave manualmente:</p>
              <code className="block bg-white px-3 py-2 rounded border border-blue-200 text-sm font-mono text-center">
                {setupData.secret_key}
              </code>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => setStep('verify')}>
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* PASO 3: Verificar código */}
        {step === 'verify' && (
          <form onSubmit={handleSubmitToken(onSubmitToken)} className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-4">
                Ingresa el código de 6 dígitos que aparece en tu app de autenticación:
              </p>
            </div>

            <Input
              {...registerToken('token')}
              type="text"
              label="Código de verificación"
              placeholder="123456"
              error={tokenErrors.token?.message}
              leftIcon={<Key className="w-4 h-4" />}
              maxLength={6}
              autoFocus
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setStep('scan')}>
                Atrás
              </Button>
              <Button type="submit" isLoading={isEnabling}>
                Verificar y habilitar
              </Button>
            </div>
          </form>
        )}

        {/* PASO 4: Códigos de backup */}
        {step === 'backup' && backupCodes.length > 0 && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-bold text-amber-900 mb-2">IMPORTANTE:</p>
              <p className="text-sm text-amber-800">
                Guarda estos códigos de respaldo en un lugar seguro. Los necesitarás si pierdes
                acceso a tu app de autenticación.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Códigos de respaldo:</p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <code
                    key={index}
                    className="bg-white px-3 py-2 rounded border border-gray-200 text-sm font-mono text-center"
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleDownloadBackupCodes}
              >
                Descargar códigos
              </Button>
              <Button type="button" onClick={handleClose}>
                Finalizar
              </Button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
