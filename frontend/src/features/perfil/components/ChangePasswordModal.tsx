/**
 * ChangePasswordModal - Modal para cambio de contraseña
 *
 * MS-001-A: Implementación funcional del cambio de contraseña
 * - Validación de contraseña actual
 * - Confirmación de nueva contraseña
 * - Requisitos de seguridad
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Key, Loader2, Check, X } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Alert } from '@/components/common';
import { Input } from '@/components/forms';
import { useChangePassword } from '@/features/users/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Requisitos de contraseña
const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'Mínimo 8 caracteres', regex: /.{8,}/ },
  { key: 'uppercase', label: 'Al menos una mayúscula', regex: /[A-Z]/ },
  { key: 'lowercase', label: 'Al menos una minúscula', regex: /[a-z]/ },
  { key: 'number', label: 'Al menos un número', regex: /[0-9]/ },
];

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const { user } = useAuthStore();
  const changePasswordMutation = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const newPassword = watch('new_password', '');

  // Verificar requisitos de contraseña
  const passwordChecks = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    passed: req.regex.test(newPassword),
  }));

  const allRequirementsPassed = passwordChecks.every((check) => check.passed);

  const onSubmit = async (data: PasswordFormData) => {
    if (!user?.id) return;

    try {
      await changePasswordMutation.mutateAsync({
        id: user.id,
        data: {
          current_password: data.current_password,
          new_password: data.new_password,
        },
      });
      reset();
      onClose();
    } catch {
      // Error manejado por el hook
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={changePasswordMutation.isPending}
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit(onSubmit)}
        disabled={changePasswordMutation.isPending || !allRequirementsPassed}
        isLoading={changePasswordMutation.isPending}
      >
        <Key className="h-4 w-4 mr-2" />
        Cambiar Contraseña
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cambiar Contraseña"
      subtitle="Actualiza tu contraseña de acceso"
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {changePasswordMutation.isError && (
          <Alert
            variant="error"
            message="Error al cambiar la contraseña. Verifica que la contraseña actual sea correcta."
          />
        )}

        {/* Contraseña actual */}
        <div className="relative">
          <Input
            label="Contraseña Actual"
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="Ingresa tu contraseña actual"
            {...register('current_password', {
              required: 'La contraseña actual es requerida',
            })}
            error={errors.current_password?.message}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Nueva contraseña */}
        <div className="relative">
          <Input
            label="Nueva Contraseña"
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Ingresa tu nueva contraseña"
            {...register('new_password', {
              required: 'La nueva contraseña es requerida',
              validate: () => allRequirementsPassed || 'La contraseña no cumple los requisitos',
            })}
            error={errors.new_password?.message}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Requisitos de contraseña */}
        {newPassword && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Requisitos de contraseña:
            </p>
            <div className="space-y-1">
              {passwordChecks.map((check) => (
                <div
                  key={check.key}
                  className={`flex items-center gap-2 text-xs ${
                    check.passed
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {check.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {check.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmar contraseña */}
        <div className="relative">
          <Input
            label="Confirmar Nueva Contraseña"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirma tu nueva contraseña"
            {...register('confirm_password', {
              required: 'Debes confirmar la contraseña',
              validate: (value) => value === newPassword || 'Las contraseñas no coinciden',
            })}
            error={errors.confirm_password?.message}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <Alert
          variant="info"
          message="Por seguridad, serás redirigido al inicio de sesión después de cambiar tu contraseña."
        />
      </form>
    </BaseModal>
  );
};

export default ChangePasswordModal;
