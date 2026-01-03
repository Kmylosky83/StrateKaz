import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { User, Lock } from 'lucide-react';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const {
    companyName,
    companySlogan,
    logo,
    logoWhite,
    primaryColor,
    secondaryColor,
    loginBackground,
    appVersion,
    isLoading: brandingLoading
  } = useBrandingConfig();

  // Precargar imagen de fondo cuando loginBackground cambia
  useEffect(() => {
    if (!loginBackground) {
      setImageLoaded(false);
      return;
    }

    // Crear nueva imagen para precargar
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(false);
    img.src = loginBackground;

    // Si la imagen ya está en caché, complete será true inmediatamente
    if (img.complete) {
      setImageLoaded(true);
    }

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [loginBackground]);

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

  // Animaciones con tipos correctos
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  const logoVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  // Animación para la imagen de fondo
  const backgroundImageVariants: Variants = {
    hidden: { opacity: 0, scale: 1.1 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fondo base */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 -z-20" />

      {/* Imagen de fondo con fade-in elegante */}
      <AnimatePresence>
        {loginBackground && imageLoaded && (
          <motion.div
            className="absolute inset-0 -z-15"
            variants={backgroundImageVariants}
            initial="hidden"
            animate="visible"
          >
            <img
              src={loginBackground}
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Overlay para fundir la imagen con el tema */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(
                    135deg,
                    ${primaryColor}40 0%,
                    rgba(0, 0, 0, 0.5) 50%,
                    ${secondaryColor}30 100%
                  )
                `,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background con gradiente dinámico (siempre visible) */}
      <div
        className="absolute inset-0 transition-all duration-700 -z-10"
        style={{
          background: loginBackground && imageLoaded
            ? 'transparent'
            : `
              linear-gradient(
                135deg,
                ${primaryColor}15 0%,
                transparent 50%,
                ${secondaryColor}10 100%
              )
            `,
        }}
      />

      {/* Formas decorativas sutiles (solo cuando no hay imagen de fondo) */}
      {(!loginBackground || !imageLoaded) && (
        <>
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 dark:opacity-10 -z-5"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-15 dark:opacity-5 -z-5"
            style={{ backgroundColor: secondaryColor }}
          />
        </>
      )}

      {/* Contenedor principal con animación - full responsive */}
      <motion.div
        className="relative z-10 w-full max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl px-4 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Tarjeta con Glassmorphism */}
        <motion.div
          className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-xl
                     border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 md:p-10 lg:p-12"
          variants={itemVariants}
        >
          {/* Logo y título */}
          <motion.div className="text-center mb-6 sm:mb-8" variants={logoVariants}>
            {/* Logo con loading state */}
            {brandingLoading ? (
              <div className="mx-auto h-16 sm:h-20 w-16 sm:w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />
            ) : (
              <>
                <img
                  src={logo}
                  alt={companyName}
                  className="mx-auto h-16 sm:h-20 w-auto object-contain mb-4 dark:hidden drop-shadow-md"
                />
                <img
                  src={logoWhite}
                  alt={companyName}
                  className="mx-auto h-16 sm:h-20 w-auto object-contain mb-4 hidden dark:block drop-shadow-md"
                />
              </>
            )}

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-heading leading-tight break-words">
              {brandingLoading ? (
                <span className="inline-block h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                companyName
              )}
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {brandingLoading ? (
                <span className="inline-block h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                companySlogan
              )}
            </p>
          </motion.div>

          {/* Formulario */}
          <motion.form
            className="space-y-5"
            onSubmit={handleSubmit(onSubmit)}
            variants={itemVariants}
          >
            <div className="space-y-4">
              <Input
                label="Usuario"
                type="text"
                autoComplete="username"
                leftIcon={<User className="h-5 w-5 text-gray-400" />}
                {...register('username')}
                error={errors.username?.message}
                className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
              />

              <Input
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                {...register('password')}
                error={errors.password?.message}
                className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300"
              isLoading={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </motion.form>
        </motion.div>

        {/* Footer */}
        <motion.div
          className={`text-center mt-6 text-sm ${
            loginBackground && imageLoaded
              ? 'text-white/80'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          variants={itemVariants}
        >
          <p>
            v{appVersion} • Powered by{' '}
            <span
              className="font-medium hover:opacity-80 transition-opacity cursor-default"
              style={{ color: loginBackground && imageLoaded ? '#ffffff' : primaryColor }}
            >
              StrateKaz
            </span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
