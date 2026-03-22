import { useState, lazy, Suspense, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion, type Variants } from 'framer-motion';
import { DURATION, EASING, shouldReduceMotion } from '@/lib/animations';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Lock, ArrowLeft, CheckCircle2, AlertTriangle, RefreshCw, Mail } from 'lucide-react';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { APP_VERSION } from '@/constants/brand';
import { authAPI } from '@/api/auth.api';
import { passwordSchema, PASSWORD_REQUIREMENTS, type PasswordFormData } from '@/utils/passwordValidation';

// Lazy load NetworkBackground for better initial load performance
const NetworkBackground = lazy(() => import('@/components/common/NetworkBackground'));

// Schema para el formulario de reenvío
const resendSchema = z.object({
  email: z.string().min(1, 'Correo requerido').email('Correo electrónico inválido'),
});
type ResendFormData = z.infer<typeof resendSchema>;

export const SetupPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Leer token/email/tenant_id de URL params, con fallback a sessionStorage
  // (la PWA puede recargar la página y perder query params)
  const urlToken = searchParams.get('token');
  const urlEmail = searchParams.get('email');
  const urlTenantId = searchParams.get('tenant_id');

  const token = urlToken || sessionStorage.getItem('setup_token');
  const email = urlEmail || sessionStorage.getItem('setup_email');

  // Guardar en sessionStorage como backup para sobrevivir reloads
  // + guardar tenant_id en localStorage para que axios envíe X-Tenant-ID
  useEffect(() => {
    if (urlToken && urlEmail) {
      sessionStorage.setItem('setup_token', urlToken);
      sessionStorage.setItem('setup_email', urlEmail);
    }
    if (urlTenantId) {
      sessionStorage.setItem('setup_tenant_id', urlTenantId);
      localStorage.setItem('current_tenant_id', urlTenantId);
    } else {
      const savedTenantId = sessionStorage.getItem('setup_tenant_id');
      if (savedTenantId) {
        localStorage.setItem('current_tenant_id', savedTenantId);
      }
    }
  }, [urlToken, urlEmail, urlTenantId]);

  const { companyName, logoWhite, primaryColor, isLoading: brandingLoading } = useBrandingConfig();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Formulario de reenvío (cuando no hay token ni email)
  const {
    register: registerResend,
    handleSubmit: handleSubmitResend,
    formState: { errors: resendErrors },
  } = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
  });

  // Verificar que tenemos token y email (de URL o sessionStorage)
  useEffect(() => {
    if (!token || !email) {
      setInvalidLink(true);
    }
  }, [token, email]);

  // Validacion visual de requisitos
  const password = watch('new_password', '');
  const requirements = PASSWORD_REQUIREMENTS.map((req) => ({
    label: req.label,
    met: req.test(password),
  }));

  const onSubmit = async (data: PasswordFormData) => {
    if (!token || !email) {
      toast.error('Enlace inválido. Solicita uno nuevo a tu administrador.');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.setupPassword({
        email,
        token,
        new_password: data.new_password,
        new_password_confirm: data.confirm_password,
      });
      setSetupSuccess(true);
      // Limpiar sessionStorage al completar exitosamente
      sessionStorage.removeItem('setup_token');
      sessionStorage.removeItem('setup_email');
      sessionStorage.removeItem('setup_tenant_id');
      toast.success('Contraseña configurada exitosamente');
      // Redirigir al login despues de 3 segundos
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message;
      if (message?.includes('expirado') || message?.includes('invalido')) {
        setInvalidLink(true);
      } else {
        toast.error(message || 'Error al configurar contraseña. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLink = async (resendEmail?: string) => {
    const targetEmail = resendEmail || email;
    if (!targetEmail) {
      toast.error('No se encontró el correo electrónico.');
      return;
    }
    setIsResending(true);
    try {
      await authAPI.resendSetupPassword(targetEmail);
      setResendSuccess(true);
      toast.success('Se ha enviado un nuevo enlace a tu correo.');
    } catch {
      toast.error('No se pudo reenviar el enlace. Intenta de nuevo más tarde.');
    } finally {
      setIsResending(false);
    }
  };

  const onResendSubmit = (data: ResendFormData) => {
    handleResendLink(data.email);
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
              {setupSuccess
                ? 'Contraseña configurada'
                : invalidLink
                  ? 'Enlace inválido'
                  : 'Configura tu contraseña'}
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-neutral-400">
              {setupSuccess
                ? 'Tu contraseña ha sido configurada exitosamente'
                : invalidLink
                  ? 'El enlace ha expirado o no es válido'
                  : 'Crea una contraseña segura para acceder al sistema'}
            </p>

            {email && !invalidLink && !setupSuccess && (
              <p className="mt-1 text-xs text-neutral-500">
                Cuenta: <span className="text-neutral-300">{email}</span>
              </p>
            )}
          </motion.div>

          {setupSuccess ? (
            /* Estado: Setup exitoso */
            <motion.div className="space-y-5" variants={itemVariants} key="success-state">
              <div className="rounded-lg p-4 bg-emerald-900/30 border border-emerald-700/50">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-emerald-400" />
                  <div className="text-sm text-emerald-200">
                    <p className="font-medium mb-1">¡Listo!</p>
                    <p className="text-xs text-emerald-300/80">
                      Tu contraseña ha sido configurada exitosamente. Serás redirigido al inicio de
                      sesión en unos segundos...
                    </p>
                  </div>
                </div>
              </div>

              <Link to="/login">
                <Button
                  type="button"
                  className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  Ir al inicio de sesión
                </Button>
              </Link>
            </motion.div>
          ) : invalidLink ? (
            /* Estado: Enlace invalido */
            <motion.div className="space-y-4" variants={itemVariants} key="invalid-state">
              <div className="rounded-lg p-4 bg-amber-900/30 border border-amber-700/50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-400" />
                  <div className="text-sm text-amber-200">
                    <p className="font-medium mb-1">Enlace expirado</p>
                    <p className="text-xs text-amber-300/80">
                      Este enlace de configuración ya no es válido. Los enlaces expiran después de 7
                      días o al ser usados.
                    </p>
                  </div>
                </div>
              </div>

              {resendSuccess ? (
                <div className="rounded-lg p-4 bg-emerald-900/30 border border-emerald-700/50">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-emerald-400" />
                    <div className="text-sm text-emerald-200">
                      <p className="font-medium mb-1">Enlace reenviado</p>
                      <p className="text-xs text-emerald-300/80">
                        Revisa tu bandeja de entrada. El nuevo enlace es válido por 7 días.
                      </p>
                    </div>
                  </div>
                </div>
              ) : email ? (
                <Button
                  type="button"
                  onClick={() => handleResendLink()}
                  isLoading={isResending}
                  className="w-full shadow-lg"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isResending ? 'Reenviando...' : 'Reenviar enlace de configuración'}
                </Button>
              ) : (
                /* Formulario de reenvío cuando no hay email */
                <form onSubmit={handleSubmitResend(onResendSubmit)} className="space-y-3">
                  <p className="text-xs text-neutral-400">
                    Ingresa tu correo electrónico para recibir un nuevo enlace de configuración.
                  </p>
                  <Input
                    label="Correo electrónico"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    leftIcon={<Mail className="h-5 w-5 text-neutral-400" />}
                    {...registerResend('email')}
                    error={resendErrors.email?.message}
                    className="bg-neutral-800/50 border-neutral-600 text-white placeholder:text-neutral-500 min-h-[48px]"
                    style={{ '--tw-ring-color': `${primaryColor}33` } as React.CSSProperties}
                    labelClassName="text-neutral-300"
                    placeholder="correo@ejemplo.com"
                  />
                  <Button
                    type="submit"
                    isLoading={isResending}
                    className="w-full shadow-lg"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {isResending ? 'Reenviando...' : 'Reenviar enlace'}
                  </Button>
                </form>
              )}

              <Link to="/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ir al inicio de sesión
                </Button>
              </Link>
            </motion.div>
          ) : (
            /* Formulario */
            <motion.form
              className="space-y-5"
              onSubmit={handleSubmit(onSubmit)}
              variants={itemVariants}
              key="setup-form"
            >
              <div className="space-y-4">
                <Input
                  label="Nueva contraseña"
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  showPasswordToggle
                  leftIcon={<Lock className="h-5 w-5 text-neutral-400" />}
                  {...register('new_password')}
                  error={errors.new_password?.message}
                  className="bg-neutral-800/50 border-neutral-600 text-white placeholder:text-neutral-500 min-h-[48px]"
                  style={{ '--tw-ring-color': `${primaryColor}33` } as React.CSSProperties}
                  labelClassName="text-neutral-300"
                />

                <Input
                  label="Confirmar contraseña"
                  type="password"
                  autoComplete="new-password"
                  showPasswordToggle
                  leftIcon={<Lock className="h-5 w-5 text-neutral-400" />}
                  {...register('confirm_password')}
                  error={errors.confirm_password?.message}
                  className="bg-neutral-800/50 border-neutral-600 text-white placeholder:text-neutral-500 min-h-[48px]"
                  style={{ '--tw-ring-color': `${primaryColor}33` } as React.CSSProperties}
                  labelClassName="text-neutral-300"
                />
              </div>

              {/* Indicador de requisitos */}
              {password.length > 0 && (
                <div className="rounded-lg p-3 bg-neutral-800/50 border border-neutral-700/50">
                  <p className="text-xs text-neutral-400 mb-2 font-medium">Requisitos:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {requirements.map((req) => (
                      <div
                        key={req.label}
                        className={`flex items-center gap-1.5 text-xs ${
                          req.met ? 'text-emerald-400' : 'text-neutral-500'
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            req.met ? 'bg-emerald-400' : 'bg-neutral-600'
                          }`}
                        />
                        {req.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                isLoading={isLoading}
              >
                {isLoading ? 'Configurando...' : 'Configurar contraseña'}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm hover:underline inline-flex items-center gap-1"
                  style={{ color: primaryColor }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver al inicio de sesión
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
