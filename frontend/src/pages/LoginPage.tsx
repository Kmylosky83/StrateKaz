import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { DURATION, EASING, shouldReduceMotion } from '@/lib/animations';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { TenantSelector } from '@/components/common/TenantSelector';
import { Input } from '@/components/forms/Input';
import { Mail, Lock, Key, ShieldCheck } from 'lucide-react';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { APP_VERSION } from '@/constants/brand';
import { verifyTwoFactor } from '@/features/perfil/api/twoFactor.api';
import { authAPI } from '@/api/auth.api';

// Lazy load NetworkBackground for better initial load performance
const NetworkBackground = lazy(() => import('@/components/common/NetworkBackground'));

const loginSchema = z.object({
  email: z.string().min(1, 'Email requerido').email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const twoFactorSchema = z.object({
  token: z
    .string()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6, 'El código debe tener 6 dígitos')
    .regex(/^\d+$/, 'Solo números'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

// Tipos de paso del login
type LoginStep = 'credentials' | '2fa' | 'tenant-select';

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const tenantUser = useAuthStore((state) => state.tenantUser);
  const accessibleTenants = useAuthStore((state) => state.accessibleTenants);
  const isSuperadmin = useAuthStore((state) => state.isSuperadmin);
  const selectTenant = useAuthStore((state) => state.selectTenant);
  const clearTenantContext = useAuthStore((state) => state.clearTenantContext);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const {
    companyName,
    companySlogan,
    logo,
    logoWhite,
    primaryColor,
    secondaryColor,
    loginBackground,
    isLoading: brandingLoading,
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

  // Form de login
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Form de 2FA
  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: errors2FA },
    reset: reset2FA,
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  });

  /**
   * Procesa el flujo después del login exitoso
   * El store ya tiene los tenants accesibles después del login
   */
  const handlePostLoginFlow = async () => {
    const { tenantUser, accessibleTenants, isSuperadmin, currentTenant } = useAuthStore.getState();

    if (accessibleTenants.length === 0) {
      // Usuario sin tenants
      if (isSuperadmin) {
        // Superadmin sin tenants → Admin Global
        clearTenantContext();
        toast.success('Bienvenido al Panel de Administración!');
        navigate('/admin-global');
      } else {
        toast.error('No tienes acceso a ninguna empresa.');
      }
      return;
    }

    // Superadmin con tenants → mostrar selector con opción Admin Global
    if (isSuperadmin) {
      setLoginStep('tenant-select');
      return;
    }

    if (accessibleTenants.length === 1) {
      // Solo un tenant - ya fue seleccionado automáticamente en el store
      toast.success(`Bienvenido a ${currentTenant?.name || accessibleTenants[0].tenant.name}!`);
      navigate('/mi-portal');
      return;
    }

    // Múltiples tenants - mostrar selector
    setLoginStep('tenant-select');
  };

  // Handler: Login inicial
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Login con el nuevo sistema multi-tenant
      await login(data);

      // TODO: Verificar si requiere 2FA
      // Por ahora, el backend no retorna requires_2fa en la nueva API
      // Si se implementa 2FA, habría que verificar la respuesta aquí

      // Login exitoso - procesar flujo de tenants
      await handlePostLoginFlow();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Verificar 2FA
  const onSubmit2FA = async (data: TwoFactorFormData) => {
    setIsLoading(true);
    try {
      const response = await verifyTwoFactor({
        username: email, // Usamos el email guardado del paso anterior
        token: data.token,
        use_backup_code: useBackupCode,
      });

      // Guardar tokens
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);

      // Obtener perfil
      const userProfile = await authAPI.getProfile();

      // Actualizar store
      useAuthStore.setState({
        user: userProfile,
        accessToken: response.access,
        refreshToken: response.refresh,
        isAuthenticated: true,
      });

      // Informar si usó código de backup
      if (useBackupCode && response.backup_codes_remaining !== undefined) {
        toast.warning(
          `Código de backup usado. Te quedan ${response.backup_codes_remaining} códigos.`
        );
      }

      // Verificar tenants después de 2FA exitoso
      await handlePostLoginFlow();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Código inválido');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Volver al login
  const handleBackToLogin = () => {
    setLoginStep('credentials');
    setEmail('');
    setUseBackupCode(false);
    reset2FA();
  };

  // Handler: Seleccionar tenant
  const handleTenantSelect = async (tenantId: number) => {
    try {
      await selectTenant(tenantId);
      const tenant = accessibleTenants.find((t) => t.tenant.id === tenantId);
      toast.success(`Bienvenido a ${tenant?.tenant.name || 'la empresa'}!`);
      navigate('/mi-portal');
    } catch (error: any) {
      toast.error(error.message || 'Error al seleccionar empresa. Intenta de nuevo.');
    }
  };

  // Reduced motion detection
  const reduceMotion = shouldReduceMotion();

  // Animaciones con tipos correctos - Usando constantes centralizadas
  // Sincronizadas con marketing_site para consistencia visual
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

  // Animación para la imagen de fondo
  const backgroundImageVariants: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: DURATION.fast } } }
    : {
        hidden: { opacity: 0, scale: 1.1 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 1.2, ease: EASING.smooth },
        },
      };

  // Determinar si usar el fondo animado de red (cuando no hay imagen personalizada)
  const useNetworkBackground = !loginBackground || !imageLoaded;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fondo animado de red - Solo cuando no hay imagen de fondo personalizada */}
      {useNetworkBackground && (
        <Suspense fallback={<div className="fixed inset-0 bg-neutral-950" />}>
          <NetworkBackground brandColor={primaryColor} />
        </Suspense>
      )}

      {/* Imagen de fondo con fade-in elegante (cuando hay imagen personalizada) */}
      <AnimatePresence>
        {loginBackground && imageLoaded && (
          <motion.div
            className="absolute inset-0 z-0"
            variants={backgroundImageVariants}
            initial="hidden"
            animate="visible"
          >
            <img src={loginBackground} alt="" className="w-full h-full object-cover" />
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

      {/* Contenedor principal con animación - full responsive */}
      <motion.div
        className="relative z-10 w-full max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl px-4 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Tarjeta con Glassmorphism - Adaptada para fondo oscuro o claro */}
        <motion.div
          className={`backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 lg:p-12
                     ${useNetworkBackground
                       ? 'bg-neutral-900/80 border border-neutral-700/50'
                       : 'bg-white/70 dark:bg-gray-800/70 border border-white/20 dark:border-gray-700/50'
                     }`}
          variants={itemVariants}
        >
          {/* Logo y título - Solo mostrar en credentials y 2fa, no en tenant-select */}
          {loginStep !== 'tenant-select' && (
            <motion.div className="text-center mb-6 sm:mb-8" variants={logoVariants}>
              {/* Logo con loading state */}
              {brandingLoading ? (
                <div className={`mx-auto h-16 sm:h-20 w-16 sm:w-20 rounded-full animate-pulse-subtle mb-4 ${useNetworkBackground ? 'bg-neutral-700' : 'bg-gray-200 dark:bg-gray-700'}`} />
              ) : (
                <>
                  {/* Si hay fondo de red, siempre mostrar logo blanco; si no, usar lógica dark/light */}
                  {useNetworkBackground ? (
                    <img
                      src={logoWhite}
                      alt={companyName}
                      className="mx-auto h-16 sm:h-20 w-auto object-contain mb-4 drop-shadow-md"
                    />
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
                </>
              )}

              <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold font-heading leading-tight break-words ${useNetworkBackground ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {brandingLoading ? (
                  <span className={`inline-block h-8 w-48 rounded animate-pulse-subtle ${useNetworkBackground ? 'bg-neutral-700' : 'bg-gray-200 dark:bg-gray-700'}`} />
                ) : (
                  companyName
                )}
              </h1>

              <p className={`mt-2 text-xs sm:text-sm ${useNetworkBackground ? 'text-neutral-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {brandingLoading ? (
                  <span className={`inline-block h-4 w-32 rounded animate-pulse-subtle ${useNetworkBackground ? 'bg-neutral-700' : 'bg-gray-200 dark:bg-gray-700'}`} />
                ) : (
                  companySlogan
                )}
              </p>
            </motion.div>
          )}

          {/* Formulario - Step-based rendering */}
          {loginStep === 'credentials' && (
            /* Formulario de Login */
            <motion.form
              className="space-y-5"
              onSubmit={handleSubmit(onSubmit)}
              variants={itemVariants}
              key="login-form"
            >
              <div className="space-y-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  autoComplete="email"
                  leftIcon={<Mail className={`h-5 w-5 ${useNetworkBackground ? 'text-neutral-400' : 'text-gray-400'}`} />}
                  {...register('email')}
                  error={errors.email?.message}
                  className={useNetworkBackground
                    ? 'bg-neutral-800/50 border-neutral-600 text-white placeholder:text-neutral-500'
                    : 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm'
                  }
                  style={useNetworkBackground ? { '--tw-ring-color': `${primaryColor}33` } as React.CSSProperties : undefined}
                  labelClassName={useNetworkBackground ? 'text-neutral-300' : undefined}
                  placeholder="correo@ejemplo.com"
                />

                <Input
                  label="Contraseña"
                  type="password"
                  autoComplete="current-password"
                  leftIcon={<Lock className={`h-5 w-5 ${useNetworkBackground ? 'text-neutral-400' : 'text-gray-400'}`} />}
                  {...register('password')}
                  error={errors.password?.message}
                  className={useNetworkBackground
                    ? 'bg-neutral-800/50 border-neutral-600 text-white placeholder:text-neutral-500'
                    : 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm'
                  }
                  style={useNetworkBackground ? { '--tw-ring-color': `${primaryColor}33` } as React.CSSProperties : undefined}
                  labelClassName={useNetworkBackground ? 'text-neutral-300' : undefined}
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
          )}

          {loginStep === '2fa' && (
            /* Formulario de 2FA */
            <motion.form
              className="space-y-5"
              onSubmit={handleSubmit2FA(onSubmit2FA)}
              variants={itemVariants}
              key="2fa-form"
            >
              <div className={`rounded-lg p-4 mb-4 ${useNetworkBackground
                ? 'bg-blue-900/30 border border-blue-700/50'
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-start gap-3">
                  <ShieldCheck className={`h-5 w-5 mt-0.5 flex-shrink-0 ${useNetworkBackground ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'}`} />
                  <div className={`text-sm ${useNetworkBackground ? 'text-blue-200' : 'text-blue-800 dark:text-blue-200'}`}>
                    <p className="font-medium mb-1">Verificación de dos factores</p>
                    <p className="text-xs">
                      {useBackupCode
                        ? 'Ingresa uno de tus códigos de respaldo de 6 dígitos.'
                        : 'Ingresa el código de 6 dígitos de tu app de autenticación.'}
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label={useBackupCode ? 'Código de respaldo' : 'Código de verificación'}
                type="text"
                autoComplete="off"
                autoFocus
                maxLength={6}
                leftIcon={<Key className={`h-5 w-5 ${useNetworkBackground ? 'text-neutral-400' : 'text-gray-400'}`} />}
                {...register2FA('token')}
                error={errors2FA.token?.message}
                className={useNetworkBackground
                  ? 'bg-neutral-800/50 border-neutral-600 text-white placeholder:text-neutral-500'
                  : 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm'
                }
                style={useNetworkBackground ? { '--tw-ring-color': `${primaryColor}33` } as React.CSSProperties : undefined}
                labelClassName={useNetworkBackground ? 'text-neutral-300' : undefined}
                placeholder="123456"
              />

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  className="text-sm hover:underline text-blue-600 dark:text-blue-400"
                  style={useNetworkBackground ? { color: primaryColor } : undefined}
                  onClick={() => setUseBackupCode(!useBackupCode)}
                >
                  {useBackupCode ? 'Usar código de la app' : 'Usar código de respaldo'}
                </button>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                  isLoading={isLoading}
                >
                  {isLoading ? 'Verificando...' : 'Verificar'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className={`w-full ${useNetworkBackground ? 'border-neutral-600 text-neutral-300 hover:bg-neutral-800' : ''}`}
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                >
                  Volver
                </Button>
              </div>
            </motion.form>
          )}

          {loginStep === 'tenant-select' && (
            /* Selector de Tenant */
            <motion.div
              variants={itemVariants}
              key="tenant-select"
            >
              <TenantSelector
                tenants={accessibleTenants}
                lastTenantId={tenantUser?.last_tenant_id ?? null}
                onSelect={handleTenantSelect}
                onBack={handleBackToLogin}
                isLoading={isLoading}
                isSuperuser={isSuperadmin}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          className={`text-center mt-6 text-sm ${
            useNetworkBackground
              ? 'text-neutral-400'
              : loginBackground && imageLoaded
                ? 'text-white/80'
                : 'text-gray-500 dark:text-gray-400'
          }`}
          variants={itemVariants}
        >
          <p>
            v{APP_VERSION} • Powered by{' '}
            <span
              className="font-medium hover:opacity-80 transition-opacity cursor-default"
              style={{ color: useNetworkBackground ? primaryColor : (loginBackground && imageLoaded ? '#ffffff' : primaryColor) }}
            >
              StrateKaz
            </span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
