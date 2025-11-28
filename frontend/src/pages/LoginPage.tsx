import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { User, Lock } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success('Bienvenido!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || 'Error al iniciar sesión'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src="/logo-dark.png"
            alt="Grasas y Huesos del Norte"
            className="mx-auto h-24 w-auto object-contain mb-4 dark:hidden"
          />
          <img
            src="/logo-ligth.png"
            alt="Grasas y Huesos del Norte"
            className="mx-auto h-24 w-auto object-contain mb-4 hidden dark:block"
          />
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Grasas y Huesos del Norte
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sistema Integrado de Gestión
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Usuario"
              type="text"
              autoComplete="username"
              leftIcon={<User className="h-5 w-5" />}
              {...register('username')}
              error={errors.username?.message}
            />

            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              leftIcon={<Lock className="h-5 w-5" />}
              {...register('password')}
              error={errors.password?.message}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Versión 1.0.0 • Powered by StrateKaz</p>
        </div>
      </div>
    </div>
  );
};
