import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { AppRoutes } from '@/routes';

function App() {
  const theme = useThemeStore((state) => state.theme);

  // Aplicar tema al cargar
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return <AppRoutes />;
}

export default App;
