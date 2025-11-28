# Guía de Integración - Módulo Ecoaliados

## 1. Agregar Ruta en el Router

```tsx
// src/App.tsx o src/routes/index.tsx

import { EcoaliadosPage } from '@/features/ecoaliados';

// En tu router principal (React Router v6)
<Routes>
  {/* ... otras rutas ... */}

  <Route
    path="/ecoaliados"
    element={
      <ProtectedRoute requiredRole={['COMERCIAL', 'LIDER_COMERCIAL', 'GERENTE', 'SUPER_ADMIN']}>
        <EcoaliadosPage />
      </ProtectedRoute>
    }
  />
</Routes>
```

## 2. Agregar en el Menú de Navegación

```tsx
// src/components/layout/Sidebar.tsx

const menuItems = [
  // ... otros items ...
  {
    id: 'ecoaliados',
    label: 'Ecoaliados',
    path: '/ecoaliados',
    icon: <Users className="h-5 w-5" />, // o <Recycle /> si existe
    roles: ['COMERCIAL', 'LIDER_COMERCIAL', 'GERENTE', 'SUPER_ADMIN'],
  },
];
```

## 3. Configurar Autenticación

```tsx
// En EcoaliadosPage.tsx, reemplazar MOCK_CURRENT_USER

import { useAuth } from '@/context/AuthContext';

export const EcoaliadosPage = () => {
  const { user } = useAuth(); // Obtener usuario del contexto

  // Permisos basados en el usuario real
  const canChangePrecio = ['LIDER_COMERCIAL', 'GERENTE', 'SUPER_ADMIN'].includes(
    user.role
  );
  const isComercial = user.role === 'COMERCIAL';

  // ... resto del código usando user.id en lugar de MOCK_CURRENT_USER.id
```

## 4. Crear Hook para Comerciales

```tsx
// src/features/users/api/useUsers.ts (o crear uno nuevo)

export const useComerciales = () => {
  return useQuery({
    queryKey: ['comerciales'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/usuarios/comerciales/');
      return response.data;
    },
  });
};
```

Luego usar en EcoaliadoForm:

```tsx
// En EcoaliadoForm.tsx
import { useComerciales } from '@/features/users/api/useUsers';

const { data: comercialesData } = useComerciales();

const comercialesOptions = comercialesData?.results.map((c) => ({
  value: c.id,
  label: `${c.first_name} ${c.last_name}`,
})) || [];
```

## 5. Configurar Permisos en el Backend (Ya implementado)

El backend ya tiene el filtrado por permisos:

```python
# ecoaliados/views.py (ya implementado)

class EcoaliadoViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user

        # Comerciales: solo VEN sus ecoaliados
        if user.cargo_nivel == 'COMERCIAL':
            return Ecoaliado.objects.filter(
                comercial_asignado=user,
                is_deleted=False
            )

        # Líder Comercial y superiores: VEN TODOS
        return Ecoaliado.objects.filter(is_deleted=False)
```

## 6. Agregar Íconos Faltantes (si es necesario)

```tsx
// Si no tienes el ícono de reciclaje/ecoaliados, usar uno de lucide-react

import {
  Users,        // Usuarios genéricos
  Recycle,      // Reciclaje
  Leaf,         // Eco-friendly
  TreePine,     // Naturaleza
} from 'lucide-react';
```

## 7. Configurar Variables de Entorno (si aplica)

```env
# .env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ENABLE_GEOLOCATION=true
```

## 8. Verificar Componentes Comunes Existen

Asegúrate de que estos componentes existan en tu proyecto:

```
src/components/
├── common/
│   ├── Button.tsx       ✅
│   ├── Badge.tsx        ✅
│   ├── Card.tsx         ✅
│   ├── Modal.tsx        ✅
│   └── Spinner.tsx      ✅
└── forms/
    ├── Input.tsx        ✅
    └── Select.tsx       ✅
```

Si falta alguno, buscar en el módulo de Proveedores o Users que ya los tienen.

## 9. Configurar axios-config

```typescript
// src/api/axios-config.ts

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
```

## 10. Agregar al QueryClient Provider

```tsx
// src/main.tsx o App.tsx

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Tu app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## 11. Verificar Toast Provider

```tsx
// src/main.tsx o App.tsx

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Tu app */}
    </>
  );
}
```

## 12. Testing (Opcional)

```tsx
// src/features/ecoaliados/__tests__/EcoaliadosPage.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EcoaliadosPage } from '../pages/EcoaliadosPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('EcoaliadosPage', () => {
  it('renders without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EcoaliadosPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('Ecoaliados')).toBeInTheDocument();
  });
});
```

## 13. Checklist de Integración

- [ ] Agregar ruta en el router
- [ ] Agregar item en el menú de navegación
- [ ] Configurar autenticación (reemplazar MOCK_CURRENT_USER)
- [ ] Crear hook useComerciales() para dropdown
- [ ] Verificar componentes comunes existen
- [ ] Configurar axios-config con interceptor de token
- [ ] Verificar QueryClient Provider está configurado
- [ ] Verificar Toaster está configurado
- [ ] Probar crear ecoaliado
- [ ] Probar editar ecoaliado
- [ ] Probar cambiar precio (Líder+)
- [ ] Probar ver historial
- [ ] Probar geolocalización GPS
- [ ] Probar filtros
- [ ] Probar toggle estado activo/inactivo
- [ ] Probar eliminar ecoaliado
- [ ] Verificar permisos por rol funcionan
- [ ] Verificar dark mode funciona

## 14. Solución de Problemas Comunes

### Error: "Cannot find module '@/features/ecoaliados'"

Verificar en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Y en `vite.config.ts`:

```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Error: "cn is not a function"

Crear utility:

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Error: Componente Button no encontrado

Verificar que existe en `src/components/common/Button.tsx`.
Si no, copiar del módulo Proveedores o Users.

## 15. Despliegue a Producción

```bash
# Build
npm run build

# Verificar que no hay errores de TypeScript
npm run type-check

# Verificar que no hay errores de linting
npm run lint

# Desplegar
# (comando específico de tu hosting)
```

## Soporte

Para dudas o problemas, revisar:
1. README.md principal del módulo
2. Código del módulo Proveedores (similar estructura)
3. Documentación del backend
