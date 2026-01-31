import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { TenantSelector } from '@/components/common/TenantSelector';
import { Input } from '@/components/forms/Input';
import { User, Lock, Key, ShieldCheck } from 'lucide-react';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useTenants } from '@/hooks/useTenants';
import { APP_VERSION } from '@/constants/brand';
import { authAPI } from '@/api/auth.api';
import { verifyTwoFactor } from '@/features/perfil/api/twoFactor.api';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
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
  const user = useAuthStore((state) => state.user);
  const clearTenantContext = useAuthStore((state) => state.clearTenantContext);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [username, setUsername] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Multi-tenant state
  const {
    tenants,
    lastTenantId,
    isLoading: tenantsLoading,
    fetchTenants,
    selectTenant,
    reset: resetTenants,
  } = useTenants();

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
   * Verifica si el usuario tiene múltiples tenants y procesa el flujo
   */
  const handlePostLoginFlow = async () => {
    try {
      // Obtener usuario actualizado del store
      const currentUser = useAuthStore.getState().user;
      const tenantsResponse = await fetchTenants();

      if (!tenantsResponse || tenantsResponse.tenants.length === 0) {
        // Usuario sin tenants
        if (currentUser?.is_superuser) {
          // Superusuario sin tenants → Admin Global (limpiar contexto de tenant)
          clearTenantContext();
          toast.success('Bienvenido al Panel de Administración!');
          navigate('/admin-global');
        } else {
          // Usuario normal sin tenants → Dashboard (caso raro)
          toast.success('Bienvenido!');
          navigate('/dashboard');
        }
        return;
      }

      // Superusuario con tenants → mostrar selector con opción Admin Global
      if (currentUser?.is_superuser) {
        setLoginStep('tenant-select');
        return;
      }

      if (tenantsResponse.tenants.length === 1) {
        // Solo un tenant - seleccionar automáticamente
        const tenant = tenantsResponse.tenants[0].tenant;
        toast.success(`Bienvenido a ${tenant.name}!`);
        await handleTenantSelect(tenant.id);
        return;
      }

      // Múltiples tenants - mostrar selector
      setLoginStep('tenant-select');
    } catch {
      // Si falla la obtención de tenants
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.is_superuser) {
        clearTenantContext();
        toast.success('Bienvenido al Panel de Administración!');
        navigate('/admin-global');
      } else {
        toast.success('Bienvenido!');
        navigate('/dashboard');
      }
    }
  };

  // Handler: Login inicial
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Intentar login
      const response = await authAPI.login(data);

      // Verificar si requiere 2FA
      if ('requires_2fa' in response && response.requires_2fa) {
        setLoginStep('2fa');
        setUsername(data.username);
        toast.info('Ingresa el código de autenticación de dos factores');
      } else {
        // Login exitoso sin 2FA - verificar tenants
        await login(data);
        await handlePostLoginFlow();
      }
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
        username,
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
    setUsername('');
    setUseBackupCode(false);
    reset2FA();
    resetTenants();
  };

  // Handler: Seleccionar tenant
  const handleTenantSelect = async (tenantId: number) => {
    const redirectUrl = await selectTenant(tenantId);

    if (redirectUrl) {
      // Redirigir al subdominio del tenant
      window.location.href = redirectUrl;
    } else {
      // Si falla, ir al dashboard
      toast.error('Error al seleccionar empresa. Intenta de nuevo.');
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

      {/* Background con gradiente dinámico (siempre visible) */}
      <div
        className="absolute inset-0 transition-all duration-700 -z-10"
        style={{
          background:
            loginBackground && imageLoaded
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
          {/* Logo y título - Solo mostrar en credentials y 2fa, no en tenant-select */}
          {loginStep !== 'tenant-select' && (
            <motion.div className="text-center mb-6 sm:mb-8" variants={logoVariants}>
              {/* Logo con loading state */}
              {brandingLoading ? (
                <div className="mx-auto h-16 sm:h-20 w-16 sm:w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse-subtle mb-4" />
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
                  <span className="inline-block h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse-subtle" />
                ) : (
                  companyName
                )}
              </h1>

              <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {brandingLoading ? (
                  <span className="inline-block h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse-subtle" />
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
          )}

          {loginStep === '2fa' && (
            /* Formulario de 2FA */
            <motion.form
              className="space-y-5"
              onSubmit={handleSubmit2FA(onSubmit2FA)}
              variants={itemVariants}
              key="2fa-form"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
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
                leftIcon={<Key className="h-5 w-5 text-gray-400" />}
                {...register2FA('token')}
                error={errors2FA.token?.message}
                className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
                placeholder="123456"
              />

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
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
                  className="w-full"
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
                tenants={tenants}
                lastTenantId={lastTenantId}
                onSelect={handleTenantSelect}
                onBack={handleBackToLogin}
                isLoading={tenantsLoading}
                isSuperuser={user?.is_superuser ?? false}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          className={`text-center mt-6 text-sm ${
            loginBackground && imageLoaded ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
          }`}
          variants={itemVariants}
        >
          <p>
            v{APP_VERSION} • Powered by{' '}
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
