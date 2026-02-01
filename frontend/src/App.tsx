import { useEffect, useState } from 'react';
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

  // Tiempo mínimo de splash para UX (evita flash muy rápido)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1200); // 1.2 segundos mínimo

    return () => clearTimeout(timer);
  }, []);

  // Ocultar splash cuando branding cargó Y pasó el tiempo mínimo
  useEffect(() => {
    if (!isBrandingLoading && minTimeElapsed) {
      setShowSplash(false);
    }
  }, [isBrandingLoading, minTimeElapsed]);

  return (
    <>
      {/* Splash Screen - Logo FIJO de StrateKaz (identidad de marca) */}
      <SplashScreen
        isVisible={showSplash}
        statusMessage="Iniciando sistema..."
        showProgress={true}
      />

      {/* Contenido principal */}
      <AppRoutes />
      <OfflineIndicator position="bottom" />
    </>
  );
}

export default App;
