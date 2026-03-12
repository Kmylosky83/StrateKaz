import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { motion, type Variants } from 'framer-motion';
import { DURATION, EASING, shouldReduceMotion } from '@/lib/animations';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { APP_VERSION } from '@/constants/brand';
import { authAPI } from '@/api/auth.api';

// Lazy load NetworkBackground for better initial load performance
const NetworkBackground = lazy(() => import('@/components/common/NetworkBackground'));

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email requerido').email('Email invalido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { companyName, logoWhite, primaryColor, isLoading: brandingLoading } = useBrandingConfig();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authAPI.forgotPassword(data.email);
      setEmailSent(true);
    } catch {
      // Siempre mostrar mensaje de exito por seguridad (no revelar si email existe)
      setEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Reduced motion detection
  const reduceMotion = shouldReduceMotion();

  const containerVariants: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: DURATION.fast } } }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: 0.6,
            staggerChildren: 0.1,
          },
        },
      };

  const itemVariants: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: DURATION.fast } } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION.slow, ease: EASING.smooth },
        },
      };

  const logoVariants: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: DURATION.fast } } }
    : {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.6, ease: EASING.smooth },
        },
      };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fondo animado de red */}
      <Suspense fallback={<div className="fixed inset-0 bg-neutral-950" />}>
        <NetworkBackground brandColor={primaryColor} />
      </Suspense>

      {/* Contenedor principal */}
      <motion.div
        className="relative z-10 w-full max-w-[90%] sm:max-w-md md:max-w-lg px-4 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Tarjeta Glassmorphism */}
        <motion.div
          className="backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 bg-neutral-900/80 border border-neutral-700/50"
          variants={itemVariants}
        >
          {/* Logo y titulo */}
          <motion.div className="text-center mb-6 sm:mb-8" variants={logoVariants}>
            {brandingLoading ? (
              <div className="mx-auto h-16 sm:h-20 w-16 sm:w-20 rounded-full animate-pulse-subtle mb-4 bg-neutral-700" />
            ) : (
              <img
                src={logoWhite}
                alt={companyName}
                className="mx-auto h-16 sm:h-20 w-auto object-contain mb-4 drop-shadow-md"
              />
            )}

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading leading-tight text-white">
              {emailSent ? 'Revisa tu correo' : 'Recuperar contrasena'}
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-neutral-400">
              {emailSent
                ? 'Te enviamos las instrucciones para restablecer tu contrasena'
                : 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena'}
            </p>
          </motion.div>

          {emailSent ? (
            /* Estado: Email enviado */
            <motion.div className="space-y-5" variants={itemVariants} key="success-state">
              <div className="rounded-lg p-4 bg-emerald-900/30 border border-emerald-700/50">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-emerald-400" />
                  <div className="text-sm text-emerald-200">
                    <p className="font-medium mb-1">Enlace enviado</p>
                    <p className="text-xs text-emerald-300/80">
                      Si el correo esta registrado en el sistema, recibiras un enlace para
                      restablecer tu contrasena. El enlace expira en 1 hora.
                    </p>
                  </div>
                </div>
              </div>

              <Link to="/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al inicio de sesion
                </Button>
              </Link>
            </motion.div>
          ) : (
            /* Formulario */
            <motion.form
              className="space-y-5"
              onSubmit={handleSubmit(onSubmit)}
              variants={itemVariants}
              key="forgot-form"
            >
              <Input
                label="Correo electronico"
                type="email"
                autoComplete="email"
                autoFocus
                leftIcon={<Mail className="h-5 w-5 text-neutral-400" />}
                {...register('email')}
                error={errors.email?.message}
                className="bg-neutral-800/50 border-neutral-600 text-white placeholder:text-neutral-500"
                style={{ '--tw-ring-color': `${primaryColor}33` } as React.CSSProperties}
                labelClassName="text-neutral-300"
                placeholder="correo@ejemplo.com"
              />

              <Button
                type="submit"
                className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                isLoading={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar enlace de recuperacion'}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm hover:underline inline-flex items-center gap-1"
                  style={{ color: primaryColor }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver al inicio de sesion
                </Link>
              </div>
            </motion.form>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div className="text-center mt-6 text-sm text-neutral-400" variants={itemVariants}>
          <p>
            v{APP_VERSION} &bull; Powered by{' '}
            <span
              className="font-medium hover:opacity-80 transition-opacity cursor-default"
              style={{ color: primaryColor }}
            >
              StrateKaz
            </span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
