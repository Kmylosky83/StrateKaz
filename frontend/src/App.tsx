import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { AppRoutes } from '@/routes';
import { OfflineIndicator } from '@/components/common';

function App() {
  const theme = useThemeStore((state) => state.theme);

  // Aplicar colores dinámicos del branding
  useDynamicTheme();

  // Aplicar tema al cargar
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <AppRoutes />
      <OfflineIndicator position="bottom" />
    </>
  );
}

export default App;
