/**
 * ImpersonateVerifyModal - Modal de verificación 2FA para impersonación
 *
 * Flujo:
 * 1. Superadmin hace clic en "Ver como usuario"
 * 2. Si tiene 2FA activo, se abre este modal pidiendo código TOTP
 * 3. Backend valida código → retorna impersonation_token (JWT, 5 min TTL)
 * 4. Frontend usa token para llamar impersonate-profile
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Button } from '@/components/common/Button';
import { authAPI } from '@/api/auth.api';
import { ShieldCheck, Eye } from 'lucide-react';

const codeSchema = z.object({
  code: z
    .string()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6, 'El código debe tener 6 dígitos')
    .regex(/^\d+$/, 'Solo números'),
});

type CodeFormData = z.infer<typeof codeSchema>;

interface ImpersonateVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { id: number; full_name?: string; first_name?: string; email?: string } | null;
  onVerified: (token: string) => void;
}

export const ImpersonateVerifyModal = ({
  isOpen,
  onClose,
  targetUser,
  onVerified,
}: ImpersonateVerifyModalProps) => {
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  const onSubmit = async (data: CodeFormData) => {
    if (!targetUser) return;
    setError('');
    setIsVerifying(true);

    try {
      const result = await authAPI.verifyImpersonation(targetUser.id, data.code);
      handleClose();
      onVerified(result.impersonation_token);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr?.response?.data?.error || 'Código inválido. Intenta de nuevo.');
    } finally {
      setIsVerifying(false);
    }
  };

  const targetName =
    targetUser?.full_name || targetUser?.first_name || targetUser?.email || 'usuario';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Verificación de seguridad"
      description="Ingresa tu código 2FA para impersonar"
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Info del usuario objetivo */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Eye className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-gray-500 dark:text-gray-400">Vas a ver el sistema como:</p>
            <p className="font-medium text-gray-900 dark:text-white">{targetName}</p>
          </div>
        </div>

        {/* Código TOTP */}
        <Input
          label="Código de autenticación"
          placeholder="000000"
          maxLength={6}
          leftIcon={<ShieldCheck className="h-5 w-5 text-gray-400" />}
          {...register('code')}
          error={errors.code?.message}
          disabled={isVerifying}
          autoFocus
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Ingresa el código de 6 dígitos de tu app de autenticación. La sesión de impersonación
          queda registrada en auditoría.
        </p>

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isVerifying}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isVerifying}>
            Verificar e Impersonar
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
