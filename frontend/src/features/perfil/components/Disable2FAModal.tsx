/**
 * Disable2FAModal - Modal para deshabilitar autenticación de dos factores
 *
 * Requiere contraseña para confirmar la deshabilitación.
 * Muestra advertencia sobre reducción de seguridad.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Button } from '@/components/common/Button';
import { use2FA } from '../hooks/use2FA';
import { Lock, AlertTriangle } from 'lucide-react';

const disableSchema = z.object({
  password: z.string().min(1, 'Contraseña requerida'),
});

type DisableFormData = z.infer<typeof disableSchema>;

interface Disable2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Disable2FAModal = ({ isOpen, onClose }: Disable2FAModalProps) => {
  const { disable, isDisabling } = use2FA();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DisableFormData>({
    resolver: zodResolver(disableSchema),
  });

  const onSubmit = async (data: DisableFormData) => {
    await disable(data.password);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Deshabilitar Autenticación de Dos Factores"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Advertencia de seguridad</p>
            <p>
              Al deshabilitar la autenticación de dos factores, tu cuenta será menos segura. Solo se
              requerirá tu contraseña para iniciar sesión.
            </p>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            Para confirmar que deseas deshabilitar la autenticación de dos factores, ingresa tu
            contraseña:
          </p>
        </div>

        <Input
          {...register('password')}
          type="password"
          label="Contraseña"
          placeholder="Tu contraseña actual"
          error={errors.password?.message}
          icon={<Lock className="w-4 h-4" />}
          autoFocus
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" loading={isDisabling}>
            Deshabilitar 2FA
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
