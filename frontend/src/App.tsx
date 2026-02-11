import { useEffect, useState, useMemo } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { AppRoutes } from '@/routes';
import { OfflineIndicator, SplashScreen } from '@/components/common';

function App() {
  const theme = useThemeStore((state) => state.theme);
  const { isLoading: isBrandingLoading } = useBrandingConfig();
  const [showSplash, setShowSplash] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Detectar si estamos en página de login para usar splash oscuro
  const isLoginPage = useMemo(() => {
    const path = window.location.pathname;
    return path === '/login' || path === '/forgot-password' || path === '/reset-password';
  }, []);

  // Si hay branding cacheado, reducir splash a 300ms (ya tenemos datos)
  const hasCachedBranding = useMemo(() => {
    try {
      return !!localStorage.getItem('last_branding');
    } catch {
      return false;
    }
  }, []);

  // Aplicar colores dinámicos del branding (colores sí son dinámicos)
  useDynamicTheme();

  // Aplicar tema al cargar
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Tiempo mínimo de splash: 300ms si hay cache, 1200ms primera vez
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setMinTimeElapsed(true);
      },
      hasCachedBranding ? 300 : 1200
    );

    return () => clearTimeout(timer);
  }, [hasCachedBranding]);

  // Ocultar splash cuando branding cargó Y pasó el tiempo mínimo
  useEffect(() => {
    if (!isBrandingLoading && minTimeElapsed) {
      setShowSplash(false);
    }
  }, [isBrandingLoading, minTimeElapsed]);

  return (
    <>
      {/* Splash Screen - Logo FIJO de StrateKaz (identidad de marca) */}
      {/* Usa variante 'dark' en páginas de login para coincidir con NetworkBackground */}
      <SplashScreen
        isVisible={showSplash}
        statusMessage="Iniciando sistema..."
        showProgress={true}
        variant={isLoginPage ? 'dark' : 'default'}
      />

      {/* Contenido principal */}
      <AppRoutes />
      <OfflineIndicator position="bottom" />
    </>
  );
}

export default App;
